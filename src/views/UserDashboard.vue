<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { personService, type PersonData } from '@/services/person.service'
import { useUserStore } from '@/stores/user'
import FileUpload from '@/components/admin/FileUpload.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const saving = ref(false)
const checkingAuth = ref(true)
const error = ref('')
const person = ref<any>(null)
const isEditing = ref(false)
const uploadSuccess = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  notes: '',
})

async function verifyAuth() {
  try {
    const me = await authService.getMe()
    userStore.setUser({ id: me.id, name: me.name, email: me.email, role: me.role })
  } catch {
    userStore.clear()
    router.push('/login')
    return false
  }
  return true
}

async function loadOrCreatePerson() {
  try {
    const persons = await personService.getPersons()
    const mine = persons.find((p: any) => p.createdBy?._id === userStore.id || p.createdBy === userStore.id)
    if (mine) {
      person.value = mine
      populateForm(mine)
    } else {
      const created = await personService.createPerson({
        name: userStore.name || '',
        email: userStore.email || '',
      })
      person.value = created
      populateForm(created)
    }
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar tu perfil'
  } finally {
    loading.value = false
  }
}

function populateForm(p: any) {
  form.value = {
    name: p.name || '',
    email: p.email || '',
    phone: p.phone || '',
    dateOfBirth: p.dateOfBirth || '',
    address: p.address || '',
    notes: p.notes || '',
  }
}

async function saveProfile() {
  if (!person.value?._id) return
  saving.value = true
  error.value = ''
  try {
    const updated = await personService.updatePerson(person.value._id, { ...form.value })
    person.value = updated
    isEditing.value = false
  } catch (e: any) {
    error.value = e?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function handleFileUploaded(file: { url: string; filename: string; type: string }) {
  if (!person.value?._id) return
  try {
    const updated = await personService.uploadFile(person.value._id, file)
    person.value = updated
    uploadSuccess.value = true
    setTimeout(() => (uploadSuccess.value = false), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Error al subir archivo'
  }
}

async function handleFileDeleted(fileId: string) {
  if (!person.value?._id) return
  try {
    const updated = await personService.deleteFile(person.value._id, fileId)
    person.value = updated
  } catch (e: any) {
    error.value = e?.message || 'Error al eliminar archivo'
  }
}

function handleLogout() {
  userStore.clear()
  router.push('/login')
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return 'fa-file-pdf'
  if (type.includes('image')) return 'fa-image'
  return 'fa-file'
}

onMounted(async () => {
  const ok = await verifyAuth()
  if (ok) await loadOrCreatePerson()
  checkingAuth.value = false
})
</script>

<template>
  <div class="dashboard">
    <!-- Background -->
    <div class="dashboard__bg">
      <video autoplay muted loop playsinline class="dashboard__video">
        <source src="https://icdlabs.in/immune-internal/wp-content/themes/immuneel/assets/videos/DNA.mp4" type="video/mp4" />
      </video>
      <div class="dashboard__overlay"></div>
    </div>

    <!-- Loading / Auth check -->
    <div v-if="checkingAuth || loading" class="dashboard__loading">
      <div class="spinner"></div>
      <p>{{ checkingAuth ? 'Verificando sesión...' : 'Cargando tu perfil...' }}</p>
    </div>

    <!-- Main dashboard -->
    <div v-else class="dashboard__content">

      <!-- Header -->
      <header class="dashboard__header">
        <div class="dashboard__brand">
          <img src="https://powerhousebiotech.com/wp-content/uploads/2024/01/logo.png" alt="PowerHouse Biotech" class="dashboard__logo" />
          <span class="dashboard__badge">Mi Panel</span>
        </div>
        <div class="dashboard__header-actions">
          <button v-if="!isEditing" class="btn btn--ghost" @click="isEditing = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn btn--ghost btn--logout" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Salir
          </button>
        </div>
      </header>

      <!-- Hero greeting -->
      <section class="hero">
        <div class="hero__text">
          <h1 class="hero__greeting">
            {{ new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches' }}, {{ userStore.name?.split(' ')[0] }}
          </h1>
          <p class="hero__sub">{{ userStore.email }}</p>
        </div>
        <div class="hero__stat">
          <span class="hero__stat-num">{{ person?.medicalFiles?.length || 0 }}</span>
          <span class="hero__stat-label">archivos médicos</span>
        </div>
      </section>

      <!-- Error banner -->
      <div v-if="error" class="alert alert--error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
        <button class="alert__close" @click="error = ''"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- Success toast -->
      <div v-if="uploadSuccess" class="toast toast--success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Archivo subido correctamente
      </div>

      <!-- Profile + Files grid -->
      <div class="dashboard__grid">

        <!-- Profile Card -->
        <div class="card card--profile">
          <div class="card__header">
            <h2 class="card__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Mi Perfil
            </h2>
          </div>

          <div v-if="isEditing" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre completo</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Tu nombre" />
              </div>
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="+593 99 000 0000" />
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de nacimiento</label>
                <input v-model="form.dateOfBirth" type="date" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input v-model="form.address" type="text" class="form-input" placeholder="Tu dirección" />
            </div>
            <div class="form-group">
              <label class="form-label">Notas personales</label>
              <textarea v-model="form.notes" class="form-textarea" placeholder="Cualquier nota relevante para tu historial médico..." rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn--primary" :disabled="saving" @click="saveProfile">
                <span v-if="saving" class="spinner spinner--sm"></span>
                <span v-else>Guardar cambios</span>
              </button>
              <button class="btn btn--ghost" @click="isEditing = false">Cancelar</button>
            </div>
          </div>

          <div v-else class="profile-view">
            <div class="profile-field">
              <span class="profile-field__label">Nombre</span>
              <span class="profile-field__value">{{ person?.name || '—' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-field__label">Correo</span>
              <span class="profile-field__value">{{ person?.email || '—' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-field__label">Teléfono</span>
              <span class="profile-field__value">{{ person?.phone || '—' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-field__label">Fecha de nacimiento</span>
              <span class="profile-field__value">{{ person?.dateOfBirth ? formatDate(person.dateOfBirth) : '—' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-field__label">Dirección</span>
              <span class="profile-field__value">{{ person?.address || '—' }}</span>
            </div>
            <div v-if="person?.notes" class="profile-field profile-field--notes">
              <span class="profile-field__label">Notas</span>
              <span class="profile-field__value">{{ person.notes }}</span>
            </div>
          </div>
        </div>

        <!-- Medical Files Card -->
        <div class="card card--files">
          <div class="card__header">
            <h2 class="card__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Archivos Médicos
            </h2>
            <span class="card__count">{{ person?.medicalFiles?.length || 0 }}</span>
          </div>

          <!-- File list -->
          <div v-if="person?.medicalFiles?.length" class="files-list">
            <div v-for="file in person.medicalFiles" :key="file._id" class="file-item">
              <i :class="['fa-regular', getFileIcon(file.type), 'file-item__icon']"></i>
              <div class="file-item__info">
                <a :href="file.url" target="_blank" class="file-item__name">{{ file.filename }}</a>
                <span class="file-item__meta">{{ file.type }} · {{ formatDate(file.uploadedAt) }}</span>
              </div>
              <button class="file-item__delete" title="Eliminar" @click="handleFileDeleted(file._id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
          <div v-else class="files-empty">
            <i class="fa-regular fa-folder-open files-empty__icon"></i>
            <p>Sin archivos aún</p>
            <p class="files-empty__hint">Sube tus resultados de laboratorio, resonancias, recetas u otros documentos médicos.</p>
          </div>

          <!-- Upload -->
          <div class="upload-area">
            <FileUpload
              :person-id="person?._id || ''"
              :files="person?.medicalFiles || []"
              @uploaded="handleFileUploaded"
              @deleted="handleFileDeleted"
            />
          </div>
        </div>

      </div>

      <!-- Footer -->
      <footer class="dashboard__footer">
        <p>PowerHouse Biotech · {{ new Date().getFullYear() }}</p>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  position: relative;
  min-height: 100vh;

  &__bg {
    position: fixed;
    inset: 0;
    z-index: 0;

    .dashboard__video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .dashboard__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(23, 24, 70, 0.93) 0%, rgba(40, 54, 69, 0.89) 100%);
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

  &__content {
    position: relative;
    z-index: 10;
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__logo {
    height: 36px;
    filter: brightness(0) invert(1);
  }

  &__badge {
    background: rgba(33, 188, 251, 0.15);
    border: 1px solid rgba(33, 188, 251, 0.3);
    color: var(--primary);
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
  }

  &__header-actions {
    display: flex;
    gap: 0.5rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__footer {
    text-align: center;
    color: var(--text-3);
    font-family: var(--font-montserrat);
    font-size: 0.75rem;
  }
}

// Hero
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(30, 34, 96, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: 16px;

  &__greeting {
    font-family: var(--font-montserrat);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.25rem;
  }

  &__sub {
    font-family: var(--font-montserrat);
    font-size: 0.875rem;
    color: var(--text-3);
    margin: 0;
  }

  &__stat {
    text-align: center;
    background: rgba(33, 188, 251, 0.1);
    border: 1px solid rgba(33, 188, 251, 0.2);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__stat-num {
    font-family: var(--font-montserrat);
    font-size: 2rem;
    font-weight: 800;
    color: var(--primary);
    line-height: 1;
  }

  &__stat-label {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Cards
.card {
  background: rgba(30, 34, 96, 0.45);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
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
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  &__count {
    background: rgba(33, 188, 251, 0.15);
    color: var(--primary);
    font-family: var(--font-montserrat);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
  }
}

// Profile view
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  &--notes {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }

  &__label {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__value {
    font-family: var(--font-montserrat);
    font-size: 0.9rem;
    color: var(--text);
  }
}

// Profile form
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-family: var(--font-montserrat);
  font-size: 0.75rem;
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

  &::placeholder { color: var(--text-3); }
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.1);
  }
}

.form-textarea { resize: vertical; min-height: 80px; }

.form-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

// Files
.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: background 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.06); }

  &__icon {
    font-size: 1.25rem;
    color: var(--primary);
    width: 1.5rem;
    text-align: center;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-family: var(--font-montserrat);
    font-size: 0.825rem;
    color: var(--primary);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover { text-decoration: underline; }
  }

  &__meta {
    font-family: var(--font-montserrat);
    font-size: 0.7rem;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__delete {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    padding: 0.35rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.2s, background 0.2s;
    &:hover {
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.1);
    }
  }
}

.files-empty {
  text-align: center;
  padding: 1.5rem 1rem;
  color: var(--text-3);

  &__icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-3);
  }
  p { margin: 0; font-family: var(--font-montserrat); font-size: 0.875rem; }
  &__hint {
    font-size: 0.75rem !important;
    margin-top: 0.25rem !important;
    color: var(--text-3);
  }
}

.upload-area {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

// Buttons
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &--primary {
    background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
    color: #171846;
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(33, 188, 251, 0.3);
    }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--border);
    color: var(--text-2);
    &:hover { background: rgba(255, 255, 255, 0.1); color: var(--text); }
  }

  &--logout {
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
  }
}

// Alert
.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-family: var(--font-montserrat);
  font-size: 0.875rem;

  &--error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  &__close {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
}

// Toast
.toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

// Spinner
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &--sm {
    width: 16px;
    height: 16px;
    border-width: 2px;
    display: inline-block;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
