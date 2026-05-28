<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  personId: string
  files?: { _id: string; url: string; filename: string; type: string; uploadedAt: string }[]
}>()

const emit = defineEmits<{
  uploaded: [file: { url: string; filename: string; type: string }]
  deleted: [fileId: string]
}>()

const uploading = ref(false)
const dragover = ref(false)
const error = ref('')

function getFileIcon(type: string) {
  if (type.includes('pdf')) return 'fa-file-pdf'
  if (type.includes('image')) return 'fa-image'
  return 'fa-file'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function handleFile(file: File) {
  error.value = ''
  if (!file) return

  // Simple upload: convert to base64 or send to Cloudinary via backend
  // For now: store as base64 data URL (small files)
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    emit('uploaded', {
      url: result,
      filename: file.name,
      type: file.type,
    })
  }
  reader.onerror = () => {
    error.value = 'Error al leer el archivo'
  }
  reader.readAsDataURL(file)
}

function onDrop(e: DragEvent) {
  dragover.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <div class="file-upload">
    <!-- Drop zone -->
    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': dragover }"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
    >
      <i class="fa-solid fa-cloud-arrow-up drop-zone__icon"></i>
      <p class="drop-zone__text">Arrastra un archivo o <label class="drop-zone__link">haz clic aquí<input type="file" accept=".pdf,.doc,.docx,image/*" class="drop-zone__input" @change="onFileInput" /></label></p>
      <p class="drop-zone__hint">PDF, DOCX, imágenes — hasta 10MB</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- File list -->
    <div v-if="files?.length" class="file-list">
      <div v-for="file in files" :key="file._id" class="file-item">
        <i :class="['fa-regular', getFileIcon(file.type), 'file-item__icon']"></i>
        <div class="file-item__info">
          <a :href="file.url" target="_blank" class="file-item__name">{{ file.filename }}</a>
          <span class="file-item__meta">{{ formatDate(file.uploadedAt) }}</span>
        </div>
        <button type="button" class="file-item__delete" @click="emit('deleted', file._id)"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drop-zone {
  border: 2px dashed var(--border-medium);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;

  &--active {
    border-color: var(--primary);
    background: rgba(33, 188, 251, 0.05);
  }

  &__icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-3);
  }

  &__text {
    font-family: var(--font-montserrat);
    font-size: 0.9rem;
    color: var(--text-2);
    margin: 0;
  }

  &__link {
    color: var(--primary);
    cursor: pointer;
    text-decoration: underline;
  }

  &__input {
    display: none;
  }

  &__hint {
    font-family: var(--font-montserrat);
    font-size: 0.75rem;
    color: var(--text-3);
    margin: 0.25rem 0 0;
  }
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;

  &__icon {
    font-size: 1.25rem;
    color: var(--primary);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-family: var(--font-montserrat);
    font-size: 0.875rem;
    color: var(--primary);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover { text-decoration: underline; }
  }

  &__meta {
    font-family: var(--font-montserrat);
    font-size: 0.75rem;
    color: var(--text-3);
  }

  &__delete {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem;
    &:hover { color: #fca5a5; }
  }
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fca5a5;
  font-size: 0.875rem;
  font-family: var(--font-montserrat);
}
</style>
