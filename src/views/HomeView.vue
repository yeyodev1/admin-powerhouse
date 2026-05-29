<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
</script>

<template>
  <div class="home-view">
    <!-- Background Video -->
    <div class="hero-bg">
      <video autoplay muted loop playsinline class="hero-bg__video">
        <source src="https://icdlabs.in/immune-internal/wp-content/themes/immuneel/assets/videos/DNA.mp4" type="video/mp4" />
      </video>
      <div class="hero-bg__overlay"></div>
      <div class="hero-bg__gradient"></div>
    </div>

    <!-- Navigation Bar -->
    <nav class="hero-nav">
      <img
        src="https://powerhousebiotech.com/wp-content/uploads/2024/01/logo.png"
        alt="PowerHouse Biotech"
        class="hero-nav__logo"
      />
      <div class="hero-nav__actions">
        <template v-if="isLoggedIn()">
          <span class="hero-nav__welcome">
            Bienvenido, <strong class="hero-nav__username">{{ userStore.name || 'Usuario' }}</strong>
          </span>
          <router-link :to="dashboardPath" class="btn btn-primary btn-sm">
            Mi Panel
          </router-link>
          <button @click="handleLogout" class="btn btn-ghost btn-sm">
            Cerrar Sesión
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-ghost">
            Iniciar Sesión
          </router-link>
        </template>
      </div>
    </nav>

    <!-- Hero Content -->
    <div class="hero-content">
      <div class="hero-content__badge">
        <span class="badge-dot"></span>
        Tratamiento Certificado
      </div>

      <h1 class="hero-content__title">
        Regeneración
        <span class="hero-content__title-accent">Genética</span>
      </h1>

      <p class="hero-content__subtitle">
        Células Madre Mesenquimales
      </p>

      <p class="hero-content__description">
        Tratamiento de vanguardia para diabetes y enfermedades degenerativas.
        Tecnología científica avanzada con resultados comprobados.
      </p>

      <div class="hero-content__cta">
        <template v-if="isLoggedIn()">
          <router-link :to="dashboardPath" class="btn btn-primary btn-lg">
            Ir a mi Panel
          </router-link>
          <button @click="handleLogout" class="btn btn-outline btn-lg">
            Cerrar Sesión
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-outline btn-lg">
            Ya tengo cuenta
          </router-link>
        </template>
      </div>

      <div class="hero-content__stats">
        <div class="stat">
          <span class="stat__number">500+</span>
          <span class="stat__label">Pacientes Tratados</span>
        </div>
        <div class="stat__divider"></div>
        <div class="stat">
          <span class="stat__number">95%</span>
          <span class="stat__label">Satisfacción</span>
        </div>
        <div class="stat__divider"></div>
        <div class="stat">
          <span class="stat__number">12+</span>
          <span class="stat__label">Años de Investigación</span>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator">
      <span>Descubre más</span>
      <div class="scroll-indicator__arrow"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// ── Background ───────────────────────────────────────────────────────────────
.hero-bg {
  position: absolute;
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
    background: rgba(23, 24, 70, 0.6);
  }

  &__gradient {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(18, 120, 243, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(33, 188, 251, 0.1) 0%, transparent 50%);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
.hero-nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;

  &__logo {
    height: 48px;
    filter: brightness(0) invert(1);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__welcome {
    color: var(--text-2);
    font-size: 0.95rem;
    font-family: var(--font-montserrat);
    margin-right: 0.5rem;
  }

  &__username {
    color: var(--text);
  }
}

// ── Hero Content ─────────────────────────────────────────────────────────────
.hero-content {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1.5rem 6rem;
  max-width: 900px;
  margin: 0 auto;

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(33, 188, 251, 0.1);
    border: 1px solid rgba(33, 188, 251, 0.25);
    color: var(--cyan);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.4rem 1rem;
    border-radius: 50px;
    margin-bottom: 1.5rem;
    font-family: var(--font-montserrat);
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: clamp(2.5rem, 7vw, 5rem);
    font-weight: 800;
    color: var(--text);
    line-height: 1.05;
    margin-bottom: 0.25rem;
    letter-spacing: -0.02em;
  }

  &__title-accent {
    display: block;
    background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    font-family: var(--font-montserrat);
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 500;
    color: var(--primary);
    margin-bottom: 1.5rem;
    letter-spacing: 0.05em;
  }

  &__description {
    font-size: 1.1rem;
    color: var(--text-2);
    max-width: 560px;
    line-height: 1.7;
    margin-bottom: 2.5rem;
    font-family: var(--font-montserrat);
  }

  &__cta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 3.5rem;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }
}

// ── Stats ────────────────────────────────────────────────────────────────────
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  &__number {
    font-family: var(--font-montserrat);
    font-size: 2rem;
    font-weight: 800;
    color: var(--text);
  }

  &__label {
    font-size: 0.75rem;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  &__divider {
    width: 1px;
    height: 40px;
    background: var(--border-medium);
  }
}

// ── Scroll Indicator ────────────────────────────────────────────────────────
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  color: var(--text-3);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-montserrat);

  &__arrow {
    width: 20px;
    height: 20px;
    border-right: 2px solid var(--primary);
    border-bottom: 2px solid var(--primary);
    transform: rotate(45deg);
    animation: scrollBounce 2s ease-in-out infinite;
  }
}

@keyframes scrollBounce {
  0%, 100% { transform: rotate(45deg) translateY(0); opacity: 1; }
  50% { transform: rotate(45deg) translateY(6px); opacity: 0.5; }
}

// ── Buttons ──────────────────────────────────────────────────────────────────
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border-radius: 8px;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  white-space: nowrap;

  &-lg {
    padding: 1rem 2.5rem;
    font-size: 1rem;
  }

  &-sm {
    padding: 0.45rem 1rem;
    font-size: 0.85rem;
    border-radius: 6px;
  }

  &-primary {
    background: linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%);
    color: #171846;
    box-shadow: 0 4px 20px rgba(33, 188, 251, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(33, 188, 251, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-outline {
    background: transparent;
    color: var(--text);
    border: 2px solid var(--border-medium);

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: rgba(33, 188, 251, 0.05);
    }
  }

  &-ghost {
    background: transparent;
    color: var(--text-2);
    border: none;
    padding: 0.75rem 1rem;

    &:hover {
      color: var(--text);
    }
  }
}

// ── Responsive ───────────────────────────────────────────────────────────────
@media (max-width: 768px) {
  .hero-nav {
    padding: 1rem 1.5rem;

    &__logo {
      height: 36px;
    }

    &__welcome {
      display: none;
    }

    &__actions {
      gap: 0.5rem;
    }
  }

  .hero-content {
    padding: 1.5rem 1rem 5rem;

    &__stats {
      gap: 1rem;
    }
  }

  .stat {
    &__divider {
      display: none;
    }
  }

  .btn-lg {
    padding: 0.875rem 1.75rem;
  }
}
</style>