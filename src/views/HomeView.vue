<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import powerhouseLogo from '@/assets/logo/logo-powerhouse.png'

const router = useRouter()
const userStore = useUserStore()

function isLoggedIn(): boolean {
  return !!localStorage.getItem('access_token')
}

const dashboardPath = computed(() => {
  const role = userStore.role || localStorage.getItem('user_role')
  return role === 'admin' ? '/admin' : '/user'
})

function handleLogout() {
  userStore.clear()
  router.push('/login')
}

// Micro-animation states
const isLoaded = ref(false)
onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="home-view" :class="{ 'is-loaded': isLoaded }">
    <!-- Premium Background -->
    <div class="premium-bg">
      <div class="premium-bg__orb premium-bg__orb--1"></div>
      <div class="premium-bg__orb premium-bg__orb--2"></div>
      <div class="premium-bg__orb premium-bg__orb--3"></div>
      <div class="premium-bg__grid"></div>
      <div class="premium-bg__noise"></div>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <div class="nav__container">
        <img :src="powerhouseLogo" alt="PowerHouse Biotech" class="nav__logo" />
        <div class="nav__actions">
          <template v-if="isLoggedIn()">
            <span class="nav__welcome">
              Bienvenido, <strong>{{ userStore.name || 'Usuario' }}</strong>
            </span>
            <router-link :to="dashboardPath" class="btn btn--glass btn--sm">
              Mi Panel
            </router-link>
            <button @click="handleLogout" class="btn btn--text btn--sm">
              Cerrar Sesión
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn--primary">
              Iniciar Sesión
            </router-link>
          </template>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <main class="hero">
      <div class="hero__container">
        <div class="hero__badge fade-up" style="--delay: 0.1s">
          <span class="pulse-dot"></span>
          <span>Biotecnología de Vanguardia</span>
        </div>
        
        <h1 class="hero__title fade-up" style="--delay: 0.2s">
          Regeneración<br/>
          <span class="text-gradient">Celular y Genética</span>
        </h1>
        
        <p class="hero__subtitle fade-up" style="--delay: 0.3s">
          Tratamientos avanzados con Células Madre Mesenquimales
        </p>
        
        <p class="hero__description fade-up" style="--delay: 0.4s">
          Pioneros en medicina regenerativa para diabetes y enfermedades autoinmunes. 
          Resultados comprobados que transforman la calidad de vida a través de la ciencia.
        </p>

        <div class="hero__actions fade-up" style="--delay: 0.5s">
          <template v-if="isLoggedIn()">
            <router-link :to="dashboardPath" class="btn btn--primary btn--lg group">
              Ir a mi Panel
              <svg class="icon group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
            <button @click="handleLogout" class="btn btn--glass btn--lg">
              Cerrar Sesión
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn--primary btn--lg group">
              Acceder al Portal
              <svg class="icon group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
          </template>
        </div>

        <div class="stats fade-up" style="--delay: 0.6s">
          <div class="stat-item">
            <span class="stat-item__value">500<span class="text-gradient">+</span></span>
            <span class="stat-item__label">Pacientes Tratados</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-item__value">95<span class="text-gradient">%</span></span>
            <span class="stat-item__label">Tasa de Éxito</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-item__value">12<span class="text-gradient">+</span></span>
            <span class="stat-item__label">Años de I+D</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
/* 
  ScaleFront Architect: Premium Modern UI 
  Dark mode base with vibrant animated glassmorphism gradients.
*/

.home-view {
  position: relative;
  min-height: 100vh;
  background-color: #050505;
  color: #ffffff;
  overflow: hidden;
  font-family: var(--font-montserrat, 'Inter', sans-serif);
  display: flex;
  flex-direction: column;
}

/* --- Premium Animated Background --- */
.premium-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: float 20s infinite ease-in-out alternate;

    &--1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, #21BCFB 0%, transparent 70%);
      top: -100px;
      left: -100px;
    }

    &--2 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #1278F3 0%, transparent 70%);
      bottom: -150px;
      right: -100px;
      animation-delay: -5s;
    }

    &--3 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #7000FF 0%, transparent 70%);
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.15;
      animation-delay: -10s;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  }
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}

/* --- Navigation --- */
.nav {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 1.5rem 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__logo {
    height: 38px;
    object-fit: contain;
    filter: brightness(0) invert(1); 
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  &__welcome {
    font-size: 0.9rem;
    color: #a1a1aa;
    strong {
      color: #fff;
      font-weight: 600;
    }
  }
}

/* --- Hero Section --- */
.hero {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;

  &__container {
    max-width: 800px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(33, 188, 251, 0.1);
    border: 1px solid rgba(33, 188, 251, 0.2);
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #21BCFB;
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
  }

  &__title {
    font-size: clamp(3rem, 6vw, 4.5rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin-bottom: 1.5rem;
    color: #ffffff;
  }

  &__subtitle {
    font-size: clamp(1.2rem, 2vw, 1.5rem);
    color: #a1a1aa;
    font-weight: 400;
    margin-bottom: 1.5rem;
  }

  &__description {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #71717a;
    max-width: 600px;
    margin: 0 auto 3rem auto;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 4rem;
  }
}

.text-gradient {
  background: linear-gradient(135deg, #21BCFB 0%, #1278F3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #21BCFB;
  box-shadow: 0 0 10px rgba(33, 188, 251, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(33, 188, 251, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(33, 188, 251, 0); }
  100% { box-shadow: 0 0 0 0 rgba(33, 188, 251, 0); }
}

/* --- Stats --- */
.stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  &__value {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
    color: #ffffff;
    font-family: monospace;
  }

  &__label {
    font-size: 0.85rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

/* --- Buttons --- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;

  &--primary {
    background: linear-gradient(135deg, #21BCFB 0%, #1278F3 100%);
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(18, 120, 243, 0.25);
    
    &:hover {
      box-shadow: 0 12px 25px rgba(18, 120, 243, 0.4);
      transform: translateY(-2px);
    }
  }

  &--glass {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  &--text {
    background: transparent;
    color: #a1a1aa;
    &:hover {
      color: #ffffff;
    }
  }

  &--lg {
    padding: 1rem 2rem;
    font-size: 1.05rem;
  }

  &--sm {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border-radius: 8px;
  }
}

.icon {
  transition: transform 0.3s ease;
}

.group:hover .group-hover\:translate-x-1 {
  transform: translateX(4px);
}

/* --- Animations --- */
.fade-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}

.is-loaded .fade-up {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .nav__container {
    padding: 0 1.5rem;
  }
  .nav__welcome {
    display: none;
  }
  .stats {
    flex-direction: column;
    gap: 2rem;
    padding-top: 2rem;
  }
  .stat-divider {
    width: 60px;
    height: 1px;
  }
  .hero__title {
    font-size: 2.5rem;
  }
}
</style>