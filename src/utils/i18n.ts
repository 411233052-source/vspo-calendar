import type { VspoMember } from './dateUtils'

export type UiLang = 'jp' | 'en' | 'zh'

const STRINGS: Record<UiLang, Record<string, string>> = {
  jp: {
    'countdown.remaining': '残り',
    'countdown.days': '日',
    'countdown.hours': '時間',
    'countdown.mins': '分',
    'countdown.secs': '秒',
    'countdown.until': 'まで',
    'countdown.month': '月',
    'countdown.week': '週',
    'nav.timeline': '📖 年表',
    'nav.eventsList': '≡ 一覧',
    'settings.title': '設定',
    'settings.language': '言語',
    'settings.about': 'ℹ️ ようこそ / 免責事項',
    'settings.sound': 'サウンド',
    'settings.vfx': 'VFX',
    'settings.on': 'オン',
    'settings.off': 'オフ',
    'eventModal.title': 'イベントを選択',
    'eventModal.searchLabel': '検索',
    'eventModal.searchPlaceholder': '名前・イベントで検索…',
    'eventModal.typeLabel': '種別',
    'eventModal.all': 'すべて',
    'eventModal.birthday': '誕生日',
    'eventModal.anniversary': '周年記念',
    'eventModal.sortAsc': '↑ 時間順',
    'eventModal.sortDesc': '↓ 逆順',
    'eventModal.sortTitleAsc': '古い順 → 新しい順',
    'eventModal.sortTitleDesc': '新しい順 → 古い順',
    'eventModal.gen': '期生',
    'eventModal.selectAllGen': 'すべて選択',
    'eventModal.deselectAllGen': 'すべて解除',
    'eventModal.empty': '該当するイベントがありません',
    'eventModal.close': '閉じる',
    'eventModal.monthThis': '今月',
    'eventModal.monthNext': '来月',
    'eventModal.sectionToday': '今日',
    'eventModal.sectionThisWeek': '今週',
    'eventModal.sectionThisMonth': '今月',
    'eventModal.sectionNextMonth': '来月',
    'eventModal.sectionTwoThreeMonths': '2-3ヶ月',
    'eventModal.sectionThreeSixMonths': '3-6ヶ月',
    'eventModal.sectionSixNineMonths': '6-9ヶ月',
    'eventModal.sectionNinePlusMonths': '9ヶ月以上',
    'eventCard.debut': '初配信 (Debut)',
    'app.timelineAria': '年間の位置',
    'app.loading': '読み込み中…',
    'app.prevEvent': '前のイベント',
    'app.nextEvent': '次のイベント',
    'app.archive': '過去の配信',
    'app.calendar': 'カレンダー',
    'app.slideshow': '▷ スライド',
    'app.slideshowTitle': 'スライドショー（5〜7秒でランダム切替）',
    'app.timeToggleTitle': '時間単位切替',
    'app.timeFormatMwdh': '🕒 月週:日時',
    'app.timeFormatDhms': '🕒 日時:分秒',
    'app.quiz': '🎮 クイズ！',
    'app.langSwitcherAria': '表示言語を切り替え（日本語↔English）',
    'leftSidebar.titleAnniversary': '{name}の周年記念アーカイブ',
    'leftSidebar.titleBirthdayMix': '{name}の誕生日・記念アーカイブ',
    'leftSidebar.streamCount': '{count} 件の配信',
    'leftSidebar.emptyPast': '過去のイベントはありません',
    'leftSidebar.emptyCategory': 'このカテゴリの配信はまだありません',
    'timeline.title': 'デビュー年表',
    'timeline.majorEvents': '重大イベント',
    'timeline.prevYear': '前の年へ',
    'timeline.nextYear': '次の年へ',
    'timeline.goYear': '{year}年へ移動',
    'timeline.continues': 'さらに続く...',
    'timeline.close': '閉じる',
    'timeline.debutSuffix': 'デビュー',
    'timeline.unavailable': '非公開 / アーカイブなし',
    'timeline.noDebutArchive': '初配信アーカイブなし',
    'rightSidebar.title': 'イベントカレンダー',
    'rightSidebar.close': '閉じる',
    'rightSidebar.prevMonth': '前の月',
    'rightSidebar.nextMonth': '次の月',
    'rightSidebar.prevYear': '前年',
    'rightSidebar.nextYear': '次年',
    'rightSidebar.toggleYearView': '年表示に切替',
    'rightSidebar.today': '今日',
    'rightSidebar.monthEventsTitle': '今月のイベント',
    'rightSidebar.dayEventsTitle': '{month}月{day}日のイベント',
    'rightSidebar.monthEventsEmpty': '今月のイベントはありません',
    'rightSidebar.showAll': '今月を表示',
    'rightSidebar.moreInDay': '+{n}件の続き',
    'rightSidebar.moreEvents': '他{n}件',
    'rightSidebar.daySuffix': '日',
    'rightSidebar.statsTotal': 'イベント数',
    'rightSidebar.statsDays': 'イベントのある日数',
    'rightSidebar.statsTopGen': '最も活動的な期生',
    'rightSidebar.eventTypeBirthday': '誕生日',
    'rightSidebar.eventTypeAnniversary': '記念日',
    'rightSidebar.eventTypeBirthdayAbbr': '誕',
    'rightSidebar.eventTypeAnniversaryAbbr': '記念',
    'quiz.title': 'VSPO クイズ',
    'quiz.titleIdle': 'VSPO メンバークイズ',
    'quiz.desc': '{seconds}秒間でできるだけ多くの問題に正解しよう！',
    'quiz.highScore': '最高得点',
    'quiz.lastScore': '前回得点',
    'quiz.maxComboLabel': '最高コンボ',
    'quiz.lastMaxCombo': '前回コンボ',
    'quiz.start': 'ゲーム開始',
    'quiz.score': '得点',
    'quiz.combo': 'コンボ',
    'quiz.maxComboPlay': '最大コンボ',
    'quiz.timeLeft': '残り時間',
    'quiz.gameOver': 'ゲーム終了！',
    'quiz.finalScore': '最終得点',
    'quiz.newRecord': '🎉 新記録達成！',
    'quiz.again': 'もう一度',
    'quiz.close': '閉じる',
    'quiz.saving': '記録中...',
    'quiz.next': '次の問題',
    'quiz.progress': '第 {n} 問',
  },
  en: {
    'countdown.remaining': 'Remaining',
    'countdown.days': 'Days',
    'countdown.hours': 'Hours',
    'countdown.mins': 'Mins',
    'countdown.secs': 'Secs',
    'countdown.until': 'Until',
    'countdown.month': 'Mo',
    'countdown.week': 'Wk',
    'nav.timeline': '📖 Timeline',
    'nav.eventsList': '≡ Events',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.about': 'ℹ️ Welcome & disclaimer',
    'settings.sound': 'Sound',
    'settings.vfx': 'VFX',
    'settings.on': 'On',
    'settings.off': 'Off',
    'eventModal.title': 'Select Event',
    'eventModal.searchLabel': 'Search',
    'eventModal.searchPlaceholder': 'Search by name or event…',
    'eventModal.typeLabel': 'Type',
    'eventModal.all': 'All',
    'eventModal.birthday': 'Birthday',
    'eventModal.anniversary': 'Anniversary',
    'eventModal.sortAsc': '↑ Time',
    'eventModal.sortDesc': '↓ Reverse',
    'eventModal.sortTitleAsc': 'Oldest → newest',
    'eventModal.sortTitleDesc': 'Newest → oldest',
    'eventModal.gen': 'Gen',
    'eventModal.selectAllGen': 'Select all',
    'eventModal.deselectAllGen': 'Clear all',
    'eventModal.empty': 'No matching events',
    'eventModal.close': 'Close',
    'eventModal.monthThis': 'This month',
    'eventModal.monthNext': 'Next month',
    'eventModal.sectionToday': 'Today',
    'eventModal.sectionThisWeek': 'This Week',
    'eventModal.sectionThisMonth': 'This Month',
    'eventModal.sectionNextMonth': 'Next Month',
    'eventModal.sectionTwoThreeMonths': '2-3 Months',
    'eventModal.sectionThreeSixMonths': '3-6 Months',
    'eventModal.sectionSixNineMonths': '6-9 Months',
    'eventModal.sectionNinePlusMonths': '9+ Months',
    'eventCard.debut': 'Debut stream',
    'app.timelineAria': 'Position in year',
    'app.loading': 'Loading…',
    'app.prevEvent': 'Previous event',
    'app.nextEvent': 'Next event',
    'app.archive': 'Past streams',
    'app.calendar': 'Calendar',
    'app.slideshow': '▷ Slides',
    'app.slideshowTitle': 'Slideshow (random every 5–7s)',
    'app.timeToggleTitle': 'Switch time units',
    'app.timeFormatMwdh': '🕒 Mo/Wk:Day:Hr',
    'app.timeFormatDhms': '🕒 Day:Hr:Min:Sec',
    'app.quiz': '🎮 Quiz!',
    'app.langSwitcherAria':
      'Switch interface language between Japanese and English',
    'leftSidebar.titleAnniversary': "{name}'s anniversary archive",
    'leftSidebar.titleBirthdayMix': "{name}'s birthday & milestones",
    'leftSidebar.streamCount': '{count} streams',
    'leftSidebar.emptyPast': 'No past events',
    'leftSidebar.emptyCategory': 'No streams in this category yet',
    'timeline.title': 'Debut timeline',
    'timeline.majorEvents': 'Major events',
    'timeline.prevYear': 'Previous year',
    'timeline.nextYear': 'Next year',
    'timeline.goYear': 'Go to {year}',
    'timeline.continues': 'To be continued…',
    'timeline.close': 'Close',
    'timeline.debutSuffix': 'Debut',
    'timeline.unavailable': 'Private / no archive',
    'timeline.noDebutArchive': 'No debut VOD',
    'rightSidebar.title': 'Event calendar',
    'rightSidebar.close': 'Close',
    'rightSidebar.prevMonth': 'Previous month',
    'rightSidebar.nextMonth': 'Next month',
    'rightSidebar.prevYear': 'Previous year',
    'rightSidebar.nextYear': 'Next year',
    'rightSidebar.toggleYearView': 'Toggle year / month view',
    'rightSidebar.today': 'Today',
    'rightSidebar.monthEventsTitle': 'This month',
    'rightSidebar.dayEventsTitle': 'Events on {month}/{day}',
    'rightSidebar.monthEventsEmpty': 'No events this month',
    'rightSidebar.showAll': 'Show all',
    'rightSidebar.moreInDay': '+{n} more',
    'rightSidebar.moreEvents': '+{n} more',
    'rightSidebar.daySuffix': '',
    'rightSidebar.statsTotal': 'Total events',
    'rightSidebar.statsDays': 'Active event days',
    'rightSidebar.statsTopGen': 'Most active generation',
    'rightSidebar.eventTypeBirthday': 'Birthday',
    'rightSidebar.eventTypeAnniversary': 'Anniversary',
    'rightSidebar.eventTypeBirthdayAbbr': 'Birth',
    'rightSidebar.eventTypeAnniversaryAbbr': 'Anniv',
    'quiz.title': 'VSPO Quiz',
    'quiz.titleIdle': 'VSPO Member Quiz',
    'quiz.desc': 'Answer as many as you can in {seconds} seconds!',
    'quiz.highScore': 'High score',
    'quiz.lastScore': 'Last score',
    'quiz.maxComboLabel': 'Best combo',
    'quiz.lastMaxCombo': 'Last combo',
    'quiz.start': 'Start',
    'quiz.score': 'Score',
    'quiz.combo': 'Combo',
    'quiz.maxComboPlay': 'Max combo',
    'quiz.timeLeft': 'Time left',
    'quiz.gameOver': 'Game over!',
    'quiz.finalScore': 'Final score',
    'quiz.newRecord': '🎉 New record!',
    'quiz.again': 'Play again',
    'quiz.close': 'Close',
    'quiz.saving': 'Saving…',
    'quiz.next': 'Next',
    'quiz.progress': 'Question {n}',
  },
  zh: {
    'countdown.remaining': '剩餘',
    'countdown.days': '天',
    'countdown.hours': '時',
    'countdown.mins': '分',
    'countdown.secs': '秒',
    'countdown.until': '距離',
    'countdown.month': '月',
    'countdown.week': '週',
    'nav.timeline': '📖 年表',
    'nav.eventsList': '≡ 一覽',
    'settings.title': '設定',
    'settings.language': '語言',
    'settings.about': 'ℹ️ 歡迎與免責聲明',
    'settings.sound': '音效',
    'settings.vfx': '動畫特效',
    'settings.on': '開',
    'settings.off': '關',
    'eventModal.title': '選擇事件',
    'eventModal.searchLabel': '搜尋',
    'eventModal.searchPlaceholder': '以姓名或事件搜尋…',
    'eventModal.typeLabel': '種類',
    'eventModal.all': '全部',
    'eventModal.birthday': '生日',
    'eventModal.anniversary': '週年',
    'eventModal.sortAsc': '↑ 時間順',
    'eventModal.sortDesc': '↓ 逆序',
    'eventModal.sortTitleAsc': '由早到晚',
    'eventModal.sortTitleDesc': '由晚到早',
    'eventModal.gen': '期生',
    'eventModal.selectAllGen': '全選',
    'eventModal.deselectAllGen': '全部解除',
    'eventModal.empty': '沒有符合的事件',
    'eventModal.close': '關閉',
    'eventModal.monthThis': '本月',
    'eventModal.monthNext': '下月',
    'eventModal.sectionToday': '今日',
    'eventModal.sectionThisWeek': '本週',
    'eventModal.sectionThisMonth': '本月',
    'eventModal.sectionNextMonth': '來月',
    'eventModal.sectionTwoThreeMonths': '2-3個月',
    'eventModal.sectionThreeSixMonths': '3-6個月',
    'eventModal.sectionSixNineMonths': '6-9個月',
    'eventModal.sectionNinePlusMonths': '9個月以上',
    'eventCard.debut': '初配信 (Debut)',
    'app.timelineAria': '年度進度',
    'app.loading': '載入中…',
    'app.prevEvent': '上一個活動',
    'app.nextEvent': '下一個活動',
    'app.archive': '過去直播',
    'app.calendar': '行事曆',
    'app.slideshow': '▷ 輪播',
    'app.slideshowTitle': '輪播（約 5～7 秒隨機切換）',
    'app.timeToggleTitle': '切換時間單位',
    'app.timeFormatMwdh': '🕒 月週:日時',
    'app.timeFormatDhms': '🕒 日時:分秒',
    'app.quiz': '🎮 測驗！',
    'app.langSwitcherAria': '在日文與英文介面之間切換',
    'leftSidebar.titleAnniversary': '{name} 週年紀念存檔',
    'leftSidebar.titleBirthdayMix': '{name} 生日與紀念存檔',
    'leftSidebar.streamCount': '{count} 部直播',
    'leftSidebar.emptyPast': '尚無過去活動',
    'leftSidebar.emptyCategory': '此分類尚無直播',
    'timeline.title': '出道年表',
    'timeline.majorEvents': '重大事件',
    'timeline.prevYear': '上一年',
    'timeline.nextYear': '下一年',
    'timeline.goYear': '前往 {year} 年',
    'timeline.continues': '仍持續擴充中…',
    'timeline.close': '關閉',
    'timeline.debutSuffix': '出道',
    'timeline.unavailable': '非公開／無存檔',
    'timeline.noDebutArchive': '無初配信存檔',
    'rightSidebar.title': '活動行事曆',
    'rightSidebar.close': '關閉',
    'rightSidebar.prevMonth': '上個月',
    'rightSidebar.nextMonth': '下個月',
    'rightSidebar.prevYear': '上一年',
    'rightSidebar.nextYear': '下一年',
    'rightSidebar.toggleYearView': '切換年／月檢視',
    'rightSidebar.today': '今天',
    'rightSidebar.monthEventsTitle': '本月活動',
    'rightSidebar.dayEventsTitle': '{month}月{day}日的活動',
    'rightSidebar.monthEventsEmpty': '本月沒有活動',
    'rightSidebar.showAll': '顯示本月全部',
    'rightSidebar.moreInDay': '+還有{n}件',
    'rightSidebar.moreEvents': '另 {n} 件',
    'rightSidebar.daySuffix': '日',
    'rightSidebar.statsTotal': '事件數',
    'rightSidebar.statsDays': '有事件的天數',
    'rightSidebar.statsTopGen': '最活躍期生',
    'rightSidebar.eventTypeBirthday': '生日',
    'rightSidebar.eventTypeAnniversary': '紀念日',
    'rightSidebar.eventTypeBirthdayAbbr': '生',
    'rightSidebar.eventTypeAnniversaryAbbr': '紀念',
    'quiz.title': 'VSPO 測驗',
    'quiz.titleIdle': 'VSPO 成員測驗',
    'quiz.desc': '在 {seconds} 秒內盡可能答對更多題目！',
    'quiz.highScore': '最高分',
    'quiz.lastScore': '上次得分',
    'quiz.maxComboLabel': '最高連擊',
    'quiz.lastMaxCombo': '上次連擊',
    'quiz.start': '開始遊戲',
    'quiz.score': '得分',
    'quiz.combo': '連擊',
    'quiz.maxComboPlay': '最大連擊',
    'quiz.timeLeft': '剩餘時間',
    'quiz.gameOver': '遊戲結束！',
    'quiz.finalScore': '最終得分',
    'quiz.newRecord': '🎉 新紀錄！',
    'quiz.again': '再玩一次',
    'quiz.close': '關閉',
    'quiz.saving': '儲存中…',
    'quiz.next': '下一題',
    'quiz.progress': '第 {n} 題',
  },
}

export function t(lang: UiLang, key: string): string {
  const row = STRINGS[lang] ?? STRINGS.zh
  return row[key] ?? STRINGS.zh[key] ?? key
}

/** 將字串中的 `{name}`、`{count}`、`{n}`、`{year}`、`{seconds}` 替換 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v))
  }
  return s
}

/** 顯示用名稱：英文用 name_en；日文／繁中介面皆顯示日文原名 name_jp（繁中不再用 name_zh）。 */
export function getMemberName(member: VspoMember, uiLang: UiLang): string {
  if (uiLang === 'en') {
    const n = member.name_en?.trim()
    return n || member.name_jp
  }
  return member.name_jp
}

function enOrdinalAnniversary(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/**
 * 主畫面／一覽卡片標題（生日可附年份）
 */
export function formatEventTitle(
  memberName: string,
  eventType: 'birthday' | 'anniversary',
  uiLang: UiLang,
  opts?: { anniversaryYears?: number; birthdayYear?: number },
): string {
  if (eventType === 'birthday') {
    const y = opts?.birthdayYear
    if (uiLang === 'en') {
      const base = `${memberName}'s Birthday`
      return y != null ? `${base} ${y}` : base
    }
    if (uiLang === 'zh') {
      const base = `${memberName}的生日`
      return y != null ? `${base} ${y}` : base
    }
    const base = `${memberName}の誕生日`
    return y != null ? `${base} ${y}` : base
  }
  const n = opts?.anniversaryYears ?? 0
  if (uiLang === 'en') {
    return `${memberName}'s ${enOrdinalAnniversary(n)} Anniversary`
  }
  if (uiLang === 'zh') {
    return `${memberName} ${n}週年紀念`
  }
  return `${memberName} ${n}周年記念`
}

export function formatMonthHeading(
  date: Date,
  now: Date,
  lang: UiLang,
): string {
  const y = date.getFullYear()
  const m = date.getMonth()
  const ny = now.getFullYear()
  const nm = now.getMonth()
  if (y === ny && m === nm) return t(lang, 'eventModal.monthThis')
  const next =
    nm === 11 ? new Date(ny + 1, 0, 1) : new Date(ny, nm + 1, 1)
  if (y === next.getFullYear() && m === next.getMonth()) {
    return t(lang, 'eventModal.monthNext')
  }
  if (lang === 'en') {
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }
  return `${y}年${m + 1}月`
}

export function formatEventListDate(date: Date, lang: UiLang): string {
  if (lang === 'en') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function formatTimelineDebutShort(
  debutYmd: string,
  uiLang: UiLang,
): string {
  const date = new Date(`${debutYmd}T12:00:00`)
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const suffix = t(uiLang, 'timeline.debutSuffix')
  return `${yy}.${mm}.${dd} ${suffix}`
}

export function formatTimelineEventDate(eventDate: string, uiLang: UiLang): string {
  const date = new Date(`${eventDate}T12:00:00`)
  if (uiLang === 'en') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}
