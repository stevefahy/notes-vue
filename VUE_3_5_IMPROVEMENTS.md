# Vue 3.5 Best Practice Improvements

This document outlines recommended improvements for your Vue 3.5.27 codebase.

## 1. Use `v-model` Instead of Manual `:value`/@input

** RELEVANT** - Your `AddNotebookForm.vue` still uses manual `:value`/@input pattern. This improvement would simplify your code.

### Current Pattern (AddNotebookForm.vue)
```vue
<input type="text" :value="notebookName" @input="nameChangeHandler(getValue($event))" />
```

### Recommended Pattern
```vue
<input type="text" v-model="selectedName" @input="nameChangeHandler" />
```

**Benefits:**
- Less boilerplate code
- Better reactivity handling
- More idiomatic Vue 3.5

**Note:** You'll need to update your handlers to work directly with the v-model value.

---

## 2. Consider `defineModel` for Custom Components

** NOT RELEVANT** - None of your components currently expose `v-model` using the `modelValue` pattern. Only relevant if you create new reusable form components that need two-way binding.

Vue 3.5 introduced the `defineModel` macro to simplify v-model in custom components. If you have components that expose v-model, consider using this:

### Example Pattern
```vue
<script setup lang="ts">
// Instead of:
// const props = defineProps<{ modelValue: string }>()
// const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Use:
const model = defineModel<string>({ required: true })
</script>
```

**When to use:** If you create reusable form components that need two-way binding.

---

## 3. Reactive Destructuring of Props (Use with Caution)

** INFORMATIONAL** - Your current `toRef` pattern is already correct. This section explains why to keep it.

Vue 3.5 allows destructuring props directly, but you need to be careful:

### Current Pattern (Good)
```vue
const props = defineProps<NoteEditorView>()
const viewText = toRef(props, 'viewText')
```

### Alternative (Vue 3.5)
```vue
const { viewText } = defineProps<NoteEditorView>()
// But watch needs a getter:
watch(() => viewText, (val) => { ... })
```

**Recommendation:** Keep your current `toRef` pattern for now - it's clearer and safer for watchers.

---

## 4. Form Handling Improvements

** RELEVANT** - Your `SelectNotebookForm.vue` uses both `v-model` and `@change` which can be simplified.

### SelectNotebookForm.vue
You're using both `v-model` and `@change` - you can simplify:

**Current:**
```vue
<select v-model="selectedNotebook" @change="handleChange($event)">
```

**Improved:**
```vue
<select v-model="selectedNotebook" @update:model-value="handleChange">
```

Or better yet, use a computed with setter or watch the v-model directly.

---

## 5. TypeScript Improvements

** OPTIONAL** - Could be useful if you add components with prop defaults, but no immediate need found in your codebase.

Vue 3.5 has better TypeScript inference. Your current patterns are good, but you can:

- Use `withDefaults()` for default values in props
- Leverage better type inference for `defineEmits`

### Example with Defaults
```vue
const props = withDefaults(defineProps<Props>(), {
  timeout: 2000,
  labels: () => ['one', 'two'] // Arrays/objects need getters
})
```

---

## 6. Performance Optimizations (Already Handled)

** ALREADY BENEFITING** - Your codebase automatically benefits from Vue 3.5 performance improvements.

Vue 3.5 automatically provides:
- ✅ Faster reactivity tracking
- ✅ Reduced memory usage
- ✅ Better tree-shaking

Your codebase already benefits from these improvements.

---

## 7. Template Refs Improvements

** PATTERN IS GOOD** - Your current template ref pattern works well in Vue 3.5, no changes needed.

Vue 3.5 has better template ref handling. Your current pattern is good:

```vue
<input :ref="el => { if (el) inputRefs[note._id] = el as HTMLInputElement }" />
```

This pattern works well in Vue 3.5.

---

## 8. ReturnType Pattern (Already Fixed ✅)

You've already updated from `NodeJS.Timeout` to `ReturnType<typeof setTimeout>`, which is correct for browser compatibility.

---

## Priority Recommendations

### High Priority
1. **Update AddNotebookForm.vue** to use `v-model` instead of manual `:value`/@input
2. **Simplify SelectNotebookForm.vue** select handling

### Medium Priority
3. Consider `defineModel` if you create new reusable form components
4. Review prop destructuring patterns (current approach is fine)

### Low Priority
5. Use `withDefaults()` for prop defaults where applicable
6. Review emit type definitions for better TypeScript support

---

## Migration Example: AddNotebookForm.vue

Here's how you could improve the form handling with a complete example:

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { FolderOptions } from '@/core/lib/folder-options'
import APPLICATION_CONSTANTS from '@/core/application-constants/application-constants'
import type {
  AlertInterface,
  FolderOptionsInterface,
  NotebookAddEdit,
  NotebookCoverType
} from '@/core/model/global'
import ErrorAlert from '../UI/ErrorAlert.vue'
import { useMobileSizeStore } from '@/stores/mobileSize'
import { storeToRefs } from 'pinia'

const AC = APPLICATION_CONSTANTS

const mobileSizeStore = useMobileSizeStore()
const { btnSize } = storeToRefs(mobileSizeStore)

const props = defineProps<NotebookAddEdit>()

const error = ref<AlertInterface>({ error_state: false, message: '' })
const selectedCover = ref<NotebookCoverType>('default')
const selectedName = ref<string>('')
const formChanged = ref<boolean>(false)
const dialog = ref(true)

const folderOptions: FolderOptionsInterface[] = FolderOptions

// Compute original values for comparison
const originalName = computed(() => 
  props.method === 'edit' && props.notebook 
    ? props.notebook.notebook_name 
    : ''
)
const originalCover = computed(() => 
  props.method === 'edit' && props.notebook 
    ? props.notebook.notebook_cover 
    : 'default'
)

// Initialize from props
if (props.method === 'edit' && props.notebook) {
  selectedName.value = props.notebook.notebook_name
  selectedCover.value = props.notebook.notebook_cover
}

const resetError = () => {
  error.value = {
    error_state: false,
    error_severity: '',
    message: ''
  }
}

// Watch for name changes and validate
watch(selectedName, (name) => {
  resetError()
  
  if (name !== originalName.value || selectedCover.value !== originalCover.value) {
    if (!name || name.length < AC.NOTEBOOK_NAME_MIN) {
      formChanged.value = false
      return
    }
    if (name.length > AC.NOTEBOOK_NAME_MAX) {
      formChanged.value = false
      error.value = {
        error_state: true,
        message: `${AC.NOTEBOOK_NAME_MAX_ERROR}`
      }
      return
    }
    formChanged.value = true
  } else {
    formChanged.value = false
  }
})

// Watch for cover changes
watch(selectedCover, (cover) => {
  if (
    selectedName.value !== originalName.value ||
    (selectedName.value !== '' && cover !== originalCover.value)
  ) {
    formChanged.value = true
  } else {
    formChanged.value = false
  }
})

const checkForm = () => {
  return !formChanged.value
}

const cancelHandler = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  error.value = { error_state: false, message: '' }
  dialog.value = false
  props.onCancel()
}

const submitHandler = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  error.value = { error_state: false, message: '' }
  
  if (!selectedName.value || selectedName.value.length < AC.NOTEBOOK_NAME_MIN) {
    error.value = {
      error_state: true,
      message: `${AC.NOTEBOOK_NAME_MIN_ERROR}`
    }
    return
  }
  if (selectedName.value.length > AC.NOTEBOOK_NAME_MAX) {
    error.value = {
      error_state: true,
      message: `${AC.NOTEBOOK_NAME_MAX_ERROR}`
    }
    return
  }
  if (!selectedCover.value || selectedCover.value.length === 0) {
    error.value = { error_state: true, message: AC.NOTEBOOK_COVER_EMPTY }
    return
  }
  
  const notebook_name = selectedName.value
  if (props.method === 'edit' && props.notebook && props.editNotebook) {
    const notebookId = props.notebook._id
    let updated = new Date().toISOString()
    if (props.notebook.updatedAt) {
      updated = props.notebook.updatedAt
    }
    props.editNotebook(notebookId, notebook_name, selectedCover.value, updated)
    dialog.value = false
    props.onCancel()
  } else if (props.method === 'create' && props.addNotebook) {
    props.addNotebook(notebook_name, selectedCover.value)
    dialog.value = false
    props.onCancel()
  }
}
</script>

<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card>
      <v-card-text>
        <div class="dialogue_container">
          <h2 class="dialogue-title">
            {{ method === 'edit' ? 'Edit Notebook' : 'Add Notebook' }}
          </h2>
          <div>
            <form class="form">
              <div class="control">
                <label for="new-notebook">Name</label>
                <!-- Improved: Use v-model directly -->
                <input 
                  type="text" 
                  id="new-notebook" 
                  v-model="selectedName" 
                />
              </div>
              <div class="control">
                <label for="new-notebook-cover">Cover</label>
                <!-- Improved: Use v-model directly -->
                <select 
                  name="cars" 
                  class="select_dialogue" 
                  id="new-notebook-cover"
                  v-model="selectedCover"
                >
                  <option 
                    v-for="folder of folderOptions" 
                    :key="folder.value" 
                    :value="folder.value"
                  >
                    {{ folder.viewValue }}
                  </option>
                </select>
              </div>
            </form>
            <div class="button_row">
              <div :class="checkForm() ? 'action_disabled' : 'action'">
                <div v-if="method === 'create'">
                  <v-btn 
                    :size="btnSize" 
                    color="secondary" 
                    aria-label="Add notebook button" 
                    class="contained medium"
                    :disabled="checkForm()" 
                    @click="submitHandler($event)"
                  >
                    Add
                  </v-btn>
                </div>
                <div v-if="method === 'edit'">
                  <v-btn 
                    :size="btnSize" 
                    color="secondary" 
                    aria-label="Edit notebook button" 
                    class="contained medium"
                    :disabled="checkForm()" 
                    @click="submitHandler($event)"
                  >
                    Confirm
                  </v-btn>
                </div>
              </div>
              <div>
                <v-btn 
                  :size="btnSize" 
                  color="secondary" 
                  aria-label="Cancel button" 
                  class="contained medium"
                  @click="cancelHandler($event)"
                >
                  <span class="icon_text">
                    <span class="material-symbols-outlined button_icon white"> cancel </span>
                    Cancel
                  </span>
                </v-btn>
              </div>
            </div>
            <template v-if="error.error_state">
              <ErrorAlert 
                :error_severity="error.error_severity" 
                :error_state="error.error_state"
                :message="error.message" 
              />
            </template>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<!-- Styles remain the same -->
```

**Key improvements:**
1. ✅ Removed `getValue()` and `getValueAsNotebookCoverType()` helper functions - no longer needed
2. ✅ Removed redundant `notebookName` and `notebookCover` variables - use refs directly
3. ✅ Use `v-model` on both input and select - cleaner and more Vue-like
4. ✅ Use `computed` for original values - better reactivity
5. ✅ Use `watch` instead of manual handlers - more reactive
6. ✅ Removed `:selected` attribute from options - `v-model` handles this automatically
7. ✅ Fixed class binding syntax (`:class` instead of `class` with expression)

---

## Summary

Your codebase is already well-structured for Vue 3.5! The main improvements would be:
1. Simplifying form handling with `v-model`
2. Considering `defineModel` for future reusable components
3. Your current patterns (toRef, ReturnType, etc.) are already Vue 3.5 compatible

No breaking changes needed - these are all optional improvements for cleaner code.

