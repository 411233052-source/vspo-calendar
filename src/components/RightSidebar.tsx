import { useMemo, useState } from 'react'

import {
  generateCalendar,
  getEventMemberId,
  getEventsForMonth,
  getJSTNow,
  getJSTWallClockParts,
  jstMidnight,
  type CalendarDay,
  type VspoEvent,
} from '../utils/dateUtils'
import type { UiLang } from '../utils/i18n'
import {
  getMemberName,
  interpolate,
  t,
} from '../utils/i18n'
import { EventActionModal } from './EventActionModal'
import {
  buildEventModalDateLabel,
  buildEventTitlePair,
  getEventVisualMeta,
} from '../utils/eventVisuals'

type RightSidebarProps = {
  isOpen: boolean
  uiLang: UiLang
  onSelectEvent: (event: VspoEvent) => void
  currentEvent: VspoEvent
}

type ViewMode = 'month' | 'year'

function weekDayHeaders(lang: UiLang): string[] {
  if (lang === 'en')
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  if (lang === 'zh')
    return ['日', '一', '二', '三', '四', '五', '六']
  return ['日', '月', '火', '水', '木', '金', '土']
}

function monthCardLabel(monthIndex: number, uiLang: UiLang): string {
  if (uiLang === 'en') {
    return jstMidnight(2024, monthIndex, 1).toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'Asia/Tokyo',
    })
  }
  return `${monthIndex + 1}月`
}

function EventAvatarButton({
  event,
  uiLang,
  onSelectEvent,
  onPreviewEvent,
  sizeClass,
}: {
  event: VspoEvent
  uiLang: UiLang
  onSelectEvent: (e: VspoEvent) => void
  onPreviewEvent: (e: VspoEvent) => void
  sizeClass: string
}) {
  const { member, type } = event
  const hasImage = member.image_url && member.image_url.trim() !== ''
  const displayName = getMemberName(member, uiLang)
  const isAnniversary = type === 'anniversary'
  const visual = getEventVisualMeta(type)
  const { fullTitle } = buildEventTitlePair(event, uiLang)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelectEvent(event)
        onPreviewEvent(event)
      }}
      title={fullTitle}
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-900 text-[10px] font-semibold shadow transition-all duration-150 hover:scale-110 hover:brightness-110 ${
        isAnniversary ? 'ring-1 ring-yellow-400/50' : ''
      }`}
      style={{
        backgroundColor: isAnniversary ? '#eab308' : member.color,
        color: '#fff',
      }}
    >
      {hasImage ? (
        <img
          src={member.image_url}
          alt={displayName}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        visual.icon
      )}
    </button>
  )
}

function YearMonthPreviewAvatar({ event, uiLang }: { event: VspoEvent; uiLang: UiLang }) {
  const { member, type } = event
  const hasImage = member.image_url && member.image_url.trim() !== ''
  const displayName = getMemberName(member, uiLang)
  const firstChar = displayName.charAt(0)
  const isAnniversary = type === 'anniversary'

  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-900 text-[9px] font-semibold ${
        isAnniversary ? 'ring-1 ring-yellow-400/50' : ''
      }`}
      style={{
        backgroundColor: isAnniversary ? '#eab308' : member.color,
        color: '#fff',
      }}
      aria-hidden
    >
      {hasImage ? (
        <img
          src={member.image_url}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        firstChar
      )}
    </div>
  )
}

export function RightSidebar({
  isOpen,
  uiLang,
  onSelectEvent,
  currentEvent,
}: RightSidebarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const p = getJSTWallClockParts(getJSTNow())
    return jstMidnight(p.year, p.monthIndex, 1)
  })
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [previewEvent, setPreviewEvent] = useState<VspoEvent | null>(null)

  const { year, monthIndex: month } = getJSTWallClockParts(currentDate)

  const calendar = useMemo(() => generateCalendar(year, month), [year, month])
  const monthEvents = useMemo(
    () => getEventsForMonth(year, month),
    [year, month],
  )

  const yearMonthSummaries = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const evs = getEventsForMonth(year, m)
      const seenIds = new Set<string>()
      for (const e of evs) seenIds.add(getEventMemberId(e))
      const uniqueCount = seenIds.size

      const display: VspoEvent[] = []
      for (const e of evs) {
        const id = getEventMemberId(e)
        if (display.some((x) => getEventMemberId(x) === id)) continue
        display.push(e)
        if (display.length >= 6) break
      }

      return {
        monthIndex: m,
        display,
        extra: Math.max(0, uniqueCount - 6),
      }
    })
  }, [year])

  const goToPreviousMonth = () => {
    setCurrentDate(jstMidnight(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(jstMidnight(year, month + 1, 1))
  }

  const goToPreviousYear = () => {
    setCurrentDate(jstMidnight(year - 1, month, 1))
  }

  const goToNextYear = () => {
    setCurrentDate(jstMidnight(year + 1, month, 1))
  }

  const tr = (key: string) => t(uiLang, key)
  const dow = useMemo(() => weekDayHeaders(uiLang), [uiLang])
  const monthStats = useMemo(() => {
    const totalEvents = monthEvents.length
    const activeDays = new Set(
      monthEvents.map((e) => {
        const p = getJSTWallClockParts(e.date)
        return `${p.year}-${p.monthIndex}-${p.day}`
      }),
    ).size
    const generationMap = new Map<
      string,
      { count: number; memberImage: string }
    >()
    monthEvents.forEach((event) => {
      const gen = event.member.generation
      const prev = generationMap.get(gen)
      if (prev) {
        prev.count += 1
      } else {
        generationMap.set(gen, {
          count: 1,
          memberImage: event.member.image_url,
        })
      }
    })
    let topGen = '-'
    let topGenImage = ''
    let topCount = 0
    generationMap.forEach((v, gen) => {
      if (v.count > topCount) {
        topCount = v.count
        topGen = gen
        topGenImage = v.memberImage
      }
    })
    return { totalEvents, activeDays, topGen, topGenImage, topCount }
  }, [monthEvents])

  const monthYearLabel = useMemo(() => {
    const d = jstMidnight(year, month, 1)
    if (uiLang === 'en') {
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Tokyo',
      })
    }
    if (uiLang === 'zh') {
      return d.toLocaleDateString('zh-TW', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Tokyo',
      })
    }
    return `${year}年${month + 1}月`
  }, [year, month, uiLang])

  const calendarWeekRows = Math.ceil(calendar.length / 7)
  const calendarGridTemplateRows = `repeat(${calendarWeekRows}, minmax(0, 1fr))`

  const headerCenterTitle =
    viewMode === 'year'
      ? uiLang === 'en'
        ? String(year)
        : `${year}年`
      : monthYearLabel

  function cellEventTypeLabel(dayEvents: VspoEvent[]): string {
    const hasBirth = dayEvents.some((e) => e.type === 'birthday')
    const hasAnn = dayEvents.some((e) => e.type === 'anniversary')
    if (!hasBirth && !hasAnn) {
      if (
        dayEvents.some(
          (e) => e.type !== 'birthday' && e.type !== 'anniversary',
        )
      ) {
        return tr('eventCard.debut')
      }
      return ''
    }
    if (hasBirth && hasAnn) {
      const sep = uiLang === 'en' ? ', ' : '、'
      return `${tr('rightSidebar.eventTypeBirthdayAbbr')}${sep}${tr('rightSidebar.eventTypeAnniversaryAbbr')}`
    }
    if (hasBirth) return tr('rightSidebar.eventTypeBirthday')
    return tr('rightSidebar.eventTypeAnniversary')
  }

  if (!isOpen) return null

  return (
    <>
      <aside className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-900/95 backdrop-blur-sm">
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-5">
        <div className="mb-3 grid shrink-0 grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex min-w-0 items-center justify-center gap-2">
            <button
              type="button"
              onClick={viewMode === 'year' ? goToPreviousYear : goToPreviousMonth}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label={
                viewMode === 'year'
                  ? tr('rightSidebar.prevYear')
                  : tr('rightSidebar.prevMonth')
              }
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h3 className="truncate text-center text-base font-semibold text-white sm:text-lg">
              {headerCenterTitle}
            </h3>
            <button
              type="button"
              onClick={viewMode === 'year' ? goToNextYear : goToNextMonth}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label={
                viewMode === 'year'
                  ? tr('rightSidebar.nextYear')
                  : tr('rightSidebar.nextMonth')
              }
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setViewMode((v) => (v === 'month' ? 'year' : 'month'))
            }
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-white/80 transition-colors hover:bg-slate-800 hover:text-white ${
              viewMode === 'year' ? 'text-cyan-300' : ''
            }`}
            aria-label={tr('rightSidebar.toggleYearView')}
            title={tr('rightSidebar.toggleYearView')}
          >
            📅
          </button>
        </div>

        {viewMode === 'month' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-white/60">
              <div className="mb-1 grid w-full shrink-0 grid-cols-7 gap-1">
                {dow.map((day) => (
                  <div
                    key={day}
                    className="py-0.5 text-center text-[10px] font-semibold text-white/60 sm:text-xs"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                className="grid min-h-0 w-full flex-1 grid-cols-7 gap-1 overflow-hidden sm:gap-1.5"
                style={{ gridTemplateRows: calendarGridTemplateRows }}
              >
                {calendar.map((day: CalendarDay, index: number) => {
                  if (day.date === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-0 min-w-0 overflow-hidden"
                      />
                    )
                  }

                  const isCurrentEventDay =
                    day.date.getFullYear() ===
                      currentEvent.date.getFullYear() &&
                    day.date.getMonth() === currentEvent.date.getMonth() &&
                    day.date.getDate() === currentEvent.date.getDate()

                  const evs = day.events
                  const eventCount = evs.length
                  const hasEvents = eventCount > 0
                  const hasManyEvents = eventCount > 2
                  const typeLabel = hasEvents ? cellEventTypeLabel(evs) : ''

                  return (
                    <div
                      key={`${year}-${month}-${day.day}`}
                      role={hasEvents ? 'button' : undefined}
                      tabIndex={hasEvents ? 0 : undefined}
                      onClick={() => {
                        if (evs.length > 0) {
                          onSelectEvent(evs[0]!)
                          setPreviewEvent(evs[0]!)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!hasEvents) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectEvent(evs[0]!)
                          setPreviewEvent(evs[0]!)
                        }
                      }}
                      className={`group relative min-h-0 min-w-0 rounded-md border border-slate-700/50 shadow-sm outline-none transition-colors duration-200 hover:bg-slate-800/90 hover:border-cyan-500 ${
                        day.isCurrentMonth ? '' : 'opacity-40'
                      } ${hasEvents ? 'cursor-pointer' : 'cursor-default'}`}
                      style={
                        isCurrentEventDay
                          ? {
                              boxShadow: `0 0 0 2px ${currentEvent.member.themeColor} inset`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className={`absolute left-1 top-1 z-10 text-xs font-medium ${
                          day.isToday ? 'font-bold text-white' : 'text-white'
                        }`}
                      >
                        {day.day}
                      </span>

                      {day.isToday ? (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-md bg-white/5 ring-1 ring-white/40"
                          aria-hidden
                        />
                      ) : null}

                      {hasEvents ? (
                        <div className="absolute inset-0 flex flex-col p-1 pt-5 pb-0.5">
                          <div className="flex min-h-0 flex-1 flex-col">
                            {eventCount === 1 ? (
                              <div className="flex min-h-0 flex-1 items-center justify-center">
                                <EventAvatarButton
                                  event={evs[0]!}
                                  uiLang={uiLang}
                                  onSelectEvent={onSelectEvent}
                                  onPreviewEvent={setPreviewEvent}
                                  sizeClass="h-8 w-8"
                                />
                              </div>
                            ) : null}

                            {eventCount === 2 ? (
                              <div className="flex min-h-0 flex-1 items-center justify-center gap-1">
                                {evs.map((event, i) => (
                                  <EventAvatarButton
                                    key={`${event.type}-${event.member.id}-${i}`}
                                    event={event}
                                    uiLang={uiLang}
                                    onSelectEvent={onSelectEvent}
                                    onPreviewEvent={setPreviewEvent}
                                    sizeClass="h-8 w-8"
                                  />
                                ))}
                              </div>
                            ) : null}

                            {hasManyEvents ? (
                              <>
                                <div className="flex min-h-0 flex-1 items-center justify-center">
                                  <EventAvatarButton
                                    event={evs[0]!}
                                    uiLang={uiLang}
                                    onSelectEvent={onSelectEvent}
                                    onPreviewEvent={setPreviewEvent}
                                    sizeClass="h-8 w-8"
                                  />
                                </div>
                                <div className="absolute bottom-5 right-1 z-20 rounded-sm bg-slate-700/80 px-1 text-[10px] leading-none text-white">
                                  +{eventCount - 1}
                                </div>
                                <div className="pointer-events-none absolute left-0 top-0 z-50 flex h-auto min-h-full w-full origin-top scale-95 -translate-y-2 flex-col rounded-md border-2 border-cyan-500 bg-slate-800 p-1 opacity-0 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="shrink-0 text-xs font-medium text-white">
                                      {day.day}
                                    </span>
                                    <span className="pointer-events-none min-w-0 flex-1 truncate text-right text-[10px] text-slate-400">
                                      {typeLabel}
                                    </span>
                                  </div>
                                  <div className="mt-4 grid grid-cols-2 gap-1">
                                    {evs.map((event, i) => (
                                      <EventAvatarButton
                                        key={`${event.type}-${event.member.id}-hover-${i}`}
                                        event={event}
                                        uiLang={uiLang}
                                        onSelectEvent={onSelectEvent}
                                        onPreviewEvent={setPreviewEvent}
                                        sizeClass="h-7 w-7"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </div>
                          {typeLabel ? (
                            <div
                              className={`mt-auto w-full truncate rounded-full px-1 pb-0.5 pt-0.5 text-center text-[10px] pointer-events-none ${
                                hasManyEvents ? 'pr-8' : ''
                              }`}
                              title={typeLabel}
                            >
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 ${
                                  getEventVisualMeta(evs[0]?.type ?? '').softBgClass
                                } ${
                                  getEventVisualMeta(evs[0]?.type ?? '').softTextClass
                                }`}
                              >
                                {typeLabel}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-2 border-t border-slate-700/60 pt-3">
              <div className="rounded-md border border-slate-700 bg-slate-800/80 p-2 text-center">
                <div className="text-[10px] text-slate-400">
                  {tr('rightSidebar.statsTotal')}
                </div>
                <div className="text-lg font-bold text-white">
                  {monthStats.totalEvents}
                </div>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-800/80 p-2 text-center">
                <div className="text-[10px] text-slate-400">
                  {tr('rightSidebar.statsDays')}
                </div>
                <div className="text-lg font-bold text-cyan-300">
                  {monthStats.activeDays}
                </div>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-800/80 p-2 text-center">
                <div className="text-[10px] text-slate-400">
                  {tr('rightSidebar.statsTopGen')}
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-1.5">
                  {monthStats.topGenImage ? (
                    <img
                      src={monthStats.topGenImage}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="line-clamp-1 text-[11px] font-semibold text-white">
                    {monthStats.topGen}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-hidden p-2 text-white/60"
            style={{
              gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
            }}
          >
            {yearMonthSummaries.map(({ monthIndex, display, extra }) => (
              <button
                key={monthIndex}
                type="button"
                onClick={() => {
                  setCurrentDate(jstMidnight(year, monthIndex, 1))
                  setViewMode('month')
                }}
                className="flex min-h-0 min-w-0 cursor-pointer flex-col overflow-hidden rounded-md border border-slate-700 bg-white/5 p-2 text-left transition-colors hover:border-cyan-500"
              >
                <div className="shrink-0 text-center text-xs font-semibold text-white">
                  {monthCardLabel(monthIndex, uiLang)}
                </div>
                <div className="mt-1 grid min-h-0 flex-1 grid-cols-3 gap-0.5 place-content-center place-items-center">
                  {display.map((event, i) => (
                    <YearMonthPreviewAvatar
                      key={`${getEventMemberId(event)}-${i}`}
                      event={event}
                      uiLang={uiLang}
                    />
                  ))}
                </div>
                {extra > 0 ? (
                  <div className="mt-0.5 shrink-0 text-center text-[10px] text-slate-400">
                    {interpolate(tr('rightSidebar.moreEvents'), { n: extra })}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
      </aside>
      <EventActionModal
        isOpen={previewEvent !== null}
        onClose={() => setPreviewEvent(null)}
        icon={previewEvent ? getEventVisualMeta(previewEvent.type).icon : '📌'}
        typeLabel={previewEvent ? getEventVisualMeta(previewEvent.type).shortLabel : '活動'}
        imageUrl={previewEvent?.member.image_url}
        title={previewEvent ? buildEventTitlePair(previewEvent, uiLang).fullTitle : ''}
        dateLabel={previewEvent ? buildEventModalDateLabel(previewEvent, uiLang) : ''}
      />
    </>
  )
}
