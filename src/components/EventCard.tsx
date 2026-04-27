import { memo, useCallback, useState } from 'react'
import type { VspoEvent } from '../utils/dateUtils'
import {
  formatEventListDate,
  getMemberName,
  type UiLang,
} from '../utils/i18n'
import { EventActionModal } from './EventActionModal'
import {
  buildEventModalDateLabel,
  buildEventTitlePair,
  getEventVisualMeta,
} from '../utils/eventVisuals'

export type EventCardProps = {
  event: VspoEvent
  isCurrent: boolean
  /** 穩定引用，由父層 useCallback 提供 */
  onSelect: (event: VspoEvent) => void
  uiLang: UiLang
  /** 與 getEventModalCardDomId(eventKey) 一致，供捲動錨定 */
  domId: string
}

function isLightThemeColor(hex: string): boolean {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6 || !/^[0-9a-f]+$/i.test(h)) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.72
}

function EventCardAvatar({
  imageUrl,
  themeColor,
  displayName,
}: {
  imageUrl: string
  themeColor: string
  displayName: string
}) {
  const [hasImageError, setHasImageError] = useState(false)
  const normalizedImageUrl = imageUrl.trim().replace(/^http:\/\//i, 'https://')
  const shouldShowImage = normalizedImageUrl.length > 0 && !hasImageError
  const initial = displayName.charAt(0)

  if (shouldShowImage) {
    return (
      <img
        src={normalizedImageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover object-center ring-1 ring-white/15"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
      />
    )
  }

  const lightBg = isLightThemeColor(themeColor)

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-inner ring-1 ring-white/15 ${
        lightBg
          ? 'text-slate-900'
          : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]'
      }`}
      style={{ backgroundColor: themeColor }}
      aria-hidden
    >
      <span>{initial}</span>
    </div>
  )
}

function EventCardInner({
  event,
  isCurrent,
  onSelect,
  uiLang,
  domId,
}: EventCardProps) {
  const { member, date, type } = event
  const theme = member.themeColor
  const memberLabel = getMemberName(member, uiLang)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const visual = getEventVisualMeta(type)
  const { shortTitle, fullTitle } = buildEventTitlePair(event, uiLang)

  const handleClick = useCallback(() => {
    onSelect(event)
    setIsActionModalOpen(true)
  }, [onSelect, event])

  return (
    <>
      <button
        type="button"
        id={domId}
        onClick={handleClick}
        className={`group relative flex w-full overflow-hidden rounded-lg border border-white/10 bg-white/5 text-left transform-gpu transition-transform transition-colors transition-shadow duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/80 active:scale-95 ${
          isCurrent
            ? 'ring-2 shadow-[0_0_15px_rgba(34,211,238,0.45)]'
            : ''
        }`}
        style={
          isCurrent
            ? ({ '--tw-ring-color': theme } as { [k: string]: string })
            : undefined
        }
      >
        <span
          className="w-1 shrink-0 self-stretch"
          style={{ backgroundColor: theme }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div
            className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${visual.softBgClass} ${visual.softTextClass}`}
          >
            <span>{visual.icon}</span>
            <span>{visual.shortLabel}</span>
          </div>
          <div className="mt-2 text-sm font-bold text-center text-white/95 line-clamp-2" title={fullTitle}>
            {shortTitle}
          </div>
          <div className="border-b border-slate-700 my-2" />
          <div className="flex items-center justify-between">
            <div
              className="text-xs font-semibold"
              style={{ color: theme }}
            >
              {formatEventListDate(date, uiLang)}
            </div>
            <div className="w-8 h-8">
              <EventCardAvatar
                imageUrl={member.image_url}
                themeColor={theme}
                displayName={memberLabel}
              />
            </div>
          </div>
        </div>
      </button>
      <EventActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        icon={visual.icon}
        typeLabel={visual.shortLabel}
        imageUrl={member.image_url}
        title={fullTitle}
        dateLabel={buildEventModalDateLabel(event, uiLang)}
      />
    </>
  )
}

export const EventCard = memo(EventCardInner)
