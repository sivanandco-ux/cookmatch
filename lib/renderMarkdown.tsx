import type { ReactNode } from 'react'

const INLINE_RE = /(\*\*[^*]+\*\*)|(https?:\/\/[^\s)]+)/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let idx = 0
  for (const match of text.matchAll(INLINE_RE)) {
    const full = match[0]
    const start = match.index ?? 0
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start))
    if (full.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-${idx++}`}>{full.slice(2, -2)}</strong>)
    } else {
      nodes.push(
        <a key={`${keyPrefix}-${idx++}`} href={full} target="_blank" rel="noopener noreferrer" className="underline break-all">
          {full}
        </a>
      )
    }
    lastIndex = start + full.length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

// Renders a small subset of markdown (bold, numbered/bullet lists, links) that
// Claude's responses commonly use — chat bubbles otherwise show literal
// "**text**" and "1. ..." instead of actual formatting.
export function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null
  let paragraphLines: string[] = []
  let blockIdx = 0

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      const joined = paragraphLines.join(' ')
      blocks.push(
        <p key={`p-${blockIdx++}`} className="mb-2 last:mb-0">
          {renderInline(joined, `p-${blockIdx}`)}
        </p>
      )
      paragraphLines = []
    }
  }

  function flushList() {
    if (currentList) {
      const items = currentList.items
      const isOrdered = currentList.type === 'ol'
      blocks.push(
        isOrdered ? (
          <ol key={`l-${blockIdx++}`} className="list-decimal pl-5 mb-2 last:mb-0 flex flex-col gap-1">
            {items.map((item, i) => <li key={i}>{renderInline(item, `li-${blockIdx}-${i}`)}</li>)}
          </ol>
        ) : (
          <ul key={`l-${blockIdx++}`} className="list-disc pl-5 mb-2 last:mb-0 flex flex-col gap-1">
            {items.map((item, i) => <li key={i}>{renderInline(item, `li-${blockIdx}-${i}`)}</li>)}
          </ul>
        )
      )
      currentList = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { flushParagraph(); flushList(); continue }

    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/)
    const bulletMatch = line.match(/^[-*•]\s+(.*)/)

    if (numberedMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ol') { flushList(); currentList = { type: 'ol', items: [] } }
      currentList.items.push(numberedMatch[1])
    } else if (bulletMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ul') { flushList(); currentList = { type: 'ul', items: [] } }
      currentList.items.push(bulletMatch[1])
    } else {
      flushList()
      paragraphLines.push(line)
    }
  }
  flushParagraph()
  flushList()

  return <>{blocks}</>
}
