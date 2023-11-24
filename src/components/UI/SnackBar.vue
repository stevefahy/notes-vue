<script setup lang="ts">
import { ref } from 'vue'
import { useSnackStore } from '@/stores/snack'

const snackStore = useSnackStore()

const message = ref('')
const status = ref(false)
const timeout = 2000

snackStore.$subscribe((mutation, state) => {
  if (state.snack.n_status && state.snack.message) {
    status.value = state.snack.n_status
    message.value = state.snack.message
  }
})
</script>

<template>
  <v-snackbar v-model="status" :timeout="timeout">
    <span class="icon_text snack_text">
      <span class="material-symbols-outlined button_icon snack_icon"> check_circle </span>
      {{ message }}
    </span>
  </v-snackbar>
</template>

<style scoped>
.snackbar {
  z-index: 100;
}
.snack_outer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.snack_icon {
  color: #116600;
}

.snack_text {
  color: #116600;
  font-size: 1rem;
  font-weight: 500;
}
</style>
