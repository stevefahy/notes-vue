<script setup lang="ts">
import { watch, ref, toRef } from 'vue'
import morphdom from 'morphdom'
import emoji_defs from '@/core/lib/emoji_definitions'
import type { ViewNoteMarkdownProps } from '@/core/model/global'
import { scrollToElementByHtmlId } from '@/core/lib/markdownScroll'
import { sanitizeCustomContainerStyles, sanitizeCustomCssClasses, sanitizeMarkdownTargetId } from '@/core/lib/markdownSafeStyles'
import fm from 'front-matter'
import MarkdownIt from 'markdown-it'
import type { Token, Options } from 'markdown-it'
import MarkdownItContainer from 'markdown-it-container'
import markdownItEmoji from 'markdown-it-emoji'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItIns from 'markdown-it-ins'
import markdownItMark from 'markdown-it-mark'
import markdownItAbbr from 'markdown-it-abbr'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItTaskCheckbox from 'markdown-it-task-checkbox'
import markdownItAnchor from 'markdown-it-anchor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markdown'

// Language alias: md -> markdown
const langAliases: Record<string, string> = { md: 'markdown' }

// MARKDOWN-IT

const md: MarkdownIt = MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  langPrefix: 'language-',
  breaks: false,
  highlight: function (str: string, lang: string | undefined) {
    const prismLang = lang ? (langAliases[lang] || lang) : undefined
    if (prismLang && Prism.languages[prismLang]) {
      const highlighted = Prism.highlight(str, Prism.languages[prismLang], prismLang)
      return (
        '<pre class="language-' +
        md.utils.escapeHtml(prismLang) +
        '"><code class="language-' +
        md.utils.escapeHtml(prismLang) +
        '">' +
        highlighted +
        '</code></pre><p>' +
        (lang || '') +
        '</p>'
      )
    }
    return (
      '<pre><code>' + md.utils.escapeHtml(str) + '</code></pre><p>' + (lang || '') + '</p>'
    )
  }
})


// Add a ruler to recognize <br> as a hardbreak
md.inline.ruler.push('html_br', (state, silent) => {
  if (state.src.slice(state.pos, state.pos + 4) === '<br>') {
    if (!silent) {
      state.push('hardbreak', 'br', 0);
    }
    state.pos += 4;
    return true;
  }
  if (state.src.slice(state.pos, state.pos + 5) === '<br/>') {
    if (!silent) {
      state.push('hardbreak', 'br', 0);
    }
    state.pos += 5;
    return true;
  }
  return false;
});

// MARKDOWN-IT PLUGINS

md.use(markdownItEmoji, { defs: emoji_defs })
md.use(markdownItFootnote)
md.use(markdownItSub)
md.use(markdownItSup)
md.use(markdownItIns)
md.use(markdownItMark)
md.use(markdownItAbbr)
md.use(markdownItAttrs, {
  // optional, these are default options '{' and '}'
  leftDelimiter: 'xx',
  rightDelimiter: 'xx',
  allowedAttributes: [] // empty array = all attributes are allowed
})

md.use(markdownItTaskCheckbox, {
  disabled: false,
  divWrap: true,
  divClass: 'custom-checkbox',
  idPrefix: 'cbx_',
  ulClass: 'task-list',
  liClass: 'task-list-item'
})

md.use(markdownItAnchor, {
  level: 1,
  permalink: false,
  permalinkClass: 'header-anchor',
  permalinkSymbol: '¶',
  permalinkBefore: false
})

const getSize = (node: string) => {
  let width: string | number = 1
  let height: string | number = 1
  const substrings = node.split('{{')
  const regex_w = /w:\d.*\b/
  const regex_h = /h:\d.*\b/
  const default_w = 100
  const default_h = 100
  let result_w
  let result_h
  if (substrings[1]) {
    result_w = substrings[1].match(regex_w)
    result_h = substrings[1].match(regex_h)
  }
  if (substrings[1] && substrings[1].includes('}}') && result_w !== null && result_h !== null) {
    width = substrings[1] ? substrings[1].match(/(?<=w:\s?)\d+/g)![0] : default_w
    height = substrings[1] ? substrings[1].match(/(?<=h:\s?)\d+/g)![0] : default_h
  } else {
    width = default_w
    height = default_h
  }
  return { width, height }
}

// MD RENDERER RULES

// Stack to track anchor links for link_close (supports nested links)
const anchorLinkStack: boolean[] = []

const defaultLinkOpen = md.renderer.rules.link_open

md.renderer.rules.link_open = function (tokens: Token[], idx: number, options: Options, env: Record<string, unknown>, slf: typeof md.renderer) {
  if (env.disableLinks) {
    anchorLinkStack.push(false)
    return ''
  }
  const aIndex = tokens[idx].attrIndex('target')
  const hIndex = tokens[idx].attrIndex('href')
  if (aIndex < 0 && tokens[idx].attrs) {
    tokens[idx].attrPush(['target', '_blank'])
  } else if (aIndex >= 0 && tokens[idx].attrs) {
    tokens[idx].attrs[aIndex][1] = '_blank'
  }
  if (hIndex >= 0 && tokens[idx].attrs) {
    const linkText = tokens[idx].attrs[hIndex][1]
    if (linkText.charAt(0) === '#') {
      anchorLinkStack.push(true)
      if (tokens[idx].attrs) tokens[idx].attrs[hIndex][1] = '#'
      let frag = linkText.slice(1)
      if (frag.startsWith('user-content-')) {
        frag = frag.slice('user-content-'.length)
      }
      const safeId = sanitizeMarkdownTargetId(frag)
      const idAttr = safeId ? md.utils.escapeHtml(safeId) : ''
      return (
        '<span class="md_anchorlink" role="link" tabindex="0" data-md-target-id="' +
        idAttr +
        '">'
      )
    }
  }
  anchorLinkStack.push(false)
  return (
    defaultLinkOpen?.(tokens, idx, options, env, slf) ??
    slf.renderToken(tokens, idx, options)
  )
}

const defaultLinkClose = md.renderer.rules.link_close

md.renderer.rules.link_close = function (tokens: Token[], idx: number, options: Options, env: Record<string, unknown>, slf: typeof md.renderer) {
  if (env.disableLinks) {
    anchorLinkStack.pop()
    return ''
  }
  const wasAnchor = anchorLinkStack.pop()
  if (wasAnchor) {
    return '</span>'
  }
  return (
    defaultLinkClose?.(tokens, idx, options, env, slf) ??
    slf.renderToken(tokens, idx, options)
  )
}

// Add class to table
md.renderer.rules.table_open = function () {
  return '<table class="table table-striped">'
}

// Add width and height to images
md.renderer.rules.image = function (tokens: Token[], idx: number, options: Options, env: Record<string, unknown>, slf: typeof md.renderer) {
  const token = tokens[idx]
  // #9: guard against missing attrs or alt attribute
  const altIdx = token.attrIndex('alt')
  if (!token.attrs || altIdx < 0) return slf.renderToken(tokens, idx, options)
  token.attrs[altIdx][1] = slf.renderInlineAsText(token.children!, options, env)
  const size = getSize(token.attrs[altIdx][1])
  token.attrSet('width', size.width + 'px')
  token.attrSet('height', size.height + 'px')
  return '<span class="image">' + slf.renderToken(tokens, idx, options) + '</span>'
}

// Footnotes: delegated scroll via data-md-footnote-scroll (no inline handlers)
md.renderer.rules.footnote_anchor = function (
  tokens: Token[],
  idx: number,
  options: Options,
  env: Record<string, unknown>,
  slf: typeof md.renderer
) {
  const id =
    (slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? '') +
    (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0
      ? ':' + tokens[idx].meta.subId
      : '')
  const escId = md.utils.escapeHtml(id)
  return (
    '<span class="footnote-backref" data-md-footnote-scroll="fnref' +
    escId +
    '" id="fnref' +
    escId +
    '">\u21a9\uFE0E</span>'
  )
}

md.renderer.rules.footnote_ref = function (
  tokens: Token[],
  idx: number,
  options: Options,
  env: Record<string, unknown>,
  slf: typeof md.renderer
) {
  const id =
    slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? ''
  const caption =
    slf.rules.footnote_caption?.(tokens, idx, options, env, slf) ?? ''
  const refid =
    id +
    (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0
      ? ':' + tokens[idx].meta.subId
      : '')
  const escRef = md.utils.escapeHtml(refid)
  const escId = md.utils.escapeHtml(id)
  return (
    '<sup class="footnote-ref"><span class="md-footnote-ref" data-md-footnote-scroll="fn' +
    escId +
    '" id="fnref' +
    escRef +
    '">' +
    caption +
    '</span></sup>'
  )
}

// Custom container: allowlisted inline styles only (see markdownSafeStyles)
md.use(MarkdownItContainer, 'custom', {
  validate: (params: string) => !!params.trim().match(/^custom\s+(.*)$/),
  render: (tokens: { info: string; nesting: number }[], idx: number) => {
    const m = tokens[idx].info.trim().match(/^custom\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      const safe = sanitizeCustomContainerStyles(m![1] ?? '')
      if (safe) return '<span style="' + md.utils.escapeHtml(safe) + '">\n'
      return '<span class="md-custom-unstyled">\n'
    }
    return '</span>\n'
  }
})

md.use(MarkdownItContainer, 'custom-css', {
  validate: (params: string) => !!params.trim().match(/^custom-css\s+(.*)$/),
  render: (tokens: { info: string; nesting: number }[], idx: number) => {
    if (tokens[idx].nesting === 1) {
      const m = tokens[idx].info.trim().match(/^custom-css\s+(.*)$/)
      if (!m) return '<span class="md-custom-css-fallback">\n'
      const classes = sanitizeCustomCssClasses(m[1])
      if (classes) return '<span class="' + md.utils.escapeHtml(classes) + '">\n'
      return '<span class="md-custom-css-fallback">\n'
    }
    return '</span>\n'
  }
})

//  COMPONENT SETUP

const props = defineProps<ViewNoteMarkdownProps>()
const updatedViewText = toRef(props, 'updatedViewText')

let content: string
// #6: cache parsed frontmatter so onChangeCheckbox avoids a second parse
let frontmatterString = ''
let hasFrontmatter = false
const contextView = ref<string>('')
const viewText = toRef(props, 'viewText')
const outHtml = ref<string>('')
const markdownContainerRef = ref<HTMLSpanElement | null>(null)

// Task list line pattern: - [ ] or - [x] or * [ ] etc (GFM style)
const TASK_LINE_RE = /^\s*[-*+]\s+\[[xX \u00A0]\s*\]/
// Checkbox ID from plugin: cbx_0, cbx_1, cbx_2, ...
const CBOX_ID_PREFIX = 'cbx_'

const onChangeCheckbox = (taskIndex: number, checked: boolean) => {
  if (typeof taskIndex !== 'number' || taskIndex < 0) return
  const lines = content.split('\n')
  let nth = 0
  for (let i = 0; i < lines.length; i++) {
    if (TASK_LINE_RE.test(lines[i])) {
      if (nth === taskIndex) {
        lines[i] = lines[i].replace(
          /\[\s*(x|\s)\s*\]/i,
          checked ? '[x]' : '[ ]'
        )
        const newContent = lines.join('\n')
        if (props.updatedViewText) {
          // #6: use cached frontmatter string instead of re-parsing
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
  viewText,
  (val) => {
    // #6: parse once and cache both content and frontmatter
    const parsed = fm(val)
    content = parsed.body
    frontmatterString = parsed.frontmatter ?? ''
    hasFrontmatter = parsed.bodyBegin > 1
    if (content !== contextView.value) {
      contextView.value = content
      // #1: pass disableLinks via env so the module-level renderer can read it
      outHtml.value = md.render(contextView.value, { disableLinks: props.disableLinks })
    }
  },
  { deep: true, immediate: true }
)

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
