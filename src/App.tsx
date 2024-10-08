import React, { useEffect, useRef, useState } from 'react'
import { Upload, Pause, Play, FileText } from 'lucide-react'

interface Wave {
  y: number
  length: number
  amplitude: number
  frequency: number
  color: string
  speed: number
}

interface Subtitle {
  start: number
  end: number
  text: string
}

function parseSRT(srtContent: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const subtitleBlocks = srtContent.trim().split('\n\n')

  for (const block of subtitleBlocks) {
    const lines = block.split('\n')
    if (lines.length < 3) continue

    const timeRange = lines[1].split(' --> ')
    if (timeRange.length !== 2) continue

    const start = timeStringToSeconds(timeRange[0])
    const end = timeStringToSeconds(timeRange[1])
    
    if (start === null || end === null) continue

    const text = lines.slice(2).join(' ')

    subtitles.push({ start, end, text })
  }

  return subtitles
}

function timeStringToSeconds(timeString: string): number | null {
  if (!timeString) return null

  const parts = timeString.trim().split(':')
  if (parts.length !== 3) return null

  const [hours, minutes, seconds] = parts.map(part => {
    const num = parseFloat(part.replace(',', '.'))
    return isNaN(num) ? 0 : num
  })

  return hours * 3600 + minutes * 60 + seconds
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const srtFileInputRef = useRef<HTMLInputElement>(null)
  const [isAudioHovered, setIsAudioHovered] = useState(false)
  const [isSrtHovered, setIsSrtHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("Dynamic Wave Animation")
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let time = 0
    const waves: Wave[] = [
      { y: canvas.height / 2, length: 0.01, amplitude: 100, frequency: 0.02, color: '#4299e1', speed: 0.05 },
      { y: canvas.height / 2, length: 0.02, amplitude: 80, frequency: 0.03, color: '#ed64a6', speed: 0.07 },
      { y: canvas.height / 2, length: 0.015, amplitude: 60, frequency: 0.01, color: '#48bb78', speed: 0.03 },
      { y: canvas.height / 2, length: 0.025, amplitude: 70, frequency: 0.04, color: '#ecc94b', speed: 0.06 },
    ]

    const extraLines: Wave[] = []
    for (let i = 0; i < 20; i++) {
      extraLines.push({
        y: canvas.height / 2,
        length: Math.random() * 0.03 + 0.005,
        amplitude: Math.random() * 50 + 20,
        frequency: Math.random() * 0.05 + 0.01,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`,
        speed: Math.random() * 0.1 + 0.02
      })
    }

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const allWaves = [...waves, ...extraLines]
      allWaves.forEach((wave, index) => {
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)

        for (let i = 0; i < canvas.width; i++) {
          ctx.lineTo(
            i,
            wave.y + Math.sin(i * wave.length + time * wave.frequency) * wave.amplitude
          )
        }

        ctx.strokeStyle = wave.color
        ctx.lineWidth = index < waves.length ? 3 : 1
        ctx.stroke()

        // Update wave position
        allWaves[index].y = canvas.height / 2 + Math.sin(time * wave.speed) * 50
      })

      // Draw audio-reactive lines
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        const barWidth = canvas.width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2
          const alpha = Math.random() * 0.5 + 0.5 // Random alpha between 0.5 and 1
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
          x += barWidth + 1
        }

        // Add extra reactive lines in the middle
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        for (let i = 0; i < bufferLength; i++) {
          const x = (i / bufferLength) * canvas.width
          const y = (canvas.height / 2) + ((dataArray[i] / 255) * canvas.height / 4) * Math.sin(x * 0.05 + time)
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      time += 0.05

      // Update subtitle
      if (isPlaying && audioContext) {
        const currentTime = audioContext.currentTime - startTimeRef.current
        const currentSub = subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end)
        setCurrentSubtitle(currentSub ? currentSub.text : "Dynamic Wave Animation")
      }
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      waves.forEach(wave => wave.y = canvas.height / 2)
      extraLines.forEach(line => line.y = canvas.height / 2)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isPlaying, subtitles])

  const handleAudioUpload = () => {
    audioFileInputRef.current?.click()
  }

  const handleSrtUpload = () => {
    srtFileInputRef.current?.click()
  }

  const handleAudioFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('Selected audio file:', file.name)
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(newAudioContext)

      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await newAudioContext.decodeAudioData(arrayBuffer)

      const source = newAudioContext.createBufferSource()
      source.buffer = audioBuffer
      
      const newAnalyser = newAudioContext.createAnalyser()
      newAnalyser.fftSize = 256
      source.connect(newAnalyser)
      newAnalyser.connect(newAudioContext.destination)
      
      setAnalyser(newAnalyser)
      setAudioSource(source)

      source.start()
      setIsPlaying(true)
      startTimeRef.current = newAudioContext.currentTime
    }
  }

  const handleSrtFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        console.log('Selected SRT file:', file.name)
        const content = await file.text()
        const parsedSubtitles = parseSRT(content)
        setSubtitles(parsedSubtitles)
        console.log('Parsed subtitles:', parsedSubtitles)
      } catch (error) {
        console.error('Error parsing SRT file:', error)
        alert('Error parsing SRT file. Please check the file format and try again.')
      }
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      audioSource?.stop()
      setIsPlaying(false)
    } else if (audioSource && audioContext) {
      const newSource = audioContext.createBufferSource()
      newSource.buffer = audioSource.buffer
      newSource.connect(analyser!)
      newSource.start()
      setAudioSource(newSource)
      setIsPlaying(true)
      startTimeRef.current = audioContext.currentTime
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <h1 className="text-4xl font-bold text-white z-10 text-center max-w-3xl">{currentSubtitle}</h1>
      <input
        type="file"
        ref={audioFileInputRef}
        onChange={handleAudioFileChange}
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={srtFileInputRef}
        onChange={handleSrtFileChange}
        accept=".srt"
        className="hidden"
      />
      <button
        className={`absolute top-4 right-4 bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-300 ease-in-out transform ${
          isAudioHovered ? 'scale-110 bg-blue-100' : ''
        }`}
        onMouseEnter={() => setIsAudioHovered(true)}
        onMouseLeave={() => setIsAudioHovered(false)}
        onClick={handleAudioUpload}
      >
        <Upload size={24} className={`transition-colors duration-300 ${isAudioHovered ? 'text-blue-600' : 'text-gray-900'}`} />
      </button>
      <button
        className={`absolute top-4 right-20 bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-300 ease-in-out transform ${
          isSrtHovered ? 'scale-110 bg-green-100' : ''
        }`}
        onMouseEnter={() => setIsSrtHovered(true)}
        onMouseLeave={() => setIsSrtHovered(false)}
        onClick={handleSrtUpload}
      >
        <FileText size={24} className={`transition-colors duration-300 ${isSrtHovered ? 'text-green-600' : 'text-gray-900'}`} />
      </button>
      {audioSource && (
        <button
          className="absolute bottom-4 right-4 bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-100"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      )}
    </div>
  )
}

export default App