<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  person: any
}>()

const emit = defineEmits(['error'])

const selectedAnalysis = ref<any>(null)

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
  window.print()
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
    const line = lines[i].trim()
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
      const isHeader = i > 0 && lines[i-1].trim() === '' || (i > 0 && !lines[i-1].includes('|'))

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
        <button class="btn btn--primary" @click="printAnalysis">
          <i class="fa-solid fa-print"></i> Imprimir / PDF
        </button>
      </div>
      
      <div class="report-document-sheet print-document">
        <div class="report-brand-header print-only">
           <div class="report-brand-header__logo">
             POWERHOUSE BIOTECH
           </div>
           <div class="report-brand-header__meta">
             <p><strong>REPORTE CLÍNICO CONFIDENCIAL</strong></p>
             <p>Medicina Regenerativa & Longevidad Avanzada</p>
             <p>Fecha: {{ formatDate(selectedAnalysis.date) }}</p>
           </div>
        </div>
        <div class="report-document-container markdown-viewer" v-html="parseMarkdown(selectedAnalysis.claudeResult || selectedAnalysis.openAiResult)"></div>
        <div class="report-brand-footer print-only">
          <p>www.powerhousebiotech.com</p>
          <p>Documento generado por análisis algorítmico AI y supervisión clínica.</p>
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
  margin-bottom: 2rem;
}

// Reuse the document sheet styles from PrecisionAnalysis implicitly via global scope,
// but let's just make sure the viewer takes up space nicely.
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

:deep(.markdown-viewer) {
  color: #fff;
  font-size: 1rem;
  line-height: 1.7;
  
  h1, h2, h3, h4 {
    color: var(--primary);
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  h1 { font-size: 1.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
  h2 { font-size: 1.4rem; }
  h3 { font-size: 1.15rem; color: #fff; }

  p { margin-bottom: 1rem; color: var(--gray-300); }

  ul { margin-bottom: 1.5rem; padding-left: 0; list-style: none; }
  li { margin-bottom: 0.5rem; display: flex; align-items: flex-start; color: var(--gray-300); }
  .bullet-dot { color: var(--primary); margin-right: 0.75rem; font-weight: bold; }

  blockquote {
    border-left: 4px solid var(--primary);
    padding-left: 1rem;
    margin: 1.5rem 0;
    background: rgba(33, 188, 251, 0.05);
    padding: 1rem;
    border-radius: 0 8px 8px 0;
    color: var(--gray-300);
  }

  .report-table-wrapper {
    overflow-x: auto;
    margin: 2rem 0;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    th {
      background: rgba(33, 188, 251, 0.1);
      color: var(--primary);
      font-weight: 700;
    }

    td {
      background: rgba(255, 255, 255, 0.02);
    }
  }
}
</style>
