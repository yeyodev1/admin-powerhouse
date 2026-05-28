import { defineStore } from 'pinia'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: string | null
  isInternal: boolean
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    isInternal: false,
    isAuthenticated: false,
  }),

  actions: {
    isLoggedIn(): boolean {
      return !!localStorage.getItem('access_token')
    },

    async isAuthenticatedAsync(): Promise<boolean> {
      const token = localStorage.getItem('access_token')
      if (!token) return false
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8100/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('invalid token')
        return true
      } catch {
        return false
      }
    },

    setUser(payload: { id?: string; name?: string; email?: string; role?: string; isInternal?: boolean }) {
      if (payload.id !== undefined) {
        this.id = payload.id
        try { localStorage.setItem('user_id', payload.id) } catch {}
      }
      if (payload.name !== undefined) {
        this.name = payload.name
        try { localStorage.setItem('user_name', payload.name) } catch {}
      }
      if (payload.email !== undefined) {
        this.email = payload.email
        try { localStorage.setItem('user_email', payload.email) } catch {}
      }
      if (payload.role !== undefined) {
        this.role = payload.role
        try { localStorage.setItem('user_role', payload.role) } catch {}
      }
      if (payload.isInternal !== undefined) {
        this.isInternal = payload.isInternal
        try { localStorage.setItem('user_isInternal', String(payload.isInternal)) } catch {}
      }
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.isInternal = false
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_isInternal')
      } catch {}
    },
  },
})
