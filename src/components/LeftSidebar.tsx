import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import streamsData from '../data/vspo_streams.json'
import {
  getJSTNow,
  getJSTWallClockParts,
  jstMidnight,
  type VspoEvent,
} from '../utils/dateUtils'

function streamArchiveDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map((x) => Number(x))
  return jstMidnight(y, m - 1, d)
}
import type { UiLang } from '../utils/i18n'
import { getMemberName, interpolate, t } from '../utils/i18n'
import { EventActionModal } from './EventActionModal'
import { getEventVisualMeta } from '../utils/eventVisuals'

type StreamRecord = {
  member_id: string
  type: VspoEvent['type']
  date: string // YYYY-MM-DD
  video_id: string
  title: string
  /** 自訂縮圖（優先於 YouTube 預設圖） */
  live_thumbnail?: string
}

type LeftSidebarProps = {
  isOpen: boolean
  currentEvent: VspoEvent
  uiLang: UiLang
  onPlayClickSound: () => void
}

type GroupedYearEvents = {
  year: number
  events: ArchiveEvent[]
}

type GroupedMonthEvents = {
  key: string
  monthLabel: string
  events: ArchiveEvent[]
}

type ArchiveEvent = VspoEvent & {
  uid: string
  stream: StreamRecord
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}

function formatMonthLabel(date: Date): string {
  return `${date.getMonth() + 1}月`
}

function normalizeSecureThumbUrl(url: string): string {
  return url.trim().replace(/^http:\/\//i, 'https://')
}

function resolveStreamThumbnailUrl(stream: StreamRecord): string {
  const custom = stream.live_thumbnail?.trim()
  if (custom) return normalizeSecureThumbUrl(custom)
  return `https://img.youtube.com/vi/${stream.video_id}/mqdefault.jpg`
}

/**
 * Normalize member IDs between sources.
 * `vspo_members.json` and `vspo_streams.json` currently contain a few legacy mismatches.
 */
function normalizeMemberIdForCompare(rawId: string): string {
  const id = rawId.trim().toLowerCase()
  if (id === 'met') return 'meto'
  if (id === 'yuuhi') return 'yuhi'
  return id
}

export function LeftSidebar({
  isOpen,
  currentEvent,
  uiLang,
  onPlayClickSound,
}: LeftSidebarProps) {
  const [expandedYears, setExpandedYears] = useState<number[]>(() => [
    getJSTWallClockParts(getJSTNow()).year,
  ])
  const [featuredEvent, setFeaturedEvent] = useState<ArchiveEvent | null>(null)
  const [actionEvent, setActionEvent] = useState<ArchiveEvent | null>(null)
  const currentMember = currentEvent.member
  const selectedMemberId = currentMember.id
  const normalizedSelectedMemberId = normalizeMemberIdForCompare(selectedMemberId)
  const tr = (key: string) => t(uiLang, key)
  const memberLabel = getMemberName(currentMember, uiLang)

  const archiveEvents = useMemo<ArchiveEvent[]>(() => {
    const nowInstant = getJSTNow()
    return (streamsData as StreamRecord[])
      .filter(
        (stream) =>
          normalizeMemberIdForCompare(stream.member_id) ===
          normalizedSelectedMemberId,
      )
      .filter((stream) => Boolean(stream.video_id))
      .filter((stream) => {
        const date = streamArchiveDate(stream.date)
        return date.getTime() < nowInstant.getTime()
      })
      .map((stream) => ({
        type: stream.type,
        date: streamArchiveDate(stream.date),
        member: currentMember,
        memberId: selectedMemberId,
        uid: `stream|${stream.member_id}|${stream.type}|${stream.date}|${stream.video_id}`,
        stream,
      }))
      .sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )
  }, [currentMember, normalizedSelectedMemberId, selectedMemberId])

  useEffect(() => {
    const matchedStreams = (streamsData as StreamRecord[]).filter(
      (stream) =>
        normalizeMemberIdForCompare(stream.member_id) ===
        normalizedSelectedMemberId,
    ).length
    console.log('[LeftSidebar] selected member id:', selectedMemberId, {
      normalizedSelectedMemberId,
      matchedStreams,
    })
  }, [normalizedSelectedMemberId, selectedMemberId])

  const filteredEvents = useMemo(() => {
    if (currentEvent.type === 'anniversary') {
      return archiveEvents.filter((event) => event.type === 'anniversary')
    }
    return archiveEvents.filter((event) => event.type !== 'anniversary')
  }, [archiveEvents, currentEvent.type])

  const groupedPastEvents = useMemo<GroupedYearEvents[]>(() => {
    const map = new Map<number, ArchiveEvent[]>()
    filteredEvents.forEach((event) => {
      const year = getJSTWallClockParts(event.date).year
      if (!map.has(year)) {
        map.set(year, [])
      }
      map.get(year)!.push(event)
    })

    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, events]) => ({ year, events }))
  }, [filteredEvents])

  const resolvedFeaturedEvent = useMemo(() => {
    if (filteredEvents.length === 0) return null
    const stillExists = featuredEvent
      ? filteredEvents.find((event) => event.uid === featuredEvent.uid)
      : null
    if (stillExists) return stillExists
    return filteredEvents[0]
  }, [filteredEvents, featuredEvent])

  const visibleExpandedYears = useMemo(() => {
    if (groupedPastEvents.length === 0) return []
    const yearSet = new Set(groupedPastEvents.map((group) => group.year))
    const kept = expandedYears.filter((year) => yearSet.has(year))
    if (kept.length > 0) return kept
    return [groupedPastEvents[0].year]
  }, [expandedYears, groupedPastEvents])

  function toggleYear(year: number) {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    )
  }

  const groupedByMonth = (events: ArchiveEvent[]): GroupedMonthEvents[] => {
    const monthMap = new Map<string, ArchiveEvent[]>()
    events.forEach((event) => {
      const key = `${event.date.getFullYear()}-${String(
        event.date.getMonth() + 1,
      ).padStart(2, '0')}`
      if (!monthMap.has(key)) monthMap.set(key, [])
      monthMap.get(key)!.push(event)
    })
    return Array.from(monthMap.entries()).map(([key, monthEvents]) => ({
      key,
      monthLabel: formatMonthLabel(monthEvents[0].date),
      events: monthEvents,
    }))
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          className="absolute inset-0 z-10 h-full w-full min-w-0 transform-gpu bg-black/80 backdrop-blur-sm"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="mb-4 px-2">
          <h2 className="text-xl font-semibold text-white">
            {currentEvent.type === 'anniversary'
              ? interpolate(tr('leftSidebar.titleAnniversary'), {
                  name: memberLabel,
                })
              : interpolate(tr('leftSidebar.titleBirthdayMix'), {
                  name: memberLabel,
                })}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto text-white/60 space-y-4 pr-1">
          {archiveEvents.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">
              {tr('leftSidebar.emptyPast')}
            </p>
          ) : (
            <>
              {/* Featured Video */}
              <section className="rounded-xl overflow-hidden bg-slate-900/70 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                {resolvedFeaturedEvent ? (
                    <button
                      type="button"
                      onClick={() => {
                        onPlayClickSound()
                        setActionEvent(resolvedFeaturedEvent)
                      }}
                      className="w-full text-left group"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={resolveStreamThumbnailUrl(
                            resolvedFeaturedEvent.stream,
                          )}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-cyan-500/90 shadow-[0_0_18px_rgba(34,211,238,0.8)] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg
                              className="w-7 h-7 text-black ml-0.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3
                          className="text-sm text-slate-100 font-semibold line-clamp-2"
                          title={resolvedFeaturedEvent.stream.title}
                        >
                          {getMemberName(resolvedFeaturedEvent.member, uiLang)}{' '}
                          {getEventVisualMeta(resolvedFeaturedEvent.type).shortLabel}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(resolvedFeaturedEvent.date)}
                        </p>
                      </div>
                    </button>
                ) : null}
              </section>

              {/* Year Accordion List */}
              <section className="rounded-xl overflow-hidden border border-slate-700/70 bg-slate-900/40">
                {groupedPastEvents.map((group) => {
                  const isExpanded = visibleExpandedYears.includes(group.year)
                  return (
                    <div key={group.year}>
                      <button
                        type="button"
                        onClick={() => {
                          onPlayClickSound()
                          toggleYear(group.year)
                        }}
                        className="w-full flex justify-between items-center py-2 px-3 bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700"
                      >
                        <span className="text-sm font-semibold text-slate-100">
                          {group.year}
                        </span>
                        <span className="text-xs text-slate-300">
                          {interpolate(tr('leftSidebar.streamCount'), {
                            count: group.events.length,
                          })}{' '}
                          {isExpanded ? '▾' : '▸'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-3 p-2">
                          {groupedByMonth(group.events).map((monthGroup) => (
                            <div key={monthGroup.key} className="space-y-1.5">
                              <h4 className="px-2 pt-1 text-xs font-bold tracking-wide text-slate-300/90">
                                {monthGroup.monthLabel}
                              </h4>
                              {monthGroup.events.map((event) => {
                                const isActive =
                                  resolvedFeaturedEvent?.uid === event.uid
                                const visual = getEventVisualMeta(event.type)
                                return (
                                  <button
                                    key={event.uid}
                                    type="button"
                                    onClick={() => {
                                      onPlayClickSound()
                                      setFeaturedEvent(event)
                                      setActionEvent(event)
                                    }}
                                    className={`group w-full text-left flex gap-3 rounded-lg p-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors ${
                                      isActive
                                        ? 'bg-cyan-500/10 ring-1 ring-cyan-400/50'
                                        : 'bg-slate-900/40'
                                    }`}
                                  >
                                    <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md">
                                      <img
                                        src={resolveStreamThumbnailUrl(
                                          event.stream,
                                        )}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="pointer-events-none absolute inset-0 bg-black/20" />
                                    </div>
                                    <div className="min-w-0 flex flex-col justify-between py-0.5">
                                      <p className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${visual.softBgClass} ${visual.softTextClass}`}>
                                        <span>{visual.icon}</span>
                                        <span>{visual.shortLabel}</span>
                                      </p>
                                      <p
                                        className="mt-1 text-xs line-clamp-1 text-slate-100"
                                        title={event.stream.title}
                                      >
                                        {getMemberName(event.member, uiLang)} {visual.shortLabel}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        {formatDate(event.date)}
                                      </p>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {groupedPastEvents.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {tr('leftSidebar.emptyCategory')}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
          </div>
        </motion.aside>
      ) : null}
      <EventActionModal
        isOpen={actionEvent !== null}
        onClose={() => setActionEvent(null)}
        icon={actionEvent ? getEventVisualMeta(actionEvent.type).icon : '📌'}
        typeLabel={actionEvent ? getEventVisualMeta(actionEvent.type).shortLabel : '活動'}
        imageUrl={actionEvent?.member.image_url}
        title={actionEvent?.stream.title ?? ''}
        dateLabel={actionEvent ? formatDate(actionEvent.date) : ''}
      />
    </AnimatePresence>
  )
}
