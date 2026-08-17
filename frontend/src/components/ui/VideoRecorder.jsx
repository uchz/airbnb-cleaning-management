import { useState, useRef, useEffect } from 'react'
import Button from './Button'
import { Camera, Video, Square, RotateCcw, Check, Upload } from 'lucide-react'

export default function VideoRecorder({ onVideoReady, maxSeconds = 120 }) {
  const [stream, setStream] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(null) // { blob, url, source }
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)

  const startCamera = async () => {
    setError('')
    try {
      // Prioriza câmera traseira quando disponível
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: true,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch (err) {
      setError('Não foi possível acessar a câmera. Permita o acesso pelo navegador ou use a opção de adicionar vídeo.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valida que é um vídeo
    if (!file.type.startsWith('video/')) {
      setError('O arquivo selecionado não é um vídeo.')
      return
    }

    setError('')
    // Para o modo câmera se estiver ativo
    stopCamera()

    const url = URL.createObjectURL(file)
    setRecorded({ blob: file, url, source: 'gallery' })
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = url
    }
    onVideoReady(file)
  }

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecorded({ blob, url, source: 'record' })
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = url
      }
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      onVideoReady(blob)
    }

    recorder.start()
    setRecording(true)
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxSeconds) {
          mediaRecorderRef.current?.stop()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
    }
  }

  const reset = () => {
    if (recorded?.url) URL.revokeObjectURL(recorded.url)
    setRecorded(null)
    setElapsed(0)
    onVideoReady(null)
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.src = ''
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-3">
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          controls={!!recorded}
          className="w-full h-full object-cover"
        />
        {!stream && !recorded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
            <Camera size={32} className="mb-2" />
            <p className="text-sm">Câmera desativada</p>
          </div>
        )}
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs px-2 py-1 rounded-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            GRAVANDO {formatTime(elapsed)}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2 justify-center flex-wrap">
        {/* Estado inicial: opções de câmera ou galeria */}
        {!stream && !recorded && (
          <>
            <Button type="button" onClick={startCamera}>
              <span className="flex items-center gap-2">
                <Camera size={16} /> Ativar Câmera
              </span>
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <span className="flex items-center gap-2">
                <Upload size={16} /> Adicionar Vídeo
              </span>
            </Button>
          </>
        )}

        {stream && !recording && !recorded && (
          <Button type="button" variant="danger" onClick={startRecording}>
            <span className="flex items-center gap-2">
              <Video size={16} /> Gravar Vídeo
            </span>
          </Button>
        )}

        {recording && (
          <Button type="button" variant="danger" onClick={stopRecording}>
            <span className="flex items-center gap-2">
              <Square size={16} /> Parar Gravação
            </span>
          </Button>
        )}

        {recorded && (
          <>
            <Button type="button" variant="outline" onClick={reset}>
              <span className="flex items-center gap-2">
                <RotateCcw size={16} /> {recorded.source === 'gallery' ? 'Trocar Vídeo' : 'Gravar Novamente'}
              </span>
            </Button>
            <Button type="submit" variant="success">
              <span className="flex items-center gap-2">
                <Check size={16} /> Confirmar Vídeo
              </span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}