<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isMenuOpen = ref(false)

/** Admins y asesores entran al panel; solo el admin gestiona usuarios */
const STAFF_ROLES = ['admin', 'advisor']
const role = ref('')
const isAdmin = computed(() => role.value === 'admin')

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_email')
  userStore.clear()
  router.push('/login')
}

// Decode JWT sin llamadas API extras
function decodeToken(token: string) {
  try {
    const parts = token.split('.')
    return JSON.parse(atob(parts[1] || ''))
  } catch { return null }
}

onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (!token) { router.push('/login'); return }
  const payload = decodeToken(token)
  if (!payload || !STAFF_ROLES.includes(payload.accountType)) { router.push('/'); return }
  role.value = payload.accountType
  userStore.setUser({
    id: payload.userId,
    name: payload.email,
    email: payload.email,
  })
})
</script>

<template>
  <div class="admin-view">
    <!-- Premium Background -->
    <div class="premium-bg">
      <div class="premium-bg__orb premium-bg__orb--1"></div>
      <div class="premium-bg__orb premium-bg__orb--2"></div>
      <div class="premium-bg__grid"></div>
    </div>

    <nav class="admin-nav glass-panel">
      <div class="admin-nav__brand">
        <img src="@/assets/logo/logo-powerhouse.png" alt="PowerHouse Biotech" class="admin-nav__logo" />
        <button class="mobile-menu-btn" @click="isMenuOpen = !isMenuOpen">
          <i class="fa-solid fa-bars" v-if="!isMenuOpen"></i>
          <i class="fa-solid fa-xmark" v-else></i>
        </button>
      </div>

      <div class="admin-nav__menu" :class="{ 'admin-nav__menu--open': isMenuOpen }">
        <div class="admin-nav__tabs">
          <router-link to="/admin/studies" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-file-waveform"></i> Estudios
          </router-link>
          <router-link v-if="isAdmin" to="/admin/users" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-users-gear"></i> Usuarios
          </router-link>
          <router-link to="/admin/persons" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-user-injured"></i> Pacientes
          </router-link>
          <router-link to="/admin/metrics" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-chart-line"></i> Agentes CRM Bakano
          </router-link>
          <router-link to="/admin/info" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-bell"></i> Notificaciones
          </router-link>
        </div>
        <button class="btn-logout" @click="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Salir</span>
        </button>
      </div>
    </nav>

    <main class="admin-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="skeleton-loader">
                <div class="skeleton-header">
                  <div class="skeleton-title"></div>
                  <div class="skeleton-btn"></div>
                </div>
                <div class="skeleton-body glass-card">
                  <div class="skeleton-row" v-for="i in 5" :key="i"></div>
                </div>
              </div>
            </template>
          </Suspense>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.admin-view {
  min-height: 100vh;
  background-color: #050505;
  color: #ffffff;
  overflow-x: hidden;
  width: 100%;
  font-family: var(--font-montserrat, 'Inter', sans-serif);
  position: relative;
}

/* --- Premium Background --- */
.premium-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.25;
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
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }
}

@keyframes pulseOrb {
  0% { transform: scale(1) translate(0, 0); opacity: 0.15; }
  100% { transform: scale(1.1) translate(20px, 20px); opacity: 0.3; }
}

/* --- Glassmorphism Utils --- */
.glass-panel {
  background: rgba(15, 15, 20, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(15, 15, 20, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
}

/* ==================================================
   MOBILE FIRST (Default Styles)
   ================================================== */

.admin-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1rem;

  &__brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    z-index: 101;
  }

  &__logo {
    height: 38px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  &__menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0;
    gap: 2rem;
    
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(15px);
    z-index: 90;
    
    opacity: 0;
    visibility: hidden;
    transform: translateY(-20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &--open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  &__tabs {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    gap: 1rem;
  }
}

.mobile-menu-btn {
  display: block;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 100;
  position: relative;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #a1a1aa;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  border: 1px solid transparent;
  
  width: 100%;
  justify-content: center;
  padding: 1rem;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;

  i {
    font-size: 1.1em;
  }

  &--active {
    background: rgba(33, 188, 251, 0.1);
    border-color: rgba(33, 188, 251, 0.2);
    color: #21BCFB;
    box-shadow: inset 0 0 20px rgba(33, 188, 251, 0.05);
  }

  &:hover:not(.tab--active) {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }
}

.admin-main {
  position: relative;
  z-index: 10;
  padding: 1.5rem 1rem;
  max-width: 1280px;
  margin: 0 auto;
}

.btn-logout {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.3s ease;

  width: 100%;
  max-width: 300px;
  justify-content: center;
  padding: 1rem;
  font-size: 1.1rem;
  border-radius: 12px;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fef2f2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }
}

/* Skeleton Loading Styles */
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-title {
  width: 250px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-btn {
  width: 160px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-row {
  height: 60px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* ==================================================
   DESKTOP STYLES (min-width: 1025px)
   ================================================== */
@media (min-width: 1025px) {
  .admin-nav {
    padding: 1rem 3rem;
    
    &__brand {
      width: auto;
    }
    
    &__menu {
      position: static;
      flex-direction: row;
      justify-content: space-between;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      opacity: 1;
      visibility: visible;
      transform: none;
      flex: 1;
      margin-left: 4rem;
      gap: 2rem;
    }
    
    &__tabs {
      flex-direction: row;
      max-width: none;
      width: auto;
      gap: 0.75rem;
    }
  }
  
  .mobile-menu-btn {
    display: none;
  }
  
  .tab {
    width: auto;
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    border-radius: 10px;
    background: transparent;
    justify-content: flex-start;
  }
  
  .btn-logout {
    width: auto;
    max-width: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    border-radius: 10px;
    justify-content: flex-start;
  }
  
  .admin-main {
    padding: 2.5rem 2rem;
  }
}
</style>
