<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSnackStore } from '@/stores/snack'
import type { SnackVariant } from '@/core/model/global'

const snackStore = useSnackStore()

const show = ref(false)
const message = ref('')
const variant = ref<SnackVariant>('success')
const timeoutMs = 4000
let hideTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => snackStore.snack,
  (s) => {
    if (s.n_status && s.message) {
      if (hideTimer) clearTimeout(hideTimer)
      show.value = true
      message.value = s.message
      variant.value = s.variant ?? 'success'
      hideTimer = setTimeout(() => {
        show.value = false
        message.value = ''
        snackStore.resetSnack()
        hideTimer = undefined
      }, timeoutMs)
    }
  },
  { deep: true, immediate: true }
)

const isMultiLine = () => message.value.includes('\n')
</script>

<template>
  <div id="snackbar" class="snackbar" :class="{
    show,
    'snackbar-success': variant === 'success',
    'snackbar-error': variant === 'error',
    'snackbar-warning': variant === 'warning',
    'snackbar-multi': isMultiLine()
  }">
    <template v-if="variant === 'success'">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="snackbar-icon" aria-hidden="true">
        <circle cx="8" cy="8" r="7.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
        <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" stroke-width="1.6" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </template>
    <div v-else-if="variant === 'error'" class="snackbar-dot snackbar-dot-error" aria-hidden="true" />
    <div v-else class="snackbar-dot snackbar-dot-warning" aria-hidden="true" />
    <span id="snackbar-msg" class="snackbar-msg">{{ message }}</span>
  </div>
</template>

<style scoped>
.snackbar.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(80px);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.32, 1.2, 0.5, 1),
    opacity 0.3s ease;
  z-index: 1100;
  pointer-events: none;
}

.snackbar-success {
  background: var(--theme-green-snackbar);
  color: white;
  white-space: nowrap;
}

.snackbar-error {
  background: var(--theme-snackbar-error-bg);
  color: var(--theme-snackbar-error-text);
  white-space: nowrap;
}

.snackbar-warning {
  background: var(--theme-snackbar-warning-bg);
  color: var(--theme-snackbar-warning-text);
  white-space: nowrap;
}

.snackbar-multi {
  white-space: pre-wrap;
  max-width: 320px;
  align-items: flex-start;
}

.snackbar-multi .snackbar-icon,
.snackbar-multi .snackbar-dot {
  margin-top: 2px;
  flex-shrink: 0;
}

.snackbar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.snackbar-dot-error {
  background: var(--theme-snackbar-error-dot);
}

.snackbar-dot-warning {
  background: var(--theme-snackbar-warning-dot);
}

@media (min-width: 768px) {
  .snackbar {
    bottom: auto;
    top: 24px;
    transform: translateX(-50%) translateY(-80px);
  }

  .snackbar.show {
    transform: translateX(-50%) translateY(0);
  }
}
</style>
