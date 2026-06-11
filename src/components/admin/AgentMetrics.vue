<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
import { useRouter } from 'vue-router'
import CustomTimeFilter from './CustomTimeFilter.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const loading = ref(true)
const error = ref('')
const agents = ref<AgentMetric[]>([])

const router = useRouter()

// Top 5 Ranking Logic
type RankingMode = 'leads' | 'income' | 'treatments';
const currentRankingMode = ref<RankingMode>('leads');

const top5Agents = computed(() => {
  return [...agents.value].sort((a, b) => {
    if (currentRankingMode.value === 'leads') {
      return (b.pipeline?.leads || 0) - (a.pipeline?.leads || 0);
    } else if (currentRankingMode.value === 'income') {
      return (b.pipeline?.totalMonetaryValue || 0) - (a.pipeline?.totalMonetaryValue || 0);
    } else if (currentRankingMode.value === 'treatments') {
      return (b.pipeline?.wonOpportunities || 0) - (a.pipeline?.wonOpportunities || 0);
    }
    return 0;
  }).slice(0, 5);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

const totalMessages = computed(() => {
  return agents.value.reduce((acc, curr) => acc + curr.messagesSent + curr.messagesReceived, 0)
})

const avgResponseTime = computed(() => {
  if (agents.value.length === 0) return 0
  const total = agents.value.reduce((acc, curr) => acc + curr.avgResponseTimeMinutes, 0)
  return (total / agents.value.length).toFixed(1)
})

// Custom Chart.js Options for Premium Look
const barChartData = computed(() => {
  return {
    labels: agents.value.map(a => a.name.split(' ')[0]),
    datasets: [
      {
        label: 'Enviados',
        backgroundColor: 'rgba(33, 188, 251, 0.9)',
        hoverBackgroundColor: 'rgba(33, 188, 251, 1)',
        data: agents.value.map(a => a.messagesSent),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: 'Recibidos',
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
        data: agents.value.map(a => a.messagesReceived),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  }
})

const barChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: { family: 'Montserrat', size: 12, weight: '500' },
        usePointStyle: true,
        boxWidth: 8
      }
    },
    tooltip: {
      backgroundColor: 'rgba(13, 17, 54, 0.9)',
      titleFont: { family: 'Montserrat', size: 14, weight: 'bold' },
      bodyFont: { family: 'Montserrat', size: 13 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { family: 'Montserrat', size: 11 } },
      beginAtZero: true
    },
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { family: 'Montserrat', size: 12, weight: '600' } }
    }
  }
}

// Guarda el filtro actual para el botón de refrescar
const currentDates = ref<{ startDate?: string, endDate?: string }>({})

async function fetchMetrics(dates?: { startDate: string, endDate: string }) {
  if (dates) {
    currentDates.value = dates
  }

  loading.value = true
  error.value = ''
  try {
    const data = await ghlService.getAgentMetrics(currentDates.value.startDate, currentDates.value.endDate)
    agents.value = data
  } catch (e: any) {
    error.value = e.message || 'Error desconocido al cargar métricas de crm.bakano.ec'
  } finally {
    loading.value = false
  }
}

function openAgentDetail(agent: AgentMetric) {
  router.push(`/admin/metrics/${agent.id}`)
}

onMounted(() => {
  fetchMetrics()
})
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Header Section -->
    <header class="dash-header">
      <div class="dash-header__titles">
        <h1 class="dash-title">
          <span class="icon-wrap"><i class="fa-solid fa-chart-pie"></i></span>
          Inteligencia de Agentes
          <div class="alliance-tag">
            <i class="fa-solid fa-xmark"></i>
            <img src="@/assets/logo/logo-bakano.png" alt="Bakano" class="alliance-logo" />
          </div>
        </h1>
        <p class="dash-subtitle">Monitoreo en tiempo real impulsado por crm.bakano.ec</p>
      </div>
      <div class="header-actions">
        <CustomTimeFilter @change="fetchMetrics" />
        <button class="btn-refresh" @click="() => fetchMetrics()" :disabled="loading">
          <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': loading }"></i> 
          <span>Sincronizar Datos</span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader-ring"></div>
      <p>Procesando métricas neuronales...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container glass-card">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h2>Anomalía Detectada</h2>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="() => fetchMetrics()">Reintentar Conexión</button>
    </div>

    <!-- Main Dashboard Content -->
    <div v-else class="dash-content">
      
      <!-- KPI Row -->
      <section class="kpi-section">
        <div class="kpi-card glass-panel">
          <div class="kpi-card__glow bg-blue"></div>
          <div class="kpi-card__icon text-blue"><i class="fa-solid fa-comments"></i></div>
          <div class="kpi-card__data">
            <span class="kpi-card__value">{{ totalMessages }}</span>
            <span class="kpi-card__label">Interacciones Globales</span>
          </div>
        </div>

        <div class="kpi-card glass-panel">
          <div class="kpi-card__glow bg-orange"></div>
          <div class="kpi-card__icon text-orange"><i class="fa-solid fa-bolt"></i></div>
          <div class="kpi-card__data">
            <span class="kpi-card__value">{{ avgResponseTime }} <small>min</small></span>
            <span class="kpi-card__label">Velocidad de Respuesta</span>
          </div>
        </div>

        <div class="kpi-card glass-panel">
          <div class="kpi-card__glow bg-green"></div>
          <div class="kpi-card__icon text-green"><i class="fa-solid fa-user-astronaut"></i></div>
          <div class="kpi-card__data">
            <span class="kpi-card__value">{{ agents.length }}</span>
            <span class="kpi-card__label">Agentes Activos</span>
          </div>
        </div>
      </section>

      <!-- Chart Section -->
      <section class="chart-section glass-panel">
        <div class="section-header">
          <h2>Flujo de Comunicación por Agente</h2>
        </div>
        <div class="chart-wrapper">
          <Bar :data="barChartData" :options="barChartOptions" />
        </div>
      </section>

      <!-- Top 5 Ranking Section -->
    <section class="top-ranking-section" v-if="agents.length > 0">
      <div class="ranking-header">
        <div class="ranking-title">
          <i class="fa-solid fa-trophy premium-gold-text"></i>
          <h2>Top 5 Mejores Asesoras</h2>
        </div>
        <div class="ranking-tabs">
          <button 
            :class="['ranking-tab', { active: currentRankingMode === 'leads' }]" 
            @click="currentRankingMode = 'leads'">
            <i class="fa-solid fa-users"></i> Volumen (Leads)
          </button>
          <button 
            :class="['ranking-tab', { active: currentRankingMode === 'income' }]" 
            @click="currentRankingMode = 'income'">
            <i class="fa-solid fa-sack-dollar"></i> Ingresos ($)
          </button>
          <button 
            :class="['ranking-tab', { active: currentRankingMode === 'treatments' }]" 
            @click="currentRankingMode = 'treatments'">
            <i class="fa-solid fa-star"></i> Cierres (Ganados)
          </button>
        </div>
      </div>

      <div class="ranking-list">
        <div v-for="(agent, index) in top5Agents" :key="agent.id" class="ranking-card glass-panel premium-hover" @click="openAgentDetail(agent)">
          <div class="rank-position" :class="'rank-' + (index + 1)">
            <span v-if="index === 0"><i class="fa-solid fa-medal"></i> 1</span>
            <span v-else-if="index === 1"><i class="fa-solid fa-medal"></i> 2</span>
            <span v-else-if="index === 2"><i class="fa-solid fa-medal"></i> 3</span>
            <span v-else>#{{ index + 1 }}</span>
          </div>
          
          <img :src="agent.avatar" alt="avatar" class="rank-avatar" />
          
          <div class="rank-info">
            <h3 class="rank-name">{{ agent.name }}</h3>
            <span class="rank-status" :class="agent.status">
              {{ agent.status === 'online' ? 'Online' : 'Offline' }}
            </span>
          </div>

          <div class="rank-metric">
            <template v-if="currentRankingMode === 'leads'">
              <span class="metric-value">{{ agent.pipeline?.leads || 0 }}</span>
              <span class="metric-label">Leads</span>
            </template>
            <template v-else-if="currentRankingMode === 'income'">
              <span class="metric-value highlight">{{ formatCurrency(agent.pipeline?.totalMonetaryValue || 0) }}</span>
              <span class="metric-label">Ingresos Brutos</span>
            </template>
            <template v-else-if="currentRankingMode === 'treatments'">
              <span class="metric-value won">{{ agent.pipeline?.wonOpportunities || 0 }}</span>
              <span class="metric-label">Tratamientos</span>
            </template>
          </div>
        </div>
      </div>
    </section>

      <!-- Table Section -->
      <section class="table-section glass-panel">
        <div class="section-header">
          <h2>Rendimiento Individual</h2>
        </div>
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Agente / Perfil</th>
                <th>Estado</th>
                <th>Enviados</th>
                <th>Recibidos</th>
                <th>T. Activo</th>
                <th>T. Respuesta</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agent in agents" :key="agent.id" class="table-row">
                <td>
                  <div class="user-cell">
                    <div class="avatar-wrapper">
                      <img :src="agent.avatar" alt="Avatar" class="avatar-img" />
                      <span class="status-dot" :class="agent.status"></span>
                    </div>
                    <div class="user-meta">
                      <span class="user-name">{{ agent.name }}</span>
                      <span class="user-email">{{ agent.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="agent.status === 'online' ? 'badge-online' : 'badge-offline'">
                    {{ agent.status === 'online' ? 'En Línea' : 'Desconectado' }}
                  </span>
                </td>
                <td class="font-mono text-bright">{{ agent.messagesSent }}</td>
                <td class="font-mono text-bright">{{ agent.messagesReceived }}</td>
                <td class="font-mono text-bright">{{ agent.activeHours }}<span class="small-unit">h</span></td>
                <td>
                  <span class="time-pill" :class="agent.avgResponseTimeMinutes > 30 ? 'time-warning' : 'time-good'">
                    <i class="fa-regular fa-clock"></i> {{ agent.avgResponseTimeMinutes }}m
                  </span>
                </td>
                <td class="text-right">
                  <button class="btn-action" @click="openAgentDetail(agent)">
                    <span>Analizar</span>
                    <i class="fa-solid fa-arrow-right"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="agents.length === 0">
                <td colspan="6">
                  <div class="empty-state">
                    <i class="fa-solid fa-ghost"></i>
                    <p>No hay agentes registrados en crm.bakano.ec</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ─────────────────────────────────────────────────────────
   BASE & LAYOUT
   ───────────────────────────────────────────────────────── */
.dashboard-wrapper {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  padding-bottom: 4rem;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─────────────────────────────────────────────────────────
   GLASSMORPHISM UTILS
   ───────────────────────────────────────────────────────── */
.glass-panel {
  background: rgba(20, 24, 60, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

/* ─────────────────────────────────────────────────────────
   HEADER
   ───────────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dash-title {
  font-family: var(--font-montserrat);
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  letter-spacing: -0.02em;

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%);
    border-radius: 14px;
    font-size: 1.4rem;
    color: #fff;
    box-shadow: 0 4px 15px rgba(33, 188, 251, 0.3);
  }
}

.alliance-tag {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 0.5rem;
  padding: 0.4rem 1rem;
  background: rgba(255,255,255,0.03);
  border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.05);
  
  i { font-size: 0.8rem; color: var(--text-3); }
}

.alliance-logo {
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.dash-subtitle {
  color: var(--text-2);
  font-size: 1.05rem;
  margin: 0;
  padding-left: 4.5rem;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(:disabled) {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* ─────────────────────────────────────────────────────────
   KPI SECTION
   ───────────────────────────────────────────────────────── */
.kpi-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
    
    .kpi-card__glow { opacity: 0.15; }
  }

  &__glow {
    position: absolute;
    top: -50%; right: -20%;
    width: 150px; height: 150px;
    border-radius: 50%;
    filter: blur(50px);
    opacity: 0.05;
    transition: opacity 0.3s ease;
    z-index: 0;

    &.bg-blue { background: #21bcfb; }
    &.bg-orange { background: #f59e0b; }
    &.bg-green { background: #10b981; }
  }

  &__icon {
    position: relative;
    z-index: 1;
    width: 64px; height: 64px;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);

    &.text-blue { color: #21bcfb; box-shadow: 0 8px 20px rgba(33, 188, 251, 0.15); }
    &.text-orange { color: #f59e0b; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.15); }
    &.text-green { color: #10b981; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15); }
  }

  &__data {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__value {
    font-size: 2.2rem;
    font-weight: 800;
    font-family: var(--font-montserrat);
    color: #fff;
    line-height: 1;
    
    small { font-size: 1rem; color: var(--text-3); font-weight: 600; }
  }

  &__label {
    font-size: 0.95rem;
    color: var(--text-2);
    font-weight: 500;
  }
}

/* ─────────────────────────────────────────────────────────
   CHART SECTION
   ───────────────────────────────────────────────────────── */
.chart-section {
  padding: 2rem;
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
  h2 {
    font-family: var(--font-montserrat);
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }
}

.chart-wrapper {
  height: 380px;
  width: 100%;
}

/* ─────────────────────────────────────────────────────────
   TABLE SECTION
   ───────────────────────────────────────────────────────── */
.table-section {
  padding: 2rem;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.premium-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;

  th {
    padding: 0 1.5rem 1rem 1.5rem;
    text-align: left;
    color: var(--text-3);
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .text-right { text-align: right; }
  .font-mono { font-family: monospace; font-size: 1.1rem; }
  .text-bright { color: #fff; font-weight: 600; }
}

.table-row {
  transition: all 0.2s ease;

  td {
    padding: 1.25rem 1.5rem;
    background: rgba(255,255,255,0.015);
    vertical-align: middle;
    border-top: 1px solid rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.02);

    &:first-child { border-left: 1px solid rgba(255,255,255,0.02); border-radius: 12px 0 0 12px; }
    &:last-child { border-right: 1px solid rgba(255,255,255,0.02); border-radius: 0 12px 12px 0; }
  }

  &:hover {
    transform: scale(1.005);
    td { background: rgba(255,255,255,0.04); }
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar-wrapper {
  position: relative;
  width: 44px; height: 44px;
}

.avatar-img {
  width: 100%; height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.1);
}

.status-dot {
  position: absolute;
  bottom: 0; right: 0;
  width: 12px; height: 12px;
  border-radius: 50%;
  border: 2px solid var(--surface);

  &.online { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
  &.offline { background: #ef4444; }
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-name { color: #fff; font-weight: 700; font-size: 1.05rem; }
.user-email { color: var(--text-3); font-size: 0.85rem; }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;

  &-online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  &-offline { background: rgba(255, 255, 255, 0.05); color: var(--text-3); }
}

.time-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);

  i { font-size: 0.9rem; }
  
  &.time-good { color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
  &.time-warning { color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
}

.btn-action {
  background: transparent;
  border: 1px solid rgba(33, 188, 251, 0.3);
  color: #21bcfb;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: #21bcfb;
    color: #fff;
    box-shadow: 0 4px 15px rgba(33, 188, 251, 0.4);
    i { transform: translateX(3px); }
  }

  i { transition: transform 0.3s ease; }
}

/* ─────────────────────────────────────────────────────────
   STATES (LOADING & ERROR)
   ───────────────────────────────────────────────────────── */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
  gap: 1.5rem;

  p { color: var(--text-2); font-weight: 500; letter-spacing: 0.05em; }
}

.loader-ring {
  width: 50px; height: 50px;
  border: 3px solid rgba(255,255,255,0.05);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-container {
  padding: 4rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  border-color: rgba(239, 68, 68, 0.3);

  i { font-size: 4rem; color: #ef4444; margin-bottom: 1rem; }
  h2 { color: #fff; margin: 0; font-size: 1.5rem; }
  p { color: var(--text-2); margin-bottom: 1.5rem; }
}

.btn-retry {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 0;
  color: var(--text-3);

  i { font-size: 3rem; opacity: 0.5; }
  p { font-size: 1rem; }
}

/* ─────────────────────────────────────────────────────────
   RESPONSIVE
   ───────────────────────────────────────────────────────── */
@media (max-width: 992px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .dash-subtitle { padding-left: 0; margin-top: 0.5rem; }
  .btn-refresh { width: 100%; justify-content: center; }
  .header-actions { flex-direction: column; width: 100%; }
}
.small-unit { font-size: 0.8rem; color: var(--text-3); font-weight: normal; margin-left: 0.2rem; }
/* Ranking Section */
.top-ranking-section {
  margin-top: 1rem;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.ranking-title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  
  i { font-size: 1.6rem; color: #D4AF37; }
  h2 { font-family: var(--font-montserrat); font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
}

.ranking-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ranking-tab {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  
  &:hover { color: #fff; }
  &.active {
    background: rgba(33, 188, 251, 0.2);
    color: #21bcfb;
    border: 1px solid rgba(33, 188, 251, 0.3);
  }
}

.ranking-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.ranking-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(212, 175, 55, 0.4);
  }
}

.rank-position {
  font-size: 1.2rem;
  font-weight: 800;
  width: 40px;
  text-align: center;
  
  &.rank-1 { color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.4); }
  &.rank-2 { color: #C0C0C0; text-shadow: 0 0 10px rgba(192, 192, 192, 0.4); }
  &.rank-3 { color: #CD7F32; text-shadow: 0 0 10px rgba(205, 127, 50, 0.4); }
  &:not(.rank-1):not(.rank-2):not(.rank-3) { color: rgba(255, 255, 255, 0.3); font-size: 1rem; }
}

.rank-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.rank-name {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.rank-status {
  font-size: 0.75rem;
  font-weight: 600;
  &.online { color: #10b981; }
  &.offline { color: rgba(255, 255, 255, 0.4); }
}

.rank-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.metric-value {
  font-family: var(--font-montserrat);
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  
  &.highlight { color: #c5a059; }
  &.won { color: #10b981; }
}

.metric-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .ranking-header { flex-direction: column; align-items: flex-start; }
  .ranking-tabs { width: 100%; overflow-x: auto; }
  .ranking-tab { flex: 1; white-space: nowrap; justify-content: center; }
}

</style>
