<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  person: any
}>()

const emit = defineEmits(['error'])

const selectedAnalysis = ref<any>(null)
const lightMode = ref(false)

const analyses = computed(() => {
  return props.person?.aiAnalyses?.slice().reverse() || []
})

function viewAnalysis(analysis: any) {
  selectedAnalysis.value = analysis
}

function closeAnalysis() {
  selectedAnalysis.value = null
}

function printAnalysis() {
  if (!selectedAnalysis.value) return

  const patientName = props.person?.name || 'Paciente'
  const analysisDate = formatDate(selectedAnalysis.value.date)
  const openAiHtml = selectedAnalysis.value.openAiResult ? parseMarkdown(selectedAnalysis.value.openAiResult) : ''
  const claudeHtml = selectedAnalysis.value.claudeResult ? parseMarkdown(selectedAnalysis.value.claudeResult) : ''

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte Clínico — ${patientName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page { margin: 2cm 1.8cm; size: A4; }

    body {
      font-family: 'Montserrat', sans-serif;
      font-size: 13.5pt;
      color: #1e2229;
      background: #fff;
      line-height: 1.85;
    }

    /* ── BRAND HEADER ── */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 4px solid #0f1547;
      padding-bottom: 18px;
      margin-bottom: 40px;
    }
    .brand-logo {
      font-size: 34pt;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #0f1547;
      line-height: 1.1;
    }
    .brand-logo span {
      display: block;
      font-size: 14pt;
      font-weight: 600;
      color: #21bcfb;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    .brand-meta {
      text-align: right;
      font-size: 11pt;
      color: #444;
      line-height: 1.6;
    }
    .brand-meta strong {
      display: block;
      font-size: 13pt;
      font-weight: 700;
      color: #0f1547;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    /* ── PATIENT BADGE ── */
    .patient-badge {
      background: #f0f7ff;
      border-left: 5px solid #21bcfb;
      border-radius: 4px;
      padding: 18px 24px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .patient-badge__grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 32px;
    }
    .patient-badge__name {
      font-size: 17pt;
      font-weight: 800;
      color: #0f1547;
    }
    .patient-badge__label {
      font-size: 9pt;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2px;
    }
    .patient-badge__value {
      font-size: 12pt;
      color: #333;
      font-weight: 500;
    }

    /* ── SECTION TITLE ── */
    .section-label {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 40px 0 24px;
      page-break-inside: avoid;
    }
    .section-label__badge {
      background: #0f1547;
      color: #21bcfb;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .section-label__line {
      flex: 1;
      height: 1.5px;
      background: #dde6f0;
    }
    .section-label__title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f1547;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .phase-2-start { page-break-before: always; }

    /* ── MARKDOWN CONTENT ── */
    h1 {
      font-size: 19pt;
      font-weight: 900;
      color: #0f1547;
      margin: 32px 0 12px;
      border-bottom: 2px solid #0f1547;
      padding-bottom: 6px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f1547;
      margin: 26px 0 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      font-weight: 700;
      color: #222;
      margin: 20px 0 8px;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 12px;
      color: #2d2d2d;
    }
    strong { font-weight: 700; color: #0f1547; }
    em { font-style: italic; }

    ul { margin: 12px 0 16px 0; padding: 0; list-style: none; }
    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
      color: #2d2d2d;
      line-height: 1.8;
    }
    .bullet-dot { color: #21bcfb; font-weight: 900; flex-shrink: 0; }

    blockquote {
      border-left: 4px solid #21bcfb;
      background: #f0f7ff;
      padding: 14px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
      color: #2d2d2d;
    }

    hr.report-divider {
      border: none;
      border-top: 1.5px solid #dde6f0;
      margin: 24px 0;
    }

    /* ── TABLES ── */
    .report-table-wrapper {
      overflow-x: auto;
      margin: 24px 0;
      border-radius: 8px;
      border: 1px solid #c8d9ee;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
    }
    .report-table th {
      background: #0f1547;
      color: #fff;
      font-weight: 700;
      font-size: 12pt;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid #21bcfb;
    }
    .report-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e0ebf7;
      font-size: 11.5pt;
      color: #2d2d2d;
    }
    .report-table tr:nth-child(even) td {
      background: #f7faff;
    }

    /* ── FOOTER ── */
    .brand-footer {
      margin-top: 60px;
      border-top: 1px solid #c8d9ee;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #888;
    }
    .confidential-stamp {
      background: #fee2e2;
      color: #c00;
      font-weight: 800;
      font-size: 9pt;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 3px;
      border: 1px solid #fca5a5;
    }
  </style>
</head>
<body>
  <div class="brand-header">
    <div class="brand-logo">
      POWERHOUSE
      <span>Biotech</span>
    </div>
    <div class="brand-meta">
      <strong>Reporte Clínico Confidencial</strong>
      Medicina Regenerativa &amp; Longevidad Avanzada<br/>
      ${analysisDate}
    </div>
  </div>

  <div class="patient-badge">
    <div class="patient-badge__grid">
      <div>
        <div class="patient-badge__label">Paciente</div>
        <div class="patient-badge__name">${patientName}</div>
      </div>
      ${props.person?.email ? `
      <div>
        <div class="patient-badge__label">Email</div>
        <div class="patient-badge__value">${props.person.email}</div>
      </div>
      ` : ''}
      ${props.person?.phone ? `
      <div>
        <div class="patient-badge__label">Teléfono</div>
        <div class="patient-badge__value">${props.person.phone}</div>
      </div>
      ` : ''}
      ${props.person?.dateOfBirth ? `
      <div>
        <div class="patient-badge__label">F. Nacimiento</div>
        <div class="patient-badge__value">${formatBirthDate(props.person.dateOfBirth)}</div>
      </div>
      ` : ''}
    </div>
    <span class="confidential-stamp">Confidencial</span>
  </div>

  ${openAiHtml ? `
  <div class="section-label">
    <span class="section-label__badge">Fase 1</span>
    <div class="section-label__line"></div>
    <div class="section-label__title">Diagnóstico Panel Médico</div>
    <div class="section-label__line"></div>
  </div>
  <div class="content">${openAiHtml}</div>
  ` : ''}

  ${claudeHtml ? `
  <div class="phase-2-start"></div>
  <div class="section-label">
    <span class="section-label__badge">Fase 2</span>
    <div class="section-label__line"></div>
    <div class="section-label__title">Medicina Regenerativa</div>
    <div class="section-label__line"></div>
  </div>
  <div class="content">${claudeHtml}</div>
  ` : ''}

  <div class="brand-footer">
    <span>www.powerhousebiotech.com</span>
    <span>Generado por análisis algorítmico AI bajo supervisión clínica.</span>
    <span>Powerhouse Biotech © ${new Date().getFullYear()}</span>
  </div>

  <script>
    window.onload = function() { window.print(); }
  <\/script>
</body>
</html>`)

  printWindow.document.close()
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
  let tableHtml = ''
  let newHtml = ''

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim()
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true
        tableHtml = '<div class="report-table-wrapper"><table class="report-table">\n'
      }
      
      const isSeparator = line.includes('---')
      if (isSeparator) {
        // Skip separator row
        continue
      }

      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim())
      const isHeader = i > 0 && (lines[i-1] || '').trim() === '' || (i > 0 && !(lines[i-1] || '').includes('|'))

      tableHtml += '<tr>'
      cells.forEach(cell => {
        // Basic markdown formatting inside tables
        let cellContent = cell
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
          
        if (isHeader) {
          tableHtml += `<th>${cellContent}</th>`
        } else {
          tableHtml += `<td>${cellContent}</td>`
        }
      })
      tableHtml += '</tr>\n'
    } else {
      if (inTable) {
        inTable = false
        tableHtml += '</table></div>\n'
        newHtml += tableHtml
        tableHtml = ''
      }
      newHtml += lines[i] + '\n'
    }
  }
  
  if (inTable) {
    tableHtml += '</table></div>\n'
    newHtml += tableHtml
  }

  html = newHtml

  html = html
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    
  html = html.replace(/^\s*-\s+(.*)$/gim, '<ul><li><span class="bullet-dot">•</span> $1</li></ul>')
  html = html.replace(/<\/ul>\n<ul>/g, '\n')
  
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p><h1>/g, '<h1>')
  html = html.replace(/<\/h1><\/p>/g, '</h1>')
  html = html.replace(/<p><h2>/g, '<h2>')
  html = html.replace(/<\/h2><\/p>/g, '</h2>')
  html = html.replace(/<p><h3>/g, '<h3>')
  html = html.replace(/<\/h3><\/p>/g, '</h3>')
  html = html.replace(/<p><ul>/g, '<ul>')
  html = html.replace(/<\/ul><\/p>/g, '</ul>')
  html = html.replace(/<p><div/g, '<div')
  html = html.replace(/<\/div><\/p>/g, '</div>')

  html = html.replace(/---/g, '<hr class="report-divider"/>')

  return html
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
</script>

<template>
  <div class="analysis-history">
    <div v-if="!selectedAnalysis" class="history-list animate-fade-in no-print">
      <div class="history-header">
        <h3>Historial de Análisis Clínicos (IA)</h3>
        <p class="subtitle">Registros generados por OpenAI y Claude</p>
      </div>
      
      <div v-if="analyses.length === 0" class="empty-state">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <h4>No hay historial</h4>
        <p>Aún no se han realizado análisis de precisión para este paciente.</p>
      </div>

      <div v-else class="timeline">
        <div v-for="analysis in analyses" :key="analysis._id" class="timeline-item" @click="viewAnalysis(analysis)">
          <div class="timeline-icon">
            <i class="fa-solid fa-file-medical"></i>
          </div>
          <div class="timeline-content card-glass">
            <div class="timeline-header">
              <span class="date">{{ formatDate(analysis.date) }}</span>
            </div>
            <p class="files-used"><strong>Archivos utilizados:</strong> {{ analysis.filesUsed?.join(', ') || 'N/A' }}</p>
            <button class="btn btn--secondary btn--sm mt-3">Ver Reporte</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Viewer -->
    <div v-else class="analysis-viewer animate-slide-up">
      <div class="viewer-actions no-print">
        <button class="btn btn--ghost" @click="closeAnalysis">
          <i class="fa-solid fa-arrow-left"></i> Volver al historial
        </button>
        <div class="viewer-actions__right">
          <button
            class="btn btn--toggle"
            :class="{ 'btn--toggle--active': lightMode }"
            @click="lightMode = !lightMode"
            :title="lightMode ? 'Modo oscuro' : 'Modo claro para lectura'"
          >
            <i :class="lightMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
            {{ lightMode ? 'Modo oscuro' : 'Modo claro' }}
          </button>
          <button class="btn btn--primary" @click="printAnalysis">
            <i class="fa-solid fa-file-pdf"></i> Exportar PDF
          </button>
        </div>
      </div>

      <div class="report-document-sheet" :class="{ 'report-document-sheet--light': lightMode }">

        <!-- Brand header SIEMPRE VISIBLE en pantalla -->
        <div class="report-brand-header">
          <div class="report-brand-header__logo">
            <span class="logo-main">POWERHOUSE</span>
            <span class="logo-sub">BIOTECH</span>
          </div>
          <div class="report-brand-header__meta">
            <p class="meta-title">REPORTE CLÍNICO CONFIDENCIAL</p>
            <p>Medicina Regenerativa &amp; Longevidad Avanzada</p>
            <p>{{ formatDate(selectedAnalysis.date) }}</p>
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

        <div class="report-section" v-if="selectedAnalysis.openAiResult">
          <div class="section-label">
            <span class="section-badge">Fase 1</span>
            <span class="section-title">Diagnóstico Panel Médico</span>
          </div>
          <div class="markdown-viewer" v-html="parseMarkdown(selectedAnalysis.openAiResult)"></div>
        </div>

        <div class="report-section" v-if="selectedAnalysis.claudeResult">
          <div class="section-label">
            <span class="section-badge">Fase 2</span>
            <span class="section-title">Medicina Regenerativa</span>
          </div>
          <div class="markdown-viewer" v-html="parseMarkdown(selectedAnalysis.claudeResult)"></div>
        </div>

        <div class="report-brand-footer">
          <span>www.powerhousebiotech.com</span>
          <span>Generado por análisis algorítmico AI bajo supervisión clínica</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analysis-history {
  padding: 1rem 0;
}

.history-header {
  margin-bottom: 2rem;
  text-align: center;
  h3 {
    font-size: 1.5rem;
    color: var(--white);
    margin-bottom: 0.5rem;
  }
  .subtitle {
    color: var(--gray-400);
    font-size: 0.9rem;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-400);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  i {
    font-size: 3rem;
    color: rgba(33, 188, 251, 0.5);
    margin-bottom: 1rem;
  }
  h4 {
    color: var(--white);
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 24px;
    bottom: 0;
    width: 2px;
    background: rgba(255, 255, 255, 0.05);
  }
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateX(5px);
    .timeline-icon {
      background: var(--primary);
      color: var(--dark);
      box-shadow: 0 0 15px rgba(33, 188, 251, 0.4);
    }
  }
}

.timeline-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  z-index: 1;
  border: 2px solid var(--dark);
  transition: all 0.3s ease;
}

.timeline-content {
  flex: 1;
  padding: 1.5rem;
  border-radius: 12px;
  
  .timeline-header {
    margin-bottom: 1rem;
    .date {
      color: var(--primary);
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }
  }
  
  .files-used {
    font-size: 0.9rem;
    color: var(--gray-300);
    margin-bottom: 0;
    strong {
      color: var(--white);
    }
  }
  
  .mt-3 {
    margin-top: 1rem;
  }
}

.viewer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  &__right {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
}

.btn--toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: var(--gray-300);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--white);
  }

  &--active {
    background: rgba(255, 255, 255, 0.92);
    color: #0f1547;
    border-color: #fff;
    font-weight: 600;
  }
}

// ── DOCUMENT SHEET (Dark Mode default) ──
.report-document-sheet {
  background: #0d1135;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  padding: 3rem 4rem;
  margin: 0 auto;
  max-width: 860px;
  width: 100%;
  transition: background 0.3s ease, color 0.3s ease;

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
  }

  // ── LIGHT MODE ──
  &--light {
    background: #ffffff;
    border-color: #dde6f5;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);

    .report-brand-header {
      border-bottom-color: #0f1547;
      &__logo .logo-main { color: #0f1547; }
      &__logo .logo-sub { color: #21bcfb; }
      &__meta .meta-title { color: #0f1547; }
      &__meta p { color: #444; }
    }

    .report-patient-bar {
      background: #f0f7ff;
      border-left-color: #21bcfb;
      .patient-label { color: #555; }
      .patient-name { color: #0f1547; }
      .patient-value { color: #333; }
    }

    .section-label {
      border-bottom-color: #dde6f5;
      .section-badge { background: #0f1547; color: #21bcfb; }
      .section-title { color: #0f1547; }
    }

    .report-brand-footer {
      border-top-color: #dde6f5;
      color: #666;
    }
  }

  // Añadir &--light para .markdown-viewer abajo
  &--light :deep(.markdown-viewer) {
    color: #1a1a2e;

    h1, h2, h3, h4 { color: #0f1547; }
    h1 { border-bottom-color: #0f1547; }
    h3 { color: #1a1a2e; }
    p { color: #2d2d2d; }
    li { color: #2d2d2d; }
    .bullet-dot { color: #21bcfb; }

    blockquote {
      background: #f0f7ff;
      border-left-color: #21bcfb;
      color: #2d2d2d;
    }

    .report-table-wrapper {
      border-color: #c8d9ee;
    }

    .report-table {
      th {
        background: #0f1547;
        color: #fff;
        border-bottom-color: #21bcfb;
      }
      td {
        border-bottom-color: #e0ebf7;
        color: #2d2d2d;
        background: transparent;
      }
      tr:nth-child(even) td { background: #f7faff; }
    }
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

// ── SECTION LABEL ──
.section-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
  margin-top: 2.5rem;

  .section-badge {
    background: #21bcfb;
    color: #0d1135;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 3px 12px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.06em;
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

// ── DARK MODE MARKDOWN ──
:deep(.markdown-viewer) {
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.25rem;
  line-height: 1.85;

  h1, h2, h3, h4 {
    color: #21bcfb;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.85rem;
    border-bottom: 1px solid rgba(33, 188, 251, 0.25);
    padding-bottom: 0.5rem;
  }
  h2 { font-size: 1.55rem; }
  h3 { font-size: 1.3rem; color: #fff; }

  p { margin-bottom: 1.2rem; color: rgba(255, 255, 255, 0.8); }

  strong { color: #fff; font-weight: 700; }
  em { font-style: italic; color: rgba(255, 255, 255, 0.75); }

  ul { margin-bottom: 1.5rem; padding-left: 0; list-style: none; }
  li {
    margin-bottom: 0.6rem;
    display: flex;
    align-items: flex-start;
    color: rgba(255, 255, 255, 0.8);
  }
  .bullet-dot { color: #21bcfb; margin-right: 0.75rem; font-weight: bold; flex-shrink: 0; }

  blockquote {
    border-left: 4px solid #21bcfb;
    background: rgba(33, 188, 251, 0.06);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    border-radius: 0 6px 6px 0;
    color: rgba(255, 255, 255, 0.75);
  }

  hr.report-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    margin: 1.75rem 0;
  }

  .report-table-wrapper {
    overflow-x: auto;
    margin: 1.75rem 0;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: rgba(33, 188, 251, 0.12);
      color: #21bcfb;
      font-weight: 700;
      font-size: 1.1rem;
      padding: 0.9rem 1.2rem;
      text-align: left;
      border-bottom: 1px solid rgba(33, 188, 251, 0.2);
    }

    td {
      padding: 0.8rem 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.05rem;
    }

    tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.02);
    }
  }
}
</style>
