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
import { sanitizeCustomContainerStyles, sanitizeCustomCssClasses, sanitizeMarkdownTargetId } from '@/core/lib/markdownSafeStyles'

const langAliases: Record<string, string> = { md: 'markdown' }

/**
 * Builds the markdown-it instance (lazy-loaded with Prism + emoji map for smaller initial chunks).
 */
export async function createViewNoteMarkdownEngine(): Promise<MarkdownIt> {
  const [{ default: Prism }, { default: emoji_defs }] = await Promise.all([
    import('prismjs'),
    import('@/core/lib/emoji_definitions')
  ])
  await Promise.all([
    import('prismjs/components/prism-javascript'),
    import('prismjs/components/prism-css'),
    import('prismjs/components/prism-markdown')
  ])

  const md: MarkdownIt = MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    langPrefix: 'language-',
    breaks: false,
    highlight: function (str: string, lang: string | undefined) {
      const prismLang = lang ? langAliases[lang] || lang : undefined
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
      return '<pre><code>' + md.utils.escapeHtml(str) + '</code></pre><p>' + (lang || '') + '</p>'
    }
  })

  md.inline.ruler.push('html_br', (state, silent) => {
    if (state.src.slice(state.pos, state.pos + 4) === '<br>') {
      if (!silent) {
        state.push('hardbreak', 'br', 0)
      }
      state.pos += 4
      return true
    }
    if (state.src.slice(state.pos, state.pos + 5) === '<br/>') {
      if (!silent) {
        state.push('hardbreak', 'br', 0)
      }
      state.pos += 5
      return true
    }
    return false
  })

  md.use(markdownItEmoji, { defs: emoji_defs })
  md.use(markdownItFootnote)
  md.use(markdownItSub)
  md.use(markdownItSup)
  md.use(markdownItIns)
  md.use(markdownItMark)
  md.use(markdownItAbbr)
  md.use(markdownItAttrs, {
    leftDelimiter: 'xx',
    rightDelimiter: 'xx',
    // markdown-it-attrs: empty allowedAttributes here does not open arbitrary HTML; combined with html:false, attributes apply only to markdown tokens (see plugin docs).
    allowedAttributes: []
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

  const anchorLinkStack: boolean[] = []
  const defaultLinkOpen = md.renderer.rules.link_open

  md.renderer.rules.link_open = function (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    slf: typeof md.renderer
  ) {
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
      defaultLinkOpen?.(tokens, idx, options, env, slf) ?? slf.renderToken(tokens, idx, options)
    )
  }

  const defaultLinkClose = md.renderer.rules.link_close

  md.renderer.rules.link_close = function (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    slf: typeof md.renderer
  ) {
    if (env.disableLinks) {
      anchorLinkStack.pop()
      return ''
    }
    const wasAnchor = anchorLinkStack.pop()
    if (wasAnchor) {
      return '</span>'
    }
    return (
      defaultLinkClose?.(tokens, idx, options, env, slf) ?? slf.renderToken(tokens, idx, options)
    )
  }

  md.renderer.rules.table_open = function () {
    return '<table class="table table-striped">'
  }

  md.renderer.rules.image = function (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    slf: typeof md.renderer
  ) {
    const token = tokens[idx]
    const altIdx = token.attrIndex('alt')
    if (!token.attrs || altIdx < 0) return slf.renderToken(tokens, idx, options)
    token.attrs[altIdx][1] = slf.renderInlineAsText(token.children!, options, env)
    const size = getSize(token.attrs[altIdx][1])
    token.attrSet('width', size.width + 'px')
    token.attrSet('height', size.height + 'px')
    return '<span class="image">' + slf.renderToken(tokens, idx, options) + '</span>'
  }

  md.renderer.rules.footnote_anchor = function (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    slf: typeof md.renderer
  ) {
    const id =
      (slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? '') +
      (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0 ? ':' + tokens[idx].meta.subId : '')
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
    const id = slf.rules.footnote_anchor_name?.(tokens, idx, options, env, slf) ?? ''
    const caption = slf.rules.footnote_caption?.(tokens, idx, options, env, slf) ?? ''
    const refid =
      id + (tokens[idx].meta?.subId && tokens[idx].meta.subId > 0 ? ':' + tokens[idx].meta.subId : '')
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

  return md
}

function getSize(node: string) {
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
