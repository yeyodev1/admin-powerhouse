<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { personService, type PersonData } from '@/services/person.service'
import PersonModal from '@/components/admin/PersonModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import FileUpload from '@/components/admin/FileUpload.vue'

const persons = ref<any[]>([])
const loading = ref(true)
const personModalOpen = ref(false)
const personToEdit = ref<any>(null)
const personConfirm = ref<{ open: boolean; personId: string; name: string } | null>(null)
const personFiles = ref<{ open: boolean; personId: string; files: any[] } | null>(null)

async function loadPersons() {
  loading.value = true
  try {
    persons.value = await personService.getPersons()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openPersonCreate() {
  personToEdit.value = null
  personModalOpen.value = true
}

function openPersonEdit(p: any) {
  personToEdit.value = p
  personModalOpen.value = true
}

async function submitPerson(data: PersonData) {
  try {
    if ((data as any)._id) await personService.updatePerson((data as any)._id, data)
    else await personService.createPerson(data)
    personModalOpen.value = false
    await loadPersons()
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al guardar persona')
  }
}

function confirmDeletePerson(p: any) {
  personConfirm.value = { open: true, personId: p._id, name: p.name }
}

async function executePersonDelete() {
  try {
    if (personConfirm.value) {
      await personService.deletePerson(personConfirm.value.personId)
      personConfirm.value = null
      await loadPersons()
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar persona')
  }
}

function openFiles(p: any) {
  personFiles.value = { open: true, personId: p._id, files: p.medicalFiles || [] }
}

async function onFileUploaded(file: { url: string; filename: string; type: string }) {
  try {
    if (personFiles.value) {
      const updated = await personService.uploadFile(personFiles.value.personId, file)
      personFiles.value.files = updated.medicalFiles
      await loadPersons()
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al subir archivo')
  }
}

async function onFileDeleted(fileId: string) {
  try {
    if (personFiles.value) {
      await personService.deleteFile(personFiles.value.personId, fileId)
      personFiles.value.files = personFiles.value.files.filter((f: any) => f._id !== fileId)
      await loadPersons()
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar archivo')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  loadPersons()
})
</script>

<template>
  <div class="admin-persons">
    <div class="tab-header">
      <h2 class="tab-title">Gestión de Pacientes</h2>
      <button class="btn btn-primary" @click="openPersonCreate">+ Agregar paciente</button>
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
        <tbody v-if="loading">
          <tr v-for="i in 5" :key="'skel-' + i">
            <td><div class="skeleton-line skeleton-line--short"></div></td>
            <td><div class="skeleton-line skeleton-line--long"></div></td>
            <td><div class="skeleton-line skeleton-line--medium"></div></td>
            <td><div class="skeleton-line skeleton-line--medium"></div></td>
            <td><div class="skeleton-line skeleton-line--actions"></div></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="p in persons" :key="p._id">
            <td>
              <div class="person-info">
                <div class="avatar-placeholder">{{ p.name.charAt(0).toUpperCase() }}</div>
                <span class="person-name">{{ p.name }}</span>
              </div>
            </td>
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
            <td colspan="5" class="empty">
              <div class="empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>No hay pacientes registrados</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PersonModal
      :open="personModalOpen"
      :person="personToEdit"
      @close="personModalOpen = false"
      @submit="submitPerson"
    />

    <ConfirmModal
      v-if="personConfirm"
      :open="personConfirm.open"
      :message="`¿Eliminar a ${personConfirm.name}?`"
      :variant="'danger'"
      @confirm="executePersonDelete"
      @cancel="personConfirm = null"
    />

    <div v-if="personFiles?.open" class="modal-overlay" @click.self="personFiles = null">
      <div class="modal files-modal">
        <div class="modal__header">
          <h3 class="modal__title">Archivos Médicos</h3>
          <button class="modal__close" @click="personFiles = null">✕</button>
        </div>
        <div class="modal__body">
          <FileUpload
            :personId="personFiles.personId"
            :files="personFiles.files"
            @uploaded="onFileUploaded"
            @deleted="onFileDeleted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-persons {
  animation: fadeIn 0.3s ease;
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
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-montserrat);

  th {
    text-align: left;
    padding: 1rem 1.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 1rem 1.25rem;
    font-size: 0.875rem;
    color: var(--text-2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
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

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-2);
  padding: 0.375rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { border-color: var(--primary); color: var(--primary); background: rgba(33, 188, 251, 0.05); }
  &--danger:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%);
  color: #171846;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(33, 188, 251, 0.3); }
}

.person-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.person-name {
  font-weight: 600;
  color: var(--text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  i {
    font-size: 2rem;
    color: var(--text-3);
  }
}

/* Skeleton Styles */
.skeleton-line {
  height: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  animation: pulse 1.5s infinite ease-in-out;
  
  &--short { width: 120px; }
  &--medium { width: 150px; }
  &--long { width: 200px; }
  &--actions { width: 120px; height: 32px; border-radius: 6px; }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
