import APIBase from './httpBase'

export type StudyStatus = 'queued' | 'generating' | 'ready' | 'failed'

export interface StudyListItem {
  publicId: string
  version: number
  assessmentPublicId: string
  fullName: string
  email: string
  telefono: string
  status: StudyStatus
  stage: string
  progress: number
  edited: boolean
  error?: string
  deliveries: number
  lastDeliveryOk: boolean | null
  url: string
  createdAt: string
  finishedAt?: string
}

export interface StudyDelivery {
  channel: string
  to: string
  sentAt: string
  ok: boolean
  detail?: string
}

export interface StudyDetail extends Omit<StudyListItem, 'deliveries' | 'lastDeliveryOk'> {
  content: string
  editedContent: string
  finalContent: string
  editedAt?: string
  editedBy?: string
  aiModel: string
  durationMs?: number
  deliveries: StudyDelivery[]
}

export class StudyService extends APIBase {
  async list(params?: { status?: string; email?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.email) query.append('email', params.email)
    const qs = query.toString() ? `?${query.toString()}` : ''
    const response = await this.get<StudyListItem[]>(`/studies${qs}`)
    return response.data
  }

  async getOne(publicId: string) {
    const response = await this.get<StudyDetail>(`/studies/${publicId}`)
    return response.data
  }

  /** Guarda la edición del asesor. No pisa el texto original de la IA. */
  async saveContent(publicId: string, content: string) {
    const response = await this.patch<{ publicId: string; editedAt: string; editedBy: string }>(
      `/studies/${publicId}`,
      { content },
    )
    return response.data
  }

  /** Dispara el webhook de GHL: es lo que manda el WhatsApp al paciente */
  async sendWhatsapp(publicId: string) {
    const response = await this.post<{ sent: boolean; url: string; detail: string }>(
      `/studies/${publicId}/send-whatsapp`,
      {},
    )
    return response.data
  }

  /** Encola un estudio nuevo a partir de un cuestionario (acumula versión) */
  async createForAssessment(assessmentPublicId: string) {
    const response = await this.post<{ publicId: string; version: number; url: string }>(
      `/assessments/${assessmentPublicId}/study`,
      {},
    )
    return response.data
  }

  /** Empuja la cola: útil si el auto-disparo no despertó al procesador */
  async runQueue() {
    const response = await this.post<{ processed: number; remaining: number }>(
      '/studies/run-queue',
      { limit: 2 },
    )
    return response.data
  }
}

export const studyService = new StudyService()
