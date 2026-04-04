import { useMemo } from 'react'

type BackgroundParticlesProps = {
  enabled: boolean
  accentHex: string
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SHAPES = ['circle', 'square', 'triangle'] as const

export function BackgroundParticles({
  enabled,
  accentHex,
}: BackgroundParticlesProps) {
  const particles = useMemo(() => {
    const rand = mulberry32(0xcafebabe)
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 5 + rand() * 12,
      dur: 48 + rand() * 52,
      delay: -rand() * 45,
      opacity: 0.05 + rand() * 0.09,
      shape: SHAPES[Math.floor(rand() * SHAPES.length)]!,
      rot: rand() * 360,
    }))
  }, [])

  if (!enabled) return null

  const mixAccent = `color-mix(in srgb, ${accentHex} 28%, rgba(255,255,255,0.12))`
  const mixSoft = `color-mix(in srgb, ${accentHex} 18%, rgba(255,255,255,0.06))`

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="vspo-particle-drift absolute will-change-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ['--p-rot' as string]: `${p.rot}deg`,
          }}
        >
          {p.shape === 'circle' ? (
            <div
              className="h-full w-full rounded-full"
              style={{ backgroundColor: mixAccent }}
            />
          ) : p.shape === 'square' ? (
            <div
              className="h-full w-full rotate-45 rounded-[2px] border border-white/18"
              style={{ backgroundColor: mixSoft }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                backgroundColor: mixAccent,
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
