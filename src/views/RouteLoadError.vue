<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FooterView from '@/components/layout/FooterView.vue'
import { useSnackStore } from '@/stores/snack'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'

const AC = APPLICATION_CONSTANTS
const router = useRouter()
const snackStore = useSnackStore()

onMounted(() => {
  snackStore.showErrorSnack('Unable to load this page. Please try again.', {
    fromServer: false
  })
})

const retry = () => window.location.reload()

const goNotebooks = () => router.push(AC.DEFAULT_PAGE)
</script>

<template>
  <div class="page_scrollable_header_breadcrumb_footer_list">
    <div class="loading_routes error-state">
      <p>Unable to load this page. Please try again.</p>
      <router-link class="back-link" :to="AC.DEFAULT_PAGE">Back to Notebooks</router-link>
      <button type="button" class="btn-action-ghost back-link" @click="retry">Retry</button>
    </div>
  </div>
  <FooterView>
    <button type="button" class="btn-action-ghost" @click="retry">Retry</button>
    <button type="button" class="btn-action-ghost" @click="goNotebooks">Back to Notebooks</button>
  </FooterView>
</template>
