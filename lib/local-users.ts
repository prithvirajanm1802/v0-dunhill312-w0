export type LocalUser = {
  id: string
  email: string
  name: string
  createdAt: string
  passkeyRegistered?: boolean
}

const KEY = "hdm_users"

function getStore(): Record<string, LocalUser> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, LocalUser>) : {}
  } catch {
    return {}
  }
}

function setStore(store: Record<string, LocalUser>) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function deriveUserIdFromEmail(email: string): string {
  // Deterministic ID for preview: normalized email
  return email.trim().toLowerCase()
}

export function saveUser(user: LocalUser) {
  const store = getStore()
  store[user.id] = user
  setStore(store)
}

export function getUserByEmail(email: string): LocalUser | null {
  const id = deriveUserIdFromEmail(email)
  const store = getStore()
  return store[id] || null
}
