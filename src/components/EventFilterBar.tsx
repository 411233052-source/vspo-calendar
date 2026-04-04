import { memo, useCallback } from 'react'
import type { RefObject } from 'react'
import type { EventTypeFilter } from '../utils/eventModalUtils'
import type { UiLang } from '../utils/i18n'
import { t } from '../utils/i18n'

type EventFilterBarProps = {
  uiLang: UiLang
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onScrollToCurrent: () => void
  sortAscending: boolean
  onToggleSort: () => void
  genDropdownRef: RefObject<HTMLDivElement | null>
  isGenDropdownOpen: boolean
  onGenDropdownOpenChange: (open: boolean) => void
  allGenerations: string[]
  selectedGens: string[]
  onToggleGeneration: (gen: string) => void
  onToggleAllGenerations: () => void
  selectedType: 'all' | EventTypeFilter
  onTypeFilterChange: (value: 'all' | EventTypeFilter) => void
}

function EventFilterBarInner({
  uiLang,
  searchQuery,
  onSearchQueryChange,
  onScrollToCurrent,
  sortAscending,
  onToggleSort,
  genDropdownRef,
  isGenDropdownOpen,
  onGenDropdownOpenChange,
  allGenerations,
  selectedGens,
  onToggleGeneration,
  onToggleAllGenerations,
  selectedType,
  onTypeFilterChange,
}: EventFilterBarProps) {
  const tr = (key: string) => t(uiLang, key)
  const genSummary = `${selectedGens.length}/${allGenerations.length}`

  const handleGenMenuToggle = useCallback(() => {
    onGenDropdownOpenChange(!isGenDropdownOpen)
  }, [isGenDropdownOpen, onGenDropdownOpenChange])

  return (
    <div className="relative z-[50] flex shrink-0 flex-wrap items-center gap-2 px-4 pb-3 md:px-6 md:pb-4">
      <label htmlFor="event-modal-search" className="sr-only">
        {tr('eventModal.searchLabel')}
      </label>
      <input
        id="event-modal-search"
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={tr('eventModal.searchPlaceholder')}
        className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-white outline-none ring-sky-500/40 placeholder:text-white/35 focus:border-sky-500/50 focus:ring-2"
        autoComplete="off"
      />

      <button
        type="button"
        onClick={onScrollToCurrent}
        className="rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-sm text-white/85 transition-transform hover:bg-slate-700/90 active:scale-95"
        title="Scroll to current event"
        aria-label="Scroll to current event"
      >
        ◎
      </button>

      <button
        type="button"
        onClick={onToggleSort}
        className="rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-sm font-semibold text-white/85 transition-transform hover:bg-slate-700/90 active:scale-95"
        title={
          sortAscending
            ? tr('eventModal.sortTitleAsc')
            : tr('eventModal.sortTitleDesc')
        }
      >
        ↑↓
      </button>

      <div className="relative" ref={genDropdownRef}>
        <button
          type="button"
          onClick={handleGenMenuToggle}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white/85 transition-transform hover:bg-slate-800 active:scale-95"
        >
          {tr('eventModal.gen')} ({genSummary})
        </button>
        {isGenDropdownOpen ? (
          <div
            className="absolute top-full right-0 z-10 mt-2 flex w-full min-w-[200px] flex-col gap-1 rounded-md border border-slate-700 bg-slate-900 p-1 opacity-100 shadow-2xl"
            style={{ backgroundColor: '#0f172a' }}
          >
            <button
              type="button"
              onClick={onToggleAllGenerations}
              className={`w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold transition-transform transition-colors active:scale-[0.98] ${
                selectedGens.length === allGenerations.length
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-white/90 hover:!bg-slate-700'
              }`}
            >
              {selectedGens.length === allGenerations.length
                ? tr('eventModal.deselectAllGen')
                : tr('eventModal.selectAllGen')}
            </button>
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {allGenerations.map((gen) => {
                const isSelected = selectedGens.includes(gen)
                return (
                  <button
                    type="button"
                    key={gen}
                    onClick={() => onToggleGeneration(gen)}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-transform transition-colors active:scale-[0.98] ${
                      isSelected
                        ? 'bg-sky-600 text-white hover:!bg-sky-600'
                        : 'bg-slate-700 text-white/85 hover:!bg-slate-700'
                    }`}
                  >
                    {gen}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      <label className="sr-only" htmlFor="event-type-select">
        {tr('eventModal.typeLabel')}
      </label>
      <select
        id="event-type-select"
        value={selectedType}
        onChange={(e) => {
          const val = e.target.value as 'all' | EventTypeFilter
          onTypeFilterChange(val)
        }}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white/90 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
      >
        <option value="all">{tr('eventModal.all')}</option>
        <option value="birthday">{tr('eventModal.birthday')}</option>
        <option value="anniversary">{tr('eventModal.anniversary')}</option>
      </select>
    </div>
  )
}

export const EventFilterBar = memo(EventFilterBarInner)
