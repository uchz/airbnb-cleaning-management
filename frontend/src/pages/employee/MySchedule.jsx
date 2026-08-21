import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSchedules, getScheduleWithTasks } from '../../services'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getWeekStart, formatTime, taskStatusLabels, taskStatusColors, taskTypeLabels, taskTypeColors } from '../../utils'
import { MapPin, Clock, Play, CheckCircle2, CalendarDays } from 'lucide-react'

const WEEK_DAY_LABELS = { 6: 'Sáb', 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' }

export default function MySchedule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const weekStart = getWeekStart(new Date())
        const s = format(weekStart, 'yyyy-MM-dd')

        const schedules = await getSchedules()
        // Encontrar escala da semana atual (ou a mais próxima)
        const current = schedules.data.find((sc) => sc.start_date === s) || schedules.data[0]

        if (current) {
          const detail = await getScheduleWithTasks(current.id)
          setSchedule(detail.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
  }

  if (!schedule) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CalendarDays size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium mb-1">Nenhuma escala publicada para esta semana.</p>
        <p className="text-sm text-gray-400">Fale com o administrador.</p>
      </div>
    )
  }

  const weekDaysList =
    schedule.start_date && schedule.end_date
      ? (() => {
          const start = new Date(schedule.start_date + 'T00:00:00')
          const end = new Date(schedule.end_date + 'T00:00:00')
          const days = []
          for (let d = new Date(start); d <= end && days.length < 31; d = addDays(d, 1)) {
            days.push(new Date(d))
          }
          return days
        })()
      : []
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Minha <span className="text-gradient">Escala</span>
        </h1>
        <p className="text-gray-500 mt-1">
          Período de {format(new Date(schedule.start_date + 'T00:00:00'), 'dd/MM', { locale: ptBR })} a{' '}
          {format(new Date(schedule.end_date + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {weekDaysList.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayTasks = (schedule.tasks || []).filter((t) => t.scheduled_date === dateKey)
          const isToday = dateKey === today

          return (
            <Card
              key={idx}
              className={`p-4 animate-slide-up ${isToday ? 'ring-2 ring-brand-500 shadow-brand-500/20 shadow-lg' : ''}`}
            >
              <div
                className={`flex justify-between items-center mb-3 rounded-xl px-3 py-2 -mx-3 -mt-1 ${
                  isToday ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white' : ''
                }`}
              >
                <div>
                  <p className={`font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {WEEK_DAY_LABELS[day.getDay()]}
                  </p>
                  <p className={`text-xs ${isToday ? 'text-white/80' : 'text-gray-500'}`}>
                    {format(day, 'dd/MM', { locale: ptBR })}
                  </p>
                </div>
                {isToday && <Badge color="green">Hoje</Badge>}
              </div>

              {dayTasks.length === 0 && (
                <p className="text-sm text-gray-400">Sem limpezas agendadas</p>
              )}

              <div className="space-y-3">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border rounded-xl p-3 transition-all hover:shadow-md ${
                      task.status === 'completed'
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{task.apartment_name}</p>
                      <Badge color={taskTypeColors[task.task_type]}>{taskTypeLabels[task.task_type]}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                      <MapPin size={12} /> {task.apartment_address}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {formatTime(task.scheduled_time)}
                      </span>
                      <Badge color={taskStatusColors[task.status]}>{taskStatusLabels[task.status]}</Badge>
                    </div>

                    <div className="mt-3">
                      {task.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                          <CheckCircle2 size={16} /> Limpeza concluída
                        </div>
                      ) : task.status === 'in_progress' ? (
                        <button
                          onClick={() => navigate(`/task/${task.id}`)}
                          className="w-full bg-brand-100 text-brand-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-brand-200 transition-all active:scale-[0.98]"
                        >
                          Continuar (finalizar)
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/task/${task.id}`)}
                          className="w-full bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:from-brand-700 hover:to-violet-700 transition-all active:scale-[0.98] shadow-md shadow-brand-600/25 flex items-center justify-center gap-2"
                        >
                          <Play size={14} /> Iniciar Limpeza
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}