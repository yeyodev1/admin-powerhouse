<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PersonData } from '@/services/person.service'

const props = defineProps<{
  open: boolean
  person?: PersonData & { _id: string } | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: PersonData]
}>()

const name = ref('')
const email = ref('')
const phone = ref('')
const dateOfBirth = ref('')
const address = ref('')
const notes = ref('')
const error = ref('')

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    name.value = props.person?.name || ''
    email.value = props.person?.email || ''
    phone.value = props.person?.phone || ''
    dateOfBirth.value = props.person?.dateOfBirth || ''
    address.value = props.person?.address || ''
    notes.value = props.person?.notes || ''
    error.value = ''
  }
})

function submit() {
  error.value = ''
  if (!name.value.trim()) { error.value = 'Nombre requerido'; return }
  emit('submit', {
    name: name.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    dateOfBirth: dateOfBirth.value,
    address: address.value.trim(),
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="open" class="modal-overlay" @click.self="emit('close')">
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">{{ person ? 'Editar persona' : 'Nueva persona' }}</h3>
            <button class="modal__close" @click="emit('close')">✕</button>
          </div>

          <form class="modal__body" @submit.prevent="submit">
            <div class="form-group">
              <label class="form-label">Nombre completo *</label>
              <input v-model="name" type="text" class="form-input" placeholder="Nombre completo" required />
            </div>

            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input v-model="email" type="email" class="form-input" placeholder="correo@ejemplo.com" />
            </div>

            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input v-model="phone" type="tel" class="form-input" placeholder="+XX XXXXXXXXX" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha de nacimiento</label>
              <input v-model="dateOfBirth" type="date" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input v-model="address" type="text" class="form-input" placeholder="Dirección" />
            </div>

            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea v-model="notes" class="form-input form-textarea" rows="3" placeholder="Notas médicas, antecedentes..." />
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <div class="modal__actions">
              <button type="button" class="btn btn-ghost" @click="emit('close')">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                {{ person ? 'Guardar cambios' : 'Crear persona' }}
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
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 99999;
  overflow-y: auto;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  .modal {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  margin: auto;

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
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
</style>
