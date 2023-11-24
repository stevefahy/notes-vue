<script setup lang="ts">
import { watch, ref, toRef } from 'vue'
import emoji_defs from '@/core/lib/emoji_definitions'
import type { ViewNoteMarkdownProps } from '@/core/model/global'
import matter from 'gray-matter'
import { Buffer } from 'buffer'
import MarkdownIt from 'markdown-it'
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

globalThis.Buffer = Buffer

// HIGHLIGHTJS
hljs.registerLanguage('javascript', hjls_js)
hljs.registerLanguage('css', hjls_css)
hljs.registerLanguage('markdown', hjls_markdown)
hljs.registerLanguage('md', hjls_markdown)

// MARKDOWN-IT

const md: MarkdownIt = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  langPrefix: 'language-',
  highlight: function (str: any, lang: any) {
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
  disabled: true,
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

// Add target blank to links
// & Change Anchor links to scrollIntoView
// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender =
  md.renderer.rules.link_open ||
  function (tokens: any, idx: any, options: any, env: any, slf: any) {
    return slf.renderToken(tokens, idx, options)
  }

md.renderer.rules.link_open = function (tokens: any, idx: any, options: any, env: any, slf: any) {
  var aIndex = tokens[idx].attrIndex('target')
  var hIndex = tokens[idx].attrIndex('href')
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']) // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank' // replace value of existing attr
  }
  // Change Anchor links to scrollIntoView
  // anchor links were causing page reload
  if (hIndex >= 0) {
    let link_text = tokens[idx].attrs[hIndex][1]
    if (link_text.charAt(0) === '#') {
      tokens[idx].attrs[hIndex][1] = 'javascript: void(0)'
      if (link_text.includes('#user-content-')) {
        link_text = '#' + link_text.substring(14)
      }
      const anchor_link = "'" + link_text + "'"
      return (
        '<span class="md_anchorlink" onclick="document.querySelector(' +
        anchor_link +
        ').scrollIntoView()">'
      )
    }
  }
  return defaultRender(tokens, idx, options, env, slf)
}

md.renderer.rules.link_close = function (tokens: any, idx: any, options: any, env: any, slf: any) {
  var hIndex = tokens[idx].attrIndex('href')
  if (hIndex >= 0) {
    const link_text = tokens[idx].attrs[hIndex][1]
    if (link_text.charAt(0) === '#') {
      // change href
      tokens[idx].attrs[hIndex][1] = 'javascript: void(0)'
      return '</span>'
    }
  }
  return defaultRender(tokens, idx, options, env, slf)
}

// Add class to table
md.renderer.rules.table_open = function () {
  return '<table class="table table-striped">'
}

// Add width and height to images
md.renderer.rules.image = function (tokens: any, idx: any, options: any, env: any, slf: any) {
  var token = tokens[idx]
  token.attrs![token.attrIndex('alt')][1] = slf.renderInlineAsText(token.children!, options, env)
  const size = getSize(token.attrs![token.attrIndex('alt')][1])
  token.attrSet('width', size.width + 'px')
  token.attrSet('height', size.height + 'px')
  return '<span class="image">' + slf.renderToken(tokens, idx, options) + '</span>'
}

// Footnotes enable scrollIntoView instead of Anchor link
md.renderer.rules.footnote_anchor = function (
  tokens: any,
  idx: any,
  options: any,
  env: any,
  slf: any
) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf)
  if (tokens[idx].meta.subId > 0) {
    id += ':' + tokens[idx].meta.subId
  }
  const newid = "'#fnref" + id + "'"
  return (
    '<span class="footnote-backref" onclick="document.querySelector(' +
    newid +
    ').scrollIntoView()" id="fnref' +
    id +
    '">\u21a9\uFE0E</span>'
  )
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
}

md.renderer.rules.footnote_ref = function (
  tokens: any,
  idx: any,
  options: any,
  env: any,
  slf: any
) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf)
  var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf)
  var refid = id
  if (tokens[idx].meta.subId > 0) {
    refid += ':' + tokens[idx].meta.subId
  }
  const newid = "'#fn" + id + "'"
  return (
    '<sup class="footnote-ref"><span onclick="document.querySelector(' +
    newid +
    ').scrollIntoView()" id="fnref' +
    refid +
    '">' +
    caption +
    '</span></sup>'
  )
}

// CUSTOM CONTAINERS

// Custom container that can have styles added
md.use(MarkdownItContainer, 'custom', {
  validate: function (params: any) {
    return params.trim().match(/^custom\s+(.*)$/)
  },
  render: function (tokens: any, idx: any) {
    var m = tokens[idx].info.trim().match(/^custom\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<span style="' + md.utils.escapeHtml(m[1]) + '">\n'
    } else {
      // closing tag
      return '</span>\n'
    }
  }
})

// Custom container that can have css added
md.use(MarkdownItContainer, 'custom-css', {
  validate: function (params: any) {
    return params.trim().match(/^custom-css\s+(.*)$/)
  },
  render: function (tokens: any, idx: any) {
    var m = tokens[idx].info.trim().match(/^custom-css\s+(.*)$/)
    if (tokens[idx].nesting === 1) {
      // opening tag
      return '<span class="' + md.utils.escapeHtml(m[1]) + '">\n'
    } else {
      // closing tag
      return '</span>\n'
    }
  }
})

//  COMPONENT SETUP

const props = defineProps<ViewNoteMarkdownProps>()

let content: string
const contextView = ref<string>('')
const isLoaded = ref<boolean>(false)
const viewText = toRef(props, 'viewText')
const outHtml = ref<string>('')

watch(
  viewText,
  (val) => {
    content = matter(val).content
    if (content !== contextView.value) {
      contextView.value = content
      isLoaded.value = true
      outHtml.value = md.render(contextView.value)
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <span v-html="outHtml"></span>
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

:host .test_imagex {
  display: inline-block;
  vertical-align: top;
}
</style>
