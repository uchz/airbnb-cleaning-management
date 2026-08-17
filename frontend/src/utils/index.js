// Utilitários de formatação e rótulos

export const taskStatusLabels = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const taskStatusColors = {
  pending: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
}

export const taskTypeLabels = {
  full_day: 'Diária Inteira',
  half_day: 'Meia Diária',
}

export const taskTypeColors = {
  full_day: 'purple',
  half_day: 'blue',
}

export const scheduleStatusLabels = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function getWeekStart(date = new Date()) {
  // Semana começa no sábado
  const d = new Date(date)
  const day = d.getDay() // 0=Dom, 6=Sáb
  let diff = (day + 1) % 7 // dias desde o último sábado
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.substring(0, 5)
}