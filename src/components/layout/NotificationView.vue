<script setup lang="ts">
import { ref } from 'vue'
import type { NotificationInterface } from '@/core/model/global'

const props = defineProps<NotificationInterface>()

const errorClass = ref<boolean>(false)

if (props.n_status === 'error') {
  errorClass.value = false
}
if (props.n_status === 'success') {
  errorClass.value = true
}

const errorClasses = errorClass.value
</script>

<template>
  <div class="notification_outer">
    <section :class="errorClasses ? 'notification success' : 'notification error'">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
    </section>
  </div>
</template>

<style scoped>
.notification {
  width: 100%;
  background-color: #1a8ed1;
  display: flex;
  justify-content: center;
  padding: 0.5rem 10%;
  align-items: center;
  color: white;
  flex-direction: column;
  white-space: pre-wrap;
}

.notification h2,
.notification p {
  font-size: 1rem;
  margin: 0;
  padding-left: 5px;
  padding-right: 5px;
}

.error {
  background-color: #690000;
}

.success {
  background-color: #1ad1b9;
}

.pending {
  background-color: rgb(253, 220, 159);
}

.notification_outer {
  z-index: 50;
  position: absolute;
  width: 100%;
  bottom: 0px;
  white-space: pre;
  text-align: center;
}
</style>
