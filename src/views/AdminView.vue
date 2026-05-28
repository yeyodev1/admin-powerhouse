<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '@/services/user.service'
import { personService, type PersonData } from '@/services/person.service'
import { useUserStore } from '@/stores/user'
import UserModal from '@/components/admin/UserModal.vue'
import PersonModal from '@/components/admin/PersonModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import FileUpload from '@/components/admin/FileUpload.vue'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<'users' | 'persons' | 'info'>('users')

// ── Users ─────────────────────────────────────────────
const users = ref<any[]>([])
const userModalOpen = ref(false)
const userToEdit = ref<any>(null)
const userConfirm = ref<{ open: boolean; userId: string; name: string } | null>(null)

async function loadUsers() {
  try { users.value = await userService.getUsers() } catch(e) { console.error(e) }
}

function openUserCreate() { userToEdit.value = null; userModalOpen.value = true }
function openUserEdit(u: any) { userToEdit.value = u; userModalOpen.value = true }

async function submitUser(data: any) {
  try {
    if (data.id) await userService.updateUser(data.id, data)
    else await userService.createUser(data)
    userModalOpen.value = false
    await loadUsers()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al guardar usuario')
  }
}

function confirmDeleteUser(u: any) { userConfirm.value = { open: true, userId: u._id, name: u.name } }

async function executeUserDelete() {
  try {
    await userService.deleteUser(userConfirm.value!.userId)
    userConfirm.value = null
    await loadUsers()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar usuario')
  }
}

// ── Persons ───────────────────────────────────────────
const persons = ref<any[]>([])
const personModalOpen = ref(false)
const personToEdit = ref<any>(null)
const personConfirm = ref<{ open: boolean; personId: string; name: string } | null>(null)
const personFiles = ref<{ open: boolean; personId: string; files: any[] } | null>(null)

async function loadPersons() {
  try { persons.value = await personService.getPersons() } catch(e) { console.error(e) }
}

function openPersonCreate() { personToEdit.value = null; personModalOpen.value = true }
function openPersonEdit(p: any) { personToEdit.value = p; personModalOpen.value = true }

async function submitPerson(data: PersonData) {
  try {
    if ((data as any)._id) await personService.updatePerson((data as any)._id, data)
    else await personService.createPerson(data)
    personModalOpen.value = false
    await loadPersons()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al guardar persona')
  }
}

function confirmDeletePerson(p: any) { personConfirm.value = { open: true, personId: p._id, name: p.name } }

async function executePersonDelete() {
  try {
    await personService.deletePerson(personConfirm.value!.personId)
    personConfirm.value = null
    await loadPersons()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar persona')
  }
}

function openFiles(p: any) {
  personFiles.value = { open: true, personId: p._id, files: p.medicalFiles || [] }
}

async function onFileUploaded(file: { url: string; filename: string; type: string }) {
  try {
    const updated = await personService.uploadFile(personFiles.value!.personId, file)
    personFiles.value!.files = updated.medicalFiles
    await loadPersons()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al subir archivo')
  }
}

async function onFileDeleted(fileId: string) {
  try {
    await personService.deleteFile(personFiles.value!.personId, fileId)
    personFiles.value!.files = personFiles.value!.files.filter((f: any) => f._id !== fileId)
    await loadPersons()
  } catch(e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar archivo')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_email')
  userStore.clear()
  router.push('/login')
}

// Decode JWT without API call
function decodeToken(token: string) {
  try {
    const parts = token.split('.')
    return JSON.parse(atob(parts[1] || ''))
  } catch { return null }
}

// ── Auth check ─────────────────────────────────────────
onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (!token) { router.push('/login'); return }
  const payload = decodeToken(token)
  if (!payload) { router.push('/login'); return }
  if (payload.accountType !== 'admin') { router.push('/'); return }
  userStore.setUser({
    id: payload.userId,
    name: payload.email,
    email: payload.email,
  })
  loadUsers()
  loadPersons()
})
</script>

<template>
  <div class="admin-view">
    <nav class="admin-nav">
      <img src="https://powerhousebiotech.com/wp-content/uploads/2024/01/logo.png" alt="PowerHouse Biotech" class="admin-nav__logo" />
      <div class="admin-nav__tabs">
        <button :class="['tab', { 'tab--active': activeTab === 'users' }]" @click="activeTab = 'users'">Usuarios</button>
        <button :class="['tab', { 'tab--active': activeTab === 'persons' }]" @click="activeTab = 'persons'">Personas</button>
        <button :class="['tab', { 'tab--active': activeTab === 'info' }]" @click="activeTab = 'info'">Info</button>
      </div>
      <button class="btn btn-logout" @click="logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        Salir
      </button>
    </nav>

    <main class="admin-main">
      <!-- ── Users Tab ── -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="tab-header">
          <h2 class="tab-title">Usuarios</h2>
          <button class="btn btn-primary" @click="openUserCreate">+ Agregar usuario</button>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Interno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u._id">
                <td>{{ u.name }}</td>
                <td>{{ u.email }}</td>
                <td><span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">{{ u.role }}</span></td>
                <td>
                  <span v-if="u.isInternal" class="badge badge-internal">
                    <i class="fa-solid fa-lock"></i> Interno
                  </span>
                  <span v-else class="badge badge-external">Ext.</span>
                </td>
                <td class="actions">
                  <button class="action-btn" title="Editar" @click="openUserEdit(u)">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="action-btn action-btn--danger" title="Eliminar" @click="confirmDeleteUser(u)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="5" class="empty">No hay usuarios</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Persons Tab ── -->
      <div v-if="activeTab === 'persons'" class="tab-content">
        <div class="tab-header">
          <h2 class="tab-title">Personas</h2>
          <button class="btn btn-primary" @click="openPersonCreate">+ Agregar persona</button>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Fecha creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in persons" :key="p._id">
                <td>{{ p.name }}</td>
                <td>{{ p.email || '—' }}</td>
                <td>{{ p.phone || '—' }}</td>
                <td>{{ formatDate(p.createdAt) }}</td>
                <td class="actions">
                  <button class="action-btn" title="Editar" @click="openPersonEdit(p)">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="action-btn" title="Archivos" @click="openFiles(p)">
                    <i class="fa-solid fa-folder-open"></i>
                  </button>
                  <button class="action-btn action-btn--danger" title="Eliminar" @click="confirmDeletePerson(p)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!persons.length">
                <td colspan="5" class="empty">No hay personas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Info Tab ── -->
      <div v-if="activeTab === 'info'" class="tab-content">
        <div class="info-banner">
          <div class="info-banner__icon">📧</div>
          <h2 class="info-banner__title">Próximamente</h2>
          <p class="info-banner__text">Notificaciones por correo electrónico están en desarrollo. Muy pronto podrás enviar emails directamente a tus pacientes.</p>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <UserModal
      :open="userModalOpen"
      :user="userToEdit"
      @close="userModalOpen = false"
      @submit="submitUser"
    />

    <PersonModal
      :open="personModalOpen"
      :person="personToEdit"
      @close="personModalOpen = false"
      @submit="submitPerson"
    />

    <ConfirmModal
      v-if="userConfirm"
      :open="userConfirm.open"
      :message="`¿Eliminar al usuario ${userConfirm.name}?`"
      :variant="'danger'"
      @confirm="executeUserDelete"
      @cancel="userConfirm = null"
    />

    <ConfirmModal
      v-if="personConfirm"
      :open="personConfirm.open"
      :message="`¿Eliminar a ${personConfirm.name}?`"
      :variant="'danger'"
      @confirm="executePersonDelete"
      @cancel="personConfirm = null"
    />

    <!-- Files Modal -->
    <div v-if="personFiles?.open" class="modal-overlay" @click.self="personFiles = null">
      <div class="modal files-modal">
        <div class="modal__header">
          <h3 class="modal__title">Archivos médicos</h3>
          <button class="modal__close" @click="personFiles = null">✕</button>
        </div>
        <div class="modal__body">
          <FileUpload
            :personId="personFiles!.personId"
            :files="personFiles!.files"
            @uploaded="onFileUploaded"
            @deleted="onFileDeleted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-view {
  min-height: 100vh;
  background: var(--bg);
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);

  &__logo {
    height: 40px;
    filter: brightness(0) invert(1);
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    flex: 1;
  }
}

.tab {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-2);
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &--active {
    background: rgba(33, 188, 251, 0.1);
    border-color: var(--primary);
    color: var(--primary);
  }

  &:hover:not(.tab--active) {
    color: var(--text);
  }
}

.admin-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tab-title {
  font-family: var(--font-montserrat);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-montserrat);

  th {
    text-align: left;
    padding: 0.875rem 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 1rem;
    font-size: 0.875rem;
    color: var(--text-2);
    border-bottom: 1px solid rgba(33, 188, 251, 0.05);
  }

  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .empty {
    text-align: center;
    color: var(--text-3);
    padding: 2rem;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;

  &-admin {
    background: rgba(33, 188, 251, 0.15);
    color: var(--primary);
  }

  &-user {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-3);
  }

  &-internal {
    background: rgba(239, 68, 68, 0.12);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  &-external {
    background: rgba(16, 185, 129, 0.1);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-2);
  font-family: var(--font-montserrat);
  font-size: 0.8rem;
  padding: 0.375rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  i { font-size: 0.8rem; }

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &--danger:hover {
    border-color: #ef4444;
    color: #fca5a5;
  }
}

.info-banner {
  background: linear-gradient(135deg, rgba(33, 188, 251, 0.08) 0%, rgba(18, 120, 243, 0.08) 100%);
  border: 1px solid rgba(33, 188, 251, 0.2);
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;

  &__icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 1rem;
  }

  &__text {
    font-family: var(--font-montserrat);
    font-size: 1rem;
    color: var(--text-2);
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.files-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 560px;
}

.modal {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: var(--text-3);
    font-size: 1.2rem;
    cursor: pointer;
    &:hover { color: var(--text); }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &-primary {
    background: linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%);
    color: #171846;
    &:hover { transform: translateY(-1px); }
  }

  &-ghost {
    background: transparent;
    color: var(--text-2);
    &:hover { color: var(--text); }
  }

  &-sm {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .admin-nav {
    flex-wrap: wrap;
    gap: 1rem;
  }
  .admin-main { padding: 1rem; }
}
</style>
