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

const newPersonForm = ref({ name: '', email: '', phone: '' })

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
  }, 300)
})

watch(() => selectedPerson.value?._id, () => {
  activeTab.value = 'profile'
  initialReportContent.value = ''
  initialReportName.value = ''
})

// ── Computed ──────────────────────────────────────────
const filteredPersons = computed(() => {
  let result = persons.value

  if (filterType.value === 'mine') {
    result = result.filter((p: any) => {
      const creator = p.createdBy
      const creatorId = typeof creator === 'object' ? creator?._id : creator
      return String(creatorId) === String(userStore.id)
    })
  } else if (filterType.value === 'with-files') {
    result = result.filter((p: any) => p.medicalFiles && p.medicalFiles.length > 0)
  }

  const q = debouncedSearchQuery.value.toLowerCase().trim()
  if (q) {
    result = result.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    )
  }
  
  return result
})

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
    const all = await personService.getPersons()
    // Remove strict filtering so users can see the records.
    // They can use the new UI filters to narrow down the list.
    persons.value = all
    console.log(' Persons loaded:', persons.value.length)
    // Removed auto-selection so nobody is selected by default on load
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
    })
    persons.value.unshift(created)
    newPersonForm.value = { name: '', email: '', phone: '' }
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
    <!-- Background -->
    <div class="agent-dashboard__bg">
      <video autoplay muted loop playsinline class="agent-dashboard__video">
        <source src="https://icdlabs.in/immune-internal/wp-content/themes/immuneel/assets/videos/DNA.mp4" type="video/mp4" />
      </video>
      <div class="agent-dashboard__overlay"></div>
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
          <img src="https://powerhousebiotech.com/wp-content/uploads/2024/01/logo.png" alt="PowerHouse Biotech" class="topbar__logo" />
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
              placeholder="Nombre de la persona"
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
              <i class="fa-regular fa-user-xmark"></i>
              <p>{{ searchQuery ? 'Sin resultados' : 'Sin personas aún' }}</p>
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
              <div class="profile-field profile-field--notes" v-if="selectedPerson.notes">
                <span class="profile-field__label"><i class="fa-solid fa-note-sticky"></i> Notas</span>
                <span class="profile-field__value">{{ selectedPerson.notes }}</span>
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
                <label class="form-label">Notas</label>
                <textarea v-model="profileForm.notes" class="form-textarea" rows="3"></textarea>
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
  </div>
</template>

<style lang="scss" scoped>
.agent-dashboard {
  position: relative;
  min-height: 100vh;

  &__bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    .agent-dashboard__video { width: 100%; height: 100%; object-fit: cover; }
    .agent-dashboard__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(23, 24, 70, 0.94) 0%, rgba(40, 54, 69, 0.90) 100%);
    }
  }

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
  &__input {
    width: 100%;
    padding: 0.625rem 0.875rem 0.625rem 2.5rem;
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
