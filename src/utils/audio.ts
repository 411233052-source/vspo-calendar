let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const maybeWebkitWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext
  }
  const AudioContextCtor =
    window.AudioContext || maybeWebkitWindow.webkitAudioContext
  if (!AudioContextCtor) return null
  if (!audioContext) {
    audioContext = new AudioContextCtor()
  }
  return audioContext
}

async function ensureAudioContextReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext()
  if (!ctx) return null
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return null
    }
  }
  return ctx.state === 'running' ? ctx : null
}

export function playClickSound(soundEnabled: boolean) {
  if (!soundEnabled) return

  void ensureAudioContextReady().then((ctx) => {
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1500, now)
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.03)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.06)
  })
}

// Tiny built-in celebratory sound (base64 WAV), no external file required.
const CELEBRATE_SOUND_DATA_URI =
  'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAGZmzMz//8zMZmYAAGbMzP//zMxmZgAA'

export function playCelebrateSound(soundEnabled: boolean) {
  if (!soundEnabled) return
  const audio = new Audio(CELEBRATE_SOUND_DATA_URI)
  audio.volume = 0.85
  audio.play().catch(() => {
    // Ignore autoplay/user-gesture policy rejections.
  })
}
