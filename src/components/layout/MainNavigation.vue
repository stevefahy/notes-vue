<script setup lang="ts">
import MenuDropdown from '../UI/MenuDropdown.vue'
import BreadCrumb from './BreadCrumb.vue'
import { storeToRefs } from 'pinia'
import { useEditNotesStore } from '@/stores/editNotes'

const editNotesStore = useEditNotesStore()
const { selectedCount, showPill } = storeToRefs(editNotesStore)
</script>

<template>
  <div class="header" id="header_height">
    <div class="header_container">
      <div class="logo_row">
        <div class="logo_mark">
          <img src="/assets/images/edit_white.png" alt="Notes logo" width="18" height="18" />
        </div>
        <span class="logo_text">Notes</span>
      </div>
      <div class="header_toolbar">
        <span v-if="showPill" class="edit-selection-pill">{{ selectedCount }} selected</span>
        <MenuDropdown />
      </div>
    </div>
  </div>
  <BreadCrumb />
</template>

<style scoped>
.header {
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: var(--theme-surface);
  border-bottom: 1px solid var(--theme-border);
}

.header_container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
}

.logo_row {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  align-items: baseline;
}

.logo_mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--theme-green);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
}

.logo_text {
  font-family: var(--theme-font-serif);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--theme-green);
}

.header_toolbar {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-selection-pill {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 99px;
  border: 1px solid var(--theme-border-input);
  background: var(--theme-lime-bg);
  color: var(--theme-green-accent);
  font-family: var(--theme-font-sans);
}
</style>
