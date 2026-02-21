<script setup lang="ts">
import { watch, ref, toRef } from 'vue'
import emoji_defs from '@/core/lib/emoji_definitions'
import type { ViewNoteMarkdownProps } from '@/core/model/global'
import matter from 'gray-matter'
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
import hljs from 'highlight.js/lib/core'
import hjls_js from 'highlight.js/lib/languages/javascript'
import hjls_css from 'highlight.js/lib/languages/css'
import hjls_markdown from 'highlight.js/lib/languages/markdown'

// HIGHLIGHTJS
hljs.registerLanguage('javascript', hjls_js)
hljs.registerLanguage('css', hjls_css)
hljs.registerLanguage('markdown', hjls_markdown)
hljs.registerLanguage('md', hjls_markdown)

// MARKDOWN-IT

const md: MarkdownIt = MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  langPrefix: 'language-',
  breaks: false,
  highlight: function (str: string, lang: string | undefined) {
    if (lang && hljs.getLanguage(lang)) {
      return (
        '<pre class="hljs"><code>' +
        hljs.highlight(str, { language: lang, ignoreIllegals: false }).value +
        '</code></pre><p>' +
        lang +
        '</p>'
      )
    }
    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre><p>' + lang + '</p>'
    )
  }
})

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
  divClass: 'checkbox',
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

// Add target="_blank" to external links.
// Convert anchor links (#fragment) to data-scroll-target spans to avoid page reload.
// Remember old renderer, if overridden, or proxy to default renderer
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens: Token[], idx: number, options: Options, _env: Record<string, unknown>, slf: typeof md.renderer) {
    return slf.renderToken(tokens, idx, options)
  }

md.renderer.rules.link_open = function (tokens: Token[], idx: number, options: Options, env: Record<string, unknown>, slf: typeof md.renderer) {
  // #1: disableLinks — strip all links in thumbnail/preview mode
  if (env.disableLinks) {
    return '<span>'
  }
  const aIndex = tokens[idx].attrIndex('target')
  const hIndex = tokens[idx].attrIndex('href')
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']) // add new attribute
  } else {
    const attrs = tokens[idx].attrs
    if (attrs && attrs[aIndex]) {
      attrs[aIndex][1] = '_blank' // replace value of existing attr
    }
  }
  // Change anchor links to data-scroll-target spans (avoid page reload)
  if (hIndex >= 0) {
    const attrs = tokens[idx].attrs
    if (attrs && attrs[hIndex]) {
      let link_text = attrs[hIndex][1]
      if (link_text && link_text.charAt(0) === '#') {
        if (link_text.includes('#user-content-')) {
          link_text = '#' + link_text.substring(14)
        }
        // #2: track open state in env so link_close emits </span>
        env.anchorOpen = true
        // #4: data-* attribute instead of inline onclick; #11: escape user value; #12: tabindex
        return (
          '<span class="md_anchorlink" data-scroll-target="' +
          md.utils.escapeHtml(link_text) +
          '" tabindex="0" role="link">'
        )
      }
    }
  }
  return defaultRender(tokens, idx, options, env, slf)
}

// #2: link_close — emit </span> when the matching open was an anchor span or disabled link
md.renderer.rules.link_close = function (tokens: Token[], idx: number, options: Options, env: Record<string, unknown>, slf: typeof md.renderer) {
  if (env.disableLinks) {
    return '</span>'
  }
  if (env.anchorOpen) {
    env.anchorOpen = false
    return '</span>'
  }
  return defaultRender(tokens, idx, options, env, slf)
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

// Footnotes: use data-scroll-target instead of inline onclick (#4), fix duplicate IDs (#3)
md.renderer.rules.footnote_anchor = function (
  tokens: Token[],
  idx: number,
  options: Options,
  env: Record<string, unknown>,
  slf: typeof md.renderer
) {
  let id = slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) || ''
  if (tokens[idx].meta.subId > 0) {
    id += ':' + tokens[idx].meta.subId
  }
  // #3: use unique id "fnref{id}-return" to avoid duplicate with footnote_ref's "fnref{id}"
  // #4: data-scroll-target replaces inline onclick; #11: escape id; #12: tabindex
  return (
    '<span class="footnote-backref" data-scroll-target="' +
    md.utils.escapeHtml('#fnref' + id) +
    '" id="fnref' +
    md.utils.escapeHtml(id) +
    '-return" tabindex="0" role="link">\u21a9\uFE0E</span>'
  )
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
}

md.renderer.rules.footnote_ref = function (
  tokens: Token[],
  idx: number,
  options: Options,
  env: Record<string, unknown>,
  slf: typeof md.renderer
) {
  const id = slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) || ''
  const caption = slf.rules.footnote_caption?.(tokens, idx, options, env, slf) || ''
  let refid = id
  if (tokens[idx].meta.subId > 0) {
    refid += ':' + tokens[idx].meta.subId
  }
  // #4: data-scroll-target replaces inline onclick; #11: escape id; #12: tabindex
  return (
    '<sup class="footnote-ref"><span data-scroll-target="' +
    md.utils.escapeHtml('#fn' + id) +
    '" id="fnref' +
    md.utils.escapeHtml(refid) +
    '" tabindex="0" role="link">' +
    caption +
    '</span></sup>'
  )
}

// CUSTOM CONTAINERS

// Custom container that can have styles added
md.use(MarkdownItContainer, 'custom', {
  validate: function (params: string) {
    return params.trim().match(/^custom\s+(.*)$/)
  },
  render: function (tokens: Token[], idx: number) {
    const m = tokens[idx].info.trim().match(/^custom\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<span style="' + md.utils.escapeHtml(m?.[1] || '') + '">\n'
    } else {
      // closing tag
      return '</span>\n'
    }
  }
})

// Custom container that can have css added
md.use(MarkdownItContainer, 'custom-css', {
  validate: function (params: string) {
    return params.trim().match(/^custom-css\s+(.*)$/)
  },
  render: function (tokens: Token[], idx: number) {
    const m = tokens[idx].info.trim().match(/^custom-css\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<span class="' + md.utils.escapeHtml(m?.[1] || '') + '">\n'
    } else {
      // closing tag
      return '</span>\n'
    }
  }
})

//  COMPONENT SETUP

const props = defineProps<ViewNoteMarkdownProps>()
const updatedViewText = toRef(props, 'updatedViewText')

let content: string
// #6: cache parsed frontmatter so onChangeCheckbox avoids a second matter() call
let frontmatterData: Record<string, unknown> = {}
const contextView = ref<string>('')
const isLoaded = ref<boolean>(false)
const viewText = toRef(props, 'viewText')
const outHtml = ref<string>('')

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
          // #6: use cached frontmatterData instead of re-parsing
          const updatedFull =
            Object.keys(frontmatterData).length > 0
              ? matter.stringify(newContent, frontmatterData)
              : newContent
          props.updatedViewText(updatedFull)
        }
        return
      }
      nth++
    }
  }
}

// #4: helper — scroll an element identified by its data-scroll-target attribute
const scrollToTarget = (el: HTMLElement) => {
  const target = el.dataset.scrollTarget
  if (target) {
    document.querySelector(target)?.scrollIntoView()
  }
}

const onCheckboxClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // #4: handle scroll targets (anchor links, footnote refs, footnote back-refs)
  const scrollEl = target.closest('[data-scroll-target]') as HTMLElement | null
  if (scrollEl) {
    scrollToTarget(scrollEl)
    return
  }
  if (!props.updatedViewText) return
  if (
    target.tagName !== 'INPUT' ||
    (target as HTMLInputElement).type !== 'checkbox'
  ) {
    return
  }
  const id = (target as HTMLInputElement).id
  if (!id || !id.startsWith(CBOX_ID_PREFIX)) return
  const taskIndex = parseInt(id.slice(CBOX_ID_PREFIX.length), 10)
  if (isNaN(taskIndex) || taskIndex < 0) return
  const checked = (target as HTMLInputElement).checked
  onChangeCheckbox(taskIndex, checked)
}

// #12: keyboard navigation for focusable scroll-target elements (Enter / Space)
const onMarkdownKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const target = event.target as HTMLElement
  if (target.dataset.scrollTarget) {
    event.preventDefault()
    scrollToTarget(target)
  }
}

watch(
  viewText,
  (val) => {
    // #6: parse once and cache both content and frontmatter
    const parsed = matter(val)
    content = parsed.content
    frontmatterData = parsed.data
    if (content !== contextView.value) {
      contextView.value = content
      isLoaded.value = true
      // #1: pass disableLinks via env so the module-level renderer can read it
      outHtml.value = md.render(contextView.value, { disableLinks: props.disableLinks })
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <span class="md-rendered" :class="{ 'md-readonly': !updatedViewText }" @click="onCheckboxClick" @keydown="onMarkdownKeydown">
    <span v-html="outHtml"></span>
  </span>
</template>

<style scoped>
.task-list input[type="checkbox"] {
  cursor: pointer;
  margin-right: 0.25em;
}

.md-readonly .task-list input[type="checkbox"] {
  pointer-events: none;
  cursor: default;
}

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

:host .test_imagex {
  display: inline-block;
  vertical-align: top;
}
</style>
