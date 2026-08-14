<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  studyService,
  type StudyListItem,
  type StudyDetail,
} from '@/services/study.service'
import StudyStatusChip from './StudyStatusChip.vue'
import StudyEditor from './StudyEditor.vue'

const studies = ref<StudyListItem[]>([])
const selected = ref<StudyDetail | null>(null)
const loading = ref(true)
const error = ref('')
const search = ref('')

let poller: ReturnType<typeof setInterval> | null = null

const running = computed(() =>
  studies.value.filter((s) => s.status === 'queued' || s.status === 'generating'),
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return studies.value
  return studies.value.filter(
    (s) => s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q),
  )
})

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    studies.value = await studyService.list()
    error.value = ''
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los estudios'
  } finally {
    loading.value = false
  }
}

async function open(publicId: string) {
  selected.value = await studyService.getOne(publicId)
}

async function refreshSelected() {
  if (selected.value) selected.value = await studyService.getOne(selected.value.publicId)
}

/** Empuja la cola a mano por si el auto-disparo no despertó al procesador */
async function pushQueue() {
  try {
    await studyService.runQueue()
    await load(true)
  } catch {
    /* el poller lo recogerá igual */
  }
}

onMounted(() => {
  load()
  // Mientras haya estudios en curso conviene refrescar; si no, cada 30 s basta
  poller = setInterval(() => {
    if (running.value.length) {
      load(true)
      if (selected.value && selected.value.status !== 'ready') refreshSelected()
    }
  }, 5000)
})

onUnmounted(() => {
  if (poller) clearInterval(poller)
})
</script>

<template>
  <section class="studies">
    <header class="studies__head">
      <div>
        <h1>Estudios</h1>
        <p>
          Se generan solos cuando un paciente completa el cuestionario al 100%. Se acumulan por
          versión: regenerar nunca borra el anterior.
        </p>
      </div>
      <div class="studies__tools">
        <input v-model="search" type="search" placeholder="Buscar por nombre o correo" />
        <button class="btn btn--ghost" @click="load()">Actualizar</button>
        <button v-if="running.length" class="btn btn--ghost" @click="pushQueue">
          Procesar cola ({{ running.length }})
        </button>
      </div>
    </header>

    <p v-if="error" class="studies__error">{{ error }}</p>

    <div v-if="running.length" class="studies__running">
      <strong>{{ running.length }} en proceso:</strong>
      <span v-for="s in running" :key="s.publicId">
        {{ s.fullName || s.email }} — {{ s.stage }}
      </span>
    </div>

    <p v-if="loading" class="studies__empty">Cargando…</p>
    <p v-else-if="!filtered.length" class="studies__empty">
      Todavía no hay estudios. Se crean al completarse un cuestionario.
    </p>

    <table v-else class="studies__table">
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Versión</th>
          <th>Estado</th>
          <th>Envíos</th>
          <th>Creado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in filtered" :key="s.publicId">
          <td>
            <strong>{{ s.fullName || '—' }}</strong>
            <span class="muted">{{ s.email }}</span>
          </td>
          <td>v{{ s.version }} <span v-if="s.edited" class="tag">editado</span></td>
          <td><StudyStatusChip :status="s.status" :stage="s.stage" :progress="s.progress" /></td>
          <td>
            <span v-if="!s.deliveries" class="muted">—</span>
            <span v-else :class="s.lastDeliveryOk ? 'ok' : 'fail'">
              {{ s.deliveries }} {{ s.lastDeliveryOk ? '✓' : '✕' }}
            </span>
          </td>
          <td class="muted">{{ new Date(s.createdAt).toLocaleDateString('es-MX') }}</td>
          <td class="right">
            <button class="btn btn--ghost" @click="open(s.publicId)">Abrir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="selected" class="drawer" @click.self="selected = null">
      <div class="drawer__panel">
        <StudyEditor
          :study="selected"
          @close="selected = null"
          @saved="load(true), refreshSelected()"
          @sent="load(true), refreshSelected()"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.studies {
  padding: 1.5rem;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.2rem;

    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.4rem;
    }

    p {
      margin: 0;
      max-width: 46rem;
      font-size: 0.85rem;
      color: #6b7280;
    }
  }

  &__tools {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    input {
      border: 1px solid #d7dce5;
      border-radius: 8px;
      padding: 0.5rem 0.8rem;
      font-size: 0.83rem;
      min-width: 15rem;

      &:focus {
        outline: none;
        border-color: #1278f3;
      }
    }
  }

  &__running {
    background: #eef5ff;
    border: 1px solid #cfe0fb;
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    font-size: 0.82rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    color: #1c4f9c;
  }

  &__error {
    color: #d4443c;
    font-size: 0.85rem;
  }

  &__empty {
    color: #6b7280;
    font-size: 0.88rem;
    padding: 2rem 0;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;

    thead th {
      text-align: left;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #6b7280;
      padding: 0.5rem 0.7rem;
      border-bottom: 1px solid #e6eaf0;
    }

    tbody td {
      padding: 0.75rem 0.7rem;
      border-bottom: 1px solid #f0f3f7;
      vertical-align: middle;
    }

    strong {
      display: block;
    }
  }
}

.muted {
  color: #9aa3b2;
  font-size: 0.78rem;
}

.ok {
  color: #1a9c6b;
}

.fail {
  color: #d4443c;
}

.right {
  text-align: right;
}

.tag {
  background: #fff4e0;
  color: #b26a00;
  border-radius: 999px;
  padding: 0.05rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 600;
}

.btn {
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #d7dce5;
  background: #fff;
  color: #374151;
}

.drawer {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 200;

  &__panel {
    background: #fff;
    width: min(760px, 100%);
    height: 100%;
    overflow-y: auto;
    padding: 1.5rem;
  }
}

@media (max-width: 720px) {
  .studies {
    padding: 1rem;
  }

  .studies__table thead {
    display: none;
  }

  .studies__table tbody td {
    display: block;
    border: 0;
    padding: 0.2rem 0;
  }

  .studies__table tbody tr {
    display: block;
    border-bottom: 1px solid #e6eaf0;
    padding: 0.8rem 0;
  }
}
</style>
