<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isMenuOpen = ref(false)

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
  if (!payload || payload.accountType !== 'admin') { router.push('/'); return }
  userStore.setUser({
    id: payload.userId,
    name: payload.email,
    email: payload.email,
  })
})
</script>

<template>
  <div class="admin-view">
    <nav class="admin-nav">
      <div class="admin-nav__brand">
        <img src="@/assets/logo/logo-powerhouse.png" alt="PowerHouse Biotech" class="admin-nav__logo" />
        <button class="mobile-menu-btn" @click="isMenuOpen = !isMenuOpen">
          <i class="fa-solid fa-bars" v-if="!isMenuOpen"></i>
          <i class="fa-solid fa-xmark" v-else></i>
        </button>
      </div>

      <div class="admin-nav__menu" :class="{ 'admin-nav__menu--open': isMenuOpen }">
        <div class="admin-nav__tabs">
          <router-link to="/admin/users" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-users-gear"></i> Usuarios
          </router-link>
          <router-link to="/admin/persons" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-user-injured"></i> Pacientes
          </router-link>
          <router-link to="/admin/metrics" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-chart-line"></i> Agentes GHL
          </router-link>
          <router-link to="/admin/info" class="tab" active-class="tab--active" @click="isMenuOpen = false">
            <i class="fa-solid fa-bell"></i> Notificaciones
          </router-link>
        </div>
        <button class="btn btn-logout" @click="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          Salir
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
                <div class="skeleton-body">
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
  background: var(--bg);
  overflow-x: hidden; /* Prevent horizontal scrolling from breaking layout */
  width: 100%;
}

/* ==================================================
   MOBILE FIRST (Default Styles)
   ================================================== */

.admin-nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0; /* Use left/right instead of width 100% to fill screen */
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
    height: 40px;
    object-fit: contain;
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
    background: rgba(13, 17, 54, 0.95);
    backdrop-filter: blur(15px);
    z-index: 90;
    
    opacity: 0;
    visibility: hidden;
    transform: translateY(-20px);
    transition: all 0.3s ease;

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
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 100;
  position: relative;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-2);
  font-family: var(--font-montserrat);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border: 1px solid transparent;
  
  width: 100%;
  justify-content: center;
  padding: 1rem;
  font-size: 1.1rem;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;

  &--active {
    background: rgba(33, 188, 251, 0.1);
    border-color: var(--primary);
    color: var(--primary);
  }

  &:hover:not(.tab--active) {
    color: var(--text);
    background: rgba(255, 255, 255, 0.02);
  }
}

.admin-main {
  padding: 1rem;
  padding-top: 90px;
  max-width: 1200px;
  margin: 0 auto;
}

.btn-logout {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-family: var(--font-montserrat);
  transition: all 0.2s ease;

  width: 100%;
  max-width: 300px;
  justify-content: center;
  padding: 1rem;
  font-size: 1.1rem;
  border-radius: 12px;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #fef2f2;
    transform: translateY(-1px);
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
  height: 32px;
  background: var(--border);
  border-radius: 6px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-btn {
  width: 140px;
  height: 40px;
  background: var(--border);
  border-radius: 8px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-body {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-row {
  height: 45px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ==================================================
   DESKTOP STYLES (min-width: 1025px)
   ================================================== */
@media (min-width: 1025px) {
  .admin-nav {
    position: sticky;
    padding: 1rem 2rem;
    
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
      margin-left: 3rem;
      gap: 2rem;
    }
    
    &__tabs {
      flex-direction: row;
      max-width: none;
      width: auto;
      gap: 0.5rem;
    }
  }
  
  .mobile-menu-btn {
    display: none;
  }
  
  .tab {
    width: auto;
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 8px;
    background: transparent;
    justify-content: flex-start;
  }
  
  .btn-logout {
    width: auto;
    max-width: none;
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 8px;
    justify-content: flex-start;
  }
  
  .admin-main {
    padding: 2rem;
  }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
