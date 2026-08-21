import { useEffect, useState, useCallback } from 'react'
import {
  getSchedules,
  getScheduleWithTasks,
  createSchedule,
  deleteSchedule,
  getEmployees,
  getApartments,
  createTask,
  reschedule,
} from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getWeekStart, formatDate, taskStatusLabels, taskStatusColors, taskTypeLabels, taskTypeColors } from '../../utils'
import { CalendarPlus, Plus, RefreshCw, Trash2, Clock } from 'lucide-react'

const WEEK_DAY_LABELS = { 6: 'Sáb', 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' }

export default function Schedules() {
  const [schedules, setSchedules] = useState([])
  const [selected, setSelected] = useState(null)
  const [employees, setEmployees] = useState([])
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewWeek, setShowNewWeek] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [newScheduleType, setNewScheduleType] = useState('weekly')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleTask, setRescheduleTask] = useState(null)
  const [error, setError] = useState('')

  const [taskForm, setTaskForm] = useState({
    employee_id: '',
    apartment_id: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    task_type: 'full_day',
    notes: '',
  })

  const [rescheduleForm, setRescheduleForm] = useState({
    new_date: '',
    new_time: '',
    new_employee_id: '',
    reason: '',
  })

  const load = useCallback(async () => {
    try {
      const res = await getSchedules()
      setSchedules(res.data)
      if (!selected && res.data.length > 0) {
        const detail = await getScheduleWithTasks(res.data[0].id)
        setSelected(detail.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => {
    load()
    getEmployees().then((r) => setEmployees(r.data))
    getApartments().then((r) => setApartments(r.data))
  }, [])

  const selectSchedule = async (id) => {
    const res = await getScheduleWithTasks(id)
    setSelected(res.data)
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    try {
      let payload
      if (newScheduleType === 'weekly') {
        const start = getWeekStart(new Date())
        const weekStart = new Date(start)
        weekStart.setDate(weekStart.getDate() + weekOffset * 7)
        const weekEnd = addDays(weekStart, 6)

        const startDate = new Date(weekStart)
        if (startDate.getDay() !== 6) {
          const diff = (startDate.getDay() + 1) % 7
          startDate.setDate(startDate.getDate() - diff)
        }

        payload = {
          schedule_type: 'weekly',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
        }
      } else {
        if (!customStart || !customEnd) {
          setError('Informe a data inicial e final do período.')
          return
        }
        if (customEnd < customStart) {
          setError('A data final deve ser depois da inicial.')
          return
        }
        payload = {
          schedule_type: 'date_range',
          start_date: customStart,
          end_date: customEnd,
        }
      }

      const res = await createSchedule(payload)
      setShowNewWeek(false)
      setCustomStart('')
      setCustomEnd('')
      setNewScheduleType('weekly')
      await load()
      if (res.data.id) {
        const detail = await getScheduleWithTasks(res.data.id)
        setSelected(detail.data)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar escala')
    }
  }

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Excluir esta escala e todas as tarefas associadas?')) return
    try {
      await deleteSchedule(id)
      setSelected(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir escala')
    }
  }

  const openTaskModal = (date = '') => {
    setTaskForm({ ...taskForm, scheduled_date: date, employee_id: employees[0]?.id || '' })
    setShowTaskModal(true)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    try {
      await createTask({ ...taskForm, schedule_id: selected.id })
      setShowTaskModal(false)
      await selectSchedule(selected.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar tarefa')
    }
  }

  const openReschedule = (task) => {
    setRescheduleTask(task)
    setRescheduleForm({
      new_date: task.scheduled_date,
      new_time: task.scheduled_time?.substring(0, 5) || '09:00',
      new_employee_id: task.employee_id || '',
      reason: '',
    })
    setShowRescheduleModal(true)
  }

  const handleReschedule = async (e) => {
    e.preventDefault()
    try {
      await reschedule({
        task_id: rescheduleTask.id,
        new_date: rescheduleForm.new_date,
        new_time: rescheduleForm.new_time,
        new_employee_id: rescheduleForm.new_employee_id || undefined,
        reason: rescheduleForm.reason,
      })
      setShowRescheduleModal(false)
      await selectSchedule(selected.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao reagendar')
    }
  }

  if (loading) {
    return <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
  }

  // Construir lista de dias da escala selecionada
  // - weekly: 7 dias a partir do sábado
  // - date_range: todos os dias do período (limitado a 31)
  const weekDaysList = selected?.start_date && selected?.end_date
    ? (() => {
        const start = new Date(selected.start_date + 'T00:00:00')
        const end = new Date(selected.end_date + 'T00:00:00')
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">Escalas</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Semanal (sáb–sex) ou por período customizado</p>
        </div>
        <Button onClick={() => setShowNewWeek(true)}>
          <span className="flex items-center gap-2">
            <CalendarPlus size={16} /> Nova Escala
          </span>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de escalas */}
        <div className="lg:w-64 shrink-0">
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-gray-200 font-semibold text-gray-900 text-sm">
              Semanas
            </div>
            <ul className="divide-y divide-gray-100">
              {schedules.length === 0 && (
                <li className="p-4 text-sm text-gray-500">Nenhuma escala criada.</li>
              )}
              {schedules.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => selectSchedule(s.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex justify-between items-center ${
                      selected?.id === s.id ? 'bg-brand-50 text-brand-700' : ''
                    }`}
                  >
                    <span className="font-medium">
                      {formatDate(s.start_date)} - {formatDate(s.end_date)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSchedule(s.id)
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Conteúdo da escala */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <Card className="p-12 text-center text-gray-500">
              <p className="mb-2">Nenhuma escala selecionada.</p>
              <Button onClick={() => setShowNewWeek(true)}>
                <span className="flex items-center gap-2">
                  <CalendarPlus size={16} /> Criar a primeira escala
                </span>
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selected.schedule_type === 'weekly' ? 'Semana' : 'Período'} de{' '}
                    {formatDate(selected.start_date)} a {formatDate(selected.end_date)}
                  </h2>
                  <Badge color={selected.status === 'active' ? 'green' : 'gray'}>
                    {selected.status === 'active' ? 'Ativa' : selected.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <select
                    value={weekOffset}
                    onChange={(e) => setWeekOffset(Number(e.target.value))}
                    className="px-2 py-1.5 border rounded-lg text-sm"
                  >
                    {[-2, -1, 0, 1, 2].map((o) => {
                      const d = addDays(getWeekStart(new Date()), o * 7)
                      return (
                        <option key={o} value={o}>
                          {formatDate(format(d, 'yyyy-MM-dd'))}
                        </option>
                      )
                    })}
                  </select>
                  <Button variant="outline" onClick={() => openTaskModal()}>
                    <span className="flex items-center gap-2">
                      <Plus size={16} /> Adicionar Tarefa
                    </span>
                  </Button>
                </div>
              </div>

              {/* Grid semanal por dia */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {weekDaysList.map((day, idx) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayTasks = (selected.tasks || []).filter((t) => t.scheduled_date === dateKey)
                  return (
                    <Card key={idx} className={`p-3 ${dateKey === today ? 'ring-2 ring-brand-500' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {WEEK_DAY_LABELS[day.getDay()]}
                          </p>
                          <p className="text-xs text-gray-500">{format(day, 'dd/MM', { locale: ptBR })}</p>
                        </div>
                        <button
                          onClick={() => openTaskModal(dateKey)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                          title="Adicionar tarefa"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dayTasks.length === 0 && (
                          <p className="text-xs text-gray-400">Sem tarefas</p>
                        )}
                        {dayTasks.map((task) => {
                          const emp = employees.find((e) => e.id === task.employee_id)
                          return (
                            <div
                              key={task.id}
                              className="border rounded-lg p-2 text-xs bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => openReschedule(task)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">
                                  {task.apartment_name || `Apto #${task.apartment_id}`}
                                </span>
                                <Badge color={taskTypeColors[task.task_type]}>
                                  {taskTypeLabels[task.task_type]}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-gray-600">
                                  <Clock size={10} className="inline mr-1" />
                                  {task.scheduled_time?.substring(0, 5)}
                                </span>
                                <span className="text-gray-500">{emp?.full_name?.split(' ')[0]}</span>
                              </div>
                              <div className="mt-1">
                                <Badge color={taskStatusColors[task.status]}>
                                  {taskStatusLabels[task.status]}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Nova Escala */}
      {showNewWeek && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Nova Escala</h2>
              <form onSubmit={handleCreateSchedule}>
                {/* Tipo de escala */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setNewScheduleType('weekly'); setError('') }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      newScheduleType === 'weekly'
                        ? 'bg-brand-50 border-brand-400 text-brand-700 ring-1 ring-brand-300'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Semanal (Sáb–Sex)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewScheduleType('date_range'); setError('') }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      newScheduleType === 'date_range'
                        ? 'bg-brand-50 border-brand-400 text-brand-700 ring-1 ring-brand-300'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Período custom
                  </button>
                </div>

                {newScheduleType === 'weekly' ? (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      A escala será criada para a semana de <strong>sábado a sexta-feira</strong>.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" type="button" onClick={() => setWeekOffset(weekOffset - 1)}>
                        ←
                      </Button>
                      <div className="flex-1 text-center">
                        {format(addDays(getWeekStart(new Date()), weekOffset * 7), 'dd/MM')} a{' '}
                        {format(addDays(getWeekStart(new Date()), weekOffset * 7 + 6), 'dd/MM')}
                      </div>
                      <Button variant="outline" type="button" onClick={() => setWeekOffset(weekOffset + 1)}>
                        →
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Data inicial"
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      required
                    />
                    <Input
                      label="Data final"
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Pode ser 1 dia, 2 dias, uma quinzena — o período que quiser.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 my-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewWeek(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Escala</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Tarefa */}
      {showTaskModal && selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Nova Tarefa de Limpeza</h2>
              <form onSubmit={handleCreateTask}>
                <Select
                  label="Funcionário"
                  value={taskForm.employee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, employee_id: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Apartamento"
                  value={taskForm.apartment_id}
                  onChange={(e) => setTaskForm({ ...taskForm, apartment_id: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {apartments.map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.name} - {ap.address}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Data"
                  type="date"
                  value={taskForm.scheduled_date}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_date: e.target.value })}
                  required
                />
                <Input
                  label="Horário"
                  type="time"
                  value={taskForm.scheduled_time}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_time: e.target.value })}
                  required
                />
                <Select
                  label="Tipo de Diária"
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                >
                  <option value="full_day">Diária Inteira</option>
                  <option value="half_day">Meia Diária</option>
                </Select>
                <Input
                  label="Observações"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                />
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowTaskModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Tarefa</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reagendar */}
      {showRescheduleModal && rescheduleTask && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-brand-600" />
                Reagendar: {rescheduleTask.apartment_name}
              </h2>
              <form onSubmit={handleReschedule}>
                <Input
                  label="Nova data"
                  type="date"
                  value={rescheduleForm.new_date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_date: e.target.value })}
                  required
                />
                <Input
                  label="Novo horário"
                  type="time"
                  value={rescheduleForm.new_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_time: e.target.value })}
                />
                <Select
                  label="Funcionário (opcional - para reatribuir)"
                  value={rescheduleForm.new_employee_id}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_employee_id: e.target.value })}
                >
                  <option value="">Manter atual</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Motivo do reagendamento"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  placeholder="Ex: horário indisponível"
                  required
                />
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Confirmar Reagendamento</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}