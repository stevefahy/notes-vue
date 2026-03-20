<script setup lang="ts">
import { computed } from 'vue'
import type { IAuthDetails } from '@/core/model/global'

const props = defineProps<{
  details: IAuthDetails | null
}>()

const initial = computed(() =>
  props.details?.username?.charAt(0).toUpperCase()
)
</script>

<template>
  <div class="profile_outer">{{ initial }}</div>
  <div v-if="details?.username" class="profile_name">{{ details.username }}</div>
  <div v-if="details?.email" class="profile_email">{{ details.email }}</div>
</template>

<style scoped>
.profile_outer {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #3d9966, #2e7d52);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--theme-font-serif);
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-top: 48px;
  margin-bottom: 20px;
  box-shadow: var(--theme-shadow-lg);
}

.profile_name {
  font-family: var(--theme-font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text);
  margin-bottom: 3px;
}

.profile_email {
  font-size: 13.5px;
  color: var(--theme-text-muted);
  margin-bottom: 20px;
}
</style>
