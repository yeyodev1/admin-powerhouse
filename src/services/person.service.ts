import APIBase from './httpBase'

export interface PersonData {
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  notes?: string
}

export interface MedicalFile {
  url: string
  filename: string
  type: string
  uploadedAt: string
}

export class PersonService extends APIBase {
  async getPersons() {
    const response = await this.get<any[]>('/persons')
    return response.data
  }

  async getPersonById(id: string) {
    const response = await this.get<any>(`/persons/${id}`)
    return response.data
  }

  async createPerson(data: PersonData) {
    const response = await this.post<any>('/persons', data)
    return response.data
  }

  async updatePerson(id: string, data: Partial<PersonData>) {
    const response = await this.patch<any>(`/persons/${id}`, data)
    return response.data
  }

  async deletePerson(id: string) {
    const response = await this.delete<any>(`/persons/${id}`)
    return response.data
  }

  async uploadFile(personId: string, file: { url: string; filename: string; type: string }) {
    const response = await this.post<any>(`/persons/${personId}/files`, file)
    return response.data
  }

  async deleteFile(personId: string, fileId: string) {
    const response = await this.delete<any>(`/persons/${personId}/files/${fileId}`)
    return response.data
  }

  async analyzePerson(id: string, payload: { patientContext: string; files: any[] }) {
    const response = await this.post<{ message: string; result: string }>(`/persons/${id}/analyze`, payload)
    return response.data
  }

  async generateReport(id: string, payload: { params: any; openAiResult: string }) {
    const response = await this.post<{ message: string; result: string }>(`/persons/${id}/report`, payload)
    return response.data
  }

  async saveAnalysis(id: string, payload: { filesUsed: string[]; openAiResult: string; patientParams: any; claudeResult: string }) {
    const response = await this.post<{ message: string; person: any }>(`/persons/${id}/analyses`, payload)
    return response.data
  }
}

export const personService = new PersonService()
