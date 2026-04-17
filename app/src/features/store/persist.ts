export type PersistAdapter = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

export const localPersist: PersistAdapter = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      //
    }
  },
}

