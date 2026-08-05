<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/user.service'
import UserModal from '@/components/admin/UserModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'

const users = ref<any[]>([])
const loading = ref(true)
const userModalOpen = ref(false)
const userToEdit = ref<any>(null)
const userConfirm = ref<{ open: boolean; userId: string; name: string } | null>(null)

async function loadUsers() {
  loading.value = true
  try {
    users.value = await userService.getUsers()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openUserCreate() {
  userToEdit.value = null
  userModalOpen.value = true
}

function openUserEdit(u: any) {
  userToEdit.value = u
  userModalOpen.value = true
}

async function submitUser(data: any) {
  try {
    if (data.id) await userService.updateUser(data.id, data)
    else await userService.createUser(data)
    userModalOpen.value = false
    await loadUsers()
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al guardar usuario')
  }
}

function confirmDeleteUser(u: any) {
  userConfirm.value = { open: true, userId: u._id, name: u.name }
}

async function executeUserDelete() {
  try {
    if (userConfirm.value) {
      await userService.deleteUser(userConfirm.value.userId)
      userConfirm.value = null
      await loadUsers()
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar usuario')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin-users fade-in">
    <div class="tab-header">
      <div class="header-titles">
        <h2 class="tab-title">Usuarios del Sistema</h2>
        <p class="tab-subtitle">Administra los accesos y roles internos</p>
      </div>
      <button class="btn-primary" @click="openUserCreate">
        <i class="fa-solid fa-plus"></i>
        <span>Agregar usuario</span>
      </button>
    </div>

    <div class="table-wrap glass-card">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acceso</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="i in 5" :key="'skel-' + i">
            <td><div class="skeleton-line skeleton-line--short"></div></td>
            <td><div class="skeleton-line skeleton-line--long"></div></td>
            <td><div class="skeleton-line skeleton-line--badge"></div></td>
            <td><div class="skeleton-line skeleton-line--badge"></div></td>
            <td class="text-right"><div class="skeleton-line skeleton-line--actions ml-auto"></div></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="u in users" :key="u._id" class="table-row">
            <td>
              <div class="user-info">
                <div class="avatar-placeholder">{{ u.name.charAt(0).toUpperCase() }}</div>
                <span class="user-name">{{ u.name }}</span>
              </div>
            </td>
            <td class="text-secondary">{{ u.email }}</td>
            <td><span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-user'">{{ u.role }}</span></td>
            <td>
              <span v-if="u.isInternal" class="badge badge-internal">
                <i class="fa-solid fa-lock"></i> Interno
              </span>
              <span v-else class="badge badge-external">Ext.</span>
            </td>
            <td class="actions text-right">
              <button class="action-btn" title="Editar" @click="openUserEdit(u)">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="action-btn action-btn--danger" title="Eliminar" @click="confirmDeleteUser(u)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="5">
              <div class="empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>No hay usuarios registrados</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserModal
      :open="userModalOpen"
      :user="userToEdit"
      @close="userModalOpen = false"
      @submit="submitUser"
    />

    <ConfirmModal
      :open="!!userConfirm"
      :message="userConfirm ? `¿Eliminar al usuario ${userConfirm.name}?` : ''"
      :variant="'danger'"
      @confirm="executeUserDelete"
      @cancel="userConfirm = null"
    />
  </div>
</template>

<style lang="scss" scoped>
.admin-users {
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

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.05em;

  &-admin { background: rgba(33, 188, 251, 0.15); color: #21BCFB; }
  &-user { background: rgba(255, 255, 255, 0.05); color: #a1a1aa; }
  &-internal { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
  &-external { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; }
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

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(33, 188, 251, 0.2) 0%, rgba(18, 120, 243, 0.2) 100%);
  border: 1px solid rgba(33, 188, 251, 0.3);
  color: #21BCFB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.user-name {
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
  
  &--short { width: 120px; }
  &--long { width: 200px; }
  &--badge { width: 80px; height: 28px; border-radius: 8px; }
  &--actions { width: 80px; height: 36px; border-radius: 8px; }
}
.ml-auto { margin-left: auto; }

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .btn-primary { width: 100%; justify-content: center; }
}
</style>
