<script setup lang="ts">
import { ref, watch } from 'vue'
import { personService } from '@/services/person.service'

const props = defineProps<{
  open: boolean
  initialName?: string
}>()

const emit = defineEmits<{
  close: []
  created: [person: any]
}>()

// Form state
const name = ref('')
const email = ref('')
const phone = ref('')
const dateOfBirth = ref('')
const address = ref('')
const hasCrmForm = ref(false)
const notes = ref('')
const selectedFiles = ref<File[]>([])
const dragover = ref(false)
const creating = ref(false)
const error = ref('')

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    name.value = props.initialName || ''
    email.value = ''
    phone.value = ''
    dateOfBirth.value = ''
    address.value = ''
    hasCrmForm.value = false
    notes.value = ''
    selectedFiles.value = []
    error.value = ''
    creating.value = false
  }
})

watch(() => props.initialName, (newVal) => {
  if (props.open && newVal) {
    name.value = newVal
  }
})

async function handlePasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      notes.value = text
      hasCrmForm.value = true
    }
  } catch {
    alert('No se pudo leer el portapapeles directamente. Por favor presiona Ctrl+V / Cmd+V dentro del cuadro de texto.')
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
    target.value = ''
  }
}

function onDrop(e: DragEvent) {
  dragover.value = false
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files))
  }
}

function addFiles(files: File[]) {
  for (const file of files) {
    // Prevent duplicate filenames in selected list
    if (!selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.value.push(file)
    }
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return 'fa-file-pdf'
  if (type.includes('image')) return 'fa-image'
  if (type.includes('word') || type.includes('doc')) return 'fa-file-word'
  return 'fa-file'
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Error al leer el archivo ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function submit() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'El nombre completo del paciente es obligatorio.'
    return
  }

  creating.value = true
  try {
    // 1. Crear el paciente
    let createdPerson = await personService.createPerson({
      name: name.value.trim(),
      email: email.value.trim() || undefined,
      phone: phone.value.trim() || undefined,
      dateOfBirth: dateOfBirth.value || undefined,
      address: address.value.trim() || undefined,
      notes: hasCrmForm.value || notes.value.trim() ? notes.value.trim() : undefined,
    })

    // 2. Subir estudios/archivos si seleccionó
    if (selectedFiles.value.length > 0) {
      for (const file of selectedFiles.value) {
        const base64Url = await readFileAsBase64(file)
        createdPerson = await personService.uploadFile(createdPerson._id, {
          url: base64Url,
          filename: file.name,
          type: file.type || 'application/octet-stream',
        })
      }
    }

    // 3. Obtener el paciente actualizado
    const fullPerson = await personService.getPersonById(createdPerson._id)
    emit('created', fullPerson)
    emit('close')
  } catch (e: any) {
    error.value = e?.message || e?.response?.data?.message || 'Error al registrar el paciente'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="open" class="modal-overlay" @click.self="emit('close')">
        <div class="modal create-patient-modal card-glass">
          <!-- Header -->
          <div class="modal__header">
            <div class="modal__title-box">
              <div class="modal__icon">
                <i class="fa-solid fa-user-plus"></i>
              </div>
              <div>
                <h3 class="modal__title">Crear Nuevo Paciente</h3>
                <p class="modal__subtitle">Ingresa los datos, adjunta estudios e indica el formulario CRM</p>
              </div>
            </div>
            <button class="modal__close" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Body -->
          <form class="modal__body" @submit.prevent="submit">
            <!-- Sección 1: Datos Básicos -->
            <div class="form-section">
              <h4 class="section-title">
                <i class="fa-solid fa-address-card"></i>
                Datos Personales
              </h4>

              <div class="form-group">
                <label class="form-label">Nombre Completo *</label>
                <input
                  v-model="name"
                  type="text"
                  class="form-input"
                  placeholder="Ej. María García López"
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Email (opcional)</label>
                  <input
                    v-model="email"
                    type="email"
                    class="form-input"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Teléfono (opcional)</label>
                  <input
                    v-model="phone"
                    type="tel"
                    class="form-input"
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Fecha de nacimiento (opcional)</label>
                  <input
                    v-model="dateOfBirth"
                    type="date"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Dirección (opcional)</label>
                  <input
                    v-model="address"
                    type="text"
                    class="form-input"
                    placeholder="Ciudad, País o Dirección"
                  />
                </div>
              </div>
            </div>

            <!-- Sección 2: Adjuntar Estudios Médicos -->
            <div class="form-section">
              <h4 class="section-title">
                <i class="fa-solid fa-file-medical"></i>
                Adjuntar Estudios o Archivos Médicos
              </h4>

              <div
                class="drop-zone"
                :class="{ 'drop-zone--active': dragover }"
                @dragover.prevent="dragover = true"
                @dragleave="dragover = false"
                @drop.prevent="onDrop"
              >
                <i class="fa-solid fa-cloud-arrow-up drop-zone__icon"></i>
                <p class="drop-zone__text">
                  Arrastra estudios aquí o
                  <label class="drop-zone__link">
                    selecciona archivos
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,image/*"
                      class="drop-zone__input"
                      @change="handleFileInput"
                    />
                  </label>
                </p>
                <p class="drop-zone__hint">Laboratorios, ecografías, resonancias, recetas (PDF, JPG, PNG, DOCX)</p>
              </div>

              <!-- Lista de archivos seleccionados -->
              <div v-if="selectedFiles.length > 0" class="file-list">
                <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                  <i :class="['fa-regular', getFileIcon(file.type), 'file-item__icon']"></i>
                  <div class="file-item__info">
                    <span class="file-item__name">{{ file.name }}</span>
                    <span class="file-item__size">{{ formatFileSize(file.size) }}</span>
                  </div>
                  <button type="button" class="file-item__delete" @click="removeFile(index)" title="Quitar archivo">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Sección 3: Formulario / Encuesta CRM (Copia y Pega) -->
            <div class="form-section">
              <div class="section-title-row">
                <h4 class="section-title">
                  <i class="fa-solid fa-clipboard-question"></i>
                  Formulario / Encuesta CRM
                </h4>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="hasCrmForm" />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">{{ hasCrmForm ? '¿Llenó formulario? Sí' : '¿Llenó formulario? No' }}</span>
                </label>
              </div>

              <div v-if="hasCrmForm" class="crm-box animate-fade-in">
                <div class="crm-toolbar">
                  <span class="crm-hint">
                    <i class="fa-solid fa-circle-info"></i>
                    Pega aquí las preguntas y respuestas del cliente. La IA lo incluirá en el análisis médico.
                  </span>
                  <button type="button" class="btn btn--xs btn--outline" @click="handlePasteFromClipboard">
                    <i class="fa-solid fa-paste"></i>
                    Pegar del portapapeles
                  </button>
                </div>

                <textarea
                  v-model="notes"
                  class="form-textarea"
                  rows="4"
                  placeholder="Pega aquí las respuestas del cliente en GoHighLevel / Bakano CRM (ej. Síntomas, motivo de consulta, antecedentes...)"
                ></textarea>
              </div>
            </div>

            <!-- Error Bar -->
            <div v-if="error" class="error-message">
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>{{ error }}</span>
            </div>

            <!-- Footer Actions -->
            <div class="modal__actions">
              <button type="button" class="btn btn--ghost" @click="emit('close')" :disabled="creating">
                Cancelar
              </button>
              <button type="submit" class="btn btn--primary" :disabled="creating">
                <span v-if="creating" class="spinner spinner--xs"></span>
                <i v-else class="fa-solid fa-check"></i>
                <span>{{ creating ? 'Creando paciente y subiendo estudios...' : 'Crear Paciente' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.create-patient-modal {
  width: 100%;
  max-width: 680px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 2rem;
  background: rgba(18, 22, 60, 0.95);
  border: 1px solid var(--border-medium);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
}

.modal {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.25rem;
  }

  &__title-box {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(33, 188, 251, 0.12);
    border: 1px solid rgba(33, 188, 251, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    color: var(--cyan);
    flex-shrink: 0;
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.2rem;
  }

  &__subtitle {
    font-family: var(--font-montserrat);
    font-size: 0.8rem;
    color: var(--text-2);
    margin: 0;
  }

  &__close {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    color: var(--text-2);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ffffff;
      border-color: rgba(239, 68, 68, 0.4);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.875rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
}

.section-title {
  font-family: var(--font-montserrat);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--cyan);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.form-label {
  font-family: var(--font-montserrat);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-2);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: rgba(10, 13, 40, 0.7);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #ffffff;
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--text-3);
  }

  &:focus {
    outline: none;
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.12);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 90px;
  font-family: var(--font-secondary);
  line-height: 1.5;
}

// Dropzone
.drop-zone {
  border: 2px dashed var(--border-medium);
  border-radius: 10px;
  padding: 1.25rem 1rem;
  text-align: center;
  transition: all 0.2s ease;
  background: rgba(10, 13, 40, 0.4);

  &--active {
    border-color: var(--cyan);
    background: rgba(33, 188, 251, 0.08);
  }

  &__icon {
    font-size: 1.75rem;
    color: var(--cyan);
    margin-bottom: 0.4rem;
  }

  &__text {
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    color: var(--text-2);
    margin: 0;
  }

  &__link {
    color: var(--cyan);
    cursor: pointer;
    font-weight: 600;
    text-decoration: underline;
  }

  &__input {
    display: none;
  }

  &__hint {
    font-family: var(--font-montserrat);
    font-size: 0.725rem;
    color: var(--text-3);
    margin: 0.25rem 0 0;
  }
}

// Selected File List
.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(33, 188, 251, 0.06);
  border: 1px solid rgba(33, 188, 251, 0.2);
  border-radius: 8px;

  &__icon {
    font-size: 1.1rem;
    color: var(--cyan);
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__name {
    font-family: var(--font-montserrat);
    font-size: 0.8rem;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__size {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
    flex-shrink: 0;
  }

  &__delete {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;

    &:hover {
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.15);
    }
  }
}

// Toggle switch for CRM
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  user-select: none;

  input {
    display: none;

    &:checked + .toggle-slider {
      background: var(--cyan);

      &::before {
        transform: translateX(18px);
        background: #101438;
      }
    }
  }
}

.toggle-slider {
  width: 38px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  position: relative;
  transition: background 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    top: 3px;
    left: 3px;
    transition: transform 0.2s ease;
  }
}

.toggle-label {
  font-family: var(--font-montserrat);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-2);
}

.crm-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.crm-hint {
  font-family: var(--font-montserrat);
  font-size: 0.725rem;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 0.35rem;

  i { color: var(--cyan); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-family: var(--font-montserrat);
  font-size: 0.825rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;

  &--xs {
    padding: 0.3rem 0.6rem;
    font-size: 0.7rem;
  }

  &--primary {
    background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
    color: #171846;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(33, 188, 251, 0.35);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--border);
    color: var(--text-2);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  }

  &--outline {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(33, 188, 251, 0.3);
    color: var(--cyan);

    &:hover {
      background: rgba(33, 188, 251, 0.1);
    }
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #171846;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

// Modal animations
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;

  .modal {
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal {
    opacity: 0;
    transform: scale(0.94) translateY(12px);
  }
}
</style>
