import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  getDebutTimeline,
  getJSTNow,
  getJSTWallClockParts,
  type HistoryEvent,
  type YearGroup,
} from '../utils/dateUtils'
import streamsData from '../data/vspo_streams.json'
import type { UiLang } from '../utils/i18n'
import {
  formatTimelineDebutShort,
  formatTimelineEventDate,
  getMemberName,
  interpolate,
  t,
} from '../utils/i18n'

type TimelineModalProps = {
  isOpen: boolean
  onClose: () => void
  uiLang: UiLang
}

type StreamRecord = {
  member_id: string
  type: string
  date: string
  video_id: string
  title: string
}

function historyEventTitle(event: HistoryEvent, uiLang: UiLang): string {
  const jp = event.title_jp?.trim() ?? ''
  const en = event.title_en?.trim() ?? ''
  const zh = event.title_zh?.trim() ?? ''
  const legacy = event.event?.trim() ?? ''
  if (uiLang === 'en') return en || jp || zh || legacy || '(Untitled event)'
  if (uiLang === 'zh') return zh || jp || en || legacy || '(未命名事件)'
  return jp || en || zh || legacy || '(未命名イベント)'
}

function historyEventTypeIcon(type: string): string {
  switch (type) {
    case 'milestone':
      return '🏆'
    case 'event':
      return '🎪'
    case 'announcement':
      return '📢'
    case '3d_debut':
      return '✨'
    default:
      return ''
  }
}

function isHistoryCntTermination(event: HistoryEvent): boolean {
  const bundle = `${event.title_jp ?? ''} ${event.title_en ?? ''} ${event.title_zh ?? ''} ${event.event ?? ''}`
  return (
    bundle.includes('VSPO! CN') &&
    (bundle.includes('終止') ||
      bundle.includes('終了') ||
      /\bclosure\b/i.test(bundle))
  )
}

export function TimelineModal({ isOpen, onClose, uiLang }: TimelineModalProps) {
  const tr = (key: string) => t(uiLang, key)
  const timeline = getDebutTimeline()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hoverHideTimerRef = useRef<number | null>(null)
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const timelineYears = useMemo(
    () => timeline.map((yearGroup) => yearGroup.year),
    [timeline],
  )
  const [activeYear, setActiveYear] = useState<number>(
    timelineYears[0] ?? getJSTWallClockParts(getJSTNow()).year,
  )

  function scrollLeft() {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  function scrollRight() {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  function scrollToYear(year: number | string) {
    const el = document.getElementById(`year-card-${year}`)
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }

  const getDebutStream = (memberId: string) =>
    (streamsData as StreamRecord[]).find(
      (s) => s.member_id === memberId && s.type === 'debut',
    )

  const memberIndex = useMemo(() => {
    const map = new Map<string, YearGroup['generations'][number]['members'][number]>()
    timeline.forEach((yearGroup) => {
      yearGroup.generations.forEach((genGroup) => {
        genGroup.members.forEach((member) => {
          map.set(member.id, member)
        })
      })
    })
    return map
  }, [timeline])

  function clearHoverHideTimer() {
    if (hoverHideTimerRef.current !== null) {
      window.clearTimeout(hoverHideTimerRef.current)
      hoverHideTimerRef.current = null
    }
  }

  function showMemberTooltip(memberId: string, rect: DOMRect) {
    clearHoverHideTimer()
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
    setHoveredMember(memberId)
  }

  function queueHideMemberTooltip() {
    clearHoverHideTimer()
    hoverHideTimerRef.current = window.setTimeout(() => {
      setHoveredMember(null)
      hoverHideTimerRef.current = null
    }, 180)
  }

  function handleScroll() {
    const container = scrollContainerRef.current
    if (!container) return

    const containerCenter = container.scrollLeft + container.clientWidth / 2
    let closestYear = timelineYears[0]
    let minDistance = Number.POSITIVE_INFINITY

    timelineYears.forEach((year) => {
      const el = document.getElementById(`year-card-${year}`)
      if (!el) return
      const cardCenter = el.offsetLeft + el.clientWidth / 2
      const distance = Math.abs(cardCenter - containerCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestYear = year
      }
    })

    if (typeof closestYear === 'number') {
      setActiveYear(closestYear)
    }
  }

  useEffect(() => {
    handleScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineYears])

  useEffect(
    () => () => {
      clearHoverHideTimer()
    },
    [],
  )

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 w-screen h-screen z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-white text-4xl cursor-pointer z-50"
        aria-label={tr('timeline.close')}
      >
        ×
      </button>

      <div className="shrink-0 px-8 pt-8 md:pt-10">
        <h2 className="text-2xl md:text-3xl font-bold text-cyan-100 tracking-wide">
          {tr('timeline.title')}
        </h2>
      </div>

      <div className="relative flex-1 w-full flex items-center overflow-hidden">
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-20 flex items-center justify-center bg-slate-800/80 hover:bg-cyan-900/80 text-cyan-500 hover:text-cyan-300 rounded-lg cursor-pointer backdrop-blur-sm transition-all shadow-lg border border-slate-700 hover:border-cyan-500 z-20 pointer-events-auto"
          aria-label={tr('timeline.prevYear')}
        >
          <span className="text-2xl font-bold">‹</span>
        </button>

        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-20 flex items-center justify-center bg-slate-800/80 hover:bg-cyan-900/80 text-cyan-500 hover:text-cyan-300 rounded-lg cursor-pointer backdrop-blur-sm transition-all shadow-lg border border-slate-700 hover:border-cyan-500 z-20 pointer-events-auto"
          aria-label={tr('timeline.nextYear')}
        >
          <span className="text-2xl font-bold">›</span>
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-6 py-4 snap-x snap-mandatory scroll-smooth w-full h-full items-center custom-scrollbar-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="shrink-0 w-[40vw] md:w-[35vw]" />
          {timeline.map((yearGroup: YearGroup) => (
            <div
              key={yearGroup.year}
              id={`year-card-${yearGroup.year}`}
              className="min-w-[250px] md:min-w-[280px] flex flex-col max-h-[65vh] bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl snap-center shrink-0"
            >
              <div className="py-4 bg-cyan-900/30 border-b border-cyan-500/50 rounded-t-xl flex justify-center items-center flex-shrink-0">
                <h3 className="text-xl md:text-2xl font-bold text-cyan-50 tracking-widest">
                  {yearGroup.year}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {yearGroup.events && yearGroup.events.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-widest">
                      {tr('timeline.majorEvents')}
                    </h4>
                    {yearGroup.events.map((event, index) => {
                      const isCNTermination = isHistoryCntTermination(event)
                      const icon = historyEventTypeIcon(event.type ?? '')
                      return (
                        <div
                          key={`${event.date}-${index}`}
                          className={`${
                            isCNTermination
                              ? 'bg-orange-500/10 border-l-2 border-orange-400'
                              : 'bg-cyan-500/10 border-l-2 border-cyan-400'
                          } rounded-r-lg p-3 hover:opacity-90 transition-colors`}
                        >
                          <div
                            className={`text-xs ${
                              isCNTermination
                                ? 'text-orange-300/80'
                                : 'text-cyan-300/80'
                            } font-medium mb-1`}
                          >
                            {formatTimelineEventDate(event.date, uiLang)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white leading-relaxed">
                            {icon ? (
                              <span className="shrink-0" aria-hidden>
                                {icon}
                              </span>
                            ) : null}
                            <span className="text-slate-100">
                              {historyEventTitle(event, uiLang)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {yearGroup.generations && yearGroup.generations.length > 0 && (
                  <div className="space-y-5">
                    {yearGroup.generations.map((genGroup) => (
                      <div key={genGroup.generation} className="space-y-2">
                        <div className="flex items-center gap-2 my-4">
                          <div className="flex-1 border-t border-slate-600" />
                          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                            {genGroup.generation}
                          </span>
                          <div className="flex-1 border-t border-slate-600" />
                        </div>

                        <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
                          {genGroup.members.map((member) => {
                            const hasImage =
                              member.image_url &&
                              member.image_url.trim() !== ''
                            const displayName = getMemberName(member, uiLang)
                            const firstChar = displayName.charAt(0)

                            return (
                              <div
                                key={member.id}
                                className="group relative flex flex-col items-center justify-center p-2 text-center bg-slate-800/20 hover:bg-cyan-900/10 rounded-lg border border-slate-700/50 hover:border-cyan-700/50 transition-all cursor-pointer last:odd:col-span-2 last:odd:w-[60%] last:odd:mx-auto [&:last-child:nth-child(odd)]:col-span-2 [&:last-child:nth-child(odd)]:w-[60%] [&:last-child:nth-child(odd)]:mx-auto"
                                onMouseEnter={(e) => {
                                  showMemberTooltip(
                                    member.id,
                                    e.currentTarget.getBoundingClientRect(),
                                  )
                                }}
                                onMouseLeave={queueHideMemberTooltip}
                              >
                                <div
                                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-slate-700 flex items-center justify-center text-white font-semibold text-sm overflow-hidden shrink-0"
                                  style={{
                                    backgroundColor: hasImage
                                      ? 'transparent'
                                      : member.color + '80',
                                  }}
                                >
                                  {hasImage ? (
                                    <img
                                      src={member.image_url}
                                      alt={displayName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    firstChar
                                  )}
                                </div>

                                <div className="text-xs md:text-sm font-bold text-slate-100 mt-2 line-clamp-1">
                                  {displayName}
                                </div>
                                <div className="text-[9px] text-slate-400 font-light mt-0.5">
                                  {formatTimelineDebutShort(
                                    member.debut_date,
                                    uiLang,
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="min-w-[250px] md:min-w-[280px] h-[400px] bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl snap-center shrink-0 flex flex-col items-center justify-center gap-4 text-cyan-500/50">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M5 12h14m-5-5 5 5-5 5"
              />
            </svg>
            <p className="text-sm tracking-[0.5em] font-light">
              {tr('timeline.continues')}
            </p>
          </div>

          <div className="shrink-0 w-[40vw] md:w-[35vw]" />
        </div>
      </div>

      <div className="shrink-0 w-full max-w-5xl mx-auto px-8 pt-4 pb-12 md:pb-16 relative z-30">
        <div className="relative flex justify-between items-center w-full">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/50 -z-10" />
          {timelineYears.map((year) => {
            const isActive = activeYear === year
            return (
              <button
                key={year}
                type="button"
                onClick={() => scrollToYear(year)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer pointer-events-auto relative ${
                  isActive
                    ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-150'
                    : 'bg-slate-600 hover:bg-slate-400'
                }`}
                aria-label={interpolate(tr('timeline.goYear'), { year })}
              >
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                  {year}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {hoveredMember &&
        (() => {
          const debutStream = getDebutStream(hoveredMember)
          const currentMember = memberIndex.get(hoveredMember)
          if (!currentMember) return null
          const tipName = getMemberName(currentMember, uiLang)
          return (
            <>
              {/* Invisible hover bridge between avatar card and tooltip card */}
              <div
                className="fixed z-[199] pointer-events-auto w-44 bg-transparent"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y - 14,
                  height: 24,
                  transform: 'translateX(-50%)',
                }}
                onMouseEnter={clearHoverHideTimer}
                onMouseLeave={queueHideMemberTooltip}
              />
              <div
                className="fixed z-[200] pointer-events-auto w-56 md:w-64 rounded-lg border border-slate-600 bg-slate-900 p-2 shadow-2xl transition-opacity duration-300"
                style={{
                  top: tooltipPos.y,
                  left: tooltipPos.x,
                  transform: 'translate(-50%, -100%)',
                  marginTop: '-12px',
                }}
                onMouseEnter={clearHoverHideTimer}
                onMouseLeave={queueHideMemberTooltip}
              >
              {debutStream ? (
                <a
                  href={`https://www.youtube.com/watch?v=${debutStream.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/thumb block transition-opacity duration-300 hover:opacity-95"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-800">
                    <img
                      src={`https://img.youtube.com/vi/${debutStream.video_id}/mqdefault.jpg`}
                      alt={debutStream.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center group-hover/thumb:scale-110 transition-transform">
                        <svg
                          className="w-5 h-5 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-100 line-clamp-2 mt-2">
                    {debutStream.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{debutStream.date}</p>
                </a>
              ) : (
                <>
                  <div className="aspect-video rounded-md bg-slate-800/80 flex items-center justify-center">
                    <span className="text-xs text-slate-500 font-bold">
                      {tr('timeline.unavailable')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 line-clamp-1 mt-2">
                    {tipName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatTimelineDebutShort(
                      currentMember.debut_date,
                      uiLang,
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {tr('timeline.noDebutArchive')}
                  </p>
                </>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-600" />
              </div>
            </>
          )
        })()}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
