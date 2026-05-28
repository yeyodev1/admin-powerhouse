import APIBase from './httpBase'

export class AuthService extends APIBase {
  async register(data: { name: string; email: string; password: string }) {
    const response = await this.post<{ access_token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/register', data)
    return response.data
  }

  async login(data: { email: string; password: string }) {
    const response = await this.post<{ access_token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/login', data)
    return response.data
  }

  async getMe() {
    const response = await this.get<{ id: string; name: string; email: string; role: string; isInternal: boolean; createdAt: string }>('/auth/me')
    return response.data
  }
}

export const authService = new AuthService()