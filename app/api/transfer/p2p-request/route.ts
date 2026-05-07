import { type NextRequest, NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverEmail, receiverMobile, amount, message } = await request.json()

    if (!senderId || (!receiverEmail && !receiverMobile) || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid request parameters" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 })
    }

    // Find sender
    const senderResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${senderId}::uuid AND is_active = true
    `

    if (!senderResult || senderResult.length === 0) {
      return NextResponse.json({ success: false, error: "Sender not found or inactive" }, { status: 404 })
    }

    const sender = senderResult[0]

    // Check sender balance
    if (Number(sender.balance) < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Find receiver by email or mobile
    let receiverResult
    if (receiverEmail) {
      receiverResult = await sql`
        SELECT id, full_name, email, mobile FROM honeydrew_users 
        WHERE LOWER(email) = LOWER(${receiverEmail}) AND is_active = true
      `
    } else {
      receiverResult = await sql`
        SELECT id, full_name, email, mobile FROM honeydrew_users 
        WHERE mobile = ${receiverMobile} AND is_active = true
      `
    }

    if (!receiverResult || receiverResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Receiver not found. They must be a registered Honeydrew Mills user." },
        { status: 404 },
      )
    }

    const receiver = receiverResult[0]

    // Check if sender and receiver are same
    if (sender.id === receiver.id) {
      return NextResponse.json({ success: false, error: "Cannot transfer to yourself" }, { status: 400 })
    }

    // Create P2P request
    const requestId = `p2p_${Date.now()}_${Math.random().toString(36).substring(7)}`
    await sql`
      INSERT INTO p2p_requests (request_id, sender_id, receiver_id, amount, message, status)
      VALUES (
        ${requestId},
        ${sender.id}::uuid,
        ${receiver.id}::uuid,
        ${amount},
        ${message || null},
        'pending'
      )
    `

    // Log the request
    await sql`
      INSERT INTO admin_logs (admin_id, action_type, resource_type, resource_id, severity, details)
      VALUES (
        ${senderId},
        'p2p_request_created',
        'p2p_request',
        ${requestId},
        'low',
        ${JSON.stringify({
          senderName: sender.full_name,
          receiverName: receiver.full_name,
          receiverEmail: receiver.email,
          amount,
          message,
        })}::jsonb
      )
    `

    return NextResponse.json({
      success: true,
      requestId,
      receiver: {
        name: receiver.full_name,
        email: receiver.email,
        mobile: receiver.mobile,
      },
      message: "P2P transfer request created. Proceeding with transfer...",
    })
  } catch (error: any) {
    console.error("[v0] P2P request error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create transfer request" },
      { status: 500 },
    )
  }
}

// GET endpoint to fetch P2P requests for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") || "all" // 'sent', 'received', or 'all'

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 })
    }

    let requests
    if (type === "sent") {
      requests = await sql`
        SELECT 
          p.*,
          r.full_name as receiver_name,
          r.email as receiver_email,
          r.mobile as receiver_mobile
        FROM p2p_requests p
        JOIN honeydrew_users r ON p.receiver_id = r.id
        WHERE p.sender_id = ${userId}::uuid
        ORDER BY p.created_at DESC
      `
    } else if (type === "received") {
      requests = await sql`
        SELECT 
          p.*,
          s.full_name as sender_name,
          s.email as sender_email,
          s.mobile as sender_mobile
        FROM p2p_requests p
        JOIN honeydrew_users s ON p.sender_id = s.id
        WHERE p.receiver_id = ${userId}::uuid
        ORDER BY p.created_at DESC
      `
    } else {
      requests = await sql`
        SELECT 
          p.*,
          s.full_name as sender_name,
          r.full_name as receiver_name
        FROM p2p_requests p
        JOIN honeydrew_users s ON p.sender_id = s.id
        JOIN honeydrew_users r ON p.receiver_id = r.id
        WHERE p.sender_id = ${userId}::uuid OR p.receiver_id = ${userId}::uuid
        ORDER BY p.created_at DESC
      `
    }

    return NextResponse.json({
      success: true,
      requests: requests.map((req: any) => ({
        id: req.id,
        requestId: req.request_id,
        senderId: req.sender_id,
        receiverId: req.receiver_id,
        senderName: req.sender_name,
        receiverName: req.receiver_name,
        amount: Number(req.amount),
        message: req.message,
        status: req.status,
        createdAt: req.created_at,
        respondedAt: req.responded_at,
        completedAt: req.completed_at,
      })),
    })
  } catch (error: any) {
    console.error("[v0] Get P2P requests error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch requests" }, { status: 500 })
  }
}
