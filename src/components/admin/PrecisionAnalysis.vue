<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAiAnalysis } from '@/composables/useAiAnalysis'
import { personService } from '@/services/person.service'

const props = defineProps<{
  person: any
  initialReportContent?: string
  initialSelectedFiles?: any[]
}>()

const emit = defineEmits<{
  uploaded: [file: { url: string; filename: string; type: string }]
  error: [message: string]
  goToProfile: []
  'history-saved': [id: string]
}>()

const {
  loading,
  loadingStatus,
  currentStep,
  error: aiError,
  openAiResult,
  claudeResult,
  patientParams,
  runOpenAiAnalysis,
  runClaudeReport
} = useAiAnalysis()

// State
const selectedFiles = ref<any[]>([])
const savingReport = ref(false)

watch(() => props.initialReportContent, (newVal) => {
  if (newVal) {
    claudeResult.value = newVal
    currentStep.value = 4
  }
}, { immediate: true })

watch(() => [props.person?._id, props.initialSelectedFiles], () => {
  if (props.initialSelectedFiles && props.initialSelectedFiles.length > 0) {
    selectedFiles.value = props.person?.medicalFiles?.filter((file: any) =>
      props.initialSelectedFiles?.some(f => f._id === file._id)
    ) || []
  } else if (props.person?.medicalFiles) {
    // Select all non-report files by default so the button is active immediately
    selectedFiles.value = props.person.medicalFiles.filter((f: any) =>
      !(f.type === 'text/markdown' || f.filename.endsWith('.md'))
    )
  } else {
    selectedFiles.value = []
  }
}, { immediate: true, deep: true })

// Computed
const hasFiles = computed(() => props.person.medicalFiles && props.person.medicalFiles.length > 0)

// Helper
function getFileIcon(type: string) {
  if (type.includes('pdf')) return 'fa-file-pdf'
  if (type.includes('image')) return 'fa-image'
  if (type.includes('word') || type.includes('docx') || type.includes('doc')) return 'fa-file-word'
  return 'fa-file'
}

// Methods
function toggleFileSelection(file: any) {
  const index = selectedFiles.value.findIndex((f) => f._id === file._id)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

async function startOpenAiStep() {
  if (selectedFiles.value.length === 0) {
    emit('error', 'Selecciona al menos un archivo para iniciar el análisis.')
    return
  }
  await runOpenAiAnalysis(props.person, selectedFiles.value)
  if (aiError.value) {
    emit('error', aiError.value)
  }
}

async function startClaudeStep() {
  await runClaudeReport(props.person._id)
  if (aiError.value) {
    emit('error', aiError.value)
  }
}

async function handleSaveReport() {
  if (!claudeResult.value) return
  savingReport.value = true
  try {
    const filesUsedNames = selectedFiles.value.map((f) => f.filename)
    await personService.saveAnalysis(props.person._id, {
      filesUsed: filesUsedNames,
      openAiResult: openAiResult.value,
      patientParams: patientParams.value,
      claudeResult: claudeResult.value
    })
    emit('history-saved', props.person._id)
    alert('Historial de Análisis Clínico AI guardado con éxito.')
    savingReport.value = false
  } catch (e: any) {
    emit('error', e.message || 'Error al guardar el reporte en el historial.')
    savingReport.value = false
  }
}

function copyReportToClipboard() {
  if (!claudeResult.value) return
  navigator.clipboard.writeText(claudeResult.value)
  alert('¡Reporte copiado al portapapeles!')
}

function printReport() {
  window.print()
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatBirthDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

// Markdown to HTML simple parser
function parseMarkdown(md: string): string {
  if (!md) return ''

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Pre-process and render markdown tables
  const lines = html.split('\n')
  let inTable = false
  let tableRows: string[] = []
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim()
    const isTableRow = line.startsWith('|') && line.endsWith('|')

    if (isTableRow) {
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      tableRows.push(line)
    } else {
      if (inTable) {
        processedLines.push(compileTable(tableRows))
        inTable = false
      }
      processedLines.push(lines[i] || '')
    }
  }
  if (inTable) {
    processedLines.push(compileTable(tableRows))
  }

  html = processedLines.join('\n')

  // Format headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Horizontal separator
  html = html.replace(/^---$/gim, '<hr class="report-divider" />')

  // Bullet Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
  html = html.replace(/<\/ul>\s*<ul>/g, '')

  // Bold formatting
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Emits formatting
  html = html.replace(/ · /g, ' <span class="bullet-dot">·</span> ')

  // Convert double newlines to paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<div') || p.trim().startsWith('<ul') || p.trim().startsWith('<li') || p.trim().startsWith('<hr')) {
      return p
    }
    return `<p>${p}</p>`
  }).join('\n')

  return html
}

function compileTable(rows: string[]): string {
  if (rows.length === 0) return ''
  
  let headerHtml = ''
  let bodyHtml = ''

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const cols = row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)

    const isSeparator = cols.every(c => /^:-*-*:*$/.test(c) || /^-+$/.test(c))
    if (isSeparator) continue

    const cellTag = (i === 0) ? 'th' : 'td'
    const rowContent = cols.map(c => {
      const formatted = c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return `<${cellTag}>${formatted}</${cellTag}>`
    }).join('')

    if (i === 0) {
      headerHtml = `<thead><tr>${rowContent}</tr></thead>`
    } else {
      bodyHtml += `<tr>${rowContent}</tr>`
    }
  }

  return `<div class="report-table-wrapper"><table class="report-table">${headerHtml}<tbody>${bodyHtml}</tbody></table></div>`
}
</script>

<template>
  <div class="precision-analysis">

    <!-- Active Loading Screen -->
    <div v-if="loading" class="precision-analysis__loading card-glass">
      <div class="dna-spinner">
        <div class="dna-dot dna-dot--1"></div>
        <div class="dna-dot dna-dot--2"></div>
        <div class="dna-dot dna-dot--3"></div>
      </div>
      <div class="progress-indicator">
        <span class="progress-indicator__label">Paso {{ currentStep }} de 2</span>
        <div class="progress-indicator__bar">
          <div class="progress-indicator__fill" :style="{ width: currentStep === 1 ? '50%' : '100%' }"></div>
        </div>
      </div>
      <h3 class="loading-title">Procesando Análisis Clínico</h3>
      <p class="loading-status">{{ loadingStatus }}</p>
    </div>

    <!-- STEP 1: Select files and launch OpenAI analysis -->
    <div v-else-if="currentStep === 1" class="step-container card-glass animate-slide-up" style="padding: 1.5rem;">
      <div class="step-header">
        <div class="step-badge">Paso 1</div>
        <h3 class="step-title" style="margin-top: 0.25rem;">Selección de Estudios Clínicos</h3>
        <p class="step-description">Selecciona los laboratorios, imágenes o expedientes médicos del paciente que deseas que OpenAI analice en profundidad.</p>
      </div>

      <div v-if="hasFiles" class="files-checklist" style="margin-top: 1rem;">
        <button
          v-for="file in person.medicalFiles"
          :key="file._id"
          class="file-check-card"
          :class="{ 'file-check-card--selected': selectedFiles.some(f => f._id === file._id) }"
          @click="toggleFileSelection(file)"
        >
          <div class="file-check-card__checkbox">
            <i v-if="selectedFiles.some(f => f._id === file._id)" class="fa-solid fa-square-check"></i>
            <i v-else class="fa-regular fa-square"></i>
          </div>
          <i :class="['fa-regular', getFileIcon(file.type), 'file-check-card__icon']" style="font-size: 1.25rem; color: var(--primary); margin: 0 0.25rem;"></i>
          <div class="file-check-card__info">
            <span class="file-check-card__name">{{ file.filename }}</span>
            <span class="file-check-card__meta">{{ file.type }}</span>
          </div>
        </button>
      </div>
      <div v-else class="files-checklist-empty" style="border: none; background: transparent; padding: 2rem 0; display: flex; flex-direction: column; align-items: center;">
        <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; color: rgba(33, 188, 251, 0.15); margin-bottom: 0.5rem;"></i>
        <p style="font-weight: 600; color: var(--text-2); margin-bottom: 0.25rem;">No hay archivos médicos cargados para esta persona.</p>
        <p class="files-checklist-empty__hint" style="max-width: 320px; font-size: 0.75rem; color: var(--text-3); text-align: center; margin-bottom: 1rem;">Primero sube resultados de laboratorios, recetas u otros documentos en la Ficha Médica.</p>
        <button class="btn btn--outline btn--sm" @click="emit('goToProfile')">
          <i class="fa-solid fa-file-medical"></i>
          Subir Archivos
        </button>
      </div>

      <div class="step-actions" style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
        <button
          class="btn btn--primary"
          :disabled="selectedFiles.length === 0"
          @click="startOpenAiStep"
        >
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          Iniciar Análisis con OpenAI
        </button>
      </div>
    </div>

    <!-- STEP 3: Review extracted parameters & trigger Claude -->
    <div v-else-if="currentStep === 3" class="step-container animate-slide-up">
      <div class="step-header">
        <div class="step-badge">Paso 2</div>
        <h3 class="step-title">Revisión de Parámetros del Paciente</h3>
        <p class="step-description">Verifica los datos clínicos extraídos por OpenAI. Puedes completarlos o ajustarlos antes de diseñar el reporte de Medicina Regenerativa con Claude.</p>
      </div>

      <div class="review-layout">
        <!-- Analysis Results -->
        <div class="review-layout__results card-glass">
          <div class="review-layout__results-header">
            <h4><i class="fa-solid fa-brain" style="color: var(--primary); margin-right: 0.5rem;"></i> Análisis Clínico Maestro (OpenAI)</h4>
          </div>
          <div class="review-layout__results-content markdown-viewer" v-html="parseMarkdown(openAiResult)"></div>
        </div>

        <!-- Parameters Form -->
        <div class="review-layout__form card-glass">
          <div class="review-layout__form-header">
            <h4><i class="fa-solid fa-sliders" style="color: var(--cyan); margin-right: 0.5rem;"></i> Ajuste de Parámetros</h4>
            <p>Verifica y ajusta los datos antes de generar el reporte final.</p>
          </div>

          <div class="params-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre Completo</label>
                <div class="input-wrapper">
                  <i class="fa-regular fa-user"></i>
                  <input v-model="patientParams.name" type="text" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Estadio de ERC y Causa</label>
                <div class="input-wrapper">
                  <i class="fa-solid fa-kidneys"></i>
                  <input v-model="patientParams.ercStage" type="text" class="form-input" placeholder="Ej. ERC Estadio 5 - Nefropatía Diabética" />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Estado de Trasplante</label>
                <div class="input-wrapper">
                  <i class="fa-solid fa-heart-pulse"></i>
                  <input v-model="patientParams.transplantStatus" type="text" class="form-input" placeholder="Ej. Candidato a trasplante pre-emptivo" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Centro de Evaluación</label>
                <div class="input-wrapper">
                  <i class="fa-regular fa-hospital"></i>
                  <input v-model="patientParams.evaluationCenter" type="text" class="form-input" placeholder="Ej. UCSF, Mayo Clinic" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Datos de Laboratorio Clave (eGFR, Creatinina, PTH...)</label>
              <div class="input-wrapper">
                <i class="fa-solid fa-flask"></i>
                <input v-model="patientParams.labValues" type="text" class="form-input" placeholder="Ej. eGFR: 8, Creatinina: 6.2, PTH: 350" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Detalles Biológicos y Contexto</label>
              <div class="input-wrapper input-wrapper--textarea">
                <i class="fa-solid fa-dna" style="margin-top: 0.75rem;"></i>
                <textarea v-model="patientParams.biologicalDetails" class="form-textarea" rows="3" placeholder="Ej. Paciente joven, buen estado nutricional, potencial donante vivo"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <button class="btn btn--ghost" @click="currentStep = 1">
          <i class="fa-solid fa-chevron-left"></i>
          Volver a Archivos
        </button>
        <button class="btn btn--primary" @click="startClaudeStep">
          <i class="fa-solid fa-file-medical"></i>
          Generar Informe Regenerativo con Claude
        </button>
      </div>
    </div>

    <!-- STEP 4: Report generated! Show report and actions -->
    <div v-else-if="currentStep === 4" class="step-container animate-slide-up">
      <div class="report-actions-bar">
        <button class="btn btn--ghost" @click="currentStep = 3">
          <i class="fa-solid fa-chevron-left"></i>
          Ajustar Datos
        </button>
        <div class="report-actions-bar__group">
          <button class="btn btn--outline" @click="copyReportToClipboard">
            <i class="fa-solid fa-copy"></i>
            Copiar
          </button>
          <button class="btn btn--outline" @click="printReport">
            <i class="fa-solid fa-print"></i>
            Imprimir / PDF
          </button>
          <button class="btn btn--primary" :disabled="savingReport" @click="handleSaveReport">
            <span v-if="savingReport" class="spinner spinner--xs"></span>
            <i v-else class="fa-solid fa-floppy-disk"></i>
            Guardar en Ficha
          </button>
        </div>
      </div>

      <!-- Professional Printable Report Viewer -->
      <div class="report-document-sheet print-document">
        <div class="report-brand-header">
           <div class="report-brand-header__logo">
             <span class="logo-main">POWERHOUSE</span>
             <span class="logo-sub">BIOTECH</span>
           </div>
           <div class="report-brand-header__meta">
             <p class="meta-title">REPORTE CLÍNICO CONFIDENCIAL</p>
             <p>Medicina Regenerativa &amp; Longevidad Avanzada</p>
             <p>{{ formatDate(new Date().toISOString()) }}</p>
           </div>
        </div>

        <!-- Patient info bar -->
        <div class="report-patient-bar">
          <div class="patient-info-grid">
            <div>
              <span class="patient-label">PACIENTE</span>
              <span class="patient-name">{{ props.person?.name || 'N/A' }}</span>
            </div>
            <div v-if="props.person?.email">
              <span class="patient-label">EMAIL</span>
              <span class="patient-value">{{ props.person.email }}</span>
            </div>
            <div v-if="props.person?.phone">
              <span class="patient-label">TELÉFONO</span>
              <span class="patient-value">{{ props.person.phone }}</span>
            </div>
            <div v-if="props.person?.dateOfBirth">
              <span class="patient-label">FECHA DE NACIMIENTO</span>
              <span class="patient-value">{{ formatBirthDate(props.person.dateOfBirth) }}</span>
            </div>
          </div>
          <span class="confidential-badge">CONFIDENCIAL</span>
        </div>

        <div class="report-document-container markdown-viewer" v-html="parseMarkdown(claudeResult)"></div>
        <div class="report-brand-footer">
           <p>www.powerhousebiotech.com</p>
           <p>Documento generado por análisis algorítmico AI y supervisión clínica.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.precision-analysis {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: var(--font-montserrat);
  color: var(--text);

  // ── Keys Config ──
  &__keys-header {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 20;
  }
}

.keys-config {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  padding: 1rem;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;

  &__hint {
    font-size: 0.65rem;
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
}

// ── Glassmorphism Card ──
.card-glass {
  background: rgba(30, 34, 96, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 14px;
}

// ── Step Container ──
.step-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  
  .step-badge {
    align-self: flex-start;
    background: rgba(33, 188, 251, 0.15);
    border: 1px solid rgba(33, 188, 251, 0.3);
    color: var(--primary);
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.15rem 0.6rem;
    border-radius: 20px;
    letter-spacing: 0.05em;
  }

  .step-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .step-description {
    font-size: 0.85rem;
    color: var(--text-2);
    margin: 0;
    line-height: 1.4;
  }
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

// ── Files Checklist ──
.files-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.file-check-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(33, 188, 251, 0.25);
  }

  &--selected {
    background: rgba(33, 188, 251, 0.08);
    border-color: rgba(33, 188, 251, 0.4);
    .file-check-card__checkbox i { color: var(--primary); }
  }

  &__checkbox {
    font-size: 1.2rem;
    color: var(--text-3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  &__name {
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 0.7rem;
    color: var(--text-3);
    text-transform: uppercase;
  }
}

.files-checklist-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  i { font-size: 3rem; color: rgba(33, 188, 251, 0.15); margin-bottom: 0.5rem; }
  p { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-2); }
  
  &__hint {
    font-size: 0.75rem !important;
    font-weight: normal !important;
    max-width: 320px;
  }
}

// ── Review Layout (Step 3) ──
.review-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  &__results {
    display: flex;
    flex-direction: column;
    max-height: 800px;
    
    &-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      
      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
      }
    }

    &-content {
      padding: 1.5rem;
      overflow-y: auto;
      
      // Scrollbar styles
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
    }
  }

  &__form {
    display: flex;
    flex-direction: column;

    &-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      
      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--text);
        display: flex;
        align-items: center;
      }
      p {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: var(--text-2);
      }
    }
  }
}

// ── Params Form Styles ──
.params-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
  
  .form-group {
    flex: 1;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  i {
    position: absolute;
    left: 1rem;
    color: var(--text-3);
    font-size: 0.9rem;
    pointer-events: none;
  }

  &--textarea i {
    top: 0;
    align-items: flex-start;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    background: rgba(10, 13, 40, 0.5);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    color: var(--text);
    font-family: var(--font-secondary);
    font-size: 0.9rem;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.15);
      background: rgba(10, 13, 40, 0.8);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.2);
    }
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
  }
}

// ── Loading state ──
.precision-analysis__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1.25rem;
}

.loading-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.loading-status {
  font-size: 0.825rem;
  color: var(--text-2);
  max-width: 400px;
  margin: 0;
  line-height: 1.4;
}

// ── DNA Spinner ──
.dna-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
}

.dna-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  animation: dna-bounce 1.2s infinite ease-in-out;

  &--1 { animation-delay: -0.4s; background: var(--cyan); }
  &--2 { animation-delay: -0.2s; background: var(--blue-light); }
  &--3 { background: var(--blue); }
}

@keyframes dna-bounce {
  0%, 100% { transform: translateY(-10px) scale(0.8); opacity: 0.5; }
  50% { transform: translateY(10px) scale(1.2); opacity: 1; }
}

// ── Progress Indicator ──
.progress-indicator {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  &__label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--primary);
    letter-spacing: 0.05em;
  }

  &__bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan) 0%, var(--blue) 100%);
    border-radius: 4px;
    transition: width 0.4s ease;
  }
}

// ── Report Viewer & Sheet ──
.report-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(20, 23, 70, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  position: sticky;
  top: 0;
  z-index: 10;

  &__group {
    display: flex;
    gap: 0.5rem;
  }
}

.report-document-sheet {
  background: #111335;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: var(--shadow-md);
  border-radius: 16px;
  padding: 3rem 4rem;
  margin: 0 auto;
  max-width: 900px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
}

// ── BRAND HEADER ──
.report-brand-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid rgba(33, 188, 251, 0.3);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;

  &__logo {
    display: flex;
    flex-direction: column;
    line-height: 1;

    .logo-main {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: #fff;
    }

    .logo-sub {
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      color: #21bcfb;
      text-transform: uppercase;
    }
  }

  &__meta {
    text-align: right;
    font-size: 0.85rem;
    line-height: 1.6;

    .meta-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    p { color: rgba(255, 255, 255, 0.6); margin: 0; }
  }
}

// ── PATIENT BAR ──
.report-patient-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(33, 188, 251, 0.06);
  border-left: 4px solid #21bcfb;
  border-radius: 4px;
  padding: 1.2rem 1.6rem;
  margin-bottom: 2.5rem;

  .patient-info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2.5rem;
  }

  .patient-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .patient-name {
    font-size: 1.35rem;
    font-weight: 800;
    color: #fff;
    text-transform: capitalize;
  }

  .patient-value {
    font-size: 1.05rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
  }

  .confidential-badge {
    background: rgba(220, 38, 38, 0.15);
    color: #f87171;
    border: 1px solid rgba(220, 38, 38, 0.3);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    padding: 6px 14px;
    border-radius: 4px;
  }
}

.report-brand-footer {
  margin-top: 3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 1.25rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
}

// ── Markdown Styles (Global to report display) ──
:deep(.markdown-viewer) {
  font-family: var(--font-secondary);
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.85;

  h1, h2, h3, h4 {
    font-family: var(--font-montserrat);
    color: #21bcfb;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.3;
  }

  h1 { font-size: 1.85rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
  h2 { font-size: 1.55rem; color: var(--primary); }
  h3 { font-size: 1.3rem; color: var(--accent); }

  p {
    margin-bottom: 1.2rem;
  }

  ul, ol {
    margin-bottom: 1.5rem;
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 0.6rem;
    &::marker {
      color: var(--primary);
    }
  }

  strong {
    color: var(--text);
    font-weight: 600;
  }

  .bullet-dot {
    color: var(--primary);
    font-weight: bold;
    font-size: 1.15rem;
  }

  .report-divider {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-medium), transparent);
    margin: 2rem 0;
  }

  // Table Styling
  .report-table-wrapper {
    overflow-x: auto;
    margin: 1.75rem 0;
    border-radius: 8px;
    border: 1px solid var(--border-medium);
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.05rem;
    text-align: left;

    th, td {
      padding: 0.8rem 1.2rem;
      border-bottom: 1px solid var(--border);
    }

    th {
      background: rgba(33, 188, 251, 0.1);
      color: var(--primary);
      font-weight: 700;
      font-size: 1.1rem;
      padding: 0.9rem 1.2rem;
    }

    tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.015);
    }
  }
}

// ── Print Styles ──
@media print {
  body * {
    visibility: hidden;
  }
  .report-document-sheet, .report-document-sheet * {
    visibility: visible;
  }
  .report-document-sheet {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    max-width: 100% !important;
    background: #FFFFFF !important;
    color: #111111 !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .report-brand-header {
    border-bottom: 4px solid #0f1547 !important;
    color: #111111 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-end !important;
    padding-bottom: 18px !important;
    margin-bottom: 40px !important;
  }
  .report-brand-header__logo {
    display: flex !important;
    flex-direction: column !important;
  }
  .report-brand-header__logo .logo-main {
    font-size: 24pt !important;
    font-weight: 900 !important;
    color: #0f1547 !important;
  }
  .report-brand-header__logo .logo-sub {
    font-size: 11pt !important;
    font-weight: 600 !important;
    color: #21bcfb !important;
    text-transform: uppercase !important;
  }
  .report-brand-header__meta {
    text-align: right !important;
    font-size: 10pt !important;
    color: #444444 !important;
  }
  .report-brand-header__meta .meta-title {
    font-weight: 700 !important;
    color: #0f1547 !important;
  }
  .report-brand-header__meta p {
    color: #444444 !important;
    margin: 0 !important;
  }
  
  .report-patient-bar {
    background: #f0f7ff !important;
    border-left: 5px solid #21bcfb !important;
    border-radius: 4px !important;
    padding: 18px 24px !important;
    margin-bottom: 40px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
  }
  .patient-info-grid {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 12px 32px !important;
  }
  .patient-label {
    display: block !important;
    font-size: 9pt !important;
    color: #666666 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    margin-bottom: 2px !important;
  }
  .patient-name {
    font-size: 17pt !important;
    font-weight: 800 !important;
    color: #0f1547 !important;
    text-transform: capitalize !important;
  }
  .patient-value {
    font-size: 12pt !important;
    color: #333333 !important;
    font-weight: 500 !important;
  }
  .confidential-badge {
    background: #fee2e2 !important;
    color: #c00000 !important;
    border: 1px solid #fca5a5 !important;
    font-size: 9pt !important;
    font-weight: 800 !important;
    padding: 4px 12px !important;
    border-radius: 4px !important;
  }
  .report-brand-footer {
    margin-top: 50px !important;
    border-top: 1px solid #c8d9ee !important;
    padding-top: 16px !important;
    display: flex !important;
    justify-content: space-between !important;
    font-size: 9pt !important;
    color: #888888 !important;
  }

  :deep(.markdown-viewer) {
    color: #1e2229 !important;
    font-size: 13.5pt !important;
    line-height: 1.85 !important;
    
    h1, h2, h3, h4, strong {
      color: #000000 !important;
    }
    
    h1 {
      font-size: 19pt !important;
      border-bottom: 2px solid #333333 !important;
      margin: 32px 0 12px !important;
      padding-bottom: 6px !important;
    }
    h2 {
      font-size: 16pt !important;
      margin: 26px 0 10px !important;
    }
    h3 {
      font-size: 13pt !important;
      margin: 20px 0 8px !important;
    }
    p {
      margin-bottom: 12px !important;
    }
    li {
      margin-bottom: 8px !important;
      line-height: 1.8 !important;
    }
    
    .report-table-wrapper {
      border: 1px solid #999999 !important;
      margin: 24px 0 !important;
    }
    
    .report-table {
      th {
        background: #f0f7ff !important;
        color: #000000 !important;
        border-bottom: 2px solid #333333 !important;
        font-size: 12pt !important;
        padding: 12px 16px !important;
      }
      td {
        border-bottom: 1px solid #cccccc !important;
        font-size: 11.5pt !important;
        padding: 12px 16px !important;
      }
      tr:nth-child(even) {
        background: #fafafa !important;
      }
    }

    .report-divider {
      background: #cccccc !important;
      margin: 24px 0 !important;
    }
    
    .bullet-dot {
      color: #000000 !important;
    }
  }
}

// Animations
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}
.animate-slide-up {
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
