import type { VspoEvent } from './dateUtils'
import { formatEventListDate, formatEventTitle, getMemberName, type UiLang } from './i18n'

type EventVisualMeta = {
  icon: string
  softBgClass: string
  softTextClass: string
  shortLabel: string
}

const DEFAULT_META: EventVisualMeta = {
  icon: '📌',
  softBgClass: 'bg-slate-500/15',
  softTextClass: 'text-slate-200',
  shortLabel: '活動',
}

export function getEventVisualMeta(eventType: string): EventVisualMeta {
  if (eventType === 'birthday') {
    return {
      icon: '🎂',
      softBgClass: 'bg-pink-400/20',
      softTextClass: 'text-pink-100',
      shortLabel: '生日',
    }
  }
  if (eventType === 'anniversary') {
    return {
      icon: '⭐️',
      softBgClass: 'bg-violet-400/20',
      softTextClass: 'text-violet-100',
      shortLabel: '周年',
    }
  }
  if (eventType === '3d_debut' || eventType === 'debut') {
    return {
      icon: '✨',
      softBgClass: 'bg-cyan-400/20',
      softTextClass: 'text-cyan-100',
      shortLabel: '3D 披露',
    }
  }
  if (eventType === 'new_outfit') {
    return {
      icon: '👗',
      softBgClass: 'bg-emerald-400/20',
      softTextClass: 'text-emerald-100',
      shortLabel: '新衣裝',
    }
  }
  return DEFAULT_META
}

export function buildEventTitlePair(event: VspoEvent, uiLang: UiLang): {
  shortTitle: string
  fullTitle: string
} {
  const memberName = getMemberName(event.member, uiLang)
  const visual = getEventVisualMeta(event.type)
  const shortTitle = `${memberName} ${visual.shortLabel}`
  let fullTitle = shortTitle
  if (event.type === 'anniversary') {
    fullTitle = formatEventTitle(memberName, 'anniversary', uiLang, {
      anniversaryYears: event.years ?? 0,
    })
  } else if (event.type === 'birthday') {
    fullTitle = formatEventTitle(memberName, 'birthday', uiLang, {
      birthdayYear: event.date.getFullYear(),
    })
  }
  return { shortTitle, fullTitle }
}

export function buildEventModalDateLabel(event: VspoEvent, uiLang: UiLang): string {
  return formatEventListDate(event.date, uiLang)
}
