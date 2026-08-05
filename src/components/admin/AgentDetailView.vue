<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ghlService, type AgentMetric } from '@/services/ghl.service'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import CustomTimeFilter from './CustomTimeFilter.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const agent = ref<AgentMetric | null>(null)
const error = ref('')

const currentDates = ref<{ startDate?: string, endDate?: string }>({})
const selectedChat = ref<any | null>(null)
const loadingChat = ref(false)
const chatBodyRef = ref<HTMLElement | null>(null)

const openChat = async (chat: any) => {
  selectedChat.value = { ...chat, messages: [] }
  loadingChat.value = true
  try {
    const msgs = await ghlService.getConversationMessages(chat.id)
    selectedChat.value.messages = msgs
    nextTick(() => {
      if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
      }
    })
  } catch (err) {
    console.error('Error fetching chat messages:', err)
  } finally {
    loadingChat.value = false
  }
}

const closeChat = () => {
  selectedChat.value = null
}

async function fetchAgent(dates?: { startDate: string, endDate: string }) {
  if (dates) {
    currentDates.value = dates
  }

  loading.value = true
  try {
    const agentId = route.params.id as string
    const data = await ghlService.getAgentById(agentId, currentDates.value.startDate, currentDates.value.endDate)
    if (data) {
      agent.value = data
    } else {
      error.value = 'Agente no encontrado en crm.bakano.ec'
    }
  } catch (e: any) {
    error.value = e.message || 'Error al conectar con el CRM'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAgent()
})

const goBack = () => {
  router.push('/admin/metrics')
}

const handleFilterChange = (dates: { startDate: string, endDate: string }) => {
  fetchAgent(dates)
}

const getStageClass = (stageName: string) => {
  if (stageName.includes('Atracción')) return 'tag-cyan'
  if (stageName.includes('Contacto')) return 'tag-purple'
  if (stageName.includes('Cita')) return 'tag-silver'
  if (stageName.includes('Cierre') || stageName.includes('Tratamiento')) return 'tag-gold'
  return 'tag-blue'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const groupedOpportunities = computed(() => {
  if (!agent.value?.opportunities) return []
  
  const groups: Record<string, { stageName: string, total: number, count: number, opps: any[] }> = {}
  
  agent.value.opportunities.forEach(opp => {
    const stage = opp.pipelineStageName || 'Desconocido'
    if (!groups[stage]) {
      groups[stage] = { stageName: stage, total: 0, count: 0, opps: [] }
    }
    groups[stage].count++
    groups[stage].total += Number(opp.monetaryValue) || 0
    groups[stage].opps.push(opp)
  })
  
  return Object.values(groups).sort((a, b) => b.total - a.total)
})

// Premium Chart Config: Gold & Cyan
const chartData = computed(() => {
  if (!agent.value) return { labels: [], datasets: [] }
  return {
    labels: ['Enviados', 'Recibidos'],
    datasets: [
      {
        label: 'Mensajes',
        backgroundColor: ['rgba(197, 160, 89, 0.9)', 'rgba(33, 188, 251, 0.8)'],
        hoverBackgroundColor: ['#D4AF37', '#21bcfb'],
        data: [agent.value.messagesSent, agent.value.messagesReceived],
        borderRadius: 8,
        barPercentage: 0.5,
        borderWidth: 1,
        borderColor: ['#D4AF37', '#21bcfb']
      }
    ]
  }
})

const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(11, 12, 16, 0.95)',
      titleFont: { family: 'Montserrat', size: 14, weight: 'bold' },
      bodyFont: { family: 'Montserrat', size: 13 },
      padding: 12,
      cornerRadius: 8,
      borderColor: 'rgba(197, 160, 89, 0.3)',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.02)', drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.4)' },
      beginAtZero: true
    },
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Montserrat', size: 13, weight: '600' } }
    }
  }
}
</script>

<template>
  <div class="agent-detail-view">
    <div class="view-header">
      <button class="btn-back" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i> Volver al Dashboard
      </button>
      <CustomTimeFilter @change="handleFilterChange" />
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader-ring"></div>
      <p>Cargando perfil premium...</p>
    </div>

    <div v-else-if="error" class="error-state glass-card">
      <i class="fa-solid fa-ghost"></i>
      <h2>{{ error }}</h2>
      <button class="btn-back" @click="goBack">Regresar</button>
    </div>

    <div v-else-if="agent" class="profile-dashboard">
      <!-- Profile Header -->
      <section class="profile-header glass-panel">
        <div class="profile-cover">
          <div class="glow-orb gold"></div>
          <div class="glow-orb cyan"></div>
          <img src="@/assets/logo/logo-powerhouse.png" alt="Powerhouse Biotech" class="company-logo" />
        </div>
        <div class="profile-info-wrapper">
          <div class="avatar-container">
            <img :src="agent.avatar" alt="Avatar" class="profile-avatar" />
            <div class="status-ring" :class="agent.status"></div>
          </div>
          <div class="profile-text">
            <h1 class="profile-name">{{ agent.name }}</h1>
            <p class="profile-email"><i class="fa-solid fa-envelope"></i> {{ agent.email }}</p>
            <span class="badge" :class="agent.status === 'online' ? 'badge-online' : 'badge-offline'">
              {{ agent.status === 'online' ? 'Conectado a Bakano' : 'Desconectado' }}
            </span>
          </div>
          <div class="premium-seal">
            <i class="fa-solid fa-crown"></i> Agente Verificado
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-grid">
        <div class="stat-card glass-panel premium-hover">
          <div class="stat-icon premium-gold"><i class="fa-solid fa-paper-plane"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.messagesSent }}</span>
            <span class="stat-label" style="display: flex; flex-direction: column; gap: 4px;">
              <span>Enviados Totales <span class="info-tooltip" data-tooltip="Suma total de mensajes enviados, tanto manuales como automáticos."><i class="fa-solid fa-circle-info"></i></span></span>
              <span style="font-size: 0.75rem; color: #c5a059; text-transform: none;"><i class="fa-solid fa-user-pen"></i> {{ agent.messagesSentManual || 0 }} Manuales</span>
              <span style="font-size: 0.75rem; color: #21bcfb; text-transform: none;"><i class="fa-solid fa-robot"></i> {{ agent.messagesSentAutomated || 0 }} Automáticos</span>
            </span>
          </div>
        </div>

        <div class="stat-card glass-panel premium-hover">
          <div class="stat-icon premium-cyan"><i class="fa-solid fa-inbox"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.messagesReceived }}</span>
            <span class="stat-label">Mensajes Recibidos <span class="info-tooltip" data-tooltip="(Estimación) Suma de mensajes individuales (burbujas de texto) recibidos dentro de los chats"><i class="fa-solid fa-circle-info"></i></span></span>
          </div>
        </div>

        <div class="stat-card glass-panel premium-hover">
          <div class="stat-icon premium-purple"><i class="fa-solid fa-briefcase"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.activeHours }} <small>hrs</small></span>
            <span class="stat-label">Tiempo Activo <span class="info-tooltip" data-tooltip="Diferencia en horas entre el primer y último mensaje enviado en el periodo"><i class="fa-solid fa-circle-info"></i></span></span>
          </div>
        </div>

        <div class="stat-card glass-panel premium-hover">
          <div class="stat-icon premium-silver"><i class="fa-solid fa-stopwatch"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.avgResponseTimeMinutes }} <small>min</small></span>
            <span class="stat-label">T. Promedio de Respuesta <span class="info-tooltip" data-tooltip="(Estimación) Tiempo promedio que demora la asesora en responder un mensaje nuevo"><i class="fa-solid fa-circle-info"></i></span></span>
          </div>
        </div>
      </section>

      <!-- Pipeline Section -->
      <section v-if="agent.pipeline" class="pipeline-section glass-panel">
        <div class="chart-header">
          <h2>Embudo de Ventas & Oportunidades</h2>
          <span class="chart-badge">CRM Pipeline</span>
        </div>
        
        <div class="pipeline-grid">
          <div class="pipeline-stage stage-attract">
            <div class="stage-header"><i class="fa-solid fa-magnet"></i> Atracción</div>
            <div class="stage-metrics">
              <div class="metric"><span class="label">Leads <span class="info-tooltip" data-tooltip="Total de Oportunidades asociadas a la asesora en el CRM"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.leads }}</span></div>
            </div>
          </div>
          
          <div class="pipeline-stage stage-contact">
            <div class="stage-header"><i class="fa-solid fa-comments"></i> Contacto</div>
            <div class="stage-metrics">
              <div class="metric"><span class="label">Llamadas (Total) <span class="info-tooltip" data-tooltip="Oportunidades en una etapa (Stage) del CRM que contenga la palabra 'Llamada'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.calls }}</span></div>
              <div class="metric"><span class="label">Llamadas Resp. <span class="info-tooltip" data-tooltip="Oportunidades en una etapa del CRM que contenga 'Llamada' y además 'Contest', 'Respond' o 'Efectiva'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.answeredCalls }}</span></div>
              <div class="metric"><span class="label">Chats de WhatsApp <span class="info-tooltip" data-tooltip="Suma de conversaciones distintas (hilos de chat) cuyo canal de origen es WhatsApp, SMS o Live Chat"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.whatsapp }}</span></div>
              <div class="metric"><span class="label">Hilos de E-mail <span class="info-tooltip" data-tooltip="Suma de conversaciones distintas (hilos de correo) cuyo canal de origen es Email"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.email }}</span></div>
            </div>
          </div>

          <div class="pipeline-stage stage-appointment">
            <div class="stage-header"><i class="fa-regular fa-calendar-check"></i> Citas</div>
            <div class="stage-metrics">
              <div class="metric"><span class="label">Info Agendadas <span class="info-tooltip" data-tooltip="Oportunidades en etapa de CRM que contenga 'Cita' o 'Agend', pero NO 'Presencial' ni 'Física'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.infoAppointmentsScheduled }}</span></div>
              <div class="metric"><span class="label">Info Asistidas <span class="info-tooltip" data-tooltip="Citas informativas cuya etapa del CRM contiene adicionalmente 'Asisti' o 'Show'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.infoAppointmentsAttended }}</span></div>
              <div class="metric"><span class="label">Pres. Agendadas <span class="info-tooltip" data-tooltip="Oportunidades en etapa de CRM que contenga 'Cita' o 'Agend', y ADEMÁS 'Presencial' o 'Física'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.presentialAppointmentsScheduled }}</span></div>
              <div class="metric"><span class="label">Pres. Asistidas <span class="info-tooltip" data-tooltip="Citas presenciales cuya etapa del CRM contiene adicionalmente 'Asisti' o 'Show'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.presentialAppointmentsAttended }}</span></div>
            </div>
          </div>

          <div class="pipeline-stage stage-close">
            <div class="stage-header"><i class="fa-solid fa-handshake"></i> Cierre</div>
            <div class="stage-metrics">
              <div class="metric highlight"><span class="label">Inicios de Tratamiento <span class="info-tooltip" data-tooltip="Oportunidades con status de CRM 'Ganado/Won' o en una etapa que contenga 'Tratamiento'"><i class="fa-solid fa-circle-info"></i></span></span><span class="value">{{ agent.pipeline.treatmentsStarted }}</span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Chats Section -->
      <section v-if="agent.recentChats && agent.recentChats.length > 0" class="chats-section glass-panel">
        <div class="chart-header">
          <h2>Conversaciones Recientes</h2>
          <span class="chart-badge">Últimos {{ agent.recentChats.length }} chats</span>
        </div>
        
        <div class="chats-list">
          <div v-for="chat in agent.recentChats" :key="chat.id" class="chat-card premium-hover clickable" @click="openChat(chat)">
            <div class="chat-avatar">
              <i class="fa-solid fa-user-circle"></i>
            </div>
            <div class="chat-content">
              <div class="chat-meta">
                <h3 class="chat-name">{{ chat.name }}</h3>
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                  <span v-if="chat.source === 'workflow' || chat.source === 'automation'" class="badge" style="font-size: 0.65rem; padding: 0.2rem 0.6rem; background: rgba(33, 188, 251, 0.1); color: #21bcfb; border: 1px solid rgba(33, 188, 251, 0.2);"><i class="fa-solid fa-robot"></i> Bot</span>
                  <span v-else class="badge" style="font-size: 0.65rem; padding: 0.2rem 0.6rem; background: rgba(197, 160, 89, 0.1); color: #c5a059; border: 1px solid rgba(197, 160, 89, 0.2);"><i class="fa-solid fa-user-pen"></i> Asesor</span>
                  <span class="chat-date">{{ new Date(chat.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }}</span>
                </div>
              </div>
              <p class="chat-phone"><i class="fa-solid fa-phone"></i> {{ chat.phone }}</p>
              <p class="chat-message" v-if="chat.lastMessage">
                <i class="fa-solid fa-comment-dots"></i> {{ chat.lastMessage }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Opportunities Section -->
      <section v-if="agent.opportunities && agent.opportunities.length > 0" class="opportunities-section glass-panel">
        <div class="chart-header">
          <h2>Oportunidades Activas por Etapa</h2>
          <span class="chart-badge">CRM Leads</span>
        </div>
        
        <div class="opportunities-stages">
          <div v-for="group in groupedOpportunities" :key="group.stageName" class="stage-group">
            <div class="stage-group-header">
              <h3 class="group-title" :class="getStageClass(group.stageName)">
                {{ group.stageName }} <span class="group-count">({{ group.count }})</span>
              </h3>
              <div class="group-total">{{ formatCurrency(group.total) }}</div>
            </div>

            <div class="opportunities-list">
              <div v-for="opp in group.opps" :key="opp.id" class="opp-card glass-panel premium-hover">
                <div class="opp-info">
                  <h3 class="opp-name">{{ opp.name }}</h3>
                  <p class="opp-date"><i class="fa-regular fa-calendar"></i> Creado: {{ new Date(opp.createdAt).toLocaleDateString() }}</p>
                </div>
                
                <div class="opp-meta">
                  <span class="opp-value">{{ formatCurrency(Number(opp.monetaryValue) || 0) }}</span>
                  <span class="opp-status" :class="opp.status">
                    <i v-if="opp.status === 'open'" class="fa-solid fa-circle-dot fa-fade" style="color: #21bcfb;"></i>
                    <i v-else-if="opp.status === 'won'" class="fa-solid fa-check-circle"></i>
                    <i v-else class="fa-solid fa-xmark-circle"></i>
                    {{ opp.status === 'open' ? 'En Seguimiento' : (opp.status === 'won' ? 'Ganado' : 'Perdido') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Chart Section -->
      <section class="chart-section glass-panel">
        <div class="chart-header">
          <h2>Balance de Productividad</h2>
          <span class="chart-badge">Data by crm.bakano.ec</span>
        </div>
        <div class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </section>
    </div>

    <!-- Chat Modal -->
    <div v-if="selectedChat" class="modal-overlay" @click.self="closeChat">
      <div class="chat-modal glass-panel">
        <div class="chat-modal-header">
          <div class="chat-modal-info">
            <h3>{{ selectedChat.name }}</h3>
            <p><i class="fa-solid fa-phone"></i> {{ selectedChat.phone }}</p>
          </div>
          <button class="btn-close" @click="closeChat"><i class="fa-solid fa-xmark"></i></button>
        </div>
        
        <div class="chat-modal-body" ref="chatBodyRef">
          <div v-if="loadingChat" class="loading-chat">
            <div class="loader-ring small"></div>
            <p>Cargando hilo de chat...</p>
          </div>
          <div v-else-if="!selectedChat.messages || selectedChat.messages.length === 0" class="no-messages">
            No hay historial de mensajes para mostrar.
          </div>
          <div class="chat-messages-container" v-else>
            <div v-for="msg in selectedChat.messages" :key="msg.id" class="message-bubble" :class="msg.direction">
              <div class="msg-content">
                {{ msg.body }}
              </div>
              <div class="msg-meta">
                <span class="msg-time">{{ new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                <span class="msg-source" v-if="msg.direction === 'outbound'">
                  <template v-if="msg.source === 'workflow' || msg.source === 'automation' || msg.source === 'campaign'">
                    <i class="fa-solid fa-robot" title="Automático"></i>
                  </template>
                  <template v-else>
                    <i class="fa-solid fa-user-pen" title="Manual"></i>
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Core Layout & Animations */
.agent-detail-view {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  padding-bottom: 4rem;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Premium Glassmorphism */
.glass-panel {
  background: rgba(13, 16, 33, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-2);
  padding: 0.6rem 1.4rem;
  border-radius: 50px;
  cursor: pointer;
  font-family: var(--font-montserrat);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgba(197, 160, 89, 0.1);
    border-color: rgba(197, 160, 89, 0.4);
    color: #c5a059;
    transform: translateX(-5px);
    box-shadow: 0 4px 15px rgba(197, 160, 89, 0.2);
  }
}

/* Profile Header */
.profile-header {
  position: relative;
  margin-bottom: 2.5rem;
}

.profile-cover {
  position: relative;
  height: 160px;
  background: linear-gradient(to right, #0b0c10, #14183c);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;

  .glow-orb {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
    
    &.gold { top: -50px; left: 10%; background: #c5a059; }
    &.cyan { bottom: -80px; right: 20%; background: #21bcfb; }
  }
}

.company-logo {
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  height: 45px;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  z-index: 2;
  opacity: 0.9;
  transition: opacity 0.3s ease;

  &:hover { opacity: 1; }
}

.profile-info-wrapper {
  padding: 0 3rem 2.5rem 3rem;
  display: flex;
  align-items: flex-end;
  gap: 2.5rem;
  margin-top: -65px;
  position: relative;
  z-index: 3;
}

.avatar-container {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(13, 16, 33, 0.9);
  padding: 4px;
  background: linear-gradient(135deg, #c5a059 0%, #21bcfb 100%);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
}

.status-ring {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid #0d1021;
  z-index: 10;
  
  &.online { background: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8); }
  &.offline { background: #ef4444; }
}

.profile-text {
  padding-bottom: 0.5rem;
  flex-grow: 1;
}

.profile-name {
  font-family: var(--font-montserrat);
  font-size: 2.4rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 0.4rem 0;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.profile-email {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.badge {
  display: inline-flex;
  padding: 0.4rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  
  &-online { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
  &-offline { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
}

.premium-seal {
  padding-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c5a059;
  font-family: var(--font-montserrat);
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  i { font-size: 1.1rem; filter: drop-shadow(0 0 8px rgba(197, 160, 89, 0.6)); }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
  overflow: visible !important; /* Prevent tooltip clipping if glass-panel has overflow hidden */

  &.premium-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}

.stat-icon {
  width: 64px; height: 64px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  &.premium-gold { background: linear-gradient(135deg, rgba(197, 160, 89, 0.15), rgba(197, 160, 89, 0.05)); color: #c5a059; }
  &.premium-cyan { background: linear-gradient(135deg, rgba(33, 188, 251, 0.15), rgba(33, 188, 251, 0.05)); color: #21bcfb; }
  &.premium-purple { background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05)); color: #a855f7; }
  &.premium-silver { background: linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.05)); color: #94a3b8; }
}

.stat-info { display: flex; flex-direction: column; gap: 0.3rem; }
.stat-value { font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-montserrat); line-height: 1; small { font-size: 1rem; color: rgba(255,255,255,0.4); font-weight: 600; } }
.stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

/* Pipeline Section */
.pipeline-section {
  padding: 2.5rem;
  margin-bottom: 2.5rem;
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.pipeline-stage {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
    border-color: rgba(255,255,255,0.1);
  }
}

.stage-header {
  padding: 1rem;
  font-family: var(--font-montserrat);
  font-weight: 700;
  text-align: center;
  color: #fff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  
  i { opacity: 0.7; }
}

.stage-attract .stage-header { background: linear-gradient(90deg, rgba(33, 188, 251, 0.15), transparent); border-top: 3px solid #21bcfb; }
.stage-contact .stage-header { background: linear-gradient(90deg, rgba(168, 85, 247, 0.15), transparent); border-top: 3px solid #a855f7; }
.stage-appointment .stage-header { background: linear-gradient(90deg, rgba(148, 163, 184, 0.15), transparent); border-top: 3px solid #94a3b8; }
.stage-close .stage-header { background: linear-gradient(90deg, rgba(197, 160, 89, 0.15), transparent); border-top: 3px solid #c5a059; }

.stage-metrics {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;

  &:hover { background: rgba(255, 255, 255, 0.05); }
  
  .label { 
    font-size: 0.85rem; 
    color: rgba(255, 255, 255, 0.6); 
    display: flex;
    align-items: center;
  }
  
  .value {
    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    font-family: var(--font-montserrat);
  }

  &.highlight {
    background: rgba(197, 160, 89, 0.1);
    border: 1px solid rgba(197, 160, 89, 0.3);
    border-radius: 8px;
    padding: 1rem 0.8rem;
    
    .label { color: #c5a059; font-weight: 700; font-size: 0.85rem; }
    .value { color: #c5a059; font-size: 1.6rem; text-shadow: 0 0 10px rgba(197, 160, 89, 0.4); }
  }
}

/* Tooltips */
.info-tooltip {
  position: relative;
  cursor: help;
  color: rgba(33, 188, 251, 0.6);
  margin-left: 6px;
  font-size: 0.8rem;
  transition: color 0.2s ease;

  &:hover {
    color: #21bcfb;
  }

  &::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 150%;
    left: 50%;
    transform: translateX(-50%) scale(0.9);
    background: rgba(11, 12, 16, 0.95);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    white-space: normal;
    min-width: 150px;
    width: max-content;
    max-width: 250px;
    text-align: center;
    border: 1px solid rgba(33, 188, 251, 0.3);
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 100;
    
    /* Reset inherited styles from labels */
    text-transform: none;
    letter-spacing: normal;
    font-weight: 500;
    line-height: 1.4;
  }
  
  &:hover::after {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.opportunities-section {
  padding: 2.5rem;
  margin-bottom: 2.5rem;
}

.opportunities-stages {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.stage-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.group-title {
  font-family: var(--font-montserrat);
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  
  &.tag-cyan { color: #21bcfb; }
  &.tag-purple { color: #a855f7; }
  &.tag-silver { color: #94a3b8; }
  &.tag-gold { color: #c5a059; }
  &.tag-blue { color: #3b82f6; }
}

.group-count {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

.group-total {
  font-family: var(--font-montserrat);
  font-size: 1.3rem;
  font-weight: 800;
  color: #10b981;
}

.opportunities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.opp-card {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &.premium-hover:hover {
    transform: translateX(5px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(33, 188, 251, 0.3);
  }
}

.opp-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.opp-name {
  font-family: var(--font-montserrat);
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.opp-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.opp-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.opp-value {
  font-family: var(--font-montserrat);
  font-size: 1.25rem;
  font-weight: 800;
  color: #10b981;
}

.opp-stage {
  padding: 0.4rem 1rem;
}

/* Recent Chats Section */
.chats-section {
  padding: 2.5rem;
  margin-bottom: 2.5rem;
}

.chats-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(33, 188, 251, 0.3);
    border-radius: 4px;
  }
}

.chat-card {
  display: flex;
  gap: 1.2rem;
  padding: 1.2rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
  align-items: center;

  &.clickable {
    cursor: pointer;
  }

  &.premium-hover:hover {
    transform: translateX(5px);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(197, 160, 89, 0.3);
  }
}

.chat-avatar {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.chat-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.chat-name {
  font-family: var(--font-montserrat);
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

.chat-phone {
  margin: 0;
  font-size: 0.85rem;
  color: #21bcfb;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.chat-message {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-style: italic;
}

.opp-stage {
  padding: 0.4rem 1rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.05);
  
  &.tag-cyan { color: #21bcfb; border: 1px solid rgba(33,188,251,0.3); background: rgba(33,188,251,0.1); }
  &.tag-purple { color: #a855f7; border: 1px solid rgba(168,85,247,0.3); background: rgba(168,85,247,0.1); }
  &.tag-silver { color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); background: rgba(148,163,184,0.1); }
  &.tag-gold { color: #c5a059; border: 1px solid rgba(197,160,89,0.3); background: rgba(197,160,89,0.1); }
  &.tag-blue { color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.1); }
}

.opp-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 100px;
  
  &.open { color: #21bcfb; }
  &.won { color: #10b981; }
  &.lost { color: #ef4444; }
}

/* Chart Section */
.chart-section {
  padding: 2.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 { margin: 0; font-family: var(--font-montserrat); font-size: 1.4rem; color: #fff; font-weight: 700; }
}

.chart-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.chart-wrapper {
  height: 380px;
  width: 100%;
}

/* Loading & Error */
.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center; padding: 6rem 0; gap: 1.5rem; color: var(--text-2);
}

.loader-ring {
  width: 60px; height: 60px;
  border: 3px solid rgba(255,255,255,0.05); border-top-color: #c5a059;
  border-radius: 50%; animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 992px) {
  .profile-info-wrapper {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 1.5rem 2rem 1.5rem;
    margin-top: -70px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .profile-name { font-size: 1.8rem; }
  .profile-email { justify-content: center; font-size: 0.9rem; }

  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .premium-seal { padding-bottom: 0; padding-top: 1rem; }
  .company-logo { top: 1rem; right: 1rem; height: 35px; }
}

@media (max-width: 768px) {
  .stage-group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .opp-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
    padding: 1.2rem;
  }
  
  .opp-meta {
    width: 100%;
    justify-content: space-between;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

/* Chat Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.chat-modal {
  width: 100%;
  max-width: 600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  background: #0d1021;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
  animation: modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalScale {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.chat-modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.chat-modal-info h3 {
  margin: 0 0 0.3rem 0;
  color: #fff;
  font-family: var(--font-montserrat);
  font-size: 1.2rem;
}

.chat-modal-info p {
  margin: 0;
  color: #21bcfb;
  font-size: 0.9rem;
}

.btn-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover { color: #fff; }
}

.chat-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: url('https://w0.peakpx.com/wallpaper/508/172/HD-wallpaper-whatsapp-dark-background.jpg') center/cover;
  display: flex;
  flex-direction: column;
}

.no-messages {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2rem;
}

.chat-messages-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;

  .loader-ring.small {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }
}

.message-bubble {
  max-width: 80%;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  &.inbound {
    align-self: flex-start;
    background: #1f2c34; /* WhatsApp Dark Mode Received Bubble */
    border-top-left-radius: 2px;
    color: #fff;
  }

  &.outbound {
    align-self: flex-end;
    background: #005c4b; /* WhatsApp Dark Mode Sent Bubble */
    border-top-right-radius: 2px;
    color: #e9edef;
  }
}

.msg-content {
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.msg-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.msg-source i {
  font-size: 0.75rem;
  &.fa-robot { color: #21bcfb; }
  &.fa-user-pen { color: #c5a059; }
}
</style>
