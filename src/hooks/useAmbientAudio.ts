import { useEffect, useRef, useState } from 'react'

export function useAmbientAudio() {
  const contextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const sourcesRef = useRef<AudioScheduledSourceNode[]>([])
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(true)

  const toggle = async () => {
    const AudioContextConstructor = window.AudioContext
    if (!AudioContextConstructor) {
      setSupported(false)
      return
    }

    let context = contextRef.current
    if (!context || context.state === 'closed') {
      context = new AudioContextConstructor()
      contextRef.current = context

      const masterGain = context.createGain()
      masterGain.gain.value = 0
      masterGain.connect(context.destination)
      masterGainRef.current = masterGain

      const lowPass = context.createBiquadFilter()
      lowPass.type = 'lowpass'
      lowPass.frequency.value = 290
      lowPass.connect(masterGain)

      const bass = context.createOscillator()
      bass.type = 'sine'
      bass.frequency.value = 55
      const bassGain = context.createGain()
      bassGain.gain.value = 0.42
      bass.connect(bassGain).connect(lowPass)
      bass.start()

      const upperDrone = context.createOscillator()
      upperDrone.type = 'triangle'
      upperDrone.frequency.value = 82.41
      const droneGain = context.createGain()
      droneGain.gain.value = 0.16
      upperDrone.connect(droneGain).connect(lowPass)
      upperDrone.start()

      const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
      const noiseSamples = noiseBuffer.getChannelData(0)
      for (let index = 0; index < noiseSamples.length; index += 1) {
        noiseSamples[index] = (Math.random() * 2 - 1) * 0.22
      }
      const marketNoise = context.createBufferSource()
      marketNoise.buffer = noiseBuffer
      marketNoise.loop = true
      const noiseFilter = context.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = 360
      noiseFilter.Q.value = 0.6
      const noiseGain = context.createGain()
      noiseGain.gain.value = 0.11
      marketNoise.connect(noiseFilter).connect(noiseGain).connect(masterGain)
      marketNoise.start()

      sourcesRef.current = [bass, upperDrone, marketNoise]
    }

    try {
      if (context.state === 'suspended') await context.resume()
      const nextEnabled = !enabled
      const masterGain = masterGainRef.current
      if (masterGain) {
        masterGain.gain.cancelScheduledValues(context.currentTime)
        masterGain.gain.setTargetAtTime(nextEnabled ? 0.32 : 0, context.currentTime, 0.24)
      }
      setEnabled(nextEnabled)
    } catch {
      setSupported(false)
      setEnabled(false)
    }
  }

  const playBell = async () => {
    const context = contextRef.current
    const masterGain = masterGainRef.current
    if (!enabled || !context || !masterGain || context.state === 'closed') return

    try {
      if (context.state === 'suspended') await context.resume()
      const startTime = context.currentTime
      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0.0001, startTime)
      envelope.gain.exponentialRampToValueAtTime(0.2, startTime + 0.012)
      envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.82)
      envelope.connect(masterGain)

      for (const [index, frequency] of [880, 1320, 1760].entries()) {
        const oscillator = context.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, startTime)
        const partialGain = context.createGain()
        partialGain.gain.value = index === 0 ? 0.8 : 0.32
        oscillator.connect(partialGain).connect(envelope)
        oscillator.onended = () => {
          sourcesRef.current = sourcesRef.current.filter((source) => source !== oscillator)
          partialGain.disconnect()
          if (index === 2) envelope.disconnect()
        }
        oscillator.start(startTime)
        oscillator.stop(startTime + 0.84)
        sourcesRef.current.push(oscillator)
      }
    } catch {
      setSupported(false)
    }
  }

  useEffect(() => () => {
    sourcesRef.current.forEach((source) => source.stop())
    sourcesRef.current = []
    const context = contextRef.current
    contextRef.current = null
    if (context && context.state !== 'closed') void context.close()
  }, [])

  return { enabled, supported, toggle, playBell }
}