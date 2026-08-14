import { ref } from 'vue'
import { personService } from '@/services/person.service'

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export interface PatientParameters {
  name: string
  ercStage: string
  transplantStatus: string
  labValues: string
  evaluationCenter: string
  biologicalDetails: string
}

export function useAiAnalysis() {
  const loading = ref(false)
  const loadingStatus = ref('')
  const currentStep = ref(1) // 1: Setup/Select Files, 2: OpenAI Analysis, 3: Edit Params, 4: Claude Report
  const error = ref('')

  const openAiResult = ref('')
  const claudeResult = ref('')

  const patientParams = ref<PatientParameters>({
    name: '',
    ercStage: 'ERC Estadio 5',
    transplantStatus: 'Candidato a trasplante pre-emptivo',
    labValues: '',
    evaluationCenter: 'UCSF',
    biologicalDetails: 'Paciente joven, buen estado nutricional, potencial donante vivo'
  })

  // Load PDF.js dynamically and extract text
  async function extractTextFromPdf(base64DataUrl: string): Promise<string> {
    if (!(window as any).pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = PDFJS_CDN
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('No se pudo cargar la librería PDF.js'))
        document.head.appendChild(script)
      })
    }

    const pdfjsLib = (window as any).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN

    // Remove data:application/pdf;base64, header
    const parts = base64DataUrl.split(',')
    const base64Str = parts[1] || parts[0] || ''
    const binaryStr = atob(base64Str)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const pdf = await loadingTask.promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += `\n--- PÁGINA ${i} ---\n${pageText}`
    }

    return fullText
  }

  // Run OpenAI analysis (Step 1)
  async function runOpenAiAnalysis(person: any, selectedFiles: any[]) {
    loading.value = true
    error.value = ''
    openAiResult.value = ''
    loadingStatus.value = 'Procesando y extrayendo contenido de archivos...'

    try {
      const fileContents: any[] = []

      for (const file of selectedFiles) {
        if (file.type.includes('pdf')) {
          loadingStatus.value = `Extrayendo texto del PDF: ${file.filename}...`
          const text = await extractTextFromPdf(file.url)
          fileContents.push({
            type: 'application/pdf',
            filename: file.filename,
            text: text
          })
        } else if (file.type.includes('image')) {
          fileContents.push({
            type: 'image/jpeg', // Standardize image types
            filename: file.filename,
            url: file.url // Send base64 image directly
          })
        } else {
          // Plain text or fallback
          fileContents.push({
            type: 'text/plain',
            filename: file.filename,
            text: `[DOCUMENTO: ${file.filename}]\n(Contenido no procesable en formato de texto puro)`
          })
        }
      }

      // Add patient metadata
      const birthDateText = person.dateOfBirth
        ? new Date(person.dateOfBirth).toLocaleDateString('es-ES')
        : 'No especificada'

      // Los archivos son opcionales: la instrucción final cambia según haya o no
      const closingInstruction =
        fileContents.length > 0
          ? 'Analiza estos datos clínicos y los documentos adjuntos.'
          : 'No se adjuntaron documentos clínicos: realiza el análisis únicamente con los datos y notas del perfil, dejando explícito qué estudios de laboratorio harían falta para confirmar cada hipótesis.'

      const userContextPrompt = `Datos del Paciente:
- Nombre completo: ${person.name}
- Email: ${person.email || 'No proporcionado'}
- Teléfono: ${person.phone || 'No proporcionado'}
- Fecha de nacimiento: ${birthDateText}
- Notas del perfil: ${person.notes || 'Sin notas adicionales'}

${closingInstruction}`

      loadingStatus.value = 'Llamando al servidor para el Análisis Clínico Maestro (OpenAI)...'

      const response = await personService.analyzePerson(person._id, {
        patientContext: userContextPrompt,
        files: fileContents
      })

      const rawText = response.result || ''

      // Parse JSON from result
      const jsonStartMarker = '---JSON_EXTRACTED---'
      if (rawText.includes(jsonStartMarker)) {
        const parts = rawText.split(jsonStartMarker)
        openAiResult.value = (parts[0] || '').trim()
        
        try {
          const jsonText = (parts[1] || '').trim()
          const extracted = JSON.parse(jsonText)
          patientParams.value.name = person.name
          patientParams.value.ercStage = `${extracted.ercStage || 'ERC Estadio 5'} - ${extracted.ercCause || 'Nefropatía Diabética'}`
          patientParams.value.transplantStatus = extracted.transplantStatus || 'Candidato a trasplante pre-emptivo'
          patientParams.value.labValues = extracted.labValues || ''
          patientParams.value.biologicalDetails = extracted.biologicalDetails || ''
        } catch (jsonErr) {
          console.warn('Error al parsear el JSON extraído:', jsonErr)
          // Fallback parsing or general values
          patientParams.value.name = person.name
          patientParams.value.labValues = 'eGFR y creatinina según estudios clínicos'
        }
      } else {
        openAiResult.value = rawText
        patientParams.value.name = person.name
        patientParams.value.labValues = 'eGFR y creatinina según estudios clínicos'
      }

      currentStep.value = 3 // Move to Review Params step
    } catch (e: any) {
      error.value = e.message || 'Error durante el análisis con OpenAI en el servidor'
    } finally {
      loading.value = false
    }
  }

  // Run Claude analysis (Step 2)
  async function runClaudeReport(personId: string) {
    loading.value = true
    error.value = ''
    claudeResult.value = ''
    loadingStatus.value = 'Llamando al servidor para diseñar el Reporte de Medicina Regenerativa con Claude...'

    try {
      const response = await personService.generateReport(personId, {
        params: patientParams.value,
        openAiResult: openAiResult.value
      })

      claudeResult.value = response.result || ''
      currentStep.value = 4 // Move to Finished Report step
    } catch (e: any) {
      error.value = e.message || 'Error durante la generación de reporte con Claude en el servidor'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    loadingStatus,
    currentStep,
    error,
    openAiResult,
    claudeResult,
    patientParams,
    runOpenAiAnalysis,
    runClaudeReport
  }
}
