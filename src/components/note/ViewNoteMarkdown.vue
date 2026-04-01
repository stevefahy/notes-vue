<script setup lang="ts">
import { watch, ref, toRef, shallowRef } from 'vue'
import type MarkdownIt from 'markdown-it'
import morphdom from 'morphdom'
import type { ViewNoteMarkdownProps } from '@/core/model/global'
import { scrollToElementByHtmlId } from '@/core/lib/markdownScroll'
import fm from 'front-matter'
import { createViewNoteMarkdownEngine } from '@/core/lib/viewNoteMarkdownEngine'

const props = defineProps<ViewNoteMarkdownProps>()
const updatedViewText = toRef(props, 'updatedViewText')

let content: string
let contextView = ''
let frontmatterString = ''
let hasFrontmatter = false
const viewText = toRef(props, 'viewText')
const outHtml = ref<string>('')
const markdownContainerRef = ref<HTMLSpanElement | null>(null)
const md = shallowRef<MarkdownIt | null>(null)

void createViewNoteMarkdownEngine().then((engine) => {
  md.value = engine
})

const TASK_LINE_RE = /^\s*[-*+]\s+\[[xX \u00A0]\s*\]/
const CBOX_ID_PREFIX = 'cbx_'

function renderMarkdown(val: string) {
  const engine = md.value
  if (!engine) return
  const parsed = fm(val)
  content = parsed.body
  frontmatterString = parsed.frontmatter ?? ''
  hasFrontmatter = parsed.bodyBegin > 1
  if (content === contextView) return
  contextView = content
  outHtml.value = engine.render(content, { disableLinks: props.disableLinks })
}

watch(
  [() => md.value, viewText],
  ([engine, val]) => {
    if (!engine) return
    renderMarkdown(val)
  },
  { immediate: true }
)

watch(
  () => props.disableLinks,
  () => {
    if (!md.value) return
    contextView = ''
    renderMarkdown(viewText.value)
  }
)

const onChangeCheckbox = (taskIndex: number, checked: boolean) => {
  if (typeof taskIndex !== 'number' || taskIndex < 0) return
  const lines = content.split('\n')
  let nth = 0
  for (let i = 0; i < lines.length; i++) {
    if (TASK_LINE_RE.test(lines[i])) {
      if (nth === taskIndex) {
        lines[i] = lines[i].replace(/\[\s*(x|\s)\s*\]/i, checked ? '[x]' : '[ ]')
        const newContent = lines.join('\n')
        if (props.updatedViewText) {
          const updatedFull = hasFrontmatter
            ? `---\n${frontmatterString}\n---\n\n${newContent}`
            : newContent
          props.updatedViewText(updatedFull)
        }
        return
      }
      nth++
    }
  }
}

const handleMarkdownPointer = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (props.updatedViewText && target.tagName === 'INPUT') {
    return
  }

  const foot = target.closest<HTMLElement>('[data-md-footnote-scroll]')
  if (foot) {
    const to = foot.getAttribute('data-md-footnote-scroll')
    if (to) {
      event.preventDefault()
      scrollToElementByHtmlId(to)
    }
    return
  }

  const anchor = target.closest<HTMLElement>('.md_anchorlink[data-md-target-id]')
  if (anchor) {
    const id = anchor.getAttribute('data-md-target-id')
    if (id) {
      event.preventDefault()
      scrollToElementByHtmlId(id)
    }
  }
}

const handleCheckboxClick = (event: MouseEvent) => {
  if (!props.updatedViewText) return
  const target = event.target as HTMLElement
  if (target.tagName !== 'INPUT' || (target as HTMLInputElement).type !== 'checkbox') return
  const id = (target as HTMLInputElement).id
  if (!id || !id.startsWith(CBOX_ID_PREFIX)) return
  const taskIndex = parseInt(id.slice(CBOX_ID_PREFIX.length), 10)
  if (isNaN(taskIndex) || taskIndex < 0) return
  const checked = (target as HTMLInputElement).checked
  onChangeCheckbox(taskIndex, checked)
}

const onCheckboxClick = (event: MouseEvent) => {
  handleMarkdownPointer(event)
  handleCheckboxClick(event)
}

const onMarkdownKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const target = event.target as HTMLElement
  const anchor = target.closest<HTMLElement>('.md_anchorlink[data-md-target-id]')
  if (!anchor || !anchor.contains(target)) return
  const id = anchor.getAttribute('data-md-target-id')
  if (!id) return
  event.preventDefault()
  scrollToElementByHtmlId(id)
}

watch(
  [outHtml, () => markdownContainerRef.value],
  () => {
    const el = markdownContainerRef.value
    const html = outHtml.value
    if (!el || !html) return

    const temp = document.createElement('span')
    temp.innerHTML = html

    morphdom(el, temp, {
      childrenOnly: true,
      getNodeKey: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const cel = node as Element
          if (cel.classList.contains('image')) {
            const img = cel.querySelector('img')
            if (img) return `img-${img.getAttribute('src')}`
          }
          if (cel.tagName === 'IMG') {
            return `img-${cel.getAttribute('src')}`
          }
        }
        return undefined
      },
      onBeforeElUpdated: (fromEl, toEl) => {
        if (fromEl.classList.contains('image') && toEl.classList.contains('image')) {
          const fromImg = fromEl.querySelector('img')
          const toImg = toEl.querySelector('img')
          if (fromImg && toImg && fromImg.getAttribute('src') === toImg.getAttribute('src')) {
            for (const attr of Array.from(toImg.attributes)) {
              if (fromImg.getAttribute(attr.name) !== attr.value) {
                fromImg.setAttribute(attr.name, attr.value)
              }
            }
            return false
          }
        }
        if (fromEl.tagName === 'IMG' && toEl.tagName === 'IMG') {
          if (fromEl.getAttribute('src') === toEl.getAttribute('src')) {
            for (const attr of Array.from(toEl.attributes)) {
              if (fromEl.getAttribute(attr.name) !== attr.value) {
                fromEl.setAttribute(attr.name, attr.value)
              }
            }
            return false
          }
        }
        return true
      }
    })
  },
  { flush: 'post' }
)
</script>

<template>
  <span
    class="md-rendered"
    :class="{ 'md-readonly': !updatedViewText }"
    @click="onCheckboxClick"
    @keydown="onMarkdownKeydown"
  >
    <span
      ref="markdownContainerRef"
      class="viewnote_content"
      :class="{ 'md-readonly': !updatedViewText }"
      data-viewnote-markdown
      :role="updatedViewText ? 'presentation' : undefined"
    />
  </span>
</template>

<style scoped>
.codebox pre {
  box-shadow: rgba(0, 0, 0, 0.4) 1.95px 1.95px 2.6px;
}

.codebox_language p {
  padding-left: 5px;
}

.image {
  display: inline-block;
  vertical-align: top;
}

.image img {
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
}
</style>
