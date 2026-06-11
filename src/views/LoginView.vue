<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'
import powerhouseLogo from '@/assets/logo/logo-powerhouse.png'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 50)
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const data = await authService.login({ email: email.value, password: password.value })
    localStorage.setItem('access_token', data.access_token)
    userStore.setUser({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role })
    if (data.user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } catch (e: any) {
    error.value = e?.message || 'Credenciales inválidas. Verifica tu email y contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-view" :class="{ 'is-loaded': isLoaded }">
    <!-- Premium Background -->
    <div class="premium-bg">
      <div class="premium-bg__orb premium-bg__orb--1"></div>
      <div class="premium-bg__orb premium-bg__orb--2"></div>
      <div class="premium-bg__grid"></div>
    </div>

    <!-- Main Container -->
    <div class="auth-container fade-in">
      
      <router-link to="/" class="back-link">
        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Volver al inicio</span>
      </router-link>

      <div class="glass-card">
        <div class="card-header">
          <div class="logo-wrapper">
            <img
              :src="powerhouseLogo"
              alt="PowerHouse Biotech"
              class="logo"
            />
          </div>
          <h1 class="title">Iniciar Sesión</h1>
          <p class="subtitle">Accede al portal de administración</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Correo Electrónico</label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="nombre@empresa.com"
                required
                autocomplete="email"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password" class="form-label">Contraseña</label>
            </div>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                class="form-input"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
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

          <transition name="fade">
            <div v-if="error" class="error-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ error }}</span>
            </div>
          </transition>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Acceder a mi cuenta</span>
          </button>
        </form>

      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 
  ScaleFront Architect: Premium Modern Auth UI
*/
.auth-view {
  position: relative;
  min-height: 100vh;
  background-color: #050505;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-montserrat, 'Inter', sans-serif);
  padding: 2rem 1rem;
  overflow: hidden;
}

/* --- Premium Background --- */
.premium-bg {
  position: absolute;
  inset: 0;
  z-index: 0;

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.3;
    animation: pulseOrb 15s infinite alternate;

    &--1 {
      width: 500px;
      height: 500px;
      background: #21BCFB;
      top: -100px;
      left: -100px;
    }

    &--2 {
      width: 600px;
      height: 600px;
      background: #1278F3;
      bottom: -200px;
      right: -100px;
      animation-delay: -5s;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 30%, transparent 100%);
  }
}

@keyframes pulseOrb {
  0% { transform: scale(1) translate(0, 0); opacity: 0.2; }
  100% { transform: scale(1.1) translate(20px, 20px); opacity: 0.4; }
}

/* --- Layout --- */
.auth-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #a1a1aa;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: color 0.3s ease;
  align-self: flex-start;

  &:hover {
    color: #ffffff;
    
    .icon {
      transform: translateX(-4px);
    }
  }

  .icon {
    transition: transform 0.3s ease;
  }
}

/* --- Glass Card --- */
.glass-card {
  background: rgba(15, 15, 20, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(33, 188, 251, 0.1);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-wrapper {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.logo {
  height: 42px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #a1a1aa;
  font-size: 0.95rem;
}

/* --- Form --- */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e4e4e7;
  letter-spacing: 0.01em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #71717a;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;

  &::placeholder {
    color: #52525b;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    outline: none;
    border-color: #21BCFB;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 4px rgba(33, 188, 251, 0.1);
  }
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #e4e4e7;
  }
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 0.875rem;
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #21BCFB 0%, #1278F3 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(18, 120, 243, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Initial Load Animation */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.is-loaded .fade-in {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 480px) {
  .glass-card {
    padding: 2rem 1.5rem;
  }
}
</style>