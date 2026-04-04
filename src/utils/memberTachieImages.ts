/**
 * 成員去背立繪（Tachie）
 *
 * 請將圖檔放在 `src/assets/`，檔名：`{memberId}-tachie.png` 或 `{memberId}-tachie.webp`
 * 生日可另放新立繪：`{memberId}-tachie-new.webp`（或 `.png`）
 * 例如：`hinano-tachie.webp` → `hinano`
 *
 * 若同時存在 .png 與 .webp，會優先使用 .webp。
 * 未放置檔案的成員不會出現在表中，畫面上不會渲染立繪。
 */
const tachieGlob = import.meta.glob<string>(
  [
    '../assets/*-tachie.png',
    '../assets/*-tachie.webp',
    '../assets/*-tachie-new.png',
    '../assets/*-tachie-new.webp',
  ],
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
)

function buildMemberImages(): Partial<Record<string, string>> {
  const best = new Map<string, { url: string; ext: 'png' | 'webp' }>()

  for (const path of Object.keys(tachieGlob)) {
    const normalized = path.replace(/\\/g, '/')
    const m = /([^/]+)-tachie\.(png|webp)$/i.exec(normalized)
    if (!m?.[1] || !m[2]) continue
    const id = m[1].toLowerCase()
    const ext = m[2].toLowerCase() as 'png' | 'webp'
    if (ext !== 'png' && ext !== 'webp') continue

    const url = tachieGlob[path]
    const prev = best.get(id)
    if (!prev) {
      best.set(id, { url, ext })
    } else if (prev.ext === 'png' && ext === 'webp') {
      best.set(id, { url, ext })
    }
  }

  return Object.fromEntries([...best.entries()].map(([k, v]) => [k, v.url]))
}

function buildMemberTachieNewImages(): Partial<Record<string, string>> {
  const best = new Map<string, { url: string; ext: 'png' | 'webp' }>()

  for (const path of Object.keys(tachieGlob)) {
    const normalized = path.replace(/\\/g, '/')
    const m = /([^/]+)-tachie-new\.(png|webp)$/i.exec(normalized)
    if (!m?.[1] || !m?.[2]) continue
    const id = m[1].toLowerCase()
    const ext = m[2].toLowerCase() as 'png' | 'webp'
    const url = tachieGlob[path]
    const prev = best.get(id)
    if (!prev) {
      best.set(id, { url, ext })
    } else if (prev.ext === 'png' && ext === 'webp') {
      best.set(id, { url, ext })
    }
  }

  return Object.fromEntries([...best.entries()].map(([k, v]) => [k, v.url]))
}

/** 僅包含有實際圖檔的成員 id */
export const MEMBER_IMAGES: Partial<Record<string, string>> =
  buildMemberImages()

/** 生日用 `-tachie-new` 圖檔（有放檔才會出現） */
export const MEMBER_IMAGES_NEW: Partial<Record<string, string>> =
  buildMemberTachieNewImages()

export function resolveMemberTachieUrl(memberId: string): string | undefined {
  const key = memberId.trim().toLowerCase()
  if (!key) return undefined
  const url = MEMBER_IMAGES[key]
  if (typeof url !== 'string' || url.trim() === '') return undefined
  return url
}

export function resolveMemberTachieNewUrl(memberId: string): string | undefined {
  const key = memberId.trim().toLowerCase()
  if (!key) return undefined
  const url = MEMBER_IMAGES_NEW[key]
  if (typeof url !== 'string' || url.trim() === '') return undefined
  return url
}
