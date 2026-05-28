import APIBase from './httpBase'

export class UserService extends APIBase {
  async getUsers() {
    const response = await this.get<any[]>('/users')
    return response.data
  }

  async createUser(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.post<any>('/users', data)
    return response.data
  }

  async updateUser(id: string, data: { name?: string; email?: string; role?: string }) {
    const response = await this.put<any>(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string) {
    const response = await this.delete<any>(`/users/${id}`)
    return response.data
  }
}

export const userService = new UserService()
