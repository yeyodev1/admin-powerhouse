<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  loading.value = true
  try {
    const data = await authService.register({ name: name.value, email: email.value, password: password.value })
    localStorage.setItem('access_token', data.access_token)
    userStore.setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
    router.push('/')
  } catch (e: any) {
    error.value = e?.message || 'Error al crear la cuenta. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-view">
    <!-- Background -->
    <div class="auth-bg">
      <video autoplay muted loop playsinline class="auth-bg__video">
        <source src="https://icdlabs.in/immune-internal/wp-content/themes/immuneel/assets/videos/DNA.mp4" type="video/mp4" />
      </video>
      <div class="auth-bg__overlay"></div>
    </div>

    <!-- Back to Home -->
    <router-link to="/" class="back-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Volver al inicio
    </router-link>

    <!-- Register Card -->
    <div class="auth-card">
      <div class="auth-card__header">
        <img
          src="https://powerhousebiotech.com/wp-content/uploads/2024/01/logo.png"
          alt="PowerHouse Biotech"
          class="auth-card__logo"
        />
        <h1 class="auth-card__title">Crear Cuenta</h1>
        <p class="auth-card__subtitle">Completa el formulario para registrarte</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name" class="form-label">Nombre Completo</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Tu nombre"
              required
              autocomplete="name"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Correo Electrónico</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              autocomplete="email"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Contraseña</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              required
              autocomplete="new-password"
              class="form-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repite la contraseña"
              required
              autocomplete="new-password"
              class="form-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="!showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Crear Cuenta</span>
        </button>
      </form>

      <div class="auth-card__footer">
        <p>¿Ya tienes cuenta? <router-link to="/login" class="auth-link">Iniciar sesión</router-link></p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;

  &__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(23, 24, 70, 0.92) 0%, rgba(40, 54, 69, 0.88) 100%);
  }
}

.back-link {
  position: relative;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-2);
  text-decoration: none;
  font-family: var(--font-montserrat);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
}

.auth-card {
  position: relative;
  z-index: 10;
  background: rgba(30, 34, 96, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);

  &__header {
    text-align: center;
    margin-bottom: 2rem;
  }

  &__logo {
    width: 160px;
    margin-bottom: 1.5rem;
    filter: brightness(0) invert(1);
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  &__subtitle {
    font-size: 0.9rem;
    color: var(--text-3);
    font-family: var(--font-montserrat);
  }

  &__footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-3);
    font-family: var(--font-montserrat);

    p {
      margin: 0;
    }
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  letter-spacing: 0.02em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-3);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-family: var(--font-montserrat);
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--text-3);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(33, 188, 251, 0.1);
  }
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.875rem;
  font-family: var(--font-montserrat);
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
  color: #171846;
  border: none;
  border-radius: 10px;
  font-family: var(--font-montserrat);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(33, 188, 251, 0.35);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(23, 24, 70, 0.3);
  border-top-color: #171846;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: var(--accent);
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
    border-radius: 12px;
  }
}
</style>