<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  open: boolean
  user?: { _id: string; name: string; email: string; role: string; isInternal?: boolean } | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { name: string; email: string; password: string; role: string; isInternal: boolean }]
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref('user')
const isInternal = ref(false)
const error = ref('')

watchEffect(() => {
  if (props.open) {
    name.value = props.user?.name ?? ''
    email.value = props.user?.email ?? ''
    password.value = ''
    role.value = props.user?.role ?? 'user'
    isInternal.value = props.user?.isInternal ?? false
    error.value = ''
  }
}, { flush: 'sync' })

function submit() {
  error.value = ''
  if (!name.value.trim()) { error.value = 'Nombre requerido'; return }
  if (!email.value.trim()) { error.value = 'Email requerido'; return }
  if (!props.user && !password.value) { error.value = 'Contraseña requerida'; return }
  const data: Record<string, unknown> = {
    name: name.value.trim(),
    email: email.value.trim(),
    role: role.value,
    isInternal: isInternal.value,
  }
  if (password.value) data.password = password.value
  if (props.user?._id) data.id = props.user._id
  emit('submit', data as any)
}
</script>

<template>
  <div v-if="open" class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">{{ user ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
        <button class="modal__close" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form class="modal__body" @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input v-model="name" type="text" class="form-input" placeholder="Nombre" required />
        </div>

        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input v-model="email" type="email" class="form-input" placeholder="correo@ejemplo.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">{{ user ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}</label>
          <input v-model="password" type="password" class="form-input" :placeholder="user ? '••••••••' : 'Mínimo 8 caracteres'" :required="!user" />
        </div>

        <div class="form-group">
          <label class="form-label">Rol</label>
          <select v-model="role" class="form-input">
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div class="toggle-group">
          <div class="toggle-info">
            <span class="toggle-label">Usuario interno</span>
            <span class="toggle-hint">Los agentes internos no aparecen como pacientes</span>
          </div>
          <button
            type="button"
            class="toggle"
            :class="{ 'toggle--on': isInternal }"
            @click="isInternal = !isInternal"
            :aria-pressed="isInternal"
          >
            <span class="toggle__thumb"></span>
          </button>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal__actions">
          <button type="button" class="btn btn-ghost" @click="emit('close')">
            <i class="fa-solid fa-xmark"></i>
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-check"></i>
            {{ user ? 'Guardar cambios' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 480px;

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
    font-size: 1rem;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    &:hover { color: var(--text); }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: var(--font-montserrat);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-2);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-montserrat);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  option {
    background: var(--surface);
    color: var(--text);
  }
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.875rem;
  font-family: var(--font-montserrat);
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
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

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
}

.toggle-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toggle-label {
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}

.toggle-hint {
  font-family: var(--font-montserrat);
  font-size: 0.7rem;
  color: var(--text-3);
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;

  &--on {
    background: rgba(33, 188, 251, 0.4);
    border-color: var(--primary);
  }

  &__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--text-3);
    border-radius: 50%;
    transition: transform 0.2s, background 0.2s;
  }

  &--on &__thumb {
    transform: translateX(20px);
    background: var(--primary);
  }
}
</style>
