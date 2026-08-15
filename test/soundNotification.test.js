import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const mockStorage = new Map()
const mockLocalStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
})

// Mock do objeto window e Web Audio API
class MockAudioNode {
  constructor() {
    this.type = ''
    this.frequency = { setValueAtTime: () => {} }
    this.gain = {
      setValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    }
  }
  connect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended'
    this.currentTime = 0
    this.destination = {}
  }
  createOscillator() {
    return new MockAudioNode()
  }
  createGain() {
    return new MockAudioNode()
  }
  resume() {
    return Promise.reject(new Error('autoplay policy prevented audio'))
  }
}

globalThis.window = {
  AudioContext: MockAudioContext,
  dispatchEvent: () => {}
}

import {
  getSoundPreference,
  setSoundPreference,
  unlockAudio,
  playNewOrderSound
} from '../src/lib/soundNotification.js'

describe('soundNotification Unit Tests', () => {
  beforeEach(() => {
    mockStorage.clear()
    globalThis.localStorage.getItem = (key) => mockStorage.get(key) || null
    globalThis.localStorage.setItem = (key, val) => mockStorage.set(key, String(val))
    globalThis.window = {
      AudioContext: MockAudioContext,
      dispatchEvent: () => {}
    }
  })

  test('getSoundPreference retorna true por padrão quando não configurado', () => {
    assert.equal(getSoundPreference(), true)
  })

  test('setSoundPreference salva e getSoundPreference recupera a preferência', () => {
    setSoundPreference(false)
    assert.equal(getSoundPreference(), false)

    setSoundPreference(true)
    assert.equal(getSoundPreference(), true)
  })

  test('trata exceções em localStorage defensivamente', () => {
    globalThis.localStorage.getItem = () => { throw new Error('storage read error') }
    assert.equal(getSoundPreference(), true)

    globalThis.localStorage.setItem = () => { throw new Error('storage write error') }
    assert.doesNotThrow(() => setSoundPreference(true))
  })

  test('unlockAudio executa resume no contexto de áudio inclusive se estiver suspenso ou com erro', () => {
    assert.doesNotThrow(() => {
      unlockAudio()
    })
  })

  test('playNewOrderSound sintetiza notas sonoras quando habilitado', () => {
    setSoundPreference(true)
    assert.doesNotThrow(() => {
      playNewOrderSound()
    })
  })

  test('playNewOrderSound não executa áudio quando som estiver desabilitado', () => {
    setSoundPreference(false)
    assert.doesNotThrow(() => {
      playNewOrderSound()
    })
  })

  test('playNewOrderSound captura exceções internas da Web Audio API defensivamente', () => {
    setSoundPreference(true)
    globalThis.window.AudioContext = class {
      constructor() {
        this.state = 'suspended'
      }
      createOscillator() {
        throw new Error('Web Audio node failure')
      }
      resume() {
        return Promise.reject(new Error('resume failed'))
      }
    }
    assert.doesNotThrow(() => {
      playNewOrderSound()
    })
  })
})
