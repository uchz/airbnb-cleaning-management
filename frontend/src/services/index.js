import api from './api'

// ============ Auth ============
export const login = (username, password) => api.post('/auth/login', { username, password })
export const getMe = () => api.get('/users/me')

// ============ Users ============
export const getUsers = () => api.get('/users/')
export const getEmployees = () => api.get('/users/employees')
export const createUser = (data) => api.post('/auth/register', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// ============ Apartments ============
export const getApartments = () => api.get('/apartments/')
export const getApartment = (id) => api.get(`/apartments/${id}`)
export const createApartment = (data) => api.post('/apartments/', data)
export const updateApartment = (id, data) => api.put(`/apartments/${id}`, data)
export const deleteApartment = (id) => api.delete(`/apartments/${id}`)

// ============ Schedules ============
export const getSchedules = () => api.get('/schedules/')
export const getSchedule = (id) => api.get(`/schedules/${id}`)
export const getScheduleWithTasks = (id) => api.get(`/schedules/${id}/with-tasks`)
export const createSchedule = (data) => api.post('/schedules/', data)
export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data)
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`)

// ============ Tasks ============
export const getTasks = (params = {}) => api.get('/schedules/tasks/all', { params })
export const getTask = (id) => api.get(`/schedules/tasks/${id}`)
export const createTask = (data) => api.post('/schedules/tasks', data)
export const updateTask = (id, data) => api.put(`/schedules/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/schedules/tasks/${id}`)

// ============ Executions ============
export const getExecution = (taskId) => api.get(`/executions/task/${taskId}`)
export const checkin = (taskId, video, observations) => {
  const formData = new FormData()
  formData.append('task_id', taskId)
  formData.append('video', video, video.name || `checkin_task_${taskId}.webm`)
  if (observations) formData.append('observations', observations)
  return api.post('/executions/checkin', formData)
}
export const checkout = (taskId, video, observations) => {
  const formData = new FormData()
  formData.append('task_id', taskId)
  formData.append('video', video, video.name || `checkout_task_${taskId}.webm`)
  if (observations) formData.append('observations', observations)
  return api.post('/executions/checkout', formData)
}
export const reschedule = (params) => api.post('/executions/reschedule', null, { params })

// ============ Reports ============
export const getEmployeeReport = (employeeId, startDate, endDate) =>
  api.get(`/reports/employee/${employeeId}`, { params: { start_date: startDate, end_date: endDate } })

export const getGeneralReport = (startDate, endDate) =>
  api.get('/reports/general', { params: { start_date: startDate, end_date: endDate } })

export const getDashboardData = (startDate, endDate) =>
  api.get('/reports/dashboard', { params: { start_date: startDate, end_date: endDate } })

// ============ Exportação de relatórios ============
export const exportEmployeePdf = (employeeId, startDate, endDate) =>
  api.get(`/reports/export/employee/${employeeId}/pdf`, {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  })

export const exportEmployeeXlsx = (employeeId, startDate, endDate) =>
  api.get(`/reports/export/employee/${employeeId}/xlsx`, {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  })

export const exportGeneralPdf = (startDate, endDate) =>
  api.get('/reports/export/general/pdf', {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  })

export const exportGeneralXlsx = (startDate, endDate) =>
  api.get('/reports/export/general/xlsx', {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  })

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadReport = (type, { employeeId, startDate, endDate }) => {
  const ext = type === 'pdf' ? 'pdf' : 'xlsx'
  const req =
    employeeId != null
      ? type === 'pdf'
        ? exportEmployeePdf(employeeId, startDate, endDate)
        : exportEmployeeXlsx(employeeId, startDate, endDate)
      : type === 'pdf'
        ? exportGeneralPdf(startDate, endDate)
        : exportGeneralXlsx(startDate, endDate)

  return req.then((res) => {
    const employeePart = employeeId != null ? `_funcionario_${employeeId}` : '_geral'
    downloadBlob(res.data, `relatorio${employeePart}_${startDate}_${endDate}.${ext}`)
  })
}

// ============ Checklist ============
export const getChecklistTemplates = (apartmentId) => api.get(`/checklist/templates/apartment/${apartmentId}`)
export const createChecklistTemplate = (data) => api.post('/checklist/templates', data)
export const deleteChecklistTemplate = (id) => api.delete(`/checklist/templates/${id}`)
export const getTaskChecklist = (taskId) => api.get(`/checklist/tasks/${taskId}/items`)
export const updateChecklistItem = (itemId, isChecked) =>
  api.patch(`/checklist/items/${itemId}`, { is_checked: isChecked })

// ============ Products (Estoque) ============
export const getProducts = () => api.get('/products/')
export const getLowStockProducts = () => api.get('/products/low-stock')
export const createProduct = (data) => api.post('/products/', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

// ============ Notifications ============
export const getNotifications = (params = {}) => api.get('/notifications/', { params })
export const getUnreadCount = () => api.get('/notifications/unread-count')
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.post('/notifications/read-all')