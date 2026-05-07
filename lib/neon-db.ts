import { neon } from "@neondatabase/serverless"

// Create a singleton SQL client
let sqlClient: ReturnType<typeof neon> | null = null

export function getSQL() {
  if (!process.env.DATABASE_URL) {
    console.warn("[v0] DATABASE_URL not set, database features disabled")
    return null
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL)
  }

  return sqlClient
}

// User operations
export async function createUser(userData: {
  fullName: string
  mobile: string
  username: string
  passwordHash: string
  balance?: number
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO honeydrew_users (full_name, mobile, username, password_hash, balance)
      VALUES (${userData.fullName}, ${userData.mobile}, ${userData.username}, ${userData.passwordHash}, ${userData.balance || 10000})
      RETURNING id, full_name, mobile, username, balance, created_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return null
  }
}

export async function getUserByMobile(mobile: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT id, full_name, mobile, username, balance, password_hash, created_at, last_login_at
      FROM honeydrew_users
      WHERE mobile = ${mobile} AND is_active = true
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error getting user by mobile:", error)
    return null
  }
}

export async function getUserById(userId: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT id, full_name, mobile, username, balance, created_at, last_login_at
      FROM honeydrew_users
      WHERE id = ${userId} AND is_active = true
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error getting user by ID:", error)
    return null
  }
}

export async function updateUserBalance(userId: string, newBalance: number) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      UPDATE honeydrew_users
      SET balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, balance
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating user balance:", error)
    return null
  }
}

export async function registerUser(userData: {
  fullName: string
  email?: string
  mobile: string
  username?: string
  passwordHash: string
  balance?: number
  fingerprintRegistered?: boolean
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO honeydrew_users (
        full_name, email, mobile, username, password_hash, balance,
        fingerprint_registered
      )
      VALUES (
        ${userData.fullName}, 
        ${userData.email || null}, 
        ${userData.mobile}, 
        ${userData.username || userData.mobile},
        ${userData.passwordHash}, 
        ${userData.balance || 10000},
        ${userData.fingerprintRegistered || false}
      )
      RETURNING id, full_name, email, mobile, username, balance, created_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error registering user:", error)
    return null
  }
}

export async function updateUserBiometricStatus(userId: string, biometricType: "fingerprint", registered: boolean) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const column = "fingerprint_registered"
    const result = await sql`
      UPDATE honeydrew_users
      SET ${sql(column)} = ${registered}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, fingerprint_registered
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating biometric status:", error)
    return null
  }
}

// Store fingerprint data
export async function storeFingerprintData(fingerprintData: {
  userId: string
  credentialId: string
  publicKey: string
  deviceType: string
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO user_biometrics (
        user_id, biometric_type, biometric_features, model_version, is_primary
      )
      VALUES (
        ${fingerprintData.userId}, 
        'fingerprint', 
        ${JSON.stringify({
          credentialId: fingerprintData.credentialId,
          publicKey: fingerprintData.publicKey,
          deviceType: fingerprintData.deviceType,
        })},
        'webauthn-v1',
        true
      )
      ON CONFLICT (user_id, biometric_type, is_primary) 
      DO UPDATE SET 
        biometric_features = ${JSON.stringify({
          credentialId: fingerprintData.credentialId,
          publicKey: fingerprintData.publicKey,
          deviceType: fingerprintData.deviceType,
        })},
        updated_at = NOW()
      RETURNING id, user_id, biometric_type, created_at
    `

    // Update user's fingerprint_registered status
    await sql`
      UPDATE honeydrew_users
      SET fingerprint_registered = true, updated_at = NOW()
      WHERE id = ${fingerprintData.userId}
    `

    return result[0]
  } catch (error) {
    console.error("[v0] Error storing fingerprint data:", error)
    return null
  }
}

// User-to-user transfer
export async function transferBetweenUsers(transferData: {
  senderId: string
  recipientId: string
  amount: number
  authMethod: string
  verificationScore?: number
  deviceId?: string
  note?: string
}) {
  const sql = getSQL()
  if (!sql) return { success: false, error: "Database not available" }

  try {
    // Get sender's current balance
    const senderResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${transferData.senderId}
    `

    if (!senderResult[0]) {
      return { success: false, error: "Sender not found" }
    }

    const sender = senderResult[0]

    if (Number(sender.balance) < transferData.amount) {
      return { success: false, error: "Insufficient balance" }
    }

    // Get recipient
    const recipientResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${transferData.recipientId}
    `

    if (!recipientResult[0]) {
      return { success: false, error: "Recipient not found" }
    }

    const recipient = recipientResult[0]

    // Calculate new balances
    const senderNewBalance = Number(sender.balance) - transferData.amount
    const recipientNewBalance = Number(recipient.balance) + transferData.amount

    // Update sender balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${senderNewBalance}, updated_at = NOW()
      WHERE id = ${transferData.senderId}
    `

    // Update recipient balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${recipientNewBalance}, updated_at = NOW()
      WHERE id = ${transferData.recipientId}
    `

    // Create sender transaction (sent)
    const senderTx = await sql`
      INSERT INTO user_transactions (
        user_id, recipient, transaction_type, amount, balance_before, balance_after,
        status, auth_method, verification_score, device_id, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${transferData.senderId}, ${transferData.recipientId}, 'sent', ${transferData.amount},
        ${sender.balance}, ${senderNewBalance}, 'completed', ${transferData.authMethod},
        ${transferData.verificationScore || null}, ${transferData.deviceId || null},
        'internal', 'transfer', ${JSON.stringify({ note: transferData.note, recipientName: recipient.full_name })},
        NOW()
      )
      RETURNING id, amount, status, created_at
    `

    // Create recipient transaction (received)
    await sql`
      INSERT INTO user_transactions (
        user_id, recipient, transaction_type, amount, balance_before, balance_after,
        status, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${transferData.recipientId}, ${transferData.senderId}, 'received', ${transferData.amount},
        ${recipient.balance}, ${recipientNewBalance}, 'completed', 'internal', 'transfer',
        ${JSON.stringify({ note: transferData.note, senderName: sender.full_name })},
        NOW()
      )
    `

    return {
      success: true,
      transactionId: senderTx[0].id,
      senderNewBalance,
      recipientNewBalance,
    }
  } catch (error) {
    console.error("[v0] Error transferring between users:", error)
    return { success: false, error: "Transfer failed" }
  }
}

// Search users by mobile or name
export async function searchUsers(query: string) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const searchPattern = `%${query}%`
    const result = await sql`
      SELECT 
        id, 
        full_name, 
        email, 
        mobile, 
        username, 
        balance
      FROM honeydrew_users
      WHERE is_active = true AND (
        mobile LIKE ${searchPattern} OR
        full_name ILIKE ${searchPattern} OR
        username ILIKE ${searchPattern}
      )
      LIMIT 20
    `
    return result
  } catch (error) {
    console.error("[v0] Error searching users:", error)
    return []
  }
}

// Get admin statistics
export async function getAdminStats() {
  const sql = getSQL()
  if (!sql) return null

  try {
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE fingerprint_registered = true) as fingerprint_registered,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        SUM(balance) as total_balance
      FROM honeydrew_users
    `

    const transactionStats = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) FILTER (WHERE transaction_type = 'sent') as total_sent,
        SUM(amount) FILTER (WHERE transaction_type = 'received') as total_received,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_transactions
      FROM user_transactions
    `

    const sessionStats = await sql`
      SELECT COUNT(*) as active_sessions
      FROM user_sessions
      WHERE is_active = true AND expires_at > NOW()
    `

    return {
      users: userStats[0],
      transactions: transactionStats[0],
      sessions: sessionStats[0],
    }
  } catch (error) {
    console.error("[v0] Error getting admin stats:", error)
    return null
  }
}

// Log user login
export async function logUserLogin(userId: string) {
  const sql = getSQL()
  if (!sql) return

  try {
    await sql`
      UPDATE honeydrew_users
      SET last_login_at = NOW()
      WHERE id = ${userId}
    `
  } catch (error) {
    console.error("[v0] Error logging user login:", error)
  }
}

// Session operations
export async function createSession(sessionData: {
  userId: string
  deviceId: string
  deviceName: string
  deviceType: string
  ipAddress?: string
  userAgent?: string
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    // First, deactivate any existing session for this device
    await sql`
      UPDATE user_sessions
      SET is_active = false
      WHERE user_id = ${sessionData.userId} AND device_id = ${sessionData.deviceId}
    `

    const result = await sql`
      INSERT INTO user_sessions (user_id, device_id, device_name, device_type, ip_address, user_agent)
      VALUES (${sessionData.userId}, ${sessionData.deviceId}, ${sessionData.deviceName}, ${sessionData.deviceType}, ${sessionData.ipAddress || null}, ${sessionData.userAgent || null})
      RETURNING id, device_id, created_at, expires_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating session:", error)
    return null
  }
}

export async function getActiveSession(userId: string, deviceId: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT id, device_id, device_name, device_type, created_at, expires_at, last_activity_at
      FROM user_sessions
      WHERE user_id = ${userId} AND device_id = ${deviceId} AND is_active = true AND expires_at > NOW()
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error getting active session:", error)
    return null
  }
}

export async function getUserActiveSessions(userId: string) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT id, device_id, device_name, device_type, created_at, last_activity_at
      FROM user_sessions
      WHERE user_id = ${userId} AND is_active = true AND expires_at > NOW()
      ORDER BY last_activity_at DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting user sessions:", error)
    return []
  }
}

// Biometric operations
export async function saveBiometricData(biometricData: {
  userId: string
  biometricType: string
  biometricFeatures: any
  imageHash: string
  modelVersion: string
}) {
  const sql = getSQL()
  if (!sql) return null

  // Only allow fingerprint biometric type
  if (biometricData.biometricType !== "fingerprint") {
    console.warn("[v0] Only fingerprint biometric type is supported")
    return null
  }

  try {
    const result = await sql`
      INSERT INTO user_biometrics (user_id, biometric_type, biometric_features, image_hash, model_version, is_primary)
      VALUES (${biometricData.userId}, ${biometricData.biometricType}, ${JSON.stringify(biometricData.biometricFeatures)}, ${biometricData.imageHash}, ${biometricData.modelVersion}, true)
      ON CONFLICT (user_id, biometric_type) 
      DO UPDATE SET 
        biometric_features = ${JSON.stringify(biometricData.biometricFeatures)},
        image_hash = ${biometricData.imageHash},
        model_version = ${biometricData.modelVersion},
        updated_at = NOW()
      RETURNING id, user_id, biometric_type, created_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error saving biometric data:", error)
    return null
  }
}

export async function getBiometricData(userId: string, biometricType: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT id, user_id, biometric_type, biometric_features, image_hash, model_version, created_at
      FROM user_biometrics
      WHERE user_id = ${userId} AND biometric_type = ${biometricType}
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error getting biometric data:", error)
    return null
  }
}

// Transaction operations
export async function createTransaction(transactionData: {
  userId: string
  transactionType: string
  amount: number
  recipient: string
  category: string
  paymentMethod?: string
  status?: string
  balanceBefore?: number
  balanceAfter?: number
  authMethod?: string
  verificationScore?: number
  deviceId?: string
  metadata?: any
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO user_transactions (
        user_id, transaction_type, amount, recipient, category, payment_method,
        status, balance_before, balance_after, auth_method, verification_score,
        device_id, metadata, completed_at
      )
      VALUES (
        ${transactionData.userId}, ${transactionData.transactionType}, ${transactionData.amount},
        ${transactionData.recipient}, ${transactionData.category}, ${transactionData.paymentMethod || null},
        ${transactionData.status || "completed"}, ${transactionData.balanceBefore || null},
        ${transactionData.balanceAfter || null}, ${transactionData.authMethod || null},
        ${transactionData.verificationScore || null}, ${transactionData.deviceId || null},
        ${transactionData.metadata ? JSON.stringify(transactionData.metadata) : null},
        ${transactionData.status === "completed" ? new Date().toISOString() : null}
      )
      RETURNING id, user_id, transaction_type, amount, status, created_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating transaction:", error)
    return null
  }
}

export async function getUserTransactions(userId: string, limit = 50) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT id, transaction_type, amount, recipient, category, payment_method,
             status, balance_before, balance_after, auth_method, verification_score,
             created_at, completed_at
      FROM user_transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting user transactions:", error)
    return []
  }
}

export async function updateTransactionStatus(transactionId: string, status: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      UPDATE user_transactions
      SET status = ${status}, completed_at = ${status === "completed" ? new Date().toISOString() : null}
      WHERE id = ${transactionId}
      RETURNING id, status, completed_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating transaction status:", error)
    return null
  }
}

// Sync operations
export async function saveSyncRecord(syncData: {
  userId: string
  deviceId: string
  dataType: string
  data: any
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO sync_records (user_id, device_id, data_type, data)
      VALUES (${syncData.userId}, ${syncData.deviceId}, ${syncData.dataType}, ${JSON.stringify(syncData.data)})
      RETURNING id, synced_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error saving sync record:", error)
    return null
  }
}

export async function getPendingSyncRecords(userId: string, deviceId: string) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT id, data_type, data, synced_at
      FROM sync_records
      WHERE user_id = ${userId} AND device_id != ${deviceId} AND acknowledged = false
      ORDER BY synced_at ASC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting pending sync records:", error)
    return []
  }
}

export async function acknowledgeSyncRecords(recordIds: string[]) {
  const sql = getSQL()
  if (!sql || recordIds.length === 0) return false

  try {
    await sql`
      UPDATE sync_records
      SET acknowledged = true
      WHERE id = ANY(${recordIds})
    `
    return true
  } catch (error) {
    console.error("[v0] Error acknowledging sync records:", error)
    return false
  }
}

// Admin operations
// Get all users for admin dashboard
export async function getAllUsersWithBiometrics() {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.mobile, 
        u.username, 
        u.balance, 
        u.is_active,
        u.face_registered,
        u.fingerprint_registered,
        u.created_at,
        u.last_login_at,
        u.face_image,
        (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) as active_sessions,
        (SELECT json_agg(b) FROM user_biometrics b WHERE b.user_id = u.id) as biometrics
      FROM honeydrew_users u
      ORDER BY u.created_at DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting all users with biometrics:", error)
    return []
  }
}

// Get user with biometric details for admin
export async function getUserWithBiometrics(userId: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const userResult = await sql`
      SELECT 
        id, full_name, email, mobile, username, balance,
        is_active, face_registered, fingerprint_registered,
        created_at, updated_at, last_login_at
      FROM honeydrew_users
      WHERE id = ${userId}
    `

    if (!userResult[0]) return null

    const biometricsResult = await sql`
      SELECT biometric_type, image_hash, model_version, created_at, updated_at
      FROM user_biometrics
      WHERE user_id = ${userId}
    `

    const sessionsResult = await sql`
      SELECT device_id, device_name, device_type, ip_address, created_at, last_activity_at
      FROM user_sessions
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY last_activity_at DESC
    `

    return {
      ...userResult[0],
      biometrics: biometricsResult,
      sessions: sessionsResult,
    }
  } catch (error) {
    console.error("[v0] Error getting user with biometrics:", error)
    return null
  }
}

// Store user with face image
export async function storeUserWithFace(userData: {
  id?: string
  fullName: string
  email?: string
  mobile: string
  username?: string
  passwordHash: string
  balance?: number
  faceImage?: string
  faceRegistered?: boolean
  fingerprintRegistered?: boolean
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO honeydrew_users (
        full_name, email, mobile, username, password_hash, balance,
        face_registered, fingerprint_registered, face_image
      )
      VALUES (
        ${userData.fullName}, 
        ${userData.email || null}, 
        ${userData.mobile}, 
        ${userData.username || userData.mobile},
        ${userData.passwordHash}, 
        ${userData.balance || 10000},
        ${userData.faceRegistered || false},
        ${userData.fingerprintRegistered || false},
        ${userData.faceImage || null}
      )
      RETURNING id, full_name, email, mobile, username, balance, created_at, face_registered, fingerprint_registered
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error storing user with face:", error)
    return null
  }
}

// Update user face image
export async function updateUserFaceImage(userId: string, faceImage: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      UPDATE honeydrew_users
      SET face_image = ${faceImage}, face_registered = true, updated_at = NOW()
      WHERE id = ${userId}::uuid
      RETURNING id, face_registered
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating user face image:", error)
    return null
  }
}

export async function getAllUsers() {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT 
        id, 
        full_name as "fullName", 
        email, 
        mobile, 
        balance,
        is_active as "isActive", fingerprint_registered as "fingerprintRegistered",
        face_registered as "faceRegistered", created_at as "createdAt",
        last_login_at as "lastLoginAt"
      FROM honeydrew_users
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting all users:", error)
    return []
  }
}

// Login authentication
export async function getUserByEmail(email: string) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT 
        id, full_name as "fullName", email, mobile, username, balance, password_hash,
        is_active as "isActive", fingerprint_registered as "fingerprintRegistered",
        face_registered as "faceRegistered", created_at as "createdAt", last_login_at as "lastLoginAt"
      FROM honeydrew_users
      WHERE LOWER(email) = LOWER(${email}) AND is_active = true
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error getting user by email:", error)
    return null
  }
}

// Delete user function for admin to permanently delete users
export async function deleteUser(userId: string) {
  const sql = getSQL()
  if (!sql) return { success: false, error: "Database not available" }

  try {
    // Delete all related records in cascading order to avoid constraint violations

    // 1. Delete user transactions (both as sender and recipient)
    await sql`
      DELETE FROM user_transactions 
      WHERE user_id = ${userId} OR recipient_id = ${userId}
    `

    // 2. Delete user sessions across all devices
    await sql`
      DELETE FROM user_sessions WHERE user_id = ${userId}
    `

    // 3. Delete P2P requests (both sent and received)
    await sql`
      DELETE FROM p2p_requests 
      WHERE sender_id = ${userId} OR recipient_id = ${userId}
    `

    // 4. Delete Stripe payments
    await sql`
      DELETE FROM stripe_payments WHERE user_id = ${userId}
    `

    // 5. Delete biometric data
    await sql`
      DELETE FROM user_biometrics WHERE user_id = ${userId}
    `

    // 6. Delete passkeys
    await sql`
      DELETE FROM passkeys WHERE user_id = ${userId}
    `

    // 7. Delete QR codes
    await sql`
      DELETE FROM qr_codes WHERE user_id = ${userId}
    `

    // 8. Delete sync records
    await sql`
      DELETE FROM sync_records WHERE user_id = ${userId}
    `

    // 9. Finally delete the user from honeydrew_users
    const result = await sql`
      DELETE FROM honeydrew_users WHERE id = ${userId}
      RETURNING id, full_name as "fullName", email, mobile
    `

    if (result[0]) {
      return { success: true, user: result[0] }
    } else {
      return { success: false, error: "User not found" }
    }
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return { success: false, error: "Failed to delete user from database" }
  }
}

// Admin logs functionality
export async function createAdminLog(logData: {
  adminId: string
  action: string
  targetUserId?: string
  details: any
  ipAddress?: string
}) {
  const sql = getSQL()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address)
      VALUES (${logData.adminId}, ${logData.action}, ${logData.targetUserId || null}, ${JSON.stringify(logData.details)}, ${logData.ipAddress || null})
      RETURNING id, created_at
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating admin log:", error)
    return null
  }
}

export async function getAdminLogs(limit = 100) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT 
        al.id, al.admin_id as "adminId", al.action, al.target_user_id as "targetUserId",
        al.details, al.ip_address as "ipAddress", al.created_at as "createdAt",
        u.full_name as "userName"
      FROM admin_logs al
      LEFT JOIN honeydrew_users u ON al.target_user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${limit}
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting admin logs:", error)
    return []
  }
}

export async function p2pTransfer(params: {
  senderId: string
  recipientMobile: string
  amount: number
  note?: string
}) {
  const sql = getSQL()
  if (!sql) {
    return { success: false, error: "Database not available" }
  }

  try {
    // Get sender details
    const senderResult = await sql`
      SELECT id, full_name, email, mobile, balance
      FROM honeydrew_users
      WHERE id = ${params.senderId} AND is_active = true
    `

    if (!senderResult[0]) {
      return { success: false, error: "Sender not found" }
    }

    const sender = senderResult[0]

    // Check sender balance
    if (Number(sender.balance) < params.amount) {
      return { success: false, error: `Insufficient balance. You have ${sender.balance}` }
    }

    // Get recipient details
    const recipientResult = await sql`
      SELECT id, full_name, email, mobile, balance
      FROM honeydrew_users
      WHERE mobile = ${params.recipientMobile} AND is_active = true
    `

    if (!recipientResult[0]) {
      return { success: false, error: "Recipient not found with this mobile number" }
    }

    const recipient = recipientResult[0]

    // Prevent self-transfer
    if (sender.id === recipient.id) {
      return { success: false, error: "Cannot transfer money to yourself" }
    }

    // Calculate new balances
    const senderNewBalance = Number(sender.balance) - params.amount
    const recipientNewBalance = Number(recipient.balance) + params.amount

    // Update sender balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${senderNewBalance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sender.id}
    `

    // Update recipient balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${recipientNewBalance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${recipient.id}
    `

    // Create sender transaction
    const senderTxResult = await sql`
      INSERT INTO user_transactions (
        sender_id, receiver_id, amount, transaction_type, status, description, metadata
      )
      VALUES (
        ${sender.id}, ${recipient.id}, ${params.amount}, 'p2p', 'completed',
        ${params.note || `Transfer to ${recipient.full_name}`},
        ${JSON.stringify({ senderName: sender.full_name, recipientName: recipient.full_name, note: params.note })}
      )
      RETURNING id, created_at
    `

    // Create recipient transaction
    await sql`
      INSERT INTO user_transactions (
        sender_id, receiver_id, amount, transaction_type, status, description, metadata
      )
      VALUES (
        ${sender.id}, ${recipient.id}, ${params.amount}, 'p2p', 'completed',
        ${`Received from ${sender.full_name}`},
        ${JSON.stringify({ senderName: sender.full_name, recipientName: recipient.full_name, note: params.note })}
      )
    `

    return {
      success: true,
      transaction: {
        id: senderTxResult[0].id,
        amount: params.amount,
        recipientName: recipient.full_name,
        senderNewBalance,
        recipientNewBalance,
        createdAt: senderTxResult[0].created_at,
      },
    }
  } catch (error: any) {
    console.error("[v0] P2P transfer error:", error)
    return { success: false, error: error.message || "Transfer failed" }
  }
}

export async function getTransactionsByUserId(userId: string, limit = 50) {
  const sql = getSQL()
  if (!sql) return []

  try {
    const result = await sql`
      SELECT 
        t.id, t.amount, t.transaction_type as "type", t.status, t.description,
        t.created_at as "createdAt", t.metadata,
        sender.full_name as "senderName", sender.mobile as "senderMobile",
        receiver.full_name as "receiverName", receiver.mobile as "receiverMobile"
      FROM user_transactions t
      LEFT JOIN honeydrew_users sender ON t.sender_id = sender.id
      LEFT JOIN honeydrew_users receiver ON t.receiver_id = receiver.id
      WHERE t.sender_id = ${userId} OR t.receiver_id = ${userId}
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `
    return result
  } catch (error) {
    console.error("[v0] Error getting transactions:", error)
    return []
  }
}

export async function createStripeTransaction(params: {
  userId: string
  amount: number
  stripePaymentId: string
  type: "deposit" | "withdrawal"
}) {
  const sql = getSQL()
  if (!sql) return { success: false, error: "Database not available" }

  try {
    // Get user
    const userResult = await sql`
      SELECT id, full_name, balance
      FROM honeydrew_users
      WHERE id = ${params.userId} AND is_active = true
    `

    if (!userResult[0]) {
      return { success: false, error: "User not found" }
    }

    const user = userResult[0]
    const currentBalance = Number(user.balance)
    let newBalance = currentBalance

    if (params.type === "deposit") {
      newBalance = currentBalance + params.amount
    } else if (params.type === "withdrawal") {
      if (currentBalance < params.amount) {
        return { success: false, error: "Insufficient balance" }
      }
      newBalance = currentBalance - params.amount
    }

    // Update user balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.userId}
    `

    // Create transaction record
    const txResult = await sql`
      INSERT INTO user_transactions (
        sender_id, receiver_id, amount, transaction_type, status,
        description, stripe_payment_id, metadata
      )
      VALUES (
        ${params.type === "deposit" ? null : params.userId},
        ${params.type === "deposit" ? params.userId : null},
        ${params.amount},
        ${`stripe_${params.type}`},
        'completed',
        ${params.type === "deposit" ? "Stripe deposit" : "Stripe withdrawal"},
        ${params.stripePaymentId},
        ${JSON.stringify({ type: params.type, stripePaymentId: params.stripePaymentId })}
      )
      RETURNING id, created_at
    `

    return {
      success: true,
      transaction: {
        id: txResult[0].id,
        newBalance,
        amount: params.amount,
        type: params.type,
      },
    }
  } catch (error: any) {
    console.error("[v0] Stripe transaction error:", error)
    return { success: false, error: error.message || "Transaction failed" }
  }
}
