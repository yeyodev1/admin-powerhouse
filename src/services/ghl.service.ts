import axios from 'axios';

// Usamos el archivo principal de configuración de axios de la app o instanciamos uno
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101/api';

export interface AgentPipeline {
  leads: number;
  calls: number;
  answeredCalls: number;
  whatsapp: number;
  email: number;
  infoAppointmentsScheduled: number;
  infoAppointmentsAttended: number;
  presentialAppointmentsScheduled: number;
  presentialAppointmentsAttended: number;
  treatmentsStarted: number;
  totalMonetaryValue: number;
  wonOpportunities: number;
}

export interface AgentOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineStageName: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  createdAt: string;
}

export interface AgentMetric {
  id: string;
  name: string;
  email: string;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTimeMinutes: number;
  activeHours: number;
  pipeline?: AgentPipeline;
  opportunities?: AgentOpportunity[];
  status: 'online' | 'offline';
  avatar: string;
}

export const ghlService = {
  async getAgentMetrics(startDate?: string, endDate?: string): Promise<AgentMetric[]> {
    const token = localStorage.getItem('access_token');
    
    // Configurar parámetros de query si existen fechas
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_URL}/ghl/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
    
    return response.data.metrics;
  },
  
  async getAgentById(id: string, startDate?: string, endDate?: string): Promise<AgentMetric | null> {
    const metrics = await this.getAgentMetrics(startDate, endDate);
    return metrics.find((a: AgentMetric) => a.id === id) || null;
  }
};
