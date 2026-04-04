import { memo, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getJSTNow, getJSTWallClockParts } from '../utils/dateUtils'
import type { UiLang } from '../utils/i18n'
import { t } from '../utils/i18n'

type TimeFormat = 'dhms' | 'mwdh'

type CountdownDisplayProps = {
  targetDate: Date
  format: TimeFormat
  className?: string
  uiLang: UiLang
}

type RemainingDHMS = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type RemainingMWDH = {
  months: number
  weeks: number
  days: number
  hours: number
}

function calcRemainingDHMS(targetDate: Date): RemainingDHMS {
  const totalMs = Math.max(0, targetDate.getTime() - getJSTNow().getTime())
  const totalSeconds = Math.floor(totalMs / 1000)

  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

function calcRemainingMWDH(targetDate: Date): RemainingMWDH {
  const n = getJSTWallClockParts(getJSTNow())
  const t = getJSTWallClockParts(targetDate)
  const now = new Date(n.year, n.monthIndex, n.day, n.hour, n.minute, n.second)
  const targetCal = new Date(
    t.year,
    t.monthIndex,
    t.day,
    t.hour,
    t.minute,
    t.second,
  )

  // Calculate months (JST 暦に合わせた仮想ローカル日付で月差を算出)
  let months = (targetCal.getFullYear() - now.getFullYear()) * 12
  months += targetCal.getMonth() - now.getMonth()
  if (targetCal.getDate() < now.getDate()) {
    months--
  }

  // Calculate remaining days after months
  const tempDate = new Date(now)
  tempDate.setMonth(tempDate.getMonth() + months)
  const remainingMs = targetDate.getTime() - tempDate.getTime()
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24))

  const weeks = Math.floor(remainingDays / 7)
  const days = remainingDays % 7

  // Calculate hours
  const tempDate2 = new Date(tempDate)
  tempDate2.setDate(tempDate2.getDate() + remainingDays)
  const remainingHours = Math.floor(
    (targetDate.getTime() - tempDate2.getTime()) / (1000 * 60 * 60),
  )

  return {
    months: Math.max(0, months),
    weeks: Math.max(0, weeks),
    days: Math.max(0, days),
    hours: Math.max(0, remainingHours),
  }
}

type FlipNumberProps = {
  value: string | number
  minDigits?: number
  numberClassName: string
  /** 整組數字最小寬度，減少位數變化時排版抖動 */
  groupMinWidthClass?: string
}

function FlipNumber({
  value,
  minDigits,
  numberClassName,
  groupMinWidthClass,
}: FlipNumberProps) {
  const str = useMemo(() => {
    if (typeof value === 'number') {
      return minDigits != null
        ? String(value).padStart(minDigits, '0')
        : String(value)
    }
    return minDigits != null ? value.padStart(minDigits, '0') : value
  }, [value, minDigits])

  const chars = str.split('')

  return (
    <span
      className={`inline-flex items-baseline justify-end tabular-nums ${numberClassName} ${groupMinWidthClass ?? ''}`}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          className="relative inline-grid min-w-[0.62em] place-items-center overflow-hidden align-baseline [height:1em]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${i}-${ch}`}
              className="col-start-1 row-start-1 flex transform-gpu items-center justify-center font-bold tabular-nums leading-none tracking-[-0.05em]"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

type CountSegmentProps = {
  value: string | number
  unit: string
  numberClassName: string
  unitClassName: string
  /** 補零位數；不傳則依數字原樣拆位 */
  minDigits?: number
  groupMinWidthClass?: string
}

function CountSegment({
  value,
  unit,
  numberClassName,
  unitClassName,
  minDigits,
  groupMinWidthClass,
}: CountSegmentProps) {
  return (
    <div className="flex items-baseline gap-0">
      <FlipNumber
        value={value}
        minDigits={minDigits}
        numberClassName={numberClassName}
        groupMinWidthClass={groupMinWidthClass}
      />
      <span className={unitClassName}>{unit}</span>
    </div>
  )
}

function CountdownDisplayInner({
  targetDate,
  format,
  className,
  uiLang,
}: CountdownDisplayProps) {
  const [nowTick, setNowTick] = useState(0)
  const tr = (key: string) => t(uiLang, key)

  useEffect(() => {
    const id = window.setInterval(() => setNowTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const remainingDHMS = useMemo(
    () => calcRemainingDHMS(targetDate),
    [targetDate, nowTick],
  )
  const remainingMWDH = useMemo(
    () => calcRemainingMWDH(targetDate),
    [targetDate, nowTick],
  )

  const labelClass =
    'font-noto-jp mb-4 text-xs font-black uppercase tracking-[0.55em] text-white/45 md:text-sm'
  const rowClass =
    'flex flex-wrap items-baseline justify-center gap-x-2 gap-y-3 sm:gap-x-4 md:gap-x-7 lg:gap-x-10'

  const numberClassName =
    'font-oswald text-[clamp(4.25rem,13vw,12rem)] font-bold tabular-nums leading-none tracking-[-0.05em] text-white drop-shadow-lg md:text-[clamp(6rem,11vw,12rem)]'

  const unitClassName =
    'font-noto-jp ml-0.5 shrink-0 text-[clamp(0.95rem,2.1vw,1.35rem)] font-black leading-none text-white/38 md:text-[1.5rem] lg:text-[2rem]'

  const colonClassName =
    'font-oswald select-none px-0.5 text-[clamp(2.75rem,8.5vw,8rem)] font-light leading-none tracking-[-0.05em] text-white/22 sm:px-1'

  if (format === 'dhms') {
    return (
      <div className={`flex flex-col items-center ${className || ''}`}>
        <div className={labelClass}>{tr('countdown.remaining')}</div>

        {/* 第一排：日 : 時間 */}
        <div className={rowClass}>
          <CountSegment
            value={remainingDHMS.days}
            unit={tr('countdown.days')}
            numberClassName={numberClassName}
            unitClassName={unitClassName}
            groupMinWidthClass="min-w-[2.75ch] sm:min-w-[3ch]"
          />
          <span className={colonClassName} aria-hidden>
            :
          </span>
          <CountSegment
            value={remainingDHMS.hours}
            unit={tr('countdown.hours')}
            minDigits={2}
            numberClassName={numberClassName}
            unitClassName={unitClassName}
            groupMinWidthClass="min-w-[2.15ch]"
          />
        </div>

        {/* 第二排：分 : 秒 */}
        <div className={`${rowClass} mt-3 sm:mt-5`}>
          <CountSegment
            value={remainingDHMS.minutes}
            unit={tr('countdown.mins')}
            minDigits={2}
            numberClassName={numberClassName}
            unitClassName={unitClassName}
            groupMinWidthClass="min-w-[2.15ch]"
          />
          <span className={colonClassName} aria-hidden>
            :
          </span>
          <CountSegment
            value={remainingDHMS.seconds}
            unit={tr('countdown.secs')}
            minDigits={2}
            numberClassName={numberClassName}
            unitClassName={unitClassName}
            groupMinWidthClass="min-w-[2.15ch]"
          />
        </div>

        <div className={`${labelClass} mt-4`}>{tr('countdown.until')}</div>
      </div>
    )
  }

  // mwdh format
  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <div className={labelClass}>{tr('countdown.remaining')}</div>

      {/* 第一排：月 : 週 */}
      <div className={rowClass}>
        <CountSegment
          value={remainingMWDH.months}
          unit={tr('countdown.month')}
          numberClassName={numberClassName}
          unitClassName={unitClassName}
          groupMinWidthClass="min-w-[2.25ch]"
        />
        <span className={colonClassName} aria-hidden>
          :
        </span>
        <CountSegment
          value={remainingMWDH.weeks}
          unit={tr('countdown.week')}
          numberClassName={numberClassName}
          unitClassName={unitClassName}
          groupMinWidthClass="min-w-[2.25ch]"
        />
      </div>

      {/* 第二排：日 : 時間 */}
      <div className={`${rowClass} mt-3 sm:mt-5`}>
        <CountSegment
          value={remainingMWDH.days}
          unit={tr('countdown.days')}
          numberClassName={numberClassName}
          unitClassName={unitClassName}
          groupMinWidthClass="min-w-[2.25ch]"
        />
        <span className={colonClassName} aria-hidden>
          :
        </span>
        <CountSegment
          value={remainingMWDH.hours}
          unit={tr('countdown.hours')}
          minDigits={2}
          numberClassName={numberClassName}
          unitClassName={unitClassName}
          groupMinWidthClass="min-w-[2.15ch]"
        />
      </div>

      <div className={`${labelClass} mt-4`}>{tr('countdown.until')}</div>
    </div>
  )
}

export const CountdownDisplay = memo(CountdownDisplayInner)
