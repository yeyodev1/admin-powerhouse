<script setup lang="ts">
withDefaults(defineProps<{
  open?: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}>(), {
  open: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
        <div class="confirm-modal">
          <div class="confirm-modal__header">
            <h3 class="confirm-modal__title">{{ title || 'Confirmar acción' }}</h3>
          </div>
          <div class="confirm-modal__body">
            <p class="confirm-modal__message">{{ message }}</p>
          </div>
          <div class="confirm-modal__actions">
            <button class="btn btn-ghost" @click="emit('cancel')">
              {{ cancelText || 'Cancelar' }}
            </button>
            <button
              class="btn"
              :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="emit('confirm')"
            >
              {{ confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm-overlay {
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

.confirm-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  margin: auto;

  &__header {
    margin-bottom: 1rem;
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  &__body {
    margin-bottom: 1.5rem;
  }

  &__message {
    font-family: var(--font-montserrat);
    font-size: 0.95rem;
    color: var(--text-2);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .confirm-modal {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .confirm-modal {
    opacity: 0;
    transform: scale(0.9) translateY(16px);
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
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(33, 188, 251, 0.3); }
  }

  &-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
    &:hover { background: rgba(239, 68, 68, 0.25); }
  }

  &-ghost {
    background: transparent;
    color: var(--text-2);
    &:hover { color: var(--text); }
  }
}
</style>
