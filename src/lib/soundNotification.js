const STORAGE_KEY_SOUND = 'kds_sound_enabled'

/**
 * Obtém a preferência de áudio do usuário (padrão: true)
 * @returns {boolean}
 */
export function getSoundPreference() {
  try {
    if (typeof window === 'undefined') return true
    const value = localStorage.getItem(STORAGE_KEY_SOUND)
    return value !== null ? value === 'true' : true
  } catch (e) {
    return true
  }
}

/**
 * Salva a preferência de áudio do usuário
 * @param {boolean} enabled 
 */
export function setSoundPreference(enabled) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_SOUND, String(enabled))
  } catch (e) {
    console.warn('Erro ao salvar preferência de som:', e)
  }
}

// Singleton para o contexto de áudio reutilizável (previne limite de instâncias no navegador)
let globalAudioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    globalAudioCtx = new AudioCtx()
  }
  return globalAudioCtx
}

/**
 * Desbloqueia a política de autoplay do navegador ao interagir com a tela
 */
export function unlockAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  } catch (e) {}
}

/**
 * Toca um alerta sonoro sintetizado via Web Audio API (Duas notas harmoniosas: D5 -> A5)
 * Funciona nativamente sem depender de arquivos de áudio externos
 */
export function playNewOrderSound() {
  if (!getSoundPreference()) return

  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Resume contexto caso o navegador tenha suspendido por política de autoplay
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // --- Nota 1 (D5 = 587.33 Hz) ---
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    
    gain1.gain.setValueAtTime(0.25, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.25)

    // --- Nota 2 (A5 = 880.00 Hz) ---
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.00, now + 0.12)
    
    gain2.gain.setValueAtTime(0.35, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(now + 0.12)
    osc2.stop(now + 0.5)
  } catch (err) {
    console.warn('Não foi possível reproduzir a notificação sonora:', err)
  }
}
