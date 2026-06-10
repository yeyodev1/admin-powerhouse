import axios from 'axios';

// Usamos el archivo principal de configuración de axios de la app o instanciamos uno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8101/api';

export interface AgentMetric {
  id: string;
  name: string;
  email: string;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTimeMinutes: number;
  status: 'online' | 'offline';
  avatar: string;
}

export const ghlService = {
  async getAgentMetrics(): Promise<AgentMetric[]> {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/ghl/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.metrics;
  },
  
  async getAgentById(id: string): Promise<AgentMetric | null> {
    const metrics = await this.getAgentMetrics();
    return metrics.find((a: AgentMetric) => a.id === id) || null;
  }
};
