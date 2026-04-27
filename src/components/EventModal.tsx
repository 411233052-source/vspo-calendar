import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { VspoEvent } from '../utils/dateUtils'
import { getAllUpcomingEvents, getJSTNow, members } from '../utils/dateUtils'
import type { UiLang } from '../utils/i18n'
import { t } from '../utils/i18n'
import {
  type EventTypeFilter,
  eventSearchBlob,
  getEventModalCardDomId,
  getEventModalCardKey,
  groupEventsByTimelineWindow,
  passesTypeFilters,
} from '../utils/eventModalUtils'
import { EventCard } from './EventCard'
import { EventFilterBar } from './EventFilterBar'

type EventModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelectEvent: (event: VspoEvent) => void
  uiLang: UiLang
  currentEvent: VspoEvent
}

function EventModalInner({
  isOpen,
  onClose,
  onSelectEvent,
  uiLang,
  currentEvent,
}: EventModalProps) {
  const [selectedGens, setSelectedGens] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventTypes, setSelectedEventTypes] = useState<
    EventTypeFilter[]
  >([])
  const [sortAscending, setSortAscending] = useState(true)
  const [isGenDropdownOpen, setIsGenDropdownOpen] = useState(false)
  const genDropdownRef = useRef<HTMLDivElement>(null)

  const allGenerations = useMemo(() => {
    const gens = new Set<string>()
    members.forEach((member) => {
      if (member.generation) {
        gens.add(member.generation)
      }
    })
    return Array.from(gens).sort()
  }, [])

  const filteredEvents = useMemo(() => {
    const now = new Date()
    let list: VspoEvent[] = getAllUpcomingEvents(now)

    if (selectedGens.length > 0) {
      list = list.filter((event) =>
        selectedGens.includes(event.member.generation),
      )
    }

    list = list.filter((e) => passesTypeFilters(e, selectedEventTypes))

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((e) => eventSearchBlob(e, uiLang).includes(q))
    }

    list = [...list].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )
    if (!sortAscending) {
      list.reverse()
    }

    return list
  }, [selectedGens, selectedEventTypes, searchQuery, sortAscending, uiLang])

  const eventGroups = useMemo(() => {
    const now = getJSTNow()
    return groupEventsByTimelineWindow(filteredEvents, now, uiLang)
  }, [filteredEvents, uiLang])

  const currentEventKey = getEventModalCardKey(currentEvent)

  const scrollToCurrentEvent = useCallback(() => {
    const el = document.getElementById(getEventModalCardDomId(currentEventKey))
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentEventKey])

  const handleCardSelect = useCallback(
    (event: VspoEvent) => {
      onSelectEvent(event)
    },
    [onSelectEvent],
  )

  const toggleGeneration = useCallback((gen: string) => {
    setSelectedGens((prev) =>
      prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen],
    )
  }, [])

  const toggleAllGenerations = useCallback(() => {
    setSelectedGens((prev) =>
      prev.length === allGenerations.length ? [] : [...allGenerations],
    )
  }, [allGenerations])

  const handleTypeFilterChange = useCallback(
    (val: 'all' | EventTypeFilter) => {
      if (val === 'all') {
        setSelectedEventTypes([])
      } else {
        setSelectedEventTypes([val])
      }
    },
    [],
  )

  const toggleSort = useCallback(() => {
    setSortAscending((v) => !v)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    scrollToCurrentEvent()
  }, [isOpen, currentEventKey, eventGroups.length, scrollToCurrentEvent])

  useEffect(() => {
    if (!isGenDropdownOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const el = genDropdownRef.current
      if (el && !el.contains(e.target as Node)) {
        setIsGenDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isGenDropdownOpen])

  const tr = (key: string) => t(uiLang, key)
  const selectedType =
    selectedEventTypes.length === 0 ? 'all' : selectedEventTypes[0]

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto flex max-h-[85vh] w-11/12 max-w-6xl flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-modal-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
          <div className="relative z-[100] flex shrink-0 flex-col border-b border-white/10 bg-slate-900/95 backdrop-blur-sm">
            <div className="relative z-[50] flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-2 md:px-6 md:pt-4 md:pb-3">
              <h2
                id="event-modal-title"
                className="text-lg font-bold tracking-tight md:text-2xl"
              >
                {tr('eventModal.title')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 shrink-0 p-2 text-white/70 transition-transform transition-colors hover:text-white active:scale-95"
                aria-label={tr('eventModal.close')}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <EventFilterBar
              uiLang={uiLang}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onScrollToCurrent={scrollToCurrentEvent}
              sortAscending={sortAscending}
              onToggleSort={toggleSort}
              genDropdownRef={genDropdownRef}
              isGenDropdownOpen={isGenDropdownOpen}
              onGenDropdownOpenChange={setIsGenDropdownOpen}
              allGenerations={allGenerations}
              selectedGens={selectedGens}
              onToggleGeneration={toggleGeneration}
              onToggleAllGenerations={toggleAllGenerations}
              selectedType={selectedType}
              onTypeFilterChange={handleTypeFilterChange}
            />
          </div>

          <div className="relative z-0 isolate min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
            {filteredEvents.length === 0 ? (
              <p className="py-12 text-center text-sm text-white/50">
                {tr('eventModal.empty')}
              </p>
            ) : (
              <div className="space-y-10">
                {eventGroups.map((group) => (
                  <section key={group.key} className="space-y-4">
                    <h3 className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-center py-1 rounded-t-md text-xs font-semibold uppercase tracking-[0.2em]">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                      {group.events.map((event) => {
                        const eventKey = getEventModalCardKey(event)
                        const isCurrent = eventKey === currentEventKey
                        return (
                          <EventCard
                            key={eventKey}
                            event={event}
                            isCurrent={isCurrent}
                            onSelect={handleCardSelect}
                            uiLang={uiLang}
                            domId={getEventModalCardDomId(eventKey)}
                          />
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export const EventModal = memo(EventModalInner)
