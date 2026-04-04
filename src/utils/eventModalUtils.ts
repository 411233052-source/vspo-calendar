import {
  getEventMemberId,
  getJSTWallClockParts,
  jstMidnight,
  type VspoEvent,
} from './dateUtils'
import {
  formatEventListDate,
  getMemberName,
  t,
  type UiLang,
} from './i18n'

export type EventTypeFilter = 'birthday' | 'anniversary'

export type EventSectionKey =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'next_month'
  | 'two_three_months'
  | 'three_six_months'
  | 'six_nine_months'
  | 'nine_plus_months'

function sectionLabel(key: EventSectionKey, uiLang: UiLang): string {
  if (key === 'today') return t(uiLang, 'eventModal.sectionToday')
  if (key === 'this_week') return t(uiLang, 'eventModal.sectionThisWeek')
  if (key === 'this_month') return t(uiLang, 'eventModal.sectionThisMonth')
  if (key === 'next_month') return t(uiLang, 'eventModal.sectionNextMonth')
  if (key === 'two_three_months')
    return t(uiLang, 'eventModal.sectionTwoThreeMonths')
  if (key === 'three_six_months')
    return t(uiLang, 'eventModal.sectionThreeSixMonths')
  if (key === 'six_nine_months')
    return t(uiLang, 'eventModal.sectionSixNineMonths')
  return t(uiLang, 'eventModal.sectionNinePlusMonths')
}

function monthDiffJst(a: Date, b: Date): number {
  const pa = getJSTWallClockParts(a)
  const pb = getJSTWallClockParts(b)
  return (pb.year - pa.year) * 12 + (pb.monthIndex - pa.monthIndex)
}

export function groupEventsByTimelineWindow(
  events: VspoEvent[],
  now: Date,
  lang: UiLang,
): { key: EventSectionKey; label: string; events: VspoEvent[] }[] {
  const pNow = getJSTWallClockParts(now)
  const startOfNow = jstMidnight(pNow.year, pNow.monthIndex, pNow.day)
  const dayMs = 24 * 60 * 60 * 1000
  const weekEnd = new Date(startOfNow.getTime() + 7 * dayMs)

  const groups: { key: EventSectionKey; label: string; events: VspoEvent[] }[] =
    [
      { key: 'today', label: sectionLabel('today', lang), events: [] },
      { key: 'this_week', label: sectionLabel('this_week', lang), events: [] },
      { key: 'this_month', label: sectionLabel('this_month', lang), events: [] },
      { key: 'next_month', label: sectionLabel('next_month', lang), events: [] },
      {
        key: 'two_three_months',
        label: sectionLabel('two_three_months', lang),
        events: [],
      },
      {
        key: 'three_six_months',
        label: sectionLabel('three_six_months', lang),
        events: [],
      },
      {
        key: 'six_nine_months',
        label: sectionLabel('six_nine_months', lang),
        events: [],
      },
      {
        key: 'nine_plus_months',
        label: sectionLabel('nine_plus_months', lang),
        events: [],
      },
    ]

  events.forEach((event) => {
    const pe = getJSTWallClockParts(event.date)
    const eventDay = jstMidnight(pe.year, pe.monthIndex, pe.day)
    const diffDays = Math.floor(
      (eventDay.getTime() - startOfNow.getTime()) / dayMs,
    )
    const mDiff = monthDiffJst(startOfNow, eventDay)

    if (diffDays === 0) {
      groups[0].events.push(event)
    } else if (diffDays > 0 && eventDay < weekEnd) {
      groups[1].events.push(event)
    } else if (mDiff === 0) {
      groups[2].events.push(event)
    } else if (mDiff === 1) {
      groups[3].events.push(event)
    } else if (mDiff >= 2 && mDiff <= 3) {
      groups[4].events.push(event)
    } else if (mDiff > 3 && mDiff <= 6) {
      groups[5].events.push(event)
    } else if (mDiff > 6 && mDiff <= 9) {
      groups[6].events.push(event)
    } else {
      groups[7].events.push(event)
    }
  })

  return groups.filter((g) => g.events.length > 0)
}

export function eventTypeCategory(
  event: VspoEvent,
): EventTypeFilter | null {
  if (event.type === 'birthday') return 'birthday'
  if (event.type === 'anniversary') return 'anniversary'
  return null
}

export function eventSearchBlob(event: VspoEvent, lang: UiLang): string {
  const { member, date, type, years } = event
  const y = years != null ? String(years) : ''
  const nZh = member.name_zh ?? ''
  return [
    member.name_jp,
    member.name_en,
    nZh,
    getMemberName(member, lang),
    member.generation,
    formatEventListDate(date, lang),
    String(getJSTWallClockParts(date).year),
    type,
    y,
  ]
    .join(' ')
    .toLowerCase()
}

export function passesTypeFilters(
  event: VspoEvent,
  selected: EventTypeFilter[],
): boolean {
  if (selected.length === 0) return true
  const cat = eventTypeCategory(event)
  if (!cat) return false
  return selected.includes(cat)
}

/** 與 EventModal 卡片 key / scroll 錨點一致 */
export function getEventModalCardKey(event: VspoEvent): string {
  return `${event.type}-${getEventMemberId(event)}-${event.date.getTime()}`
}

/** 供卡片 button id 與 scrollIntoView 使用（合法 HTML id 字元） */
export function getEventModalCardDomId(eventKey: string): string {
  const safe = eventKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `event-modal-card-${safe}`
}
