<script setup lang="ts">
import { computed } from 'vue'
import type { StudyStatus } from '@/services/study.service'

const props = defineProps<{
  status: StudyStatus
  stage?: string
  progress?: number
}>()

const LABELS: Record<StudyStatus, string> = {
  queued: 'En cola',
  generating: 'Generando',
  ready: 'Listo',
  failed: 'Falló',
}

const label = computed(() => LABELS[props.status] ?? props.status)
const isRunning = computed(() => props.status === 'queued' || props.status === 'generating')
</script>

<template>
  <span class="chip" :class="'chip--' + status">
    <span v-if="isRunning" class="chip__dot"></span>
    <i v-else-if="status === 'ready'" class="chip__icon">✓</i>
    <i v-else class="chip__icon">!</i>
    {{ label }}
    <span v-if="isRunning && progress" class="chip__pct">{{ progress }}%</span>
  </span>
  <span v-if="isRunning && stage" class="stage">{{ stage }}…</span>
</template>

<style scoped lang="scss">
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border: 1px solid currentColor;
  white-space: nowrap;

  &--queued {
    color: #8a94a6;
  }
  &--generating {
    color: #1278f3;
  }
  &--ready {
    color: #1a9c6b;
  }
  &--failed {
    color: #d4443c;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 1.2s ease-in-out infinite;
  }

  &__icon {
    font-style: normal;
    font-weight: 700;
  }

  &__pct {
    opacity: 0.7;
  }
}

.stage {
  margin-left: 0.5rem;
  font-size: 0.72rem;
  color: #8a94a6;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chip__dot {
    animation: none;
  }
}
</style>
