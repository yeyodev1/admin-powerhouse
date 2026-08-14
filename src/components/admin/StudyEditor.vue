<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { studyService, type StudyDetail } from '@/services/study.service'
import StudyStatusChip from './StudyStatusChip.vue'

const props = defineProps<{ study: StudyDetail }>()
const emit = defineEmits<{ close: []; saved: []; sent: [] }>()

const draft = ref('')
const saving = ref(false)
const sending = ref(false)
const message = ref('')
const error = ref('')
const confirmSend = ref(false)

watch(
  () => props.study,
  (s) => {
    draft.value = s.finalContent || s.content || ''
    confirmSend.value = false
    message.value = ''
    error.value = ''
  },
  { immediate: true },
)

const dirty = computed(() => draft.value !== (props.study.finalContent || props.study.content))
const canSend = computed(() => props.study.status === 'ready' && !!props.study.telefono)

async function save() {
  saving.value = true
  error.value = ''
  try {
    await studyService.saveContent(props.study.publicId, draft.value)
    message.value = 'Cambios guardados'
    emit('saved')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

async function send() {
  sending.value = true
  error.value = ''
  try {
    if (dirty.value) await studyService.saveContent(props.study.publicId, draft.value)
    const result = await studyService.sendWhatsapp(props.study.publicId)
    message.value = `Enviado al CRM (${result.detail}). GHL despacha el WhatsApp.`
    confirmSend.value = false
    emit('sent')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo enviar'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="editor">
    <header class="editor__head">
      <div>
        <h2>{{ study.fullName || study.email }}</h2>
        <p class="editor__meta">
          Versión {{ study.version }} · {{ study.email }}
          <template v-if="study.telefono"> · {{ study.telefono }}</template>
          <span v-if="study.edited" class="editor__badge">editado</span>
        </p>
        <StudyStatusChip :status="study.status" :stage="study.stage" :progress="study.progress" />
      </div>
      <button class="btn btn--ghost" @click="emit('close')">Cerrar</button>
    </header>

    <p v-if="study.error" class="editor__error">{{ study.error }}</p>

    <template v-if="study.status === 'ready'">
      <label class="editor__label">
        Contenido del estudio (Markdown)
        <span>Lo que guardes aquí es lo que ve el paciente. El texto original de la IA se conserva.</span>
      </label>
      <textarea v-model="draft" class="editor__area" spellcheck="true"></textarea>

      <div class="editor__actions">
        <a :href="study.url" target="_blank" rel="noopener" class="btn btn--ghost">
          Ver como el paciente
        </a>
        <span class="editor__spacer"></span>
        <button class="btn btn--ghost" :disabled="!dirty || saving" @click="save">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
        <button
          v-if="!confirmSend"
          class="btn btn--primary"
          :disabled="!canSend"
          :title="canSend ? '' : 'El contacto no tiene teléfono registrado'"
          @click="confirmSend = true"
        >
          Enviar por WhatsApp
        </button>
        <button v-else class="btn btn--danger" :disabled="sending" @click="send">
          {{ sending ? 'Enviando…' : `Confirmar envío a ${study.telefono}` }}
        </button>
      </div>

      <p v-if="confirmSend" class="editor__warn">
        Esto dispara el webhook de GHL y le llega un WhatsApp real al paciente.
      </p>
    </template>

    <p v-else class="editor__pending">
      El estudio todavía se está generando. Esta ficha se actualiza sola.
    </p>

    <p v-if="message" class="editor__ok">{{ message }}</p>
    <p v-if="error" class="editor__error">{{ error }}</p>

    <div v-if="study.deliveries?.length" class="editor__deliveries">
      <h3>Envíos</h3>
      <div v-for="(d, i) in study.deliveries" :key="i" class="delivery">
        <span :class="d.ok ? 'delivery--ok' : 'delivery--fail'">{{ d.ok ? '✓' : '✕' }}</span>
        {{ new Date(d.sentAt).toLocaleString('es-MX') }} → {{ d.to }}
        <em>{{ d.detail }}</em>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;

    h2 {
      margin: 0 0 0.2rem;
      font-size: 1.15rem;
    }
  }

  &__meta {
    margin: 0 0 0.5rem;
    font-size: 0.82rem;
    color: #6b7280;
  }

  &__badge {
    margin-left: 0.5rem;
    background: #fff4e0;
    color: #b26a00;
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
  }

  &__label {
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    span {
      font-weight: 400;
      font-size: 0.76rem;
      color: #6b7280;
    }
  }

  &__area {
    width: 100%;
    min-height: 420px;
    resize: vertical;
    border: 1px solid #d7dce5;
    border-radius: 10px;
    padding: 0.9rem 1rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.83rem;
    line-height: 1.6;

    &:focus {
      outline: none;
      border-color: #1278f3;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  &__spacer {
    flex: 1;
  }

  &__warn {
    margin: 0;
    font-size: 0.8rem;
    color: #b26a00;
  }

  &__ok {
    margin: 0;
    font-size: 0.82rem;
    color: #1a9c6b;
  }

  &__error {
    margin: 0;
    font-size: 0.82rem;
    color: #d4443c;
  }

  &__pending {
    margin: 0;
    font-size: 0.88rem;
    color: #6b7280;
  }

  &__deliveries {
    border-top: 1px solid #e6eaf0;
    padding-top: 0.8rem;

    h3 {
      margin: 0 0 0.4rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
    }
  }
}

.delivery {
  font-size: 0.8rem;
  color: #374151;
  padding: 0.2rem 0;

  em {
    color: #9aa3b2;
    font-style: normal;
  }

  &--ok {
    color: #1a9c6b;
    font-weight: 700;
  }

  &--fail {
    color: #d4443c;
    font-weight: 700;
  }
}

.btn {
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--ghost {
    background: #fff;
    border-color: #d7dce5;
    color: #374151;
  }

  &--primary {
    background: #1278f3;
    color: #fff;
  }

  &--danger {
    background: #d4443c;
    color: #fff;
  }
}
</style>
