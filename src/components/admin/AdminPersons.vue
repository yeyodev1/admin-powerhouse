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
    alert(e?.response?.data?.message || 'Error al guardar paciente')
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
    alert(e?.response?.data?.message || 'Error al eliminar paciente')
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
  <div class="admin-persons fade-in">
    <div class="tab-header">
      <div class="header-titles">
        <h2 class="tab-title">Gestión de Pacientes</h2>
        <p class="tab-subtitle">Directorio e historial de tratamientos</p>
      </div>
      <button class="btn-primary" @click="openPersonCreate">
        <i class="fa-solid fa-plus"></i>
        <span>Agregar paciente</span>
      </button>
    </div>

    <div class="table-wrap glass-card">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Nombre del Paciente</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Fecha de registro</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="i in 5" :key="'skel-' + i">
            <td><div class="skeleton-line skeleton-line--long"></div></td>
            <td><div class="skeleton-line skeleton-line--medium"></div></td>
            <td><div class="skeleton-line skeleton-line--medium"></div></td>
            <td><div class="skeleton-line skeleton-line--short"></div></td>
            <td class="text-right"><div class="skeleton-line skeleton-line--actions ml-auto"></div></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="p in persons" :key="p._id" class="table-row">
            <td>
              <div class="person-info">
                <div class="avatar-placeholder">{{ p.name.charAt(0).toUpperCase() }}</div>
                <span class="person-name">{{ p.name }}</span>
              </div>
            </td>
            <td class="text-secondary">{{ p.email || '—' }}</td>
            <td class="text-secondary">{{ p.phone || '—' }}</td>
            <td><span class="date-pill">{{ formatDate(p.createdAt) }}</span></td>
            <td class="actions text-right">
              <button class="action-btn" title="Editar" @click="openPersonEdit(p)">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="action-btn action-btn--accent" title="Archivos Médicos" @click="openFiles(p)">
                <i class="fa-solid fa-file-medical"></i>
              </button>
              <button class="action-btn action-btn--danger" title="Eliminar" @click="confirmDeletePerson(p)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="!persons.length">
            <td colspan="5">
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
      :message="`¿Eliminar al paciente ${personConfirm.name}?`"
      :variant="'danger'"
      @confirm="executePersonDelete"
      @cancel="personConfirm = null"
    />

    <transition name="modal-fade">
      <div v-if="personFiles?.open" class="modal-overlay" @click.self="personFiles = null">
        <div class="modal files-modal glass-card">
          <div class="modal__header">
            <h3 class="modal__title">
              <i class="fa-solid fa-folder-open text-primary"></i> Archivos Médicos
            </h3>
            <button class="modal__close" @click="personFiles = null"><i class="fa-solid fa-xmark"></i></button>
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
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.admin-persons {
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
}

.tab-title {
  font-family: var(--font-montserrat);
  font-size: 2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
}

.tab-subtitle {
  color: #a1a1aa;
  font-size: 1rem;
  margin: 0;
}

.glass-card {
  background: rgba(15, 15, 20, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.table-wrap {
  overflow-x: auto;
}

.premium-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-family: var(--font-montserrat);

  th {
    text-align: left;
    padding: 0 1.5rem 1rem 1.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #71717a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .text-right {
    text-align: right;
  }
}

.table-row {
  transition: all 0.2s ease;

  td {
    padding: 1.25rem 1.5rem;
    background: rgba(255, 255, 255, 0.015);
    vertical-align: middle;
    border-top: 1px solid rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);

    &:first-child { border-left: 1px solid rgba(255, 255, 255, 0.02); border-radius: 12px 0 0 12px; }
    &:last-child { border-right: 1px solid rgba(255, 255, 255, 0.02); border-radius: 0 12px 12px 0; }
  }

  &:hover {
    transform: scale(1.005);
    td { background: rgba(255, 255, 255, 0.04); }
  }
}

.text-secondary {
  color: #a1a1aa;
}

.date-pill {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.85rem;
  color: #e4e4e7;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.action-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #a1a1aa;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #21BCFB;
    color: #21BCFB;
    background: rgba(33, 188, 251, 0.1);
    transform: translateY(-2px);
  }
  
  &--accent:hover {
    border-color: #10b981;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  &--danger:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #21BCFB 0%, #1278F3 100%);
  color: #ffffff;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(18, 120, 243, 0.35);
  }
}

.person-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.person-name {
  font-weight: 600;
  color: #ffffff;
  font-size: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 0;
  
  i {
    font-size: 3rem;
    color: #52525b;
  }
  
  p {
    color: #a1a1aa;
    font-size: 1.1rem;
    margin: 0;
  }
}

/* Skeleton Styles */
.skeleton-line {
  height: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  animation: pulse 1.5s infinite ease-in-out;
  
  &--short { width: 100px; }
  &--medium { width: 140px; }
  &--long { width: 220px; }
  &--actions { width: 120px; height: 36px; border-radius: 8px; }
}
.ml-auto { margin-left: auto; }

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.files-modal {
  width: 90%;
  max-width: 600px;
  padding: 2.5rem;
  margin: auto;
}

.modal {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  &__close {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #a1a1aa;
    font-size: 1.2rem;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover { 
      color: #ffffff;
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
    }
  }
  &__body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
.text-primary { color: #21BCFB; }

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
  .files-modal { transition: transform 0.3s ease; }
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .files-modal { transform: scale(0.95); }
}

@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .btn-primary { width: 100%; justify-content: center; }
  .files-modal { padding: 1.5rem; }
}
</style>
