import { AnimatePresence, motion } from 'framer-motion'

type EventActionModalProps = {
  isOpen: boolean
  icon: string
  typeLabel: string
  imageUrl?: string
  title: string
  dateLabel: string
  onClose: () => void
}

function normalizeImageUrl(imageUrl?: string): string {
  if (!imageUrl) return ''
  return imageUrl.trim().replace(/^http:\/\//i, 'https://')
}

export function EventActionModal({
  isOpen,
  icon,
  typeLabel,
  imageUrl,
  title,
  dateLabel,
  onClose,
}: EventActionModalProps) {
  const safeImageUrl = normalizeImageUrl(imageUrl)

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="pointer-events-none fixed inset-0 z-[121] flex items-center justify-center p-4">
            <motion.div
              className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="mb-4 flex items-center gap-3">
                {safeImageUrl ? (
                  <img
                    src={safeImageUrl}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover object-center ring-2 ring-white/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">{typeLabel}</p>
                  <p className="text-sm text-cyan-200">{dateLabel}</p>
                </div>
              </div>

              <h3 className="text-center text-lg font-semibold leading-relaxed text-white/95">
                {title}
              </h3>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
