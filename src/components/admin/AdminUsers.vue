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
  <div class="admin-users">
    <div class="tab-header">
      <h2 class="tab-title">Usuarios del Sistema</h2>
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
        <tbody v-if="loading">
          <tr v-for="i in 5" :key="'skel-' + i">
            <td><div class="skeleton-line skeleton-line--short"></div></td>
            <td><div class="skeleton-line skeleton-line--long"></div></td>
            <td><div class="skeleton-line skeleton-line--badge"></div></td>
            <td><div class="skeleton-line skeleton-line--badge"></div></td>
            <td><div class="skeleton-line skeleton-line--actions"></div></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="u in users" :key="u._id">
            <td>
              <div class="user-info">
                <div class="avatar-placeholder">{{ u.name.charAt(0).toUpperCase() }}</div>
                <span class="user-name">{{ u.name }}</span>
              </div>
            </td>
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
            <td colspan="5" class="empty">
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
      v-if="userConfirm"
      :open="userConfirm.open"
      :message="`¿Eliminar al usuario ${userConfirm.name}?`"
      :variant="'danger'"
      @confirm="executeUserDelete"
      @cancel="userConfirm = null"
    />
  </div>
</template>

<style lang="scss" scoped>
.admin-users {
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

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;

  &-admin { background: rgba(33, 188, 251, 0.15); color: var(--primary); }
  &-user { background: rgba(255, 255, 255, 0.05); color: var(--text-3); }
  &-internal { background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.25); }
  &-external { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.2); }
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(33, 188, 251, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.user-name {
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
  &--long { width: 200px; }
  &--badge { width: 60px; height: 24px; border-radius: 50px; }
  &--actions { width: 80px; height: 32px; border-radius: 6px; }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
