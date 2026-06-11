<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'change', dates: { startDate: string, endDate: string }): void
}>()

// --- ESTADO INICIAL ---
const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

const startDate = ref<Date | null>(firstDay)
const endDate = ref<Date | null>(today)

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// --- ESTADO DEL CALENDARIO ---
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())
const selectionStep = ref<'start' | 'end'>('start') // Qué estamos seleccionando

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// --- FUNCIONES DE NAVEGACIÓN ---
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

// --- LÓGICA DEL GRID ---
const calendarDays = computed(() => {
  const days: { date: Date, isCurrentMonth: boolean }[] = []
  
  // Primer día del mes
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  // Último día del mes
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)
  
  // En JS, getDay() devuelve 0 para Domingo, 1 para Lunes. Queremos que Lunes sea 0.
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6 // Domingo

  // Rellenar días del mes anterior
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(currentYear.value, currentMonth.value - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    })
  }

  // Rellenar días del mes actual
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push({
      date: new Date(currentYear.value, currentMonth.value, i),
      isCurrentMonth: true
    })
  }

  // Rellenar días del próximo mes (para completar cuadrícula de 42 días, 6 semanas)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(currentYear.value, currentMonth.value + 1, i),
      isCurrentMonth: false
    })
  }

  return days
})

// --- LÓGICA DE SELECCIÓN ---
const selectDay = (day: { date: Date, isCurrentMonth: boolean }) => {
  // Ignorar clics en días de otros meses para evitar confusión (opcional, pero buena práctica)
  // if (!day.isCurrentMonth) return;

  const d = new Date(day.date)
  d.setHours(0, 0, 0, 0)

  if (selectionStep.value === 'start') {
    startDate.value = d
    endDate.value = null
    selectionStep.value = 'end'
  } else {
    if (startDate.value && d < startDate.value) {
      // Si seleccionó una fecha final menor a la inicial, se vuelve la inicial
      startDate.value = d
      endDate.value = null
      selectionStep.value = 'end'
    } else {
      endDate.value = d
      selectionStep.value = 'start'
      // Emitir y cerrar
      isOpen.value = false
      emitDates()
    }
  }
}

const isSelected = (d: Date) => {
  if (startDate.value && d.getTime() === startDate.value.getTime()) return true
  if (endDate.value && d.getTime() === endDate.value.getTime()) return true
  return false
}

const isInRange = (d: Date) => {
  if (startDate.value && endDate.value) {
    return d > startDate.value && d < endDate.value
  }
  return false
}

const isToday = (d: Date) => {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

// --- UTILIDADES ---
const formatDate = (date: Date | null) => {
  if (!date) return '...'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = date.getFullYear()
  return `${dd}/${mm}/${yy}`
}

const emitDates = () => {
  if (startDate.value && endDate.value) {
    const sStr = `${startDate.value.getFullYear()}-${String(startDate.value.getMonth()+1).padStart(2,'0')}-${String(startDate.value.getDate()).padStart(2,'0')}`
    const eStr = `${endDate.value.getFullYear()}-${String(endDate.value.getMonth()+1).padStart(2,'0')}-${String(endDate.value.getDate()).padStart(2,'0')}`
    emit('change', { startDate: sStr, endDate: eStr })
  }
}

// Controlar click fuera para cerrar
const toggleDropdown = () => { isOpen.value = !isOpen.value }
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })

</script>

<template>
  <div class="custom-datepicker" ref="dropdownRef">
    <!-- Botón / Input visual -->
    <button class="filter-btn glass-panel" @click="toggleDropdown" :class="{ 'is-active': isOpen }">
      <div class="date-display">
        <span class="label">Desde</span>
        <span class="value">{{ formatDate(startDate) }}</span>
      </div>
      <i class="fa-solid fa-arrow-right-long separator"></i>
      <div class="date-display">
        <span class="label">Hasta</span>
        <span class="value">{{ formatDate(endDate) }}</span>
      </div>
      <i class="fa-solid fa-calendar-week icon-end"></i>
    </button>

    <!-- Popup Calendario -->
    <transition name="dropdown-fade">
      <div v-if="isOpen" class="calendar-popup glass-panel">
        
        <!-- Controles Mes/Año -->
        <div class="calendar-header">
          <button class="nav-btn" @click.stop="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="current-month">{{ monthNames[currentMonth] }} {{ currentYear }}</div>
          <button class="nav-btn" @click.stop="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
        </div>

        <!-- Indicador de acción -->
        <div class="selection-helper">
          <span v-if="selectionStep === 'start'">Selecciona la Fecha Inicial</span>
          <span v-else>Selecciona la Fecha Final</span>
        </div>

        <!-- Días de la semana -->
        <div class="weekdays">
          <div v-for="d in weekDays" :key="d" class="weekday">{{ d }}</div>
        </div>

        <!-- Cuadrícula de días -->
        <div class="days-grid">
          <button 
            v-for="(day, idx) in calendarDays" :key="idx"
            class="day-btn"
            :class="{
              'is-muted': !day.isCurrentMonth,
              'is-selected': isSelected(day.date),
              'is-in-range': isInRange(day.date),
              'is-today': isToday(day.date)
            }"
            @click.stop="selectDay(day)"
          >
            {{ day.date.getDate() }}
          </button>
        </div>
        
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.custom-datepicker {
  position: relative;
  display: inline-block;
  font-family: var(--font-montserrat);
}

.glass-panel {
  background: rgba(13, 17, 54, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1.25rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    border-color: rgba(33, 188, 251, 0.3);
    box-shadow: 0 4px 20px rgba(33, 188, 251, 0.15);
  }

  &.is-active {
    border-color: #21bcfb;
    background: rgba(33, 188, 251, 0.05);
  }
}

.date-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;

  .label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); font-weight: 700; }
  .value { font-size: 0.95rem; font-weight: 600; }
}

.separator { color: rgba(255, 255, 255, 0.2); font-size: 0.9rem; }
.icon-end { color: #21bcfb; font-size: 1.2rem; margin-left: 0.5rem; }

/* Popup */
.calendar-popup {
  position: absolute;
  top: calc(100% + 0.8rem);
  right: 0;
  width: 320px;
  padding: 1.5rem;
  z-index: 100;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .current-month {
    font-weight: 700;
    font-size: 1.1rem;
    color: #fff;
    text-transform: capitalize;
  }

  .nav-btn {
    background: transparent;
    border: none;
    color: var(--text-3);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover { background: rgba(255,255,255,0.05); color: #fff; }
  }
}

.selection-helper {
  text-align: center;
  font-size: 0.75rem;
  color: #21bcfb;
  font-weight: 600;
  margin-bottom: 1rem;
  background: rgba(33, 188, 251, 0.1);
  padding: 0.4rem;
  border-radius: 6px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.5rem;
  
  .weekday {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-3);
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.3rem;
}

.day-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.6rem 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.is-selected) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.is-muted {
    color: rgba(255, 255, 255, 0.2);
  }

  &.is-today {
    color: #c5a059;
    font-weight: 800;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #c5a059;
    }
  }

  &.is-in-range {
    background: rgba(33, 188, 251, 0.15);
    border-radius: 4px; /* Menos curvo para dar efecto de continuidad */
  }

  &.is-selected {
    background: #21bcfb;
    color: #0d1021;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(33, 188, 251, 0.4);
    transform: scale(1.05);
    z-index: 2;
  }
}

/* Transitions */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

@media (max-width: 768px) {
  .calendar-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 360px;
    z-index: 1000;
  }
  
  .filter-btn {
    width: 100%;
    justify-content: space-between;
  }

  .dropdown-fade-enter-from,
  .dropdown-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -45%) scale(0.95);
  }
}
</style>
