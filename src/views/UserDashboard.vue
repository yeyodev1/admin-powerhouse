<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { personService } from '@/services/person.service'
import { useUserStore } from '@/stores/user'
import FileUpload from '@/components/admin/FileUpload.vue'
import PrecisionAnalysis from '@/components/admin/PrecisionAnalysis.vue'
import AnalysisHistory from '@/components/admin/AnalysisHistory.vue'

const router = useRouter()
const userStore = useUserStore()

// ── State ─────────────────────────────────────────────
const checkingAuth = ref(true)
const persons = ref<any[]>([])
const selectedPerson = ref<any>(null)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const isSearching = ref(false)
let searchTimeout: any = null
const filterType = ref('all')
const loadingPersons = ref(false)
const savingProfile = ref(false)
const creatingPerson = ref(false)
const uploadSuccess = ref(false)
const error = ref('')

const newPersonForm = ref({ name: '', email: '', phone: '', notes: '' })

// ── CRM Modal State ──
const crmModalOpen = ref(false)
const crmModalText = ref('')
const savingCrmNotes = ref(false)

function openCrmModal() {
  if (!selectedPerson.value) return
  crmModalText.value = selectedPerson.value.notes || ''
  crmModalOpen.value = true
}

async function handlePasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      crmModalText.value = text
    }
  } catch {
    alert('No se pudo leer el portapapeles directamente. Por favor presiona Ctrl+V / Cmd+V dentro del cuadro de texto.')
  }
}

async function saveCrmModal() {
  if (!selectedPerson.value?._id) return
  savingCrmNotes.value = true
  error.value = ''
  try {
    const updated = await personService.updatePerson(selectedPerson.value._id, {
      notes: crmModalText.value.trim()
    })
    selectedPerson.value = updated
    const idx = persons.value.findIndex((p: any) => p._id === updated._id)
    if (idx !== -1) persons.value[idx] = updated
    crmModalOpen.value = false
  } catch (e: any) {
    error.value = e?.message || 'Error al guardar respuestas del CRM'
  } finally {
    savingCrmNotes.value = false
  }
}

// ── Tab Management ──
const activeTab = ref('profile')
const initialReportContent = ref('')
const initialReportName = ref('')
const initialSelectedFiles = ref<any[]>([])

// ── Watchers ──────────────────────────────────────────
watch(searchQuery, (newVal) => {
  isSearching.value = true
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newVal
    isSearching.value = false
    loadPersons()
  }, 300)
})

watch(filterType, () => {
  loadPersons()
})

watch(() => selectedPerson.value?._id, () => {
  activeTab.value = 'profile'
  initialReportContent.value = ''
  initialReportName.value = ''
})

// ── Computed ──────────────────────────────────────────
const filteredPersons = computed(() => persons.value)

// ── Auth ─────────────────────────────────────────────
async function verifyAuth() {
  try {
    const me = await authService.getMe()
    userStore.setUser({ id: me.id, name: me.name, email: me.email, role: me.role, isInternal: me.isInternal })
  } catch {
    userStore.clear()
    router.push('/login')
    return false
  }
  return true
}

// ── Load persons ─────────────────────────────────────
async function loadPersons() {
  loadingPersons.value = true
  error.value = ''
  try {
    const all = await personService.getPersons({
      search: debouncedSearchQuery.value,
      filter: filterType.value,
    })
    persons.value = all
    console.log(' Persons loaded from API:', persons.value.length)
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar personas'
  } finally {
    loadingPersons.value = false
  }
}

// ── Select person ────────────────────────────────────
async function selectPerson(person: any) {
  error.value = ''
  try {
    // Obtain full, fresh details of the user when clicked
    const freshPerson = await personService.getPersonById(person._id)
    selectedPerson.value = freshPerson
  } catch (e: any) {
    error.value = e?.message || 'Error al obtener los detalles de la persona'
  }
}

// ── Create person ────────────────────────────────────
async function createPerson() {
  if (!newPersonForm.value.name.trim()) return
  creatingPerson.value = true
  error.value = ''
  try {
    const created = await personService.createPerson({
      name: newPersonForm.value.name.trim(),
      email: newPersonForm.value.email.trim() || undefined,
      phone: newPersonForm.value.phone.trim() || undefined,
      notes: newPersonForm.value.notes.trim() || undefined,
    })
    persons.value.unshift(created)
    newPersonForm.value = { name: '', email: '', phone: '', notes: '' }
    selectPerson(created)
  } catch (e: any) {
    error.value = e?.message || 'Error al crear persona'
  } finally {
    creatingPerson.value = false
  }
}

// ── Update profile ───────────────────────────────────
const profileForm = ref({
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  notes: '',
})
const isEditingProfile = ref(false)

function startEditProfile() {
  if (!selectedPerson.value) return
  profileForm.value = {
    name: selectedPerson.value.name || '',
    email: selectedPerson.value.email || '',
    phone: selectedPerson.value.phone || '',
    dateOfBirth: selectedPerson.value.dateOfBirth || '',
    address: selectedPerson.value.address || '',
    notes: selectedPerson.value.notes || '',
  }
  isEditingProfile.value = true
}

async function saveProfile() {
  if (!selectedPerson.value?._id) return
  savingProfile.value = true
  error.value = ''
  try {
    const updated = await personService.updatePerson(selectedPerson.value._id, { ...profileForm.value })
    selectedPerson.value = updated
    const idx = persons.value.findIndex((p: any) => p._id === updated._id)
    if (idx !== -1) persons.value[idx] = updated
    isEditingProfile.value = false
  } catch (e: any) {
    error.value = e?.message || 'Error al guardar'
  } finally {
    savingProfile.value = false
  }
}

// ── Files ────────────────────────────────────────────
async function handleFileUploaded(file: { url: string; filename: string; type: string }) {
  if (!selectedPerson.value?._id) return
  try {
    const updated = await personService.uploadFile(selectedPerson.value._id, file)
    selectedPerson.value = updated
    const idx = persons.value.findIndex((p: any) => p._id === updated._id)
    if (idx !== -1) persons.value[idx] = updated
    uploadSuccess.value = true
    setTimeout(() => (uploadSuccess.value = false), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Error al subir archivo'
  }
}

async function handleHistorySaved(personId: string) {
  try {
    const updated = await personService.getPersonById(personId)
    selectedPerson.value = updated
    const idx = persons.value.findIndex((p: any) => p._id === updated._id)
    if (idx !== -1) persons.value[idx] = updated
    activeTab.value = 'history' // Switch to history tab automatically
  } catch (e: any) {
    error.value = e?.message || 'Error al actualizar el historial de la persona'
  }
}

async function handleFileDeleted(fileId: string) {
  if (!selectedPerson.value?._id) return
  try {
    const updated = await personService.deleteFile(selectedPerson.value._id, fileId)
    selectedPerson.value = updated
    const idx = persons.value.findIndex((p: any) => p._id === updated._id)
    if (idx !== -1) persons.value[idx] = updated
  } catch (e: any) {
    error.value = e?.message || 'Error al eliminar archivo'
  }
}

// ── Search Helpers ─────────────────────────────────
function fillNewPersonFromSearch() {
  if (searchQuery.value) {
    newPersonForm.value.name = searchQuery.value.trim()
  }
}

function clearSearch() {
  searchQuery.value = ''
  filterType.value = 'all'
}

// ── Copy CRM Notes ─────────────────────────────────
async function copyCrmNotes() {
  if (!selectedPerson.value?.notes) return
  try {
    await navigator.clipboard.writeText(selectedPerson.value.notes)
    alert('¡Respuestas del CRM copiadas al portapapeles!')
  } catch {
    alert('No se pudo copiar automáticamente. Puedes seleccionar el texto manualmente.')
  }
}

// ── Logout ────────────────────────────────────────────
function handleLogout() {
  userStore.clear()
  router.push('/login')
}

// ── Utils ─────────────────────────────────────────────
async function openSavedReport(file: any) {
  try {
    const response = await fetch(file.url)
    const text = await response.text()
    activeTab.value = 'analysis'
    initialReportContent.value = text
    initialReportName.value = file.filename
  } catch (e: any) {
    error.value = 'Error al abrir el reporte guardado: ' + e.message
  }
}

function formatDate(date: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function startAnalysisForFile(file: any) {
  initialSelectedFiles.value = [file]
  activeTab.value = 'analysis'
}

function startAnalysisAll() {
  if (selectedPerson.value?.medicalFiles) {
    initialSelectedFiles.value = selectedPerson.value.medicalFiles.filter((f: any) =>
      !(f.type === 'text/markdown' || f.filename.endsWith('.md'))
    )
  } else {
    initialSelectedFiles.value = []
  }
  activeTab.value = 'analysis'
}

function getFileIcon(type: string) {
  if (type.includes('markdown') || type.includes('md') || type.includes('text/markdown')) return 'fa-file-medical'
  if (type.includes('pdf')) return 'fa-file-pdf'
  if (type.includes('image')) return 'fa-image'
  return 'fa-file'
}

onMounted(async () => {
  const ok = await verifyAuth()
  if (ok) await loadPersons()
  checkingAuth.value = false
})
</script>

<template>
  <div class="agent-dashboard">
    <!-- Premium Background -->
    <div class="premium-bg">
      <div class="premium-bg__orb premium-bg__orb--1"></div>
      <div class="premium-bg__orb premium-bg__orb--2"></div>
      <div class="premium-bg__grid"></div>
    </div>

    <!-- Auth check -->
    <div v-if="checkingAuth" class="agent-dashboard__loading">
      <div class="spinner"></div>
      <p>Verificando sesión...</p>
    </div>

    <div v-else class="agent-dashboard__workspace">

      <!-- ── Header ── -->
      <header class="topbar">
        <div class="topbar__brand">
          <img src="@/assets/logo/logo-powerhouse.png" alt="PowerHouse Biotech" class="topbar__logo" />
          <span class="topbar__badge">Panel de Agentes</span>
        </div>
        <div class="topbar__meta">
          <span class="topbar__agent-name">
            <i class="fa-solid fa-user-shield"></i>
            {{ userStore.name }}
          </span>
          <span class="topbar__count">
            <i class="fa-solid fa-users"></i>
            {{ persons.length }} personas
          </span>
          <button class="btn btn--ghost btn--sm" @click="handleLogout">
            <i class="fa-solid fa-right-from-bracket"></i>
            Salir
          </button>
        </div>
      </header>

      <!-- ── Main ── -->
      <div class="workspace">

        <!-- ── Left panel: Persons list ── -->
        <aside class="persons-panel">
          <div class="persons-panel__header">
            <h2 class="panel-title">
              <i class="fa-solid fa-users-viewfinder"></i>
              Personas
            </h2>
            <span class="panel-count">{{ filteredPersons.length }}</span>
          </div>

          <!-- Filters and Search -->
          <div class="filters-container">
            <div class="search-box">
              <i v-if="!isSearching" class="fa-solid fa-magnifying-glass search-box__icon"></i>
              <div v-else class="spinner spinner--xs search-box__icon search-box__icon--spinner"></div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                class="search-box__input"
              />
              <button v-if="searchQuery" class="search-box__clear" @click="searchQuery = ''" title="Limpiar búsqueda">
                <i class="fa-solid fa-circle-xmark"></i>
              </button>
            </div>
            <div class="filter-box">
              <select v-model="filterType" class="form-input form-input--sm filter-select">
                <option value="all">Todas las personas</option>
                <option value="mine">Mis registros</option>
                <option value="with-files">Con archivos médicos</option>
              </select>
            </div>
          </div>

          <!-- New person form -->
          <form @submit.prevent="createPerson" class="new-person-form">
            <input
              v-model="newPersonForm.name"
              type="text"
              placeholder="Nombre de la persona *"
              class="form-input form-input--sm"
              required
            />
            <div class="new-person-form__row">
              <input
                v-model="newPersonForm.email"
                type="email"
                placeholder="Email (opcional)"
                class="form-input form-input--sm"
              />
              <input
                v-model="newPersonForm.phone"
                type="tel"
                placeholder="Teléfono (opcional)"
                class="form-input form-input--sm"
              />
            </div>
            <textarea
              v-model="newPersonForm.notes"
              placeholder="Formulario CRM: Copia y pega aquí las respuestas que llenó el cliente (opcional)..."
              class="form-textarea form-textarea--sm"
              rows="2"
            ></textarea>
            <button type="submit" class="btn btn--primary btn--sm btn--full" :disabled="creatingPerson">
              <span v-if="creatingPerson" class="spinner spinner--xs"></span>
              <i v-else class="fa-solid fa-user-plus"></i>
              Nueva persona
            </button>
          </form>

          <!-- Persons list -->
          <div class="persons-list">
            <div v-if="loadingPersons" class="persons-list__empty">
              <div class="spinner"></div>
            </div>
            <div v-else-if="filteredPersons.length === 0" class="persons-list__empty">
              <template v-if="searchQuery">
                <div class="search-empty-box">
                  <i class="fa-solid fa-user-slash search-empty-icon"></i>
                  <h4 class="search-empty-title">Sin coincidencias</h4>
                  <p class="search-empty-text">
                    No existe ningún paciente registrado con <strong>"{{ searchQuery }}"</strong> en nombre, correo o teléfono.
                  </p>
                  <div class="search-empty-actions">
                    <button class="btn btn--sm btn--primary btn--full" @click="fillNewPersonFromSearch">
                      <i class="fa-solid fa-user-plus"></i>
                      <span>Crear paciente "{{ searchQuery }}"</span>
                    </button>
                    <button class="btn btn--sm btn--ghost btn--full" @click="clearSearch">
                      <i class="fa-solid fa-rotate-left"></i>
                      <span>Ver todos</span>
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="search-empty-box">
                  <i class="fa-solid fa-users-slash search-empty-icon"></i>
                  <h4 class="search-empty-title">Sin pacientes en la lista</h4>
                  <p class="search-empty-text">Usa el formulario superior para registrar a tu primer paciente.</p>
                </div>
              </template>
            </div>
            <button
              v-for="person in filteredPersons"
              :key="person._id"
              class="person-card"
              :class="{ 'person-card--active': selectedPerson?._id === person._id }"
              @click="selectPerson(person)"
            >
              <div class="person-card__avatar">
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="person-card__info">
                <span class="person-card__name">{{ person.name }}</span>
                <span class="person-card__meta">{{ person.email || 'Sin email' }}</span>
              </div>
              <span class="person-card__files-count" v-if="person.medicalFiles?.length">
                <i class="fa-solid fa-paperclip"></i>
                {{ person.medicalFiles.length }}
              </span>
            </button>
          </div>
        </aside>

        <!-- ── Right panel: Person detail ── -->
        <main class="person-detail" v-if="selectedPerson">
          <div class="person-detail__header">
            <div class="person-detail__title-row">
              <div class="person-detail__avatar">
                <i class="fa-solid fa-user"></i>
              </div>
              <div>
                <h2 class="person-detail__name">{{ selectedPerson.name }}</h2>
                <span class="person-detail__since">
                  <i class="fa-regular fa-calendar"></i>
                  Creado {{ formatDate(selectedPerson.createdAt) }}
                </span>
              </div>
            </div>
            <button v-if="!isEditingProfile" class="btn btn--outline btn--sm" @click="startEditProfile">
              <i class="fa-solid fa-pen"></i>
              Editar perfil
            </button>
            <div v-else class="person-detail__edit-actions">
              <button class="btn btn--primary btn--sm" :disabled="savingProfile" @click="saveProfile">
                <span v-if="savingProfile" class="spinner spinner--xs"></span>
                <i v-else class="fa-solid fa-check"></i>
                Guardar
              </button>
              <button class="btn btn--ghost btn--sm" @click="isEditingProfile = false">
                <i class="fa-solid fa-xmark"></i>
                Cancelar
              </button>
            </div>
          </div>
          <!-- Tabs Navigation -->
          <div class="person-tabs">
            <button
              class="person-tab"
              :class="{ 'person-tab--active': activeTab === 'profile' }"
              @click="activeTab = 'profile'"
            >
              <i class="fa-solid fa-address-card"></i>
              Ficha Médica
            </button>
            <button
              class="person-tab"
              :class="{ 'person-tab--active': activeTab === 'analysis' }"
              @click="activeTab = 'analysis'"
            >
              <i class="fa-solid fa-vial-medical"></i>
              Análisis de Precisión
            </button>
            <button
              class="person-tab"
              :class="{ 'person-tab--active': activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              <i class="fa-solid fa-clock-rotate-left"></i>
              Historial de Análisis
            </button>
          </div>

          <div v-if="activeTab === 'profile'" class="tab-content-wrapper animate-fade-in">
            <!-- CRM Quick Banner / Action Button -->
            <div class="crm-banner card-glass">
              <div class="crm-banner__info">
                <div class="crm-banner__icon">
                  <i class="fa-solid fa-clipboard-question"></i>
                </div>
                <div>
                  <h4 class="crm-banner__title">Respuestas del Formulario CRM (GoHighLevel / Bakano)</h4>
                  <p class="crm-banner__subtitle" v-if="selectedPerson.notes">
                    <i class="fa-solid fa-circle-check text-success"></i>
                    Formulario cargado ({{ selectedPerson.notes.length }} caracteres) — La IA incluirá estas respuestas en su análisis.
                  </p>
                  <p class="crm-banner__subtitle" v-else>
                    <i class="fa-solid fa-circle-info text-primary"></i>
                    El paciente aún no tiene respuestas del CRM registradas.
                  </p>
                </div>
              </div>
              <div class="crm-banner__actions">
                <button v-if="selectedPerson.notes" class="btn btn--xs btn--outline" @click="copyCrmNotes">
                  <i class="fa-solid fa-copy"></i>
                  Copiar
                </button>
                <button class="btn btn--sm btn--primary" @click="openCrmModal">
                  <i class="fa-solid fa-paste"></i>
                  <span>{{ selectedPerson.notes ? 'Ver / Editar Formulario CRM' : 'Pegar Formulario CRM' }}</span>
                </button>
              </div>
            </div>

            <!-- Profile view -->
            <div v-if="!isEditingProfile" class="profile-fields">
              <div class="profile-field">
                <span class="profile-field__label"><i class="fa-solid fa-user"></i> Nombre</span>
                <span class="profile-field__value">{{ selectedPerson.name || '—' }}</span>
              </div>
              <div class="profile-field">
                <span class="profile-field__label"><i class="fa-solid fa-envelope"></i> Email</span>
                <span class="profile-field__value">{{ selectedPerson.email || '—' }}</span>
              </div>
              <div class="profile-field">
                <span class="profile-field__label"><i class="fa-solid fa-phone"></i> Teléfono</span>
                <span class="profile-field__value">{{ selectedPerson.phone || '—' }}</span>
              </div>
              <div class="profile-field">
                <span class="profile-field__label"><i class="fa-solid fa-cake-candles"></i> Fecha de nacimiento</span>
                <span class="profile-field__value">{{ selectedPerson.dateOfBirth ? formatDate(selectedPerson.dateOfBirth) : '—' }}</span>
              </div>
              <div class="profile-field">
                <span class="profile-field__label"><i class="fa-solid fa-location-dot"></i> Dirección</span>
                <span class="profile-field__value">{{ selectedPerson.address || '—' }}</span>
              </div>
            </div>

            <!-- Profile edit form -->
            <div v-else class="profile-edit">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre</label>
                  <input v-model="profileForm.name" type="text" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input v-model="profileForm.email" type="email" class="form-input" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Teléfono</label>
                  <input v-model="profileForm.phone" type="tel" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha de nacimiento</label>
                  <input v-model="profileForm.dateOfBirth" type="date" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <input v-model="profileForm.address" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">
                  <i class="fa-solid fa-clipboard-question"></i>
                  Formulario / Encuesta CRM del Cliente (Copia y Pega)
                </label>
                <textarea
                  v-model="profileForm.notes"
                  class="form-textarea"
                  rows="5"
                  placeholder="Copia y pega aquí el texto completo del formulario o encuesta que el cliente llenó en GoHighLevel / Bakano CRM..."
                ></textarea>
                <span class="field-hint">Estas respuestas serán analizadas automáticamente por la Inteligencia Artificial al generar el reporte médico.</span>
              </div>
            </div>

            <!-- Medical files section -->
            <div class="medical-section">
              <div class="medical-section__header">
                <h3 class="medical-section__title">
                  <i class="fa-solid fa-file-medical"></i>
                  Archivos Médicos
                  <span class="medical-section__count">{{ selectedPerson.medicalFiles?.length || 0 }}</span>
                </h3>
                <button
                  v-if="selectedPerson.medicalFiles?.some((f: any) => !(f.type === 'text/markdown' || f.filename.endsWith('.md')))"
                  class="btn btn--primary btn--sm"
                  @click="startAnalysisAll"
                >
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  Analizar con IA
                </button>
              </div>

              <!-- File list -->
              <div v-if="selectedPerson.medicalFiles?.length" class="files-grid">
                <div v-for="file in selectedPerson.medicalFiles" :key="file._id" class="file-card">
                  <div class="file-card__icon">
                    <i :class="['fa-regular', getFileIcon(file.type)]"></i>
                  </div>
                  <div class="file-card__info">
                    <a
                      v-if="file.type === 'text/markdown' || file.filename.endsWith('.md')"
                      href="#"
                      class="file-card__name"
                      @click.prevent="openSavedReport(file)"
                    >
                      {{ file.filename }}
                    </a>
                    <a v-else :href="file.url" target="_blank" class="file-card__name">{{ file.filename }}</a>
                    <span class="file-card__meta">{{ file.type }}</span>
                    <span class="file-card__date">{{ formatDate(file.uploadedAt) }}</span>
                  </div>
                  <div class="file-card__actions">
                    <button
                      v-if="!(file.type === 'text/markdown' || file.filename.endsWith('.md'))"
                      class="btn-icon"
                      title="Analizar con IA"
                      @click="startAnalysisForFile(file)"
                    >
                      <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </button>
                    <a
                      v-if="file.type === 'text/markdown' || file.filename.endsWith('.md')"
                      href="#"
                      class="btn-icon"
                      title="Ver reporte"
                      @click.prevent="openSavedReport(file)"
                    >
                      <i class="fa-solid fa-file-medical"></i>
                    </a>
                    <a v-else :href="file.url" target="_blank" class="btn-icon" title="Ver archivo">
                      <i class="fa-solid fa-eye"></i>
                    </a>
                    <button class="btn-icon btn-icon--danger" title="Eliminar" @click="handleFileDeleted(file._id)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="files-empty">
                <i class="fa-regular fa-folder-open"></i>
                <p>Sin archivos médicos</p>
                <p class="files-empty__hint">Sube resultados de laboratorio, imágenes, recetas u otros documentos.</p>
              </div>

              <!-- Upload -->
              <div class="upload-section">
                <FileUpload
                  :person-id="selectedPerson._id"
                  :files="selectedPerson.medicalFiles || []"
                  @uploaded="handleFileUploaded"
                  @deleted="handleFileDeleted"
                />
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'analysis'" class="tab-content-wrapper animate-fade-in">
            <PrecisionAnalysis
              :person="selectedPerson"
              :initial-report-content="initialReportContent"
              :initial-selected-files="initialSelectedFiles"
              @uploaded="handleFileUploaded"
              @history-saved="handleHistorySaved"
              @error="(msg) => error = msg"
              @go-to-profile="activeTab = 'profile'"
            />
          </div>

          <div v-else-if="activeTab === 'history'" class="tab-content-wrapper animate-fade-in">
            <AnalysisHistory
              :person="selectedPerson"
              @error="(msg) => error = msg"
            />
          </div>
        </main>

        <!-- Empty state: no person selected -->
        <main class="person-detail person-detail--empty" v-else>
          <div class="empty-state">
            <i class="fa-regular fa-user-pen"></i>
            <h3>Selecciona una persona</h3>
            <p>Elige una persona de la lista para ver y gestionar su perfil y archivos médicos.</p>
          </div>
        </main>
      </div>
    </div>

    <!-- Error toast -->
    <div v-if="error" class="alert-bar">
      <i class="fa-solid fa-circle-exclamation"></i>
      {{ error }}
      <button @click="error = ''"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <!-- Success toast -->
    <div v-if="uploadSuccess" class="toast toast--success">
      <i class="fa-solid fa-check-circle"></i>
      Archivo subido correctamente
    </div>

    <!-- CRM Questionnaire Modal -->
    <Teleport to="body">
      <Transition name="modal-fade" appear>
        <div v-if="crmModalOpen" class="modal-overlay" @click.self="crmModalOpen = false">
          <div class="modal crm-modal card-glass">
            <div class="modal__header">
              <div class="crm-modal__title-box">
                <i class="fa-solid fa-clipboard-question text-primary crm-modal__icon"></i>
                <div>
                  <h3 class="modal__title">Formulario / Encuesta CRM del Cliente</h3>
                  <span class="crm-modal__subtitle">GoHighLevel / Bakano CRM</span>
                </div>
              </div>
              <button class="modal__close" @click="crmModalOpen = false"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="modal__body crm-modal__body">
              <div class="crm-modal__notice">
                <i class="fa-solid fa-wand-magic-sparkles text-primary"></i>
                <p>Copia y pega aquí las respuestas completas de la encuesta que llenó el cliente. La Inteligencia Artificial analizará estas respuestas automáticamente para generar el informe médico.</p>
              </div>

              <div class="crm-modal__toolbar">
                <button class="btn btn--xs btn--outline" @click="handlePasteFromClipboard">
                  <i class="fa-solid fa-paste"></i>
                  Pegar del portapapeles
                </button>
                <button v-if="crmModalText" class="btn btn--xs btn--ghost" @click="crmModalText = ''">
                  <i class="fa-solid fa-trash"></i>
                  Limpiar texto
                </button>
              </div>

              <textarea
                v-model="crmModalText"
                class="form-textarea crm-modal__textarea"
                rows="10"
                placeholder="Pega aquí las preguntas y respuestas del cliente (ej. Edad, síntomas principales, antecedentes familiares, alergias, objetivos de tratamiento...)"
              ></textarea>
            </div>

            <div class="modal__actions crm-modal__actions">
              <button class="btn btn--ghost" @click="crmModalOpen = false">
                <i class="fa-solid fa-xmark"></i>
                Cancelar
              </button>
              <button class="btn btn--primary" :disabled="savingCrmNotes" @click="saveCrmModal">
                <span v-if="savingCrmNotes" class="spinner spinner--xs"></span>
                <i v-else class="fa-solid fa-floppy-disk"></i>
                Guardar Respuestas CRM
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.agent-dashboard {
  position: relative;
  min-height: 100vh;
  background-color: #050505;
  color: #ffffff;

  &__loading {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-2);
    font-family: var(--font-montserrat);
  }

  &__workspace {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

/* --- Premium Background --- */
.premium-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.25;
    animation: pulseOrb 15s infinite alternate;

    &--1 {
      width: 500px;
      height: 500px;
      background: #21BCFB;
      top: -100px;
      left: -100px;
    }

    &--2 {
      width: 600px;
      height: 600px;
      background: #1278F3;
      bottom: -200px;
      right: -100px;
      animation-delay: -5s;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }
}

@keyframes pulseOrb {
  0% { transform: scale(1) translate(0, 0); opacity: 0.15; }
  100% { transform: scale(1.1) translate(20px, 20px); opacity: 0.3; }
}

// ── Topbar ──
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: rgba(20, 23, 70, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  gap: 1rem;

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__logo { height: 32px; filter: brightness(0) invert(1); }

  &__badge {
    background: rgba(33, 188, 251, 0.15);
    border: 1px solid rgba(33, 188, 251, 0.3);
    color: var(--primary);
    font-family: var(--font-montserrat);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__agent-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    color: var(--text-2);
    i { color: var(--primary); }
  }

  &__count {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    color: var(--text-3);
    i { color: var(--primary); }
  }
}

// ── Workspace ──
.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 340px 1fr;
  overflow: hidden;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// ── Persons Panel ──
.persons-panel {
  border-right: 1px solid var(--border);
  background: rgba(20, 23, 70, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 0.75rem;
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-montserrat);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  i { color: var(--primary); }
}

.panel-count {
  background: rgba(33, 188, 251, 0.15);
  color: var(--primary);
  font-family: var(--font-montserrat);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
}

// ── Filters & Search ──
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.search-box {
  position: relative;
  margin: 0 0.75rem;
  &__icon {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    font-size: 0.8rem;
    
    &--spinner {
      border-color: var(--text-3);
      border-top-color: transparent;
    }
  }
  &__clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.15s;

    &:hover {
      color: var(--text);
    }
  }
  &__input {
    width: 100%;
    padding: 0.625rem 2.2rem 0.625rem 2.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    transition: border-color 0.2s;
    &::placeholder { color: var(--text-3); }
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.1);
    }
  }
}

.search-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem 1.25rem;
  gap: 0.6rem;
  background: rgba(33, 188, 251, 0.03);
  border: 1px dashed var(--border-medium);
  border-radius: 14px;
  width: 100%;
  box-sizing: border-box;
  margin: 0.5rem 0;

  .search-empty-icon {
    font-size: 2.2rem;
    color: var(--cyan);
    opacity: 0.85;
    margin-bottom: 0.25rem;
  }

  .search-empty-title {
    font-family: var(--font-montserrat);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .search-empty-text {
    font-family: var(--font-montserrat);
    font-size: 0.8rem;
    color: var(--text-2);
    margin: 0;
    line-height: 1.45;
    max-width: 260px;

    strong {
      color: var(--cyan);
      font-weight: 700;
    }
  }

  .search-empty-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    margin-top: 0.6rem;

    .btn {
      width: 100%;
      justify-content: center;
      text-align: center;
    }
  }
}

.filter-box {
  margin: 0 0.75rem;
  .filter-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--font-montserrat);
    font-size: 0.8rem;
    cursor: pointer;
    
    option {
      background: #141746;
      color: var(--text);
    }
  }
}

// ── New Person Form ──
.new-person-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.75rem 0.75rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.5rem;

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}

// ── Persons List ──
.persons-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 1rem;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: var(--text-3);
    font-family: var(--font-montserrat);
    font-size: 0.8rem;
    i { font-size: 2rem; }
    p { margin: 0; }
  }

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
}

.person-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  margin-bottom: 0.25rem;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--border);
  }

  &--active {
    background: rgba(33, 188, 251, 0.08);
    border-color: rgba(33, 188, 251, 0.3);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(33, 188, 251, 0.12);
    border: 1px solid rgba(33, 188, 251, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    i { color: var(--primary); font-size: 0.875rem; }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__name {
    font-family: var(--font-montserrat);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__files-count {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--primary);
    background: rgba(33, 188, 251, 0.1);
    padding: 0.15rem 0.45rem;
    border-radius: 20px;
    flex-shrink: 0;
    i { font-size: 0.65rem; }
  }
}

// ── Person Detail ──
.person-detail {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem 2rem 2rem;
  gap: 1.5rem;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(33, 188, 251, 0.12);
    border: 2px solid rgba(33, 188, 251, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    i { color: var(--primary); font-size: 1.25rem; }
  }

  &__name {
    font-family: var(--font-montserrat);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.2rem;
  }

  &__since {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-montserrat);
    font-size: 0.75rem;
    color: var(--text-3);
    i { font-size: 0.7rem; }
  }

  &__edit-actions {
    display: flex;
    gap: 0.5rem;
  }
}

// ── Person Tabs ──
.person-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
}

.person-tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  font-family: var(--font-montserrat);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;

  i {
    font-size: 0.9rem;
    transition: transform 0.2s;
  }

  &:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.03);
    i {
      transform: translateY(-1px);
    }
  }

  &--active {
    background: rgba(33, 188, 251, 0.08);
    border-color: rgba(33, 188, 251, 0.25);
    color: var(--primary);
    box-shadow: 0 0 10px rgba(33, 188, 251, 0.05);
  }
}

.tab-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

// ── CRM Card Styles ──
.crm-card {
  padding: 1.25rem;
  border-radius: 14px;
  background: rgba(30, 34, 96, 0.4);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    h4 {
      margin: 0;
      font-family: var(--font-montserrat);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text);
    }
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #6ee7b7;
    margin: 0 0 0.5rem;
  }

  &__empty {
    text-align: center;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-3);

    i { font-size: 2.2rem; color: rgba(33, 188, 251, 0.25); margin-bottom: 0.25rem; }
    .empty-title { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--text-2); }
    .empty-desc { margin: 0; font-size: 0.78rem; max-width: 480px; line-height: 1.4; color: var(--text-3); }
  }
}

.crm-notes-box {
  background: rgba(10, 13, 40, 0.6);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  max-height: 240px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-family: var(--font-secondary);
    font-size: 0.85rem;
    color: var(--text-2);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }
}

.field-hint {
  font-size: 0.725rem;
  color: var(--text-3);
  margin-top: 0.2rem;
}
.text-success { color: #10b981; }

// ── CRM Banner ──
.crm-banner {
  padding: 1rem 1.25rem;
  border-radius: 14px;
  background: rgba(30, 34, 96, 0.4);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  &__info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(33, 188, 251, 0.12);
    border: 1px solid rgba(33, 188, 251, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: var(--cyan);
    flex-shrink: 0;
  }

  &__title {
    margin: 0 0 0.2rem;
    font-family: var(--font-montserrat);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
  }

  &__subtitle {
    margin: 0;
    font-family: var(--font-montserrat);
    font-size: 0.78rem;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }
}

// ── CRM Modal ──
.crm-modal {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;

  &__title-box {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  &__icon {
    font-size: 1.6rem;
  }

  &__subtitle {
    font-size: 0.75rem;
    color: var(--cyan);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    margin-top: 1rem;
  }

  &__notice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: rgba(33, 188, 251, 0.08);
    border: 1px solid rgba(33, 188, 251, 0.2);
    border-radius: 10px;
    padding: 0.875rem 1rem;

    i { font-size: 1.1rem; margin-top: 0.1rem; flex-shrink: 0; }
    p { margin: 0; font-size: 0.825rem; color: var(--text-2); line-height: 1.45; }
  }

  &__toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  &__textarea {
    min-height: 200px;
    font-family: var(--font-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    background: rgba(10, 13, 40, 0.7);
    border-radius: 10px;
    padding: 1rem;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
}

// ── Profile Fields ──
.profile-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: rgba(30, 34, 96, 0.4);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  &--notes {
    grid-column: 1 / -1;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    i { color: var(--primary); font-size: 0.7rem; }
  }

  &__value {
    font-family: var(--font-montserrat);
    font-size: 0.9rem;
    color: var(--text);
  }
}

// ── Profile Edit ──
.profile-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(30, 34, 96, 0.4);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-family: var(--font-montserrat);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-textarea {
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  &::placeholder { color: var(--text-3); }
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.1);
  }
  &--sm { padding: 0.5rem 0.75rem; font-size: 0.825rem; }
}

.form-textarea { resize: vertical; min-height: 80px; }

// ── Medical Section ──
.medical-section {
  background: rgba(30, 34, 96, 0.4);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-montserrat);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
    i { color: var(--primary); }
  }

  &__count {
    background: rgba(33, 188, 251, 0.15);
    color: var(--primary);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
  }
}

// ── Files Grid ──
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    .file-card__actions { opacity: 1; }
  }

  &__icon {
    font-size: 1.5rem;
    color: var(--primary);
    width: 2rem;
    text-align: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__name {
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    &:hover { text-decoration: underline; }
  }

  &__meta {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__date {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
  }

  &__actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.15s;
  }
}

// ── Files Empty ──
.files-empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-3);
  i { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
  p { margin: 0; font-family: var(--font-montserrat); font-size: 0.875rem; }
  &__hint {
    font-size: 0.75rem !important;
    margin-top: 0.25rem !important;
    color: var(--text-3);
  }
}

.upload-section {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

// ── Empty State ──
.empty-state {
  text-align: center;
  color: var(--text-3);
  i { font-size: 4rem; display: block; margin-bottom: 1rem; color: rgba(33, 188, 251, 0.2); }
  h3 {
    font-family: var(--font-montserrat);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-2);
    margin: 0 0 0.5rem;
  }
  p {
    font-family: var(--font-montserrat);
    font-size: 0.85rem;
    margin: 0;
    max-width: 280px;
  }
}

// ── Buttons ──
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  white-space: nowrap;

  &--sm { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
  &--xs { padding: 0.3rem 0.6rem; font-size: 0.7rem; }
  &--full { width: 100%; justify-content: center; }

  &--primary {
    background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
    color: #171846;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(33, 188, 251, 0.3); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &--outline {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(33, 188, 251, 0.3);
    color: var(--primary);
    &:hover { background: rgba(33, 188, 251, 0.08); }
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--border);
    color: var(--text-2);
    &:hover { background: rgba(255, 255, 255, 0.1); color: var(--text); }
  }
}

.btn-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-2);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
  text-decoration: none;
  &:hover { background: rgba(33, 188, 251, 0.1); color: var(--primary); border-color: rgba(33, 188, 251, 0.3); }
  &--danger:hover { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }
}

// ── Alert ──
.alert-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  z-index: 100;
  animation: slideUp 0.3s ease;
  i { flex-shrink: 0; }
  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    padding: 0 0 0 0.5rem;
    &:hover { opacity: 1; }
  }
}

// ── Toast ──
.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.875rem 1.25rem;
  border-radius: 10px;
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 100;
  animation: slideUp 0.3s ease;

  &--success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
  }
}

// ── Spinners ──
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  &--xs { width: 14px; height: 14px; border-width: 2px; display: inline-block; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
</style>

<style lang="scss">
/* ── Global Print Styles for Dashboard ── */
@media print {
  /* Ocultar elementos de navegación y estructurales innecesarios */
  .admin-header,
  .persons-sidebar,
  .person-detail__header,
  .person-tabs,
  .viewer-actions,
  .analysis-controls {
    display: none !important;
  }
  
  /* Resetear contenedores principales para que ocupen todo el espacio */
  body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #app,
  .admin-layout,
  .admin-main,
  .dashboard-container,
  .person-detail,
  .analysis-viewer,
  .precision-analysis-wrapper {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    border: none !important;
    overflow: visible !important;
    box-shadow: none !important;
    display: block !important;
  }
}
</style>
