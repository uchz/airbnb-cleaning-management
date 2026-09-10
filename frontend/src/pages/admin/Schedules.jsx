import { useEffect, useState, useCallback } from 'react'
import {
  getSchedules,
  getScheduleWithTasks,
  createSchedule,
  deleteSchedule,
  duplicateSchedule,
  getEmployees,
  getApartments,
  createTask,
  deleteTask,
  getTasks,
  reschedule,
} from '../../services'
import { useI18n } from '../../contexts/I18nContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { format, addDays } from 'date-fns'
import { taskStatusLabels, taskStatusColors, taskTypeLabels, taskTypeColors } from '../../utils'
import { CalendarPlus, Plus, RefreshCw, Trash2, Clock, Zap, CopyPlus } from 'lucide-react'

const WEEK_DAY_LABELS = { 6: 'Sáb', 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' }

export default function Schedules() {
  const { t, formatDate } = useI18n()
  const [schedules, setSchedules] = useState([])
  const [selected, setSelected] = useState(null)
  const [employees, setEmployees] = useState([])
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewWeek, setShowNewWeek] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAdhocModal, setShowAdhocModal] = useState(false)
  const [adhocTasks, setAdhocTasks] = useState([])
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
      const tt = await getTasks()
      setAdhocTasks(tt.data.filter((x) => !x.schedule_id))
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
      if (!customStart || !customEnd) {
        setError(t('schedules.errorStartEnd'))
        return
      }
      if (customEnd < customStart) {
        setError(t('schedules.errorEndBeforeStart'))
        return
      }

      const res = await createSchedule({
        schedule_type: 'date_range',
        start_date: customStart,
        end_date: customEnd,
      })
      setShowNewWeek(false)
      setCustomStart('')
      setCustomEnd('')
      await load()
      if (res.data.id) {
        const detail = await getScheduleWithTasks(res.data.id)
        setSelected(detail.data)
      }
    } catch (err) {
      setError(err.response?.data?.detail || t('schedules.errorCreateSchedule'))
    }
  }

  const handleDeleteSchedule = async (id) => {
    if (!confirm(t('schedules.deleteScheduleConfirm'))) return
    try {
      await deleteSchedule(id)
      setSelected(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || t('schedules.errorDeleteSchedule'))
    }
  }

  const handleDuplicate = async () => {
    if (!confirm(t('schedules.duplicateConfirm'))) return
    setError('')
    try {
      const res = await duplicateSchedule(selected.id)
      await load()
      const detail = await getScheduleWithTasks(res.data.id)
      setSelected(detail.data)
    } catch (err) {
      alert(err.response?.data?.detail || t('schedules.errorDuplicate'))
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
      setError(err.response?.data?.detail || t('schedules.errorCreateTask'))
    }
  }

  const openAdhocModal = () => {
    setTaskForm({ ...taskForm, scheduled_date: format(new Date(), 'yyyy-MM-dd'), employee_id: employees[0]?.id || '' })
    setError('')
    setShowAdhocModal(true)
  }

  const handleCreateAdhoc = async (e) => {
    e.preventDefault()
    try {
      const { ...payload } = taskForm
      await createTask(payload) // sem schedule_id = diária avulsa
      setShowAdhocModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || t('schedules.errorCreateDaily'))
    }
  }

  const handleDeleteAdhoc = async (id) => {
    if (!confirm(t('schedules.deleteAdhocConfirm'))) return
    try {
      await deleteTask(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || t('schedules.errorDeleteDaily'))
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
      setError(err.response?.data?.detail || t('schedules.errorReschedule'))
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
            <span className="text-gradient">{t('schedules.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('schedules.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAdhocModal}>
            <span className="flex items-center gap-2">
              <Zap size={16} /> {t('schedules.newDailyBtn')}
            </span>
          </Button>
          <Button onClick={() => setShowNewWeek(true)}>
            <span className="flex items-center gap-2">
              <CalendarPlus size={16} /> {t('schedules.newSchedule')}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de escalas */}
        <div className="lg:w-64 shrink-0">
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-gray-200 font-semibold text-gray-900 text-sm">
              {t('schedules.weeks')}
            </div>
            <ul className="divide-y divide-gray-100">
              {schedules.length === 0 && (
                <li className="p-4 text-sm text-gray-500">{t('schedules.noSchedules')}</li>
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
              <p className="mb-2">{t('schedules.noScheduleSelected')}</p>
              <Button onClick={() => setShowNewWeek(true)}>
                <span className="flex items-center gap-2">
                  <CalendarPlus size={16} /> {t('schedules.createFirst')}
                </span>
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {t('schedules.periodOf', { start: formatDate(selected.start_date), end: formatDate(selected.end_date) })}
                  </h2>
                  <Badge color={selected.status === 'active' ? 'green' : 'gray'}>
                    {selected.status === 'active' ? t('schedules.active') : selected.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDuplicate}>
                    <span className="flex items-center gap-2">
                      <CopyPlus size={16} /> {t('schedules.duplicate')}
                    </span>
                  </Button>
                  <Button variant="outline" onClick={() => openTaskModal()}>
                    <span className="flex items-center gap-2">
                      <Plus size={16} /> {t('schedules.addTask')}
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
                          <p className="text-xs text-gray-500">{formatDate(day.toISOString().slice(0,10))}</p>
                        </div>
                        <button
                          onClick={() => openTaskModal(dateKey)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                          title={t('schedules.addTaskTitle')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dayTasks.length === 0 && (
                          <p className="text-xs text-gray-400">{t('schedules.noTasks')}</p>
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

      {/* Diárias avulsas (sem escala) */}
      {adhocTasks.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            <p className="font-semibold text-gray-900 text-sm">{t('schedules.adhocTitle')}</p>
            <span className="text-xs text-gray-400">{t('schedules.adhocSubtitle')}</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {adhocTasks.map((tt) => {
              const emp = employees.find((e) => e.id === tt.employee_id)
              return (
                <li key={tt.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                  <button onClick={() => openReschedule(tt)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {tt.apartment_name || `Apto #${tt.apartment_id}`}
                      <span className="ml-2 text-gray-400 font-normal">{formatDate(tt.scheduled_date)} · {tt.scheduled_time?.substring(0, 5)}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {emp?.full_name?.split(' ')[0] || '—'} ·{' '}
                      <Badge color={taskStatusColors[tt.status]}>{taskStatusLabels[tt.status]}</Badge>
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteAdhoc(tt.id)}
                    className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Modal Nova Escala */}
      {showNewWeek && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t('schedules.newSchedulePeriod')}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {t('schedules.newSchedulePeriodDesc')}
              </p>
              <form onSubmit={handleCreateSchedule}>
                <div className="space-y-3">
                  <Input
                    label={t('schedules.startDate')}
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                  />
                  <Input
                    label={t('schedules.endDate')}
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 my-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewWeek(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('schedules.createSchedule')}</Button>
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('schedules.newTask')}</h2>
              <form onSubmit={handleCreateTask}>
                <Select
                  label={t('schedules.employee')}
                  value={taskForm.employee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, employee_id: e.target.value })}
                  required
                >
                  <option value="">{t('schedules.select')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
                <Select
                  label={t('schedules.apartment')}
                  value={taskForm.apartment_id}
                  onChange={(e) => setTaskForm({ ...taskForm, apartment_id: e.target.value })}
                  required
                >
                  <option value="">{t('schedules.select')}</option>
                  {apartments.map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.name} - {ap.address}
                    </option>
                  ))}
                </Select>
                <Input
                  label={t('schedules.date')}
                  type="date"
                  value={taskForm.scheduled_date}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_date: e.target.value })}
                  required
                />
                <Input
                  label={t('schedules.time')}
                  type="time"
                  value={taskForm.scheduled_time}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_time: e.target.value })}
                  required
                />
                <Select
                  label={t('schedules.dailyType')}
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                >
                  <option value="full_day">{t('schedules.fullDay')}</option>
                  <option value="half_day">{t('schedules.halfDay')}</option>
                </Select>
                <Input
                  label={t('schedules.notes')}
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
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('schedules.createTask')}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Diária Avulsa */}
      {showAdhocModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                {t('schedules.newDaily')}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {t('schedules.newDailyDesc')}
              </p>
              <form onSubmit={handleCreateAdhoc}>
                <Select
                  label={t('schedules.employee')}
                  value={taskForm.employee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, employee_id: e.target.value })}
                  required
                >
                  <option value="">{t('schedules.select')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
                <Select
                  label={t('schedules.apartment')}
                  value={taskForm.apartment_id}
                  onChange={(e) => setTaskForm({ ...taskForm, apartment_id: e.target.value })}
                  required
                >
                  <option value="">{t('schedules.select')}</option>
                  {apartments.map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.name} - {ap.address}
                    </option>
                  ))}
                </Select>
                <Input
                  label={t('schedules.date')}
                  type="date"
                  value={taskForm.scheduled_date}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_date: e.target.value })}
                  required
                />
                <Input
                  label={t('schedules.time')}
                  type="time"
                  value={taskForm.scheduled_time}
                  onChange={(e) => setTaskForm({ ...taskForm, scheduled_time: e.target.value })}
                  required
                />
                <Select
                  label={t('schedules.dailyType')}
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                >
                  <option value="full_day">{t('schedules.fullDay')}</option>
                  <option value="half_day">{t('schedules.halfDay')}</option>
                </Select>
                <Input
                  label={t('schedules.notes')}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                />
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowAdhocModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('schedules.createDaily')}</Button>
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
                {t('schedules.reschedule')}: {rescheduleTask.apartment_name}
              </h2>
              <form onSubmit={handleReschedule}>
                <Input
                  label={t('schedules.newDate')}
                  type="date"
                  value={rescheduleForm.new_date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_date: e.target.value })}
                  required
                />
                <Input
                  label={t('schedules.newTime')}
                  type="time"
                  value={rescheduleForm.new_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_time: e.target.value })}
                />
                <Select
                  label={t('schedules.newEmployeeOptional')}
                  value={rescheduleForm.new_employee_id}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, new_employee_id: e.target.value })}
                >
                  <option value="">{t('schedules.keepCurrent')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
                <Input
                  label={t('schedules.rescheduleReason')}
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                  placeholder={t('schedules.rescheduleReasonPlaceholder')}
                  required
                />
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{t('schedules.confirmReschedule')}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
