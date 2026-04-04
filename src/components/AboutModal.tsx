import { AnimatePresence, motion } from 'framer-motion'

type AboutModalProps = {
  isOpen: boolean
  onClose: () => void
  /** 初回ウェルカム表示時のみ true（設定から開いた場合は false） */
  isFirstVisit?: boolean
}

export function AboutModal({
  isOpen,
  onClose,
  isFirstVisit = false,
}: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto flex max-h-[90vh] w-11/12 max-w-lg flex-col overflow-hidden rounded-xl border border-slate-600/40 bg-slate-800 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
            >
              <div className="relative shrink-0 border-b border-slate-700/50 bg-slate-800/95 px-4 py-4 backdrop-blur-sm sm:px-6">
                <h2 className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text pr-10 text-center text-2xl font-bold leading-tight text-transparent sm:text-3xl">
                  VSPO! Calendar へようこそ
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-white/75">
                  Welcome to VSPO! Calendar
                </p>
                <p className="mt-2 text-center text-sm leading-relaxed text-white/70">
                  ぶいすぽっ！メンバーの誕生日や記念日、イベントをまとめた非公式ファンカレンダーです。
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-2 top-3 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-3"
                  aria-label="閉じる"
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

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-indigo-300/90">
                      主な機能
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <span
                          className="mt-0.5 shrink-0 text-xl"
                          aria-hidden
                        >
                          📅
                        </span>
                        <div>
                          <p className="font-semibold text-white/95">
                            イベント一覧＆カレンダー (Event Calendar)
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-white/70">
                            月間カレンダーやリスト形式で、全メンバーの記念日を一覧できます。
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span
                          className="mt-0.5 shrink-0 text-xl"
                          aria-hidden
                        >
                          ⏳
                        </span>
                        <div>
                          <p className="font-semibold text-white/95">
                            デビュータイムライン (Debut Timeline)
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-white/70">
                            各メンバーのデビューの歴史や世代ごとの流れを振り返ることができます。
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span
                          className="mt-0.5 shrink-0 text-xl"
                          aria-hidden
                        >
                          🎮
                        </span>
                        <div>
                          <p className="font-semibold text-white/95">
                            VSPO クイズ (VSPO Quiz)
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-white/70">
                            あなたのファン度を試すランダムクイズ機能！名言やぼやけた画像からメンバーを当てよう。
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span
                          className="mt-0.5 shrink-0 text-xl"
                          aria-hidden
                        >
                          ✨
                        </span>
                        <div>
                          <p className="font-semibold text-white/95">
                            メンバーカラー＆エフェクト (Colors &amp; VFX)
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-white/70">
                            公式カラーに基づいた美しい発光エフェクトで、推しの記念日をお祝いします。
                          </p>
                        </div>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-200/80">
                      注意事項
                    </h3>
                    <div className="space-y-3 text-sm leading-relaxed text-white/75">
                      <div>
                        <p className="font-semibold text-white/90">
                          掲載データについて (About Data)
                        </p>
                        <p className="mt-1">
                          本アプリはぶいすぽっ！JP および EN メンバーのデータを収録しています。
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white/90">
                          日付の表示について (Date Values)
                        </p>
                        <p className="mt-1">
                          メンバーの公式プロフィールに合わせるため、日付はすべて
                          <strong className="text-amber-200/90"> JST（日本標準時）</strong>
                          で計算・表示されています。あなたの端末のタイムゾーンに関わらず、日本の時刻に基づきカウントダウンが行われます。
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white/90">
                          お問い合わせ (Contact)
                        </p>
                        <p className="mt-1">
                          ご質問やご提案がある場合は、
                          <span className="text-cyan-300/90">YOUR_TWITTER_ID</span>
                          までご連絡ください。
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
                      免責事項
                    </h3>
                    <div className="rounded-lg border-2 border-amber-500/50 bg-slate-900/50 p-4">
                      <p className="text-sm font-semibold leading-relaxed text-slate-300">
                        ⚠️
                        本プロジェクトは非営利のファンメイド作品であり、「ぶいすぽっ！」公式、株式会社Brave
                        group、およびその関連会社とは一切関係ありません。
                      </p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-400">
                        (This non-profitable project is a fan-made work and is not
                        affiliated with, endorsed by, or in any way officially
                        connected to &quot;VSPO!&quot;, Brave group, or any of its
                        subsidiaries.)
                      </p>
                    </div>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-700/50 bg-slate-800/95 p-4 backdrop-blur-sm sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-blue-600 py-3 text-center text-base font-bold text-white transition-transform transition-colors hover:bg-blue-700 active:scale-[0.98]"
                >
                  {isFirstVisit ? (
                    <>
                      アプリを始める
                      <span className="mt-0.5 block text-xs font-normal text-blue-100/90">
                        Start App
                      </span>
                    </>
                  ) : (
                    <>
                      閉じる
                      <span className="mt-0.5 block text-xs font-normal text-blue-100/90">
                        Close
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
