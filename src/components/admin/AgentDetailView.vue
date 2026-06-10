<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const agent = ref<AgentMetric | null>(null)
const error = ref('')

async function fetchAgent() {
  loading.value = true
  try {
    const agentId = route.params.id as string
    const data = await ghlService.getAgentById(agentId)
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

// Chart Config
const chartData = computed(() => {
  if (!agent.value) return { labels: [], datasets: [] }
  return {
    labels: ['Enviados', 'Recibidos'],
    datasets: [
      {
        label: 'Mensajes',
        backgroundColor: ['rgba(33, 188, 251, 0.9)', 'rgba(16, 185, 129, 0.9)'],
        hoverBackgroundColor: ['rgba(33, 188, 251, 1)', 'rgba(16, 185, 129, 1)'],
        data: [agent.value.messagesSent, agent.value.messagesReceived],
        borderRadius: 8,
        barPercentage: 0.5
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
      backgroundColor: 'rgba(13, 17, 54, 0.9)',
      titleFont: { family: 'Montserrat', size: 14, weight: 'bold' },
      bodyFont: { family: 'Montserrat', size: 13 },
      padding: 12,
      cornerRadius: 8,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
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
    <button class="btn-back" @click="goBack">
      <i class="fa-solid fa-arrow-left"></i> Volver al Dashboard
    </button>

    <div v-if="loading" class="loading-state">
      <div class="loader-ring"></div>
      <p>Cargando perfil...</p>
    </div>

    <div v-else-if="error" class="error-state glass-card">
      <i class="fa-solid fa-ghost"></i>
      <h2>{{ error }}</h2>
      <button class="btn-back" @click="goBack">Regresar</button>
    </div>

    <div v-else-if="agent" class="profile-dashboard">
      <!-- Profile Header -->
      <section class="profile-header glass-panel">
        <div class="profile-cover"></div>
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
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-grid">
        <div class="stat-card glass-panel">
          <div class="stat-icon bg-blue"><i class="fa-solid fa-paper-plane"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.messagesSent }}</span>
            <span class="stat-label">Mensajes Enviados</span>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon bg-green"><i class="fa-solid fa-inbox"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.messagesReceived }}</span>
            <span class="stat-label">Mensajes Recibidos</span>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon bg-orange"><i class="fa-solid fa-stopwatch"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ agent.avgResponseTimeMinutes }} <small>min</small></span>
            <span class="stat-label">T. Promedio de Respuesta</span>
          </div>
        </div>
      </section>

      <!-- Chart Section -->
      <section class="chart-section glass-panel">
        <h2>Balance de Productividad</h2>
        <div class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.agent-detail-view {
  animation: fadeUp 0.5s ease forwards;
  padding-bottom: 4rem;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-back {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-2);
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  font-family: var(--font-montserrat);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255,255,255,0.05);
    color: #fff;
    transform: translateX(-5px);
  }
}

.glass-panel {
  background: rgba(20, 24, 60, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Profile Header */
.profile-header {
  position: relative;
  margin-bottom: 2rem;
}

.profile-cover {
  height: 120px;
  background: linear-gradient(135deg, rgba(33, 188, 251, 0.2), rgba(16, 185, 129, 0.2));
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.profile-info-wrapper {
  padding: 0 2.5rem 2.5rem 2.5rem;
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  margin-top: -50px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid var(--surface);
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  position: relative;
  z-index: 2;
}

.status-ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  z-index: 1;
  &.online { box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.6); }
  &.offline { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.4); }
}

.profile-text {
  padding-bottom: 0.5rem;
  flex-grow: 1;
}

.profile-name {
  font-family: var(--font-montserrat);
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.profile-email {
  color: var(--text-2);
  font-size: 1rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  display: inline-flex;
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  
  &-online { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
  &-offline { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.8rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.3s ease;

  &:hover { transform: translateY(-3px); }
}

.stat-icon {
  width: 60px; height: 60px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem;

  &.bg-blue { background: rgba(33, 188, 251, 0.15); color: #21bcfb; }
  &.bg-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  &.bg-orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
}

.stat-info { display: flex; flex-direction: column; gap: 0.2rem; }
.stat-value { font-size: 2rem; font-weight: 800; color: #fff; font-family: var(--font-montserrat); small { font-size: 1rem; color: var(--text-3); } }
.stat-label { font-size: 0.9rem; color: var(--text-2); font-weight: 500; }

/* Chart */
.chart-section {
  padding: 2.5rem;
  
  h2 { margin: 0 0 2rem 0; font-family: var(--font-montserrat); font-size: 1.4rem; color: #fff; }
}

.chart-wrapper {
  height: 350px;
  width: 100%;
}

/* Loading & Error */
.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center; padding: 5rem 0; gap: 1rem; color: var(--text-2);
}

.loader-ring {
  width: 50px; height: 50px;
  border: 3px solid rgba(255,255,255,0.05); border-top-color: var(--primary);
  border-radius: 50%; animation: spin 1s infinite linear;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .profile-info-wrapper {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 1.5rem 2rem 1.5rem;
    margin-top: -60px;
  }
}
</style>
