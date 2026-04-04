import streamsData from '../data/vspo_streams.json'
import historyData from '../data/vspo_history.json'
import { members } from './dateUtils'
import { getMemberName, type UiLang } from './i18n'

export type QuestionType =
  | 'thumbnail_to_title'
  | 'history_year'
  | 'birthday_to_member'

export type QuizOption = {
  id: string
  label: string
  imageUrl?: string
}

export type DynamicQuestion = {
  type: QuestionType
  questionText: string
  options: QuizOption[]
  correctIndex: number
  promptImageUrl?: string
  questionId?: string
}

type StreamRecord = {
  member_id: string
  date: string
  video_id: string
  title: string
  live_thumbnail?: string
}

type HistoryRecord = {
  date: string
  title_jp?: string
  title_en?: string
  title_zh?: string
}

const allMembers = members
const allStreams = streamsData as StreamRecord[]
const allHistory = historyData as HistoryRecord[]
const QUIZ_OPTION_COUNT = 4
const RECENT_QUESTION_LIMIT = 8
const recentQuestionIds: string[] = []

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((v) => v.trim()).filter((v) => v.length > 0)),
  )
}

function hasUniqueLabels(options: QuizOption[]): boolean {
  return new Set(options.map((o) => o.label)).size === options.length
}

function isQuestionValid(question: DynamicQuestion): boolean {
  if (question.options.length !== QUIZ_OPTION_COUNT) return false
  if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
    return false
  }
  const uniqueIds = new Set(question.options.map((o) => o.id))
  if (uniqueIds.size !== question.options.length) return false
  if (!hasUniqueLabels(question.options)) return false
  return true
}

function formatBirthdayLabel(birthday: string, uiLang: UiLang): string {
  const [mmRaw, ddRaw] = birthday.split('-')
  const month = Number(mmRaw)
  const day = Number(ddRaw)
  if (uiLang === 'en') return `${month}/${day}`
  if (uiLang === 'zh') return `${month}月${day}日`
  return `${month}月${day}日`
}

function historyTitle(item: HistoryRecord, uiLang: UiLang): string {
  if (uiLang === 'en') return item.title_en || item.title_jp || item.title_zh || ''
  if (uiLang === 'zh') return item.title_zh || item.title_jp || item.title_en || ''
  return item.title_jp || item.title_en || item.title_zh || ''
}

function pushRecentQuestionId(questionId: string) {
  if (!questionId) return
  recentQuestionIds.push(questionId)
  if (recentQuestionIds.length > RECENT_QUESTION_LIMIT) {
    recentQuestionIds.splice(0, recentQuestionIds.length - RECENT_QUESTION_LIMIT)
  }
}

function generateThumbnailToTitleQuestion(uiLang: UiLang): DynamicQuestion | null {
  const candidates = allStreams.filter(
    (s) => !!s.live_thumbnail?.trim() && !!s.title?.trim() && !!s.member_id,
  )
  if (candidates.length === 0) return null
  const picked = pickRandom(candidates)
  const correctTitle = picked.title.trim()

  const sameMemberTitles = uniqueStrings(
    allStreams
      .filter(
        (s) => s.member_id === picked.member_id && s.title.trim() !== correctTitle,
      )
      .map((s) => s.title),
  )
  const otherMemberTitles = uniqueStrings(
    allStreams
      .filter(
        (s) => s.member_id !== picked.member_id && s.title.trim() !== correctTitle,
      )
      .map((s) => s.title),
  )

  const wrongTitles = new Set<string>()
  shuffleArray(sameMemberTitles).forEach((title) => {
    if (wrongTitles.size < QUIZ_OPTION_COUNT - 1) wrongTitles.add(title)
  })
  shuffleArray(otherMemberTitles).forEach((title) => {
    if (wrongTitles.size < QUIZ_OPTION_COUNT - 1) wrongTitles.add(title)
  })
  if (wrongTitles.size < QUIZ_OPTION_COUNT - 1) {
    const fallbackTitles = uniqueStrings(
      allStreams
        .map((s) => s.title)
        .filter((title) => title.trim() !== correctTitle),
    )
    shuffleArray(fallbackTitles).forEach((title) => {
      if (wrongTitles.size < QUIZ_OPTION_COUNT - 1) wrongTitles.add(title)
    })
  }
  if (wrongTitles.size < QUIZ_OPTION_COUNT - 1) return null

  const options = shuffleArray([
    {
      id: `title-correct-${picked.video_id}`,
      label: correctTitle,
    },
    ...Array.from(wrongTitles)
      .slice(0, QUIZ_OPTION_COUNT - 1)
      .map((title, idx) => ({
      id: `title-wrong-${picked.video_id}-${idx}`,
      label: title,
    })),
  ])

  const correctIndex = options.findIndex((o) => o.label === correctTitle)
  const question: DynamicQuestion = {
    type: 'thumbnail_to_title',
    questionText:
      uiLang === 'en'
        ? 'Which title matches this thumbnail?'
        : uiLang === 'zh'
          ? '這張縮圖對應哪一個直播標題？'
          : 'このサムネに対応する配信タイトルは？',
    options,
    correctIndex,
    promptImageUrl: picked.live_thumbnail?.trim(),
    questionId: `thumbnail:${picked.video_id}`,
  }
  return isQuestionValid(question) ? question : null
}

function generateHistoryYearQuestion(uiLang: UiLang): DynamicQuestion | null {
  const picked = pickRandom(allHistory)
  const eventTitle = historyTitle(picked, uiLang)
  const maskedTitle = eventTitle.replace(/\d{4}/g, '████')
  const correctYear = Number(picked.date.split('-')[0])
  const yearPool = Array.from({ length: 9 }, (_, i) => 2018 + i).filter(
    (y) => y !== correctYear,
  )
  const wrongYears = Array.from(new Set(shuffleArray(yearPool))).slice(
    0,
    QUIZ_OPTION_COUNT - 1,
  )
  if (wrongYears.length < QUIZ_OPTION_COUNT - 1) return null
  const options = shuffleArray(
    [correctYear, ...wrongYears].map((year) => ({
      id: `year-${picked.date}-${year}`,
      label: String(year),
    })),
  )
  const correctIndex = options.findIndex((o) => Number(o.label) === correctYear)

  const question: DynamicQuestion = {
    type: 'history_year',
    questionText:
      uiLang === 'en'
        ? `In which year did "${maskedTitle}" happen?`
        : uiLang === 'zh'
          ? `「${maskedTitle}」是在哪一年發生的？`
          : `「${maskedTitle}」は何年に起きた？`,
    options,
    correctIndex,
    questionId: `history:${picked.date}`,
  }
  return isQuestionValid(question) ? question : null
}

function generateBirthdayToMemberQuestion(uiLang: UiLang): DynamicQuestion | null {
  const birthdayMembers = allMembers.filter((m) => !!m.birthday)
  if (birthdayMembers.length < QUIZ_OPTION_COUNT) return null
  const correctMember = pickRandom(birthdayMembers)
  const wrongMembers = shuffleArray(
    birthdayMembers.filter((m) => m.id !== correctMember.id),
  ).slice(0, QUIZ_OPTION_COUNT - 1)
  if (wrongMembers.length < QUIZ_OPTION_COUNT - 1) return null
  const birthdayLabel = formatBirthdayLabel(correctMember.birthday, uiLang)

  const options = shuffleArray(
    [correctMember, ...wrongMembers].map((member) => ({
      id: member.id,
      label: getMemberName(member, uiLang),
      imageUrl: member.image_url,
    })),
  )
  const correctIndex = options.findIndex((o) => o.id === correctMember.id)

  const question: DynamicQuestion = {
    type: 'birthday_to_member',
    questionText:
      uiLang === 'en'
        ? `Whose birthday is ${birthdayLabel}?`
        : uiLang === 'zh'
          ? `${birthdayLabel} 是哪位成員的生日？`
          : `${birthdayLabel}は誰の誕生日？`,
    options,
    correctIndex,
    questionId: `birthday:${correctMember.id}`,
  }
  return isQuestionValid(question) ? question : null
}

export function generateDynamicQuestion(uiLang: UiLang): DynamicQuestion {
  const questionTypes: QuestionType[] = [
    'thumbnail_to_title',
    'history_year',
    'birthday_to_member',
  ]
  for (let attempt = 0; attempt < 10; attempt++) {
    const selectedType = pickRandom(questionTypes)
    const generated =
      selectedType === 'thumbnail_to_title'
        ? generateThumbnailToTitleQuestion(uiLang)
        : selectedType === 'history_year'
          ? generateHistoryYearQuestion(uiLang)
          : generateBirthdayToMemberQuestion(uiLang)
    if (!generated || !isQuestionValid(generated)) continue
    if (generated.questionId && recentQuestionIds.includes(generated.questionId)) {
      continue
    }
    if (generated.questionId) pushRecentQuestionId(generated.questionId)
    return generated
  }

  // Hard fallback: ensure no freeze even if one pool is unexpectedly sparse.
  const fallback = generateBirthdayToMemberQuestion(uiLang)
  if (
    fallback &&
    isQuestionValid(fallback) &&
    (!fallback.questionId || !recentQuestionIds.includes(fallback.questionId))
  ) {
    if (fallback.questionId) pushRecentQuestionId(fallback.questionId)
    return fallback
  }
  const fallbackHistory = generateHistoryYearQuestion(uiLang)
  if (
    fallbackHistory &&
    isQuestionValid(fallbackHistory) &&
    (!fallbackHistory.questionId || !recentQuestionIds.includes(fallbackHistory.questionId))
  ) {
    if (fallbackHistory.questionId) pushRecentQuestionId(fallbackHistory.questionId)
    return fallbackHistory
  }

  // Final guard - deterministic non-blocking question.
  const finalOptions = shuffleArray([
    { id: 'y2024', label: '2024' },
    { id: 'y2023', label: '2023' },
    { id: 'y2025', label: '2025' },
    { id: 'y2026', label: '2026' },
  ])
  return {
    type: 'history_year',
    questionText: uiLang === 'en' ? 'Select 2024' : uiLang === 'zh' ? '請選擇 2024' : '2024 を選んでください',
    options: finalOptions,
    correctIndex: finalOptions.findIndex((o) => o.id === 'y2024'),
    questionId: `fallback:${Date.now()}`,
  }
}
