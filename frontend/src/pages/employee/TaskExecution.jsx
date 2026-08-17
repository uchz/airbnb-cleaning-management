import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTask, getExecution, checkin, checkout, getTaskChecklist, updateChecklistItem } from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import VideoRecorder from '../../components/ui/VideoRecorder'
import { formatDate, formatDateTime, formatTime, taskTypeLabels } from '../../utils'
import { MapPin, Clock, ArrowLeft, Video as VideoIcon, CheckCircle2, Loader2, ListChecks } from 'lucide-react'

export default function TaskExecution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [execution, setExecution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('checkin') // checkin | checkout | done
  const [videoBlob, setVideoBlob] = useState(null)
  const [observations, setObservations] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checklist, setChecklist] = useState([])
  const [checklistLoading, setChecklistLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, execRes] = await Promise.all([
          getTask(id),
          getExecution(id).catch(() => null),
        ])
        setTask(taskRes.data)
        setExecution(execRes?.data || null)

        if (taskRes.data.status === 'completed') {
          setStep('done')
        } else if (execRes?.data?.checkin_time) {
          setStep('checkout')
          loadChecklist()
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const loadChecklist = async () => {
    setChecklistLoading(true)
    try {
      const res = await getTaskChecklist(id)
      setChecklist(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setChecklistLoading(false)
    }
  }

  const toggleChecklistItem = async (item) => {
    const newState = !item.is_checked
    setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: newState } : i)))
    try {
      await updateChecklistItem(item.id, newState)
    } catch (err) {
      console.error(err)
      setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: !newState } : i)))
    }
  }

  const handleCheckin = async () => {
    if (!videoBlob) {
      setError('Grave o vídeo de entrada antes de confirmar.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await checkin(id, videoBlob, observations)
      const execRes = await getExecution(id)
      setExecution(execRes.data)
      setStep('checkout')
      setVideoBlob(null)
      setObservations('')
      loadChecklist()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar vídeo de entrada')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckout = async () => {
    if (!videoBlob) {
      setError('Grave o vídeo de saída antes de confirmar.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await checkout(id, videoBlob, observations)
      setStep('done')
      setVideoBlob(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar vídeo de saída')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Tarefa não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
        <ArrowLeft size={16} /> Voltar para a escala
      </button>

      {/* Info da tarefa */}
      <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-brand-600/20">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-extrabold">{task.apartment_name}</h1>
            <p className="text-white/80 flex items-center gap-1.5 mt-1.5 text-sm">
              <MapPin size={14} /> {task.apartment_address}
            </p>
          </div>
          <Badge color="yellow">{taskTypeLabels[task.task_type]}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/90 mt-2 pt-3 border-t border-white/20">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {formatDate(task.scheduled_date)} às {formatTime(task.scheduled_time)}
          </span>
        </div>
      </div>

      {/* Passos */}
      <div className="flex gap-3 mb-6 items-center">
        <div className="flex-1">
          <div className={`h-2 rounded-full transition-all duration-500 ${step !== 'checkin' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-brand-500 to-violet-500'}`}></div>
          <p className={`text-xs font-semibold mt-1 ${step !== 'checkin' ? 'text-emerald-600' : 'text-brand-600'}`}>Entrada</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 rounded-full transition-all duration-500 ${step === 'done' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gray-200'}`}></div>
          <p className={`text-xs font-semibold mt-1 ${step === 'done' ? 'text-emerald-600' : 'text-gray-400'}`}>Saída</p>
        </div>
      </div>

      {step === 'checkin' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <VideoIcon size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">1. Vídeo de Entrada</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Grave o vídeo mostrando <strong>como encontrou o apartamento</strong>. Pode durar até 2 minutos.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCheckin()
            }}
          >
            <VideoRecorder onVideoReady={setVideoBlob} />
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações (opcional)"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl mt-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 focus:bg-white transition-all"
              rows={2}
            />
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mt-4 animate-fade-in">
                {error}
              </div>
            )}
            <div className="mt-4">
              <Button type="submit" variant="success" className="w-full !py-3" disabled={submitting || !videoBlob}>
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" /> Enviando...
                  </span>
                ) : (
                  'Confirmar Entrada'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 'checkout' && (
        <Card className="p-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-sm text-emerald-700 flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Entrada registrada</p>
              <p>{execution ? `Entrada às ${formatDateTime(execution.checkin_time)}` : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <VideoIcon size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">2. Vídeo de Saída</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Agora limpe o apartamento e grave o vídeo mostrando <strong>como deixou o local</strong>.
          </p>

          {checklistLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto my-4"></div>
          ) : checklist.length > 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={16} className="text-brand-600" />
                <p className="text-sm font-semibold text-gray-800">
                  Checklist de limpeza
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {checklist.filter((i) => i.is_checked).length}/{checklist.length} concluídos
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      item.is_checked
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() => toggleChecklistItem(item)}
                      className="w-5 h-5 rounded accent-emerald-600 shrink-0"
                    />
                    <span className={`text-sm flex-1 ${item.is_checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.item_name}
                    </span>
                    {item.is_checked && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCheckout()
            }}
          >
            <VideoRecorder onVideoReady={setVideoBlob} />
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações (opcional)"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl mt-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 focus:bg-white transition-all"
              rows={2}
            />
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mt-4 animate-fade-in">
                {error}
              </div>
            )}
            <div className="mt-4">
              <Button type="submit" variant="success" className="w-full !py-3" disabled={submitting || !videoBlob}>
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" /> Enviando...
                  </span>
                ) : (
                  'Confirmar Saída e Concluir'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 'done' && (
        <Card className="p-10 text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Limpeza Concluída!</h2>
          <p className="text-gray-500 mb-7">
            Obrigado! O administrador já pode acompanhar os vídeos desta limpeza.
          </p>
          <Button onClick={() => navigate('/')}>Voltar para a escala</Button>
        </Card>
      )}
    </div>
  )
}