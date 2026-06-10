<script setup lang="ts">
// Componente puramente presentacional
</script>

<template>
  <div class="admin-info animate-fade-in">
    <div class="info-banner">
      <div class="info-banner__icon">📧</div>
      <h2 class="info-banner__title">Próximamente</h2>
      <p class="info-banner__text">
        Notificaciones por correo electrónico están en desarrollo. Muy pronto podrás enviar emails directamente a tus pacientes para automatizar procesos.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-info {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.info-banner {
  background: linear-gradient(135deg, rgba(33, 188, 251, 0.08) 0%, rgba(18, 120, 243, 0.08) 100%);
  border: 1px solid rgba(33, 188, 251, 0.2);
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 600px;

  &__icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-family: var(--font-montserrat);
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text);
    margin: 0 0 1rem;
  }

  &__text {
    font-family: var(--font-montserrat);
    font-size: 1rem;
    color: var(--text-2);
    margin: 0 auto;
    line-height: 1.6;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
