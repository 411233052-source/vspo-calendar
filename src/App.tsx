import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { BackgroundParticles } from './components/BackgroundParticles'
import { CountdownDisplay } from './components/CountdownDisplay'
import { EventModal } from './components/EventModal'
import { LeftSidebar } from './components/LeftSidebar'
import { RightSidebar } from './components/RightSidebar'
import { AboutModal } from './components/AboutModal'

const TimelineModal = lazy(async () => {
  const m = await import('./components/TimelineModal')
  return { default: m.TimelineModal }
})
const QuizModal = lazy(async () => {
  const m = await import('./components/QuizModal')
  return { default: m.QuizModal }
})
import {
  findIndexOfEarliestEventForMember,
  getAllUpcomingEvents,
  getEventMemberId,
  getYearTimelinePercent,
  getJSTNow,
  resolveEventToNextOccurrence,
  sortEventsChronologically,
  type VspoEvent,
} from './utils/dateUtils'
import {
  formatEventTitle,
  getMemberName,
  t,
  type UiLang,
} from './utils/i18n'
import { playCelebrateSound, playClickSound } from './utils/audio'
import { resolveMemberGlowHex } from './utils/memberGlowColors'
import {
  resolveMemberTachieNewUrl,
  resolveMemberTachieUrl,
} from './utils/memberTachieImages'

const UI_LANG_STORAGE_KEY = 'vspo_ui_lang'
const WELCOME_SEEN_KEY = 'vspo_welcome_seen'

function parseStoredUiLang(raw: string | null): UiLang | null {
  if (raw == null) return null
  const v = raw.trim()
  if (v === 'jp' || v === 'ja') return 'jp'
  if (v === 'zh' || v === 'zh-TW' || v === 'zh-Hant') return 'jp'
  if (v === 'en') return 'en'
  return null
}

function readInitialUiLang(): UiLang {
  try {
    return parseStoredUiLang(localStorage.getItem(UI_LANG_STORAGE_KEY)) ?? 'jp'
  } catch {
    return 'jp'
  }
}

function eventVisualKey(e: VspoEvent) {
  return `${getEventMemberId(e)}-${e.date.getTime()}-${e.type}-${e.years ?? ''}`
}

function normalizeSecureImageUrl(url: string): string {
  return url.trim().replace(/^http:\/\//i, 'https://')
}

function fireCountdownCelebration(
  memberColor: string,
  onCelebrateSound: () => void,
) {
  const duration = 3000
  const end = Date.now() + duration
  const colors = ['#ba55d3', '#ff69b4', '#87cefa', memberColor]
  onCelebrateSound()

  ;(function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })
    if (Date.now() < end) {
      window.requestAnimationFrame(frame)
    }
  })()
}

function EventTitleAvatar({
  imageUrl,
  name,
  themeColor,
}: {
  imageUrl: string
  name: string
  themeColor: string
}) {
  const [hasError, setHasError] = useState(false)
  const safeImageUrl = normalizeSecureImageUrl(imageUrl)
  const showImage = safeImageUrl.length > 0 && !hasError

  if (showImage) {
    return (
      <img
        src={safeImageUrl}
        alt={`${name} YouTube avatar`}
        className="h-10 w-10 shrink-0 rounded-full object-cover object-center ring-1 ring-white/20"
        referrerPolicy="no-referrer"
        fetchPriority="high"
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/20"
      style={{ backgroundColor: themeColor }}
      aria-hidden
    >
      {name.charAt(0)}
    </div>
  )
}

function App() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [isLeftOpen, setIsLeftOpen] = useState(false)
  const [isRightOpen, setIsRightOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [aboutIsFirstVisit, setAboutIsFirstVisit] = useState(false)
  const [timeFormat, setTimeFormat] = useState<'dhms' | 'mwdh'>('dhms')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSlideshowActive, setIsSlideshowActive] = useState(false)
  /** 手動左右切時遞增，強制重設スライド計時器，避免與自動切換衝突 */
  const [slideshowRescheduleTick, setSlideshowRescheduleTick] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uiLang, setUiLang] = useState<UiLang>(() => readInitialUiLang())
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [vfxEnabled, setVfxEnabled] = useState(true)
  const [hasCelebrated, setHasCelebrated] = useState(false)
  /** 生日用 -new 立繪載入失敗時降級為預設立繪 */
  const [imageError, setImageError] = useState(false)
  const prevRemainingMsRef = useRef<number | null>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const pendingWelcomeAckRef = useRef(false)

  const events = useMemo(() => {
    const now = getJSTNow()
    return sortEventsChronologically(getAllUpcomingEvents(now))
  }, [tick])

  const currentEvent: VspoEvent | null =
    events.length > 0 ? events[currentIndex]! : null

  useEffect(() => {
    setImageError(false)
  }, [
    selectedMemberId,
    currentEvent?.type,
    currentEvent?.date.getTime(),
    currentEvent ? getEventMemberId(currentEvent) : '',
  ])

  const tachieSrc = useMemo(() => {
    if (!currentEvent) return null
    const id = getEventMemberId(currentEvent)
    const base = resolveMemberTachieUrl(id)
    const fresh = resolveMemberTachieNewUrl(id)
    if (currentEvent.type === 'birthday' && !imageError && fresh) return fresh
    return base ?? null
  }, [currentEvent, imageError])

  const showTachieLayer = useMemo(() => {
    if (!currentEvent) return false
    const id = getEventMemberId(currentEvent)
    const base = resolveMemberTachieUrl(id)
    const fresh = resolveMemberTachieNewUrl(id)
    if (currentEvent.type === 'birthday' && fresh) return true
    return Boolean(base)
  }, [currentEvent])

  const eventsLengthRef = useRef(events.length)
  const eventsRef = useRef(events)
  const selectedMemberIdRef = useRef(selectedMemberId)

  const slideshowTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  )

  const timelinePercent = useMemo(
    () => (currentEvent ? getYearTimelinePercent(currentEvent.date) : 0),
    [currentEvent],
  )

  const pauseSlideshowForModal =
    isEventModalOpen || isTimelineOpen || isQuizOpen || isAboutOpen

  const pauseSlideshowForModalRef = useRef(pauseSlideshowForModal)

  useEffect(() => {
    eventsLengthRef.current = events.length
  }, [events.length])

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    selectedMemberIdRef.current = selectedMemberId
  }, [selectedMemberId])

  useEffect(() => {
    pauseSlideshowForModalRef.current = pauseSlideshowForModal
  }, [pauseSlideshowForModal])

  const resetSlideshowDelay = useCallback(() => {
    setSlideshowRescheduleTick((t) => t + 1)
  }, [])

  const click = useCallback(() => playClickSound(soundEnabled), [soundEnabled])

  useEffect(() => {
    try {
      localStorage.setItem(UI_LANG_STORAGE_KEY, uiLang)
    } catch {
      /* ignore quota / private mode */
    }
  }, [uiLang])

  const handleEventModalSelect = useCallback(
    (event: VspoEvent) => {
      click()
      setSelectedMemberId(null)
      const resolved = resolveEventToNextOccurrence(event, getJSTNow())
      const idx = events.findIndex(
        (e) =>
          e.type === resolved.type &&
          getEventMemberId(e) === getEventMemberId(resolved) &&
          e.date.getTime() === resolved.date.getTime(),
      )
      if (idx >= 0) setCurrentIndex(idx)
      setIsEventModalOpen(false)
      resetSlideshowDelay()
    },
    [click, events, resetSlideshowDelay],
  )

  const handleEventModalClose = useCallback(() => {
    click()
    setIsEventModalOpen(false)
  }, [click])

  const handleTimelineClose = useCallback(() => {
    click()
    setIsTimelineOpen(false)
  }, [click])

  const handleQuizClose = useCallback(() => {
    click()
    setIsQuizOpen(false)
  }, [click])

  const handleAboutClose = useCallback(() => {
    click()
    setIsAboutOpen(false)
    try {
      if (pendingWelcomeAckRef.current) {
        localStorage.setItem(WELCOME_SEEN_KEY, '1')
        pendingWelcomeAckRef.current = false
      }
    } catch {
      /* ignore */
    }
  }, [click])

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
        pendingWelcomeAckRef.current = true
        setAboutIsFirstVisit(true)
        setIsAboutOpen(true)
      }
    } catch {
      pendingWelcomeAckRef.current = true
      setAboutIsFirstVisit(true)
      setIsAboutOpen(true)
    }
  }, [])

  const handleRightSidebarSelect = useCallback(
    (event: VspoEvent) => {
      click()
      setSelectedMemberId(null)
      const resolved = resolveEventToNextOccurrence(event, getJSTNow())
      const idx = events.findIndex(
        (e) =>
          e.type === resolved.type &&
          getEventMemberId(e) === getEventMemberId(resolved) &&
          e.date.getTime() === resolved.date.getTime(),
      )
      if (idx >= 0) setCurrentIndex(idx)
      resetSlideshowDelay()
    },
    [click, events, resetSlideshowDelay],
  )

  const tr = (key: string) => t(uiLang, key)

  useEffect(() => {
    if (!settingsOpen) return
    const onPointerDown = (e: MouseEvent) => {
      const el = settingsPanelRef.current
      if (el && !el.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [settingsOpen])

  // Re-evaluate periodically so when the countdown hits 0 it will roll to the next member.
  // Only update when selectedMemberId is null (auto mode)
  useEffect(() => {
    if (selectedMemberId === null) {
      const id = window.setInterval(() => {
        setTick((prev) => prev + 1)
      }, 60_000)
      return () => window.clearInterval(id)
    }
  }, [selectedMemberId])

  useEffect(() => {
    if (events.length === 0) return
    setCurrentIndex((i) => Math.min(i, events.length - 1))
  }, [events.length])

  useEffect(() => {
    if (!selectedMemberId || events.length === 0) return
    const idx = findIndexOfEarliestEventForMember(events, selectedMemberId)
    if (idx >= 0) setCurrentIndex(idx)
  }, [selectedMemberId, events])

  useEffect(() => {
    if (!currentEvent) return
    const remainingMs = currentEvent.date.getTime() - getJSTNow().getTime()
    prevRemainingMsRef.current = remainingMs
    // Switching to an already-expired event should never trigger celebration.
    if (remainingMs <= 0) {
      setHasCelebrated(true)
      return
    }
    setHasCelebrated(false)
  }, [currentEvent?.date.getTime(), currentEvent?.type, currentEvent?.member.id])

  useEffect(() => {
    if (!currentEvent || hasCelebrated) return
    const windowMs = 2000

    const intervalId = window.setInterval(() => {
      const remainingMs = currentEvent.date.getTime() - getJSTNow().getTime()
      const previous = prevRemainingMsRef.current

      // Only fire on the precise crossing moment: >0 -> <=0, within tolerance window.
      const crossedToZero =
        previous !== null &&
        previous > 0 &&
        remainingMs <= 0 &&
        remainingMs >= -windowMs

      if (crossedToZero) {
        if (vfxEnabled) {
          fireCountdownCelebration(
            currentEvent.member.themeColor,
            () => playCelebrateSound(soundEnabled),
          )
        }
        setHasCelebrated(true)
        window.clearInterval(intervalId)
        return
      }

      // If we've missed the zero-crossing window, lock it to prevent late playback.
      if (remainingMs < -windowMs) {
        setHasCelebrated(true)
        window.clearInterval(intervalId)
        return
      }

      prevRemainingMsRef.current = remainingMs
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [currentEvent, hasCelebrated, vfxEnabled])

  // スライド：Modal 開啟時暫停；clearTimeout 後每輪重新 5–7s；手動／選人用 resetSlideshowDelay 重掛
  useEffect(() => {
    const clearSlideshowTimer = () => {
      if (slideshowTimeoutRef.current !== null) {
        window.clearTimeout(slideshowTimeoutRef.current)
        slideshowTimeoutRef.current = null
      }
    }

    if (
      !isSlideshowActive ||
      events.length < 2 ||
      pauseSlideshowForModal
    ) {
      clearSlideshowTimer()
      return
    }

    const pickRandomOtherIndex = (prev: number) => {
      const ev = eventsRef.current
      const n = ev.length
      const memberId = selectedMemberIdRef.current
      const candidates: number[] = []
      for (let i = 0; i < n; i++) {
        if (i === prev) continue
        if (memberId !== null && getEventMemberId(ev[i]!) !== memberId) continue
        candidates.push(i)
      }
      if (candidates.length === 0) return prev
      return candidates[Math.floor(Math.random() * candidates.length)]!
    }

    const scheduleNext = () => {
      clearSlideshowTimer()
      const delayMs = 5000 + Math.floor(Math.random() * 2000)
      slideshowTimeoutRef.current = window.setTimeout(() => {
        slideshowTimeoutRef.current = null
        const n = eventsLengthRef.current
        if (n < 2 || pauseSlideshowForModalRef.current) return
        setCurrentIndex((prev) => pickRandomOtherIndex(prev))
        scheduleNext()
      }, delayMs)
    }

    scheduleNext()
    return clearSlideshowTimer
  }, [
    isSlideshowActive,
    events.length,
    slideshowRescheduleTick,
    pauseSlideshowForModal,
  ])

  const handlePrev = () => {
    if (events.length === 0) return
    click()
    setSelectedMemberId(null)
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length)
    resetSlideshowDelay()
  }

  const handleNext = () => {
    if (events.length === 0) return
    click()
    setSelectedMemberId(null)
    setCurrentIndex((prev) => (prev + 1) % events.length)
    resetSlideshowDelay()
  }

  const toggleTimeFormat = () => {
    click()
    setTimeFormat((prev) => (prev === 'dhms' ? 'mwdh' : 'dhms'))
  }

  if (!currentEvent) {
    return (
      <>
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
          {t(uiLang, 'app.loading')}
        </div>
        <AboutModal
          isOpen={isAboutOpen}
          onClose={handleAboutClose}
          isFirstVisit={aboutIsFirstVisit}
        />
      </>
    )
  }

  const currentMember = currentEvent.member
  const themeColor = currentMember.themeColor
  const glowHex = resolveMemberGlowHex(getEventMemberId(currentEvent), themeColor)

  const ambientGlowStyle = {
    '--ambient-glow': glowHex,
  } as CSSProperties & { '--ambient-glow': string }

  const immersiveHidden =
    isRightOpen ? 'opacity-0 pointer-events-none' : ''

  const closeMobileDrawers = () => {
    setIsLeftOpen(false)
    setIsRightOpen(false)
  }
  const toggleRightSidebar = () => {
    click()
    setIsRightOpen((open) => !open)
  }
  const toggleLeftSidebar = () => {
    click()
    setIsLeftOpen((open) => !open)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {(isLeftOpen || isRightOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          aria-hidden
          onClick={closeMobileDrawers}
        />
      )}

      <button
        type="button"
        onClick={toggleLeftSidebar}
        className={`fixed top-1/2 z-[80] -translate-y-1/2 transform-gpu rounded-r-md border border-l-0 border-slate-600 bg-slate-800/80 p-2 transition-[left,transform,colors] duration-300 ease-in-out hover:bg-slate-700 active:scale-95 ${
          isLeftOpen ? 'left-80 max-md:left-[85vw] max-md:max-w-[400px]' : 'left-0'
        }`}
        aria-label={isLeftOpen ? tr('leftSidebar.close') : tr('app.archive')}
      >
        {isLeftOpen ? '◀' : '▶'}
      </button>

      {/* 左欄：外層不佔手機 flex 寬度；內層 fixed off-canvas / 桌面 md:relative */}
      <div
        className={`shrink-0 max-md:w-0 max-md:min-w-0 overflow-visible md:transition-[width] md:duration-500 md:ease-in-out ${
          isLeftOpen ? 'md:w-80' : 'md:w-0'
        }`}
      >
        <div
          className={`fixed inset-y-0 left-0 z-50 flex h-full w-[85vw] max-w-[400px] flex-col overflow-visible transform-gpu transition-transform duration-500 ease-in-out max-md:will-change-transform md:will-change-auto md:relative md:inset-auto md:z-auto md:h-full md:w-full md:max-w-none md:translate-x-0 ${
            isLeftOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full w-full min-w-[320px] flex-col overflow-hidden">
            <LeftSidebar
              isOpen={isLeftOpen}
              currentEvent={currentEvent}
              uiLang={uiLang}
              onPlayClickSound={click}
            />
          </div>
        </div>
      </div>

      <div
        className={`relative isolate flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden md:transition-[width] md:duration-500 md:ease-in-out ${
          isRightOpen ? 'md:w-[60vw]' : 'md:w-full'
        }`}
      >
      <div
        className="timeline-container shrink-0"
        role="progressbar"
        aria-valuenow={Math.round(timelinePercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={tr('app.timelineAria')}
      >
        <div
          className="timeline-progress"
          style={{
            width: `${timelinePercent}%`,
            backgroundColor: themeColor,
          }}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
        {/* 立繪＋倒數＋主 UI：依賴 flex 寬度過渡，避免主欄與右欄縫隙 */}
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        >
        {/* 最底層：雙角環境光（左上 + 右下）；z-0 + 全層不接收點擊 */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[#0a0a0a]"
          aria-hidden
        >
          <div
            className="pointer-events-none ambient-glow-radial-tl"
            style={ambientGlowStyle}
          />
          <div
            className="pointer-events-none ambient-glow-radial-br"
            style={ambientGlowStyle}
          />
        </div>

        {/* 背景圖 / 主題漸層（不接收點擊） */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
        >
          <div
            key={`bg-${eventVisualKey(currentEvent)}`}
            className="pointer-events-none absolute inset-0 animate-fade-in bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
            style={{
              backgroundImage: `radial-gradient(600px circle at 50% 45%, ${themeColor}44 0%, transparent 60%), radial-gradient(900px circle at 50% 80%, ${themeColor}22 0%, transparent 65%)`,
            }}
          />
          <BackgroundParticles enabled={vfxEnabled} accentHex={themeColor} />
          {/* 立繪：切換時柔和淡入淡出 */}
          <AnimatePresence mode="wait">
            {showTachieLayer && tachieSrc ? (
              <motion.div
                key={`${eventVisualKey(currentEvent)}-${tachieSrc}-${imageError}`}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                <div
                  className="pointer-events-none absolute left-1/2 top-[44%] z-0 h-[min(78vh,820px)] w-[min(78vw,720px)] -translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl"
                  style={{
                    background: `radial-gradient(ellipse 58% 62% at 50% 50%, ${themeColor} 0%, transparent 70%)`,
                  }}
                />
                <div className="relative z-10 h-[min(88vh,920px)] w-[min(85vw,760px)] max-h-full max-w-full shrink-0">
                  <img
                    src={tachieSrc}
                    alt=""
                    decoding="async"
                    fetchPriority="low"
                    className="member-tachie-mask absolute inset-0 h-full w-full object-contain object-center opacity-[0.25] select-none brightness-[1.15] contrast-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    onError={() => {
                      if (currentEvent.type === 'birthday' && !imageError) {
                        setImageError(true)
                      }
                    }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 transition-opacity duration-500 ease-in-out" />
        </div>

        <main className="relative z-20 flex min-h-0 w-full flex-1 flex-col items-center justify-center bg-transparent px-6 pb-24 md:pb-28 text-white">
        <div
          className={`fixed right-3 top-3 z-[62] transition-opacity duration-500 md:right-5 md:top-4 ${immersiveHidden}`}
          ref={settingsPanelRef}
        >
          <button
            type="button"
            onClick={() => {
              click()
              setSettingsOpen((o) => !o)
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-lg text-white/90 shadow-lg backdrop-blur-md transition-transform transition-colors hover:border-cyan-500/40 hover:bg-black/55 hover:text-white active:scale-95"
            aria-expanded={settingsOpen}
            aria-haspopup="true"
            aria-label={tr('settings.title')}
          >
            ⚙️
          </button>
          {settingsOpen ? (
            <div
              className="absolute right-0 mt-2 w-60 rounded-xl border border-white/12 bg-slate-900/95 py-2 shadow-2xl backdrop-blur-md"
              role="menu"
            >
              <div className="border-b border-white/10 px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                {tr('settings.title')}
              </div>
              <div className="px-3 py-2">
                <p className="mb-1.5 text-xs text-white/55">
                  {tr('settings.language')}
                </p>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      click()
                      setUiLang('jp')
                    }}
                    className={`rounded-md py-1.5 text-center text-xs font-semibold transition-transform transition-colors active:scale-95 ${
                      uiLang === 'jp'
                        ? 'bg-sky-600 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    JP
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      click()
                      setUiLang('en')
                    }}
                    className={`rounded-md py-1.5 text-center text-xs font-semibold transition-transform transition-colors active:scale-95 ${
                      uiLang === 'en'
                        ? 'bg-sky-600 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  click()
                  setSettingsOpen(false)
                  setAboutIsFirstVisit(false)
                  setIsAboutOpen(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-transform hover:bg-white/5 active:scale-[0.98]"
              >
                {tr('settings.about')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  click()
                  setSoundEnabled((v) => !v)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/90 transition-transform hover:bg-white/5 active:scale-[0.98]"
              >
                <span>{tr('settings.sound')}</span>
                <span className="text-xs text-cyan-300/90">
                  {soundEnabled ? tr('settings.on') : tr('settings.off')}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  click()
                  setVfxEnabled((v) => !v)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/90 transition-transform hover:bg-white/5 active:scale-[0.98]"
              >
                <span>{tr('settings.vfx')}</span>
                <span className="text-xs text-cyan-300/90">
                  {vfxEnabled ? tr('settings.on') : tr('settings.off')}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {/* 左側：窄條點擊區 — 上一個活動（底部留白避免遮擋工具列） */}
        {!isRightOpen ? (
        <button
          type="button"
          onClick={handlePrev}
          className="fixed left-0 top-0 bottom-20 z-30 w-16 max-w-[10%] cursor-pointer group border-0 bg-transparent p-0 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-inset"
          aria-label={tr('app.prevEvent')}
        >
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl md:text-5xl text-white/0 group-hover:text-white/40 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-300 group-hover:scale-105">
            ‹
          </span>
        </button>
        ) : null}

        {/* 倒數＋標題：與立繪同軸置中（Hololive 式全畫面中央） */}
        <div
          key={eventVisualKey(currentEvent)}
          className="relative z-30 flex flex-col items-center justify-center gap-6 [pointer-events:auto]"
        >
          <CountdownDisplay
            targetDate={currentEvent.date}
            format={timeFormat}
            className="animate-fade-in-up"
            uiLang={uiLang}
          />

          {/* 可点击的事件标题 */}
          <button
            type="button"
            onClick={() => {
              click()
              setIsEventModalOpen(true)
            }}
            className="mt-4 inline-flex animate-fade-in-up cursor-pointer items-center gap-3 text-center text-3xl font-bold transition-transform hover:text-cyan-400 active:scale-95"
            style={{
              animationDelay: '80ms',
              textShadow: `0 0 36px ${themeColor}aa, 0 2px 14px rgba(0,0,0,0.9)`,
            }}
          >
            <EventTitleAvatar
              imageUrl={currentMember.image_url}
              name={getMemberName(currentMember, uiLang)}
              themeColor={themeColor}
            />
            {currentEvent.type === 'birthday' ? (
              formatEventTitle(
                getMemberName(currentMember, uiLang),
                'birthday',
                uiLang,
                { birthdayYear: currentEvent.date.getFullYear() },
              )
            ) : (
              formatEventTitle(
                getMemberName(currentMember, uiLang),
                'anniversary',
                uiLang,
                { anniversaryYears: currentEvent.years ?? 0 },
              )
            )}
          </button>
        </div>

        {/* 右側：窄條點擊區 — 下一個活動（底部留白避免遮擋工具列） */}
        {!isRightOpen ? (
        <button
          type="button"
          onClick={handleNext}
          className="fixed right-0 top-0 bottom-20 z-30 w-16 max-w-[10%] cursor-pointer group border-0 bg-transparent p-0 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-inset"
          aria-label={tr('app.nextEvent')}
        >
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl md:text-5xl text-white/0 group-hover:text-white/40 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-300 group-hover:scale-105">
            ›
          </span>
        </button>
        ) : null}

        {/* Bottom Navigation */}
        <div className="fixed bottom-4 left-0 right-0 z-30 flex w-full items-center justify-between px-8">
          {/* 左下角 - 左側群組 */}
          <div className="flex items-center gap-2">
            {/* スライド開關 */}
            <button
              onClick={() => {
                click()
                setIsSlideshowActive((prev) => !prev)
              }}
              className={`backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-full font-semibold transition-all duration-300 border border-white/5 shadow-lg hover:shadow-xl hover:border-cyan-500/50 hover:text-cyan-100 active:scale-95 ${
                isSlideshowActive
                  ? 'bg-cyan-600/80 border-cyan-400/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={tr('app.slideshowTitle')}
            >
              {tr('app.slideshow')}
            </button>
            {/* 單位切換 */}
            <button
              onClick={toggleTimeFormat}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-full font-semibold transition-all duration-300 border border-white/5 hover:border-cyan-500/50 hover:text-cyan-100 shadow-lg hover:shadow-xl active:scale-95"
              title={tr('app.timeToggleTitle')}
            >
              {timeFormat === 'dhms'
                ? tr('app.timeFormatMwdh')
                : tr('app.timeFormatDhms')}
            </button>
          </div>

          {/* 正中間 - Quiz 按鈕 (Gaming Start Key) */}
          <button
            onClick={() => {
              click()
              setIsQuizOpen(true)
            }}
            className={`bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-500/40 text-indigo-300 hover:text-white px-8 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] font-bold tracking-widest uppercase active:scale-95 ${immersiveHidden}`}
          >
            {tr('app.quiz')}
          </button>

          {/* 右下角 - 右側群組 */}
          {!isRightOpen ? (
          <div className="flex items-center gap-2">
            {/* 一覧 */}
            <button
              onClick={() => {
                click()
                setIsEventModalOpen(true)
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-full font-semibold transition-all duration-300 border border-white/5 hover:border-cyan-500/50 hover:text-cyan-100 shadow-lg hover:shadow-xl active:scale-95"
            >
              {tr('nav.eventsList')}
            </button>
            {/* 年表 */}
            <button
              onClick={() => {
                click()
                setIsTimelineOpen(true)
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-full font-semibold transition-all duration-300 border border-white/5 hover:border-cyan-500/50 hover:text-cyan-100 shadow-lg hover:shadow-xl active:scale-95"
            >
              {tr('nav.timeline')}
            </button>
          </div>
          ) : (
            <div />
          )}
        </div>
      </main>
        </div>
      </div>
      </div>

      {/* 右欄：外層不佔手機 flex 寬度；內層 fixed off-canvas / 桌面 md:relative */}
      <div
        className={`shrink-0 max-md:w-0 max-md:min-w-0 overflow-visible md:transition-[width] md:duration-500 md:ease-in-out ${
          isRightOpen ? 'md:w-[40vw]' : 'md:w-0'
        }`}
      >
        <div
          className={`fixed inset-y-0 right-0 z-50 flex h-full w-[85vw] max-w-[400px] flex-col overflow-visible border-l border-slate-700 bg-slate-900 transform-gpu transition-transform duration-500 ease-in-out max-md:will-change-transform md:will-change-auto md:relative md:inset-auto md:z-auto md:h-full md:w-full md:max-w-none md:translate-x-0 ${
            isRightOpen ? 'translate-x-0' : 'translate-x-full'
          } ${
            !isRightOpen ? 'md:border-none' : ''
          }`}
        >
          <button
            type="button"
            onClick={toggleRightSidebar}
            className="absolute left-0 top-1/2 z-[70] -translate-x-full -translate-y-1/2 rounded-l-md border border-r-0 border-slate-600 bg-slate-800/80 p-2 transition-transform transition-colors hover:bg-slate-700 active:scale-95"
            aria-label={isRightOpen ? tr('rightSidebar.close') : tr('app.calendar')}
          >
            {isRightOpen ? '▶' : '◀'}
          </button>
          <div className="flex h-full w-full min-w-[320px] flex-col overflow-hidden">
            <RightSidebar
              isOpen={isRightOpen}
              uiLang={uiLang}
              currentEvent={currentEvent}
              onSelectEvent={handleRightSidebarSelect}
            />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleEventModalClose}
        uiLang={uiLang}
        currentEvent={currentEvent}
        onSelectEvent={handleEventModalSelect}
      />

      <Suspense fallback={null}>
        <TimelineModal
          isOpen={isTimelineOpen}
          onClose={handleTimelineClose}
          uiLang={uiLang}
        />
        <QuizModal
          isOpen={isQuizOpen}
          onClose={handleQuizClose}
          uiLang={uiLang}
        />
      </Suspense>

      <AboutModal
        isOpen={isAboutOpen}
        onClose={handleAboutClose}
        isFirstVisit={aboutIsFirstVisit}
      />
    </div>
  )
}

export default App
