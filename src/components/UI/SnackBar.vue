<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSnackStore } from '@/stores/snack'

const snackStore = useSnackStore()

const message = ref('')
const show = ref(false)
const timeout = 2000

snackStore.$subscribe((mutation, state) => {
  if (state.snack.n_status && state.snack.message) {
    show.value = true
    message.value = state.snack.message
  }
})

watch(show, (visible) => {
  if (visible && message.value) {
    const t = setTimeout(() => {
      show.value = false
      message.value = ''
    }, timeout)
    return () => clearTimeout(t)
  }
})
</script>

<template>
  <div class="snackbar" :class="{ show }">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" stroke-width="1.6" stroke-linecap="round"
        stroke-linejoin="round" />
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(80px);
  background: var(--theme-green-snackbar);
  color: white;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.32, 1.2, 0.5, 1),
    opacity 0.3s ease;
  z-index: 100;
  pointer-events: none;
}

.snackbar.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
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
