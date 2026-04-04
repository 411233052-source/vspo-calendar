import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import quizDataRaw from '../data/quizData.json'
import membersRaw from '../data/vspo_members.json'
import type { UiLang } from '../utils/i18n'
import { interpolate, t } from '../utils/i18n'

type QuizModalProps = {
  isOpen: boolean
  onClose: () => void
  uiLang: UiLang
}

type GameState = 'idle' | 'playing' | 'finished'

type QuizRecord = {
  score: number
  maxCombo: number
  highScore: number
  lastScore: number
  lastMaxCombo: number
}

type QuizDataRow = {
  id: string
  question_type: string
  question: string
  correct_member_id: string
  explanation: string
}

type QuizMember = {
  id: string
  name_jp: string
  name_en: string
  color: string
  image_url: string
}

const quizData = quizDataRaw as QuizDataRow[]
const quizMembers = membersRaw as QuizMember[]

const QUIZ_STORAGE_KEY = 'vspo_quiz_record'
const GAME_TIME_SECONDS = 60
const AUTO_ADVANCE_MS = 1500

function loadQuizRecord(): QuizRecord {
  try {
    const stored = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as QuizRecord
    }
  } catch (error) {
    console.error('Failed to load quiz record:', error)
  }
  return {
    score: 0,
    maxCombo: 0,
    highScore: 0,
    lastScore: 0,
    lastMaxCombo: 0,
  }
}

function saveQuizRecord(score: number, maxCombo: number): void {
  try {
    const current = loadQuizRecord()
    const newRecord: QuizRecord = {
      score,
      maxCombo,
      highScore: Math.max(current.highScore, score),
      lastScore: score,
      lastMaxCombo: maxCombo,
    }
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(newRecord))
  } catch (error) {
    console.error('Failed to save quiz record:', error)
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function normalizeImageUrl(url: string): string {
  return url.trim().replace(/^http:\/\//i, 'https://')
}

function questionTypeBadge(type: string): string {
  switch (type) {
    case 'quote':
      return 'Quote'
    case 'silhouette':
      return 'Blur'
    case 'fan_mark':
      return 'Fan mark'
    case 'unit':
      return 'Unit'
    default:
      return 'Trivia'
  }
}

function correctAnswerGlowStyle(color: string): CSSProperties {
  const c = color.trim()
  const isVeryDark = /^#?0{3,6}$/i.test(c.replace('#', '')) || c === '#000000'
  const glow = isVeryDark ? 'rgba(34,211,238,0.65)' : `${c}99`
  return {
    borderColor: c,
    boxShadow: `0 0 0 2px ${c}, 0 0 20px ${glow}, 0 0 40px ${glow}`,
  }
}

export function QuizModal({ isOpen, onClose, uiLang }: QuizModalProps) {
  const tr = (key: string) => t(uiLang, key)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_SECONDS)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [record, setRecord] = useState<QuizRecord>(loadQuizRecord())
  const [isSaving, setIsSaving] = useState(false)

  const [currentQuestion, setCurrentQuestion] = useState<QuizDataRow | null>(
    null,
  )
  const [options, setOptions] = useState<QuizMember[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)

  const timerRef = useRef<number | null>(null)
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOpenRef = useRef(isOpen)
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(0)
  const maxComboRef = useRef(0)
  isOpenRef.current = isOpen
  gameStateRef.current = gameState
  scoreRef.current = score
  maxComboRef.current = maxCombo

  const clearAutoNextTimeout = useCallback(() => {
    if (autoNextTimeoutRef.current !== null) {
      clearTimeout(autoNextTimeoutRef.current)
      autoNextTimeoutRef.current = null
    }
  }, [])

  const generateQuestion = useCallback(() => {
    if (quizData.length === 0 || quizMembers.length < 4) return

    let row: QuizDataRow | undefined
    let correct: QuizMember | undefined
    for (let a = 0; a < 30; a++) {
      const pick = quizData[Math.floor(Math.random() * quizData.length)]
      if (!pick) continue
      const c = quizMembers.find((m) => m.id === pick.correct_member_id)
      if (c) {
        row = pick
        correct = c
        break
      }
    }
    if (!row || !correct) return

    const wrongPool = quizMembers.filter((m) => m.id !== correct.id)
    const wrongPick = shuffleArray(wrongPool).slice(0, 3)
    if (wrongPick.length < 3) return

    const four = shuffleArray([correct, ...wrongPick])
    setCurrentQuestion(row)
    setOptions(four)
    setSelectedOption(null)
    setIsAnswered(false)
  }, [])

  const handleGameEnd = useCallback(() => {
    clearAutoNextTimeout()
    setGameState('finished')
    saveQuizRecord(scoreRef.current, maxComboRef.current)
    setRecord(loadQuizRecord())
  }, [clearAutoNextTimeout])

  const goToNextQuestion = useCallback(() => {
    generateQuestion()
    setQuestionCount((c) => c + 1)
  }, [generateQuestion])

  const startGame = useCallback(() => {
    clearAutoNextTimeout()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setGameState('playing')
    setTimeLeft(GAME_TIME_SECONDS)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setQuestionCount(1)
    setSelectedOption(null)
    setIsAnswered(false)
    generateQuestion()

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          handleGameEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearAutoNextTimeout, generateQuestion, handleGameEnd])

  const handlePickMember = useCallback(
    (memberId: string) => {
      if (!currentQuestion || isAnswered) return
      clearAutoNextTimeout()
      setSelectedOption(memberId)
      setIsAnswered(true)

      const isCorrect = memberId === currentQuestion.correct_member_id
      if (isCorrect) {
        setCombo((prevCombo) => {
          const nextCombo = prevCombo + 1
          const points = 10 + prevCombo * 2
          setScore((s) => s + points)
          setMaxCombo((m) => Math.max(m, nextCombo))
          return nextCombo
        })
      } else {
        setCombo(0)
      }

      autoNextTimeoutRef.current = window.setTimeout(() => {
        autoNextTimeoutRef.current = null
        if (!isOpenRef.current || gameStateRef.current !== 'playing') return
        goToNextQuestion()
      }, AUTO_ADVANCE_MS)
    },
    [currentQuestion, isAnswered, clearAutoNextTimeout, goToNextQuestion],
  )

  function handleClose() {
    clearAutoNextTimeout()
    if (gameState === 'playing') {
      setIsSaving(true)
      saveQuizRecord(score, maxCombo)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeout(() => {
        setIsSaving(false)
        setGameState('idle')
        setRecord(loadQuizRecord())
        onClose()
      }, 300)
    } else {
      onClose()
    }
  }

  function resetGame() {
    clearAutoNextTimeout()
    setGameState('idle')
    setTimeLeft(GAME_TIME_SECONDS)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setCurrentQuestion(null)
    setOptions([])
    setSelectedOption(null)
    setIsAnswered(false)
    setQuestionCount(0)
    setRecord(loadQuizRecord())
  }

  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current !== null) {
        clearTimeout(autoNextTimeoutRef.current)
        autoNextTimeoutRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) return
    clearAutoNextTimeout()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isOpen, clearAutoNextTimeout])

  useEffect(() => {
    if (!isOpen) return
    clearAutoNextTimeout()
    const id = requestAnimationFrame(() => {
      setIsSaving(false)
      setGameState('idle')
      setTimeLeft(GAME_TIME_SECONDS)
      setScore(0)
      setCombo(0)
      setMaxCombo(0)
      setCurrentQuestion(null)
      setOptions([])
      setSelectedOption(null)
      setIsAnswered(false)
      setQuestionCount(0)
      setRecord(loadQuizRecord())
    })
    return () => {
      cancelAnimationFrame(id)
      clearAutoNextTimeout()
    }
  }, [isOpen, clearAutoNextTimeout])

  const silhouetteMember =
    currentQuestion?.question_type === 'silhouette'
      ? quizMembers.find((m) => m.id === currentQuestion.correct_member_id) ??
        null
      : null

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto flex max-h-[85vh] w-11/12 max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-800 text-white shadow-2xl transform transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between rounded-t-xl border-b border-slate-700/50 bg-slate-800/95 px-6 py-4 backdrop-blur-sm">
                <h2 className="text-2xl font-bold">{tr('quiz.title')}</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="relative z-30 -mr-2 p-2 text-white/70 transition-transform transition-colors hover:text-white active:scale-95 disabled:opacity-50"
                  aria-label={tr('quiz.close')}
                >
                  {isSaving ? (
                    <span className="text-sm">{tr('quiz.saving')}</span>
                  ) : (
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
                  )}
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {gameState === 'idle' && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center gap-8">
                    <div className="text-center">
                      <h3 className="mb-4 text-3xl font-bold">
                        {tr('quiz.titleIdle')}
                      </h3>
                      <p className="mb-8 text-white/70">
                        {interpolate(tr('quiz.desc'), {
                          seconds: GAME_TIME_SECONDS,
                        })}
                      </p>
                    </div>

                    <div className="grid w-full max-w-md grid-cols-2 gap-6">
                      <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                        <div className="mb-2 text-sm text-white/60">
                          {tr('quiz.highScore')}
                        </div>
                        <div className="text-3xl font-bold text-yellow-400">
                          {record.highScore}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                        <div className="mb-2 text-sm text-white/60">
                          {tr('quiz.lastScore')}
                        </div>
                        <div className="text-3xl font-bold text-blue-400">
                          {record.lastScore}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                        <div className="mb-2 text-sm text-white/60">
                          {tr('quiz.maxComboLabel')}
                        </div>
                        <div className="text-3xl font-bold text-purple-400">
                          {record.maxCombo}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                        <div className="mb-2 text-sm text-white/60">
                          {tr('quiz.lastMaxCombo')}
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                          {record.lastMaxCombo}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startGame}
                      className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl active:scale-95"
                    >
                      {tr('quiz.start')}
                    </button>
                  </div>
                )}

                {gameState === 'playing' && currentQuestion && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <div className="text-sm text-white/60">
                            {tr('quiz.score')}
                          </div>
                          <div className="text-2xl font-bold">{score}</div>
                        </div>
                        <div>
                          <div className="text-sm text-white/60">
                            {tr('quiz.combo')}
                          </div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {combo}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-white/60">
                            {tr('quiz.maxComboPlay')}
                          </div>
                          <div className="text-2xl font-bold text-purple-400">
                            {maxCombo}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-white/60">
                            {interpolate(tr('quiz.progress'), { n: questionCount })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60">
                          {tr('quiz.timeLeft')}
                        </div>
                        <div
                          className={`text-3xl font-bold tabular-nums ${
                            timeLeft <= 10 ? 'animate-pulse text-red-400' : ''
                          }`}
                        >
                          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                          {String(timeLeft % 60).padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-700/80 via-slate-800/90 to-indigo-950/50 p-6 shadow-[0_0_40px_rgba(99,102,241,0.12)]">
                      <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-indigo-300/80">
                        {questionTypeBadge(currentQuestion.question_type)}
                      </div>
                      <p className="text-center text-lg font-semibold leading-relaxed text-white/95 md:text-xl">
                        {currentQuestion.question}
                      </p>
                      {silhouetteMember ? (
                        <div className="mt-5 flex justify-center">
                          <div className="h-32 w-32 overflow-hidden rounded-full sm:h-40 sm:w-40">
                            <img
                              src={normalizeImageUrl(silhouetteMember.image_url)}
                              alt=""
                              className="h-full w-full scale-110 object-cover blur-xl select-none pointer-events-none"
                              referrerPolicy="no-referrer"
                              draggable={false}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                        isAnswered ? 'pointer-events-none' : ''
                      }`}
                    >
                      {options.map((m) => {
                        const isSelected = selectedOption === m.id
                        const isCorrectId = m.id === currentQuestion.correct_member_id
                        const showCorrectHighlight = isAnswered && isCorrectId
                        const showWrongDim =
                          isAnswered && isSelected && !isCorrectId

                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handlePickMember(m.id)}
                            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-600/50 bg-slate-700/40 p-4 transition-all duration-200 hover:border-slate-500 hover:bg-slate-700/70 active:scale-95 ${
                              showWrongDim ? 'opacity-50' : ''
                            } ${showCorrectHighlight ? 'opacity-100' : ''}`}
                            style={
                              showCorrectHighlight
                                ? correctAnswerGlowStyle(m.color)
                                : undefined
                            }
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-800 shadow-lg ring-2 ring-black/20">
                              <img
                                src={normalizeImageUrl(m.image_url)}
                                alt=""
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-center text-sm font-bold text-white/95">
                              {m.name_jp}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {isAnswered && currentQuestion ? (
                      <div className="rounded-xl border border-cyan-500/25 bg-slate-900/60 p-4">
                        <p className="text-sm leading-relaxed text-white/85">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                {gameState === 'finished' && (
                  <div className="flex min-h-[400px] flex-col items-center justify-center gap-8">
                    <div className="text-center">
                      <h3 className="mb-4 text-3xl font-bold">
                        {tr('quiz.gameOver')}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1 text-sm text-white/60">
                            {tr('quiz.finalScore')}
                          </div>
                          <div className="text-4xl font-bold text-yellow-400">
                            {score}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm text-white/60">
                            {tr('quiz.maxComboPlay')}
                          </div>
                          <div className="text-3xl font-bold text-purple-400">
                            {maxCombo}
                          </div>
                        </div>
                        {score >= record.highScore && score > 0 ? (
                          <div className="animate-pulse font-semibold text-green-400">
                            {tr('quiz.newRecord')}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={resetGame}
                        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:scale-95"
                      >
                        {tr('quiz.again')}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95"
                      >
                        {tr('quiz.close')}
                      </button>
                    </div>
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
