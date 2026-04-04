import membersJson from '../data/vspo_members.json'
import historyEventsData from '../data/vspo_history.json'

/** Row shape in `vspo_members.json` (optional camelCase overrides) */
type VspoMemberFileRow = {
  id?: string
  member_id?: string
  name_jp: string
  name_en: string
  name_zh?: string
  generation: string
  birthday: string
  debut_date: string
  color: string
  image_url: string
  imageUrl?: string
  themeColor?: string
  youtube_url?: string
}

export type VspoMember = {
  id: string
  name_jp: string
  name_en: string
  /** 繁中顯示名；未填時 UI 會回退為 name_jp */
  name_zh?: string
  generation: string
  birthday: string // MM-DD
  debut_date: string // YYYY-MM-DD
  color: string // Hex (legacy / 通用底色)
  image_url: string // 與 imageUrl 同步，供既有元件使用
  imageUrl: string // 立繪或背景圖（優先用於主畫面）
  themeColor: string // 代表色（進度條、陰影等 UI 強調）
  youtube_url?: string
}

function normalizeMember(m: VspoMemberFileRow): VspoMember {
  const id = String((m.id ?? m.member_id) ?? '').trim()
  const url = ((m.imageUrl ?? m.image_url) ?? '').trim()
  const theme =
    ((m.themeColor ?? m.color) ?? '#64748b').trim() || '#64748b'
  const nameZh = m.name_zh?.trim()
  return {
    ...m,
    id,
    name_zh: nameZh || undefined,
    image_url: (m.image_url && m.image_url.trim()) || url,
    imageUrl: url,
    themeColor: theme,
  }
}

export const members: VspoMember[] = (membersJson as VspoMemberFileRow[]).map(
  normalizeMember,
)

export type NextBirthdayResult = {
  member: VspoMember
  targetDate: Date
}

export interface VspoEvent {
  type: 'birthday' | 'anniversary' | 'debut' | '3d_debut' | (string & {})
  date: Date
  member: VspoMember
  /** 與 member.id 一致；立繪／比對用，避免僅依賴 member 參照時遺失 id */
  memberId: string
  years?: number // 周年数（仅用于 anniversary）
}

export function getEventMemberId(event: VspoEvent): string {
  const fromField = event.memberId?.trim()
  if (fromField) return fromField
  return (event.member?.id ?? '').trim()
}

/** 日本（Asia/Tokyo）における暦の年月日・時分秒 */
export function getJSTWallClockParts(instant: Date): {
  year: number
  monthIndex: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    Number(p.find((x) => x.type === t)?.value ?? 0)
  return {
    year: g('year'),
    monthIndex: g('month') - 1,
    day: g('day'),
    hour: g('hour'),
    minute: g('minute'),
    second: g('second'),
  }
}

/**
 * 指定 JST 暦日の 00:00:00（日本）に対応する ECMAScript 瞬間。
 */
export function jstMidnight(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(Date.UTC(year, monthIndex, day, -9, 0, 0, 0))
}

function jstCalendarWeekday(
  year: number,
  monthIndex: number,
  day: number,
): number {
  const noonUtcMs =
    jstMidnight(year, monthIndex, day).getTime() + 12 * 60 * 60 * 1000
  return new Date(noonUtcMs).getUTCDay()
}

function daysInJstMonth(year: number, monthIndex: number): number {
  const a = jstMidnight(year, monthIndex, 1).getTime()
  const b = jstMidnight(year, monthIndex + 1, 1).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * 現在の実瞬間。カウントダウンは getTime() で UTC ミリ秒差分を取る。
 * （toLocaleString を再パースする方法は環境により誤るため使わない。）
 */
export function getJSTNow(): Date {
  return new Date()
}

function startOfDay(d: Date) {
  const { year, monthIndex, day } = getJSTWallClockParts(d)
  return jstMidnight(year, monthIndex, day)
}

function parseMonthDay(mmdd: string) {
  const [mm, dd] = mmdd.split('-').map((x) => Number(x))
  return { monthIndex: mm - 1, day: dd }
}

/** YYYY-MM-DD を JST 暦のその日 0 時として解釈 */
function parseYmdToJstMidnight(ymd: string) {
  const [yy, mm, dd] = ymd.split('-').map((x) => Number(x))
  return jstMidnight(yy, mm - 1, dd)
}

function nextOccurrenceFrom(nowInstant: Date, birthdayMmDd: string) {
  const { year } = getJSTWallClockParts(nowInstant)
  const { monthIndex, day } = parseMonthDay(birthdayMmDd)
  const thisYear = jstMidnight(year, monthIndex, day)
  if (nowInstant.getTime() < thisYear.getTime()) return thisYear
  return jstMidnight(year + 1, monthIndex, day)
}

/** デビュー月日の次回記念日（JST 0 時基準） */
function nextAnniversaryOccurrenceFrom(nowInstant: Date, debut: Date): Date {
  const { monthIndex: dm, day: dd } = getJSTWallClockParts(debut)
  const { year } = getJSTWallClockParts(nowInstant)
  const thisYearAnniversary = jstMidnight(year, dm, dd)
  if (nowInstant.getTime() < thisYearAnniversary.getTime())
    return thisYearAnniversary
  return jstMidnight(year + 1, dm, dd)
}

/**
 * Recompute this event's target date from a reference time (e.g. real "now").
 * Use when selecting from the calendar: sidebar events may use the month's
 * reference date, so the date can lag behind the true next occurrence.
 */
export function resolveEventToNextOccurrence(
  event: VspoEvent,
  now = getJSTNow(),
): VspoEvent {
  const memberId = getEventMemberId(event)
  const member = event.member

  if (event.type === 'birthday') {
    const d = startOfDay(nextOccurrenceFrom(now, member.birthday))
    return { ...event, date: d, memberId }
  }

  if (event.type === 'anniversary' && member.debut_date) {
    const debut = parseYmdToJstMidnight(member.debut_date)
    const debutYear = getJSTWallClockParts(debut).year
    const next = startOfDay(nextAnniversaryOccurrenceFrom(now, debut))
    const years = Math.max(1, getJSTWallClockParts(next).year - debutYear)
    return { ...event, date: next, years, memberId }
  }

  return { ...event, memberId }
}

// Anniversary calculation intentionally kept out of data source for now.
// We keep `VspoEvent['type']` and UI branches compatible so we can re-enable
// anniversaries later without refactoring.

/**
 * Get all upcoming events (birthdays and anniversaries) sorted by date.
 */
export function getAllUpcomingEvents(now = getJSTNow()): VspoEvent[] {
  const events: VspoEvent[] = []

  ;(members as VspoMember[]).forEach((member) => {
    // Add birthday event
    const nextBirthday = nextOccurrenceFrom(now, member.birthday)
    events.push({
      type: 'birthday',
      date: startOfDay(nextBirthday),
      member,
      memberId: member.id,
    })

    // Add anniversary event based on debut date
    if (member.debut_date) {
      const debut = parseYmdToJstMidnight(member.debut_date)
      const debutYear = getJSTWallClockParts(debut).year
      const nextAnniversary = startOfDay(nextAnniversaryOccurrenceFrom(now, debut))
      const years = getJSTWallClockParts(nextAnniversary).year - debutYear

      if (years >= 1) {
        events.push({
          type: 'anniversary',
          date: nextAnniversary,
          member,
          memberId: member.id,
          years,
        })
      }
    }
  })

  // Sort by date (ascending)
  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Ensure events are sorted Jan→Dec (chronological) for navigation index.
 * Does not mutate the input array.
 */
export function sortEventsChronologically(events: VspoEvent[]): VspoEvent[] {
  return [...events].sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Index in `events` of the earliest upcoming event for this member (by date).
 */
export function findIndexOfEarliestEventForMember(
  events: VspoEvent[],
  memberId: string,
): number {
  let bestIdx = -1
  let bestTime = Infinity
  events.forEach((e, i) => {
    if (getEventMemberId(e) !== memberId) return
    const t = e.date.getTime()
    if (t < bestTime) {
      bestTime = t
      bestIdx = i
    }
  })
  return bestIdx
}

function daysInYear(year: number): number {
  const isLeap =
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return isLeap ? 366 : 365
}

/**
 * Day of year 1..365/366 for the given instant's JST calendar date.
 */
export function getDayOfYear(date: Date): number {
  const { year, monthIndex, day } = getJSTWallClockParts(date)
  const start = jstMidnight(year, 0, 1).getTime()
  const cur = jstMidnight(year, monthIndex, day).getTime()
  return Math.floor((cur - start) / 86_400_000) + 1
}

/**
 * Progress through the event date's year (0–100) for the top timeline bar.
 */
export function getYearTimelinePercent(date: Date): number {
  const y = getJSTWallClockParts(date).year
  const doy = getDayOfYear(date)
  const total = daysInYear(y)
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (doy / total) * 100))
}

/**
 * Find the next upcoming event (birthday or anniversary) from the provided time.
 * The target date is at local time 00:00:00 of that event.
 */
export function getNextUpcomingEvent(now = getJSTNow()): {
  event: VspoEvent
  targetDate: Date
} {
  const allEvents = getAllUpcomingEvents(now)
  if (allEvents.length === 0) {
    throw new Error('No events found in vspo_members.json')
  }
  const nextEvent = allEvents[0]
  return { event: nextEvent, targetDate: nextEvent.date }
}

/**
 * Find the next upcoming birthday from the provided time (handles cross-year).
 * The target date is at local time 00:00:00 of that birthday.
 * @deprecated Use getNextUpcomingEvent() instead for events including anniversaries
 */
export function getNextUpcomingBirthday(now = getJSTNow()): NextBirthdayResult {
  const baseNow = now
  const candidates = (members as VspoMember[]).map((m) => {
    const targetDate = nextOccurrenceFrom(baseNow, m.birthday)
    return { member: m, targetDate }
  })

  candidates.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())

  // If there are no members, throw early (shouldn't happen in normal usage)
  const next = candidates[0]
  if (!next) {
    throw new Error('No members found in vspo_members.json')
  }

  // normalize just in case, keep it as start-of-day
  return { member: next.member, targetDate: startOfDay(next.targetDate) }
}

/**
 * Get the next birthday for a specific member by ID.
 */
export function getNextBirthdayByMemberId(
  memberId: string,
  now = getJSTNow(),
): NextBirthdayResult {
  const member = (members as VspoMember[]).find((m) => m.id === memberId)
  if (!member) {
    throw new Error(`Member with id "${memberId}" not found`)
  }

  const targetDate = nextOccurrenceFrom(now, member.birthday)
  return { member, targetDate: startOfDay(targetDate) }
}

/**
 * Get a member by ID.
 */
export function getMemberById(memberId: string): VspoMember | undefined {
  return (members as VspoMember[]).find((m) => m.id === memberId)
}

export type CalendarDay = {
  date: Date | null // null for empty cells
  day: number | null // day number, null for empty cells
  isCurrentMonth: boolean
  isToday: boolean
  birthdays: VspoMember[] // members with birthday on this day
  events: VspoEvent[] // all events (birthdays and anniversaries) on this day
}

/**
 * Generate calendar array for a given year and month.
 * Returns a 7xN grid (7 columns for days of week, N rows for weeks).
 */
export function generateCalendar(
  year: number,
  month: number, // 0-11 (0 = January)
): CalendarDay[] {
  const firstDayOfWeek = jstCalendarWeekday(year, month, 1)
  const daysInMonth = daysInJstMonth(year, month)

  const calendar: CalendarDay[] = []
  const today = getJSTWallClockParts(getJSTNow())
  const isViewingCurrentMonth =
    today.year === year && today.monthIndex === month

  // Get all events for this month
  const monthEvents = getEventsForMonth(year, month)
  const eventsByDay = new Map<number, VspoEvent[]>()
  monthEvents.forEach((event) => {
    const day = getJSTWallClockParts(event.date).day
    if (!eventsByDay.has(day)) {
      eventsByDay.set(day, [])
    }
    eventsByDay.get(day)!.push(event)
  })

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendar.push({
      date: null,
      day: null,
      isCurrentMonth: false,
      isToday: false,
      birthdays: [],
      events: [],
    })
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = jstMidnight(year, month, day)
    const isToday = isViewingCurrentMonth && today.day === day

    // Find members with birthday on this day
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const birthdayKey = `${monthStr}-${dayStr}`

    const birthdays = (members as VspoMember[]).filter(
      (m) => m.birthday === birthdayKey,
    )

    // Get events for this day
    const dayEvents = eventsByDay.get(day) || []

    calendar.push({
      date,
      day,
      isCurrentMonth: true,
      isToday,
      birthdays,
      events: dayEvents,
    })
  }

  // Fill remaining cells to make a complete grid (multiple of 7)
  const remainingCells = 7 - (calendar.length % 7)
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      calendar.push({
        date: null,
        day: null,
        isCurrentMonth: false,
        isToday: false,
        birthdays: [],
        events: [],
      })
    }
  }

  return calendar
}

/**
 * Get all events (birthdays and anniversaries) for a specific month.
 */
export function getEventsForMonth(
  year: number,
  month: number, // 0-11
): VspoEvent[] {
  const ref = jstMidnight(year, month, 1)
  const allEvents = getAllUpcomingEvents(ref)

  // Filter events that occur in the specified month
  return allEvents.filter((event) => {
    const p = getJSTWallClockParts(event.date)
    return p.year === year && p.monthIndex === month
  })
}

/**
 * Get all birthday events for a specific month.
 * @deprecated Use getEventsForMonth() instead for events including anniversaries
 */
export function getBirthdaysForMonth(
  year: number,
  month: number, // 0-11
): Array<{ date: Date; members: VspoMember[] }> {
  const events: Map<number, VspoMember[]> = new Map()

  ;(members as VspoMember[]).forEach((member) => {
    const { monthIndex, day } = parseMonthDay(member.birthday)
    if (monthIndex === month) {
      const dayNum = day
      if (!events.has(dayNum)) {
        events.set(dayNum, [])
      }
      events.get(dayNum)!.push(member)
    }
  })

  // Convert to array and sort by date
  return Array.from(events.entries())
    .map(([day, members]) => ({
      date: jstMidnight(year, month, day),
      members,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export type PastBirthdayEvent = {
  member: VspoMember
  date: Date
  year: number
}

/**
 * Get all past birthday events (birthdays that have already passed this year).
 * If it's early in the year, also include birthdays from late last year to avoid empty list.
 */
export function getPastBirthdays(now = getJSTNow()): PastBirthdayEvent[] {
  const { year: currentYear, monthIndex: currentMonth } =
    getJSTWallClockParts(now)
  const events: PastBirthdayEvent[] = []

  ;(members as VspoMember[]).forEach((member) => {
    const { monthIndex, day } = parseMonthDay(member.birthday)
    const thisYearDate = jstMidnight(currentYear, monthIndex, day)
    const lastYearDate = jstMidnight(currentYear - 1, monthIndex, day)

    // Check if birthday has passed this year
    if (thisYearDate.getTime() < now.getTime()) {
      events.push({
        member,
        date: thisYearDate,
        year: currentYear,
      })
    }
    // If it's early in the year (before March), also include last year's late birthdays
    else if (currentMonth < 2 && lastYearDate.getTime() < now.getTime()) {
      events.push({
        member,
        date: lastYearDate,
        year: currentYear - 1,
      })
    }
  })

  // Sort by date descending (most recent first)
  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Get all past events.
 * Historical archive UI now relies on `src/data/vspo_streams.json` only,
 * so we intentionally do not auto-generate synthetic past events here.
 *
 * NOTE: Upcoming countdown logic is unaffected and still uses
 * `getAllUpcomingEvents()`.
 */
export function getAllPastEvents(now = getJSTNow()): VspoEvent[] {
  void now
  return []
}

export type GenerationGroup = {
  generation: string
  members: VspoMember[]
}

export type HistoryEvent = {
  date: string // YYYY-MM-DD
  type?: string
  title_jp?: string
  title_en?: string
  title_zh?: string
  // Legacy field kept for backward compatibility with older history data
  event?: string
}

export type YearGroup = {
  year: number
  events: HistoryEvent[]
  generations: GenerationGroup[]
}

/**
 * Get debut timeline grouped by year and generation.
 * Years are sorted ascending, members within each generation are sorted by debut date.
 */
export function getDebutTimeline(): YearGroup[] {
  // Import history events
  const historyEvents = (historyEventsData as unknown as HistoryEvent[]) || []

  // Group by year
  const yearMap = new Map<number, Map<string, VspoMember[]>>()
  const yearEventsMap = new Map<number, HistoryEvent[]>()

  // Process history events
  historyEvents.forEach((event) => {
    const [yearStr] = event.date.split('-')
    const year = parseInt(yearStr, 10)
    if (!yearEventsMap.has(year)) {
      yearEventsMap.set(year, [])
    }
    yearEventsMap.get(year)!.push(event)
  })

  // Process members
  ;(members as VspoMember[]).forEach((member) => {
    const [yearStr] = member.debut_date.split('-')
    const year = parseInt(yearStr, 10)

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map())
    }

    const generationMap = yearMap.get(year)!
    if (!generationMap.has(member.generation)) {
      generationMap.set(member.generation, [])
    }

    generationMap.get(member.generation)!.push(member)
  })

  // Convert to array and sort
  const timeline: YearGroup[] = Array.from(yearMap.entries())
    .map(([year, generationMap]) => {
      const generations: GenerationGroup[] = Array.from(generationMap.entries())
        .map(([generation, members]) => {
          // Sort members by debut date within each generation
          const sortedMembers = [...members].sort((a, b) => {
            const dateA = new Date(a.debut_date).getTime()
            const dateB = new Date(b.debut_date).getTime()
            return dateA - dateB
          })

          return {
            generation,
            members: sortedMembers,
          }
        })
        .sort((a, b) => {
          // Sort generations by the earliest debut date in each generation
          const dateA = new Date(a.members[0]?.debut_date || '').getTime()
          const dateB = new Date(b.members[0]?.debut_date || '').getTime()
          return dateA - dateB
        })

      // Get events for this year and sort by date
      const events = (yearEventsMap.get(year) || []).sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })

      return {
        year,
        events,
        generations,
      }
    })
    .sort((a, b) => a.year - b.year) // Sort years ascending

  // Also include years that only have events but no members
  yearEventsMap.forEach((events, year) => {
    if (!yearMap.has(year)) {
      const sortedEvents = events.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })
      timeline.push({
        year,
        events: sortedEvents,
        generations: [],
      })
    }
  })

  // Re-sort after adding event-only years
  return timeline.sort((a, b) => a.year - b.year)
}

