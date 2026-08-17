import { useEffect, useState } from 'react'
import { getEmployees, getEmployeeReport, getGeneralReport, downloadReport } from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { format } from 'date-fns'
import { getWeekStart, formatDate, taskStatusLabels, taskStatusColors, taskTypeLabels } from '../../utils'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

export default function Reports() {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [startDate, setStartDate] = useState(format(getWeekStart(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(
    format(new Date(getWeekStart(new Date()).getTime() + 6 * 86400000), 'yyyy-MM-dd')
  )
  const [report, setReport] = useState(null)
  const [general, setGeneral] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    getEmployees().then((r) => setEmployees(r.data))
  }, [])

  const runReport = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const [gen, emp] = await Promise.all([
        getGeneralReport(startDate, endDate),
        selectedEmployee ? getEmployeeReport(selectedEmployee, startDate, endDate) : Promise.resolve(null),
      ])
      setGeneral(gen.data)
      setReport(emp?.data || null)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!report) return
    const rows = [
      ['Funcionário', report.employee_name],
      ['Período', `${formatDate(report.period_start)} a ${formatDate(report.period_end)}`],
      ['Dias trabalhados', report.total_days_worked],
      ['Diárias inteiras', report.full_day_count],
      ['Meias diárias', report.half_day_count],
      ['Total de tarefas', report.total_tasks],
      ['Concluídas', report.completed_tasks],
      ['Taxa de conclusão', `${report.completion_rate}%`],
      [],
      ['Data', 'Apartamento', 'Tipo', 'Status'],
      ...report.tasks.map((t) => [
        t.scheduled_date,
        t.apartment_name,
        taskTypeLabels[t.task_type],
        taskStatusLabels[t.status],
      ]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${report.employee_name}_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type, employeeId = null) => {
    setExporting(`${type}${employeeId ? '_emp' : '_gen'}`)
    try {
      await downloadReport(type, { employeeId, startDate, endDate })
    } catch (err) {
      alert('Erro ao exportar relatório')
    } finally {
      setExporting('')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          <span className="text-gradient">Relatórios</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Diárias trabalhadas e cálculo de pagamento</p>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <form onSubmit={runReport} className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="">Todos</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Relatório geral */}
      {general && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-900">
              Relatório Geral ({formatDate(general.period_start)} a {formatDate(general.period_end)})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!!exporting}>
                <span className="flex items-center gap-2">
                  {exporting === 'pdf_gen' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  PDF
                </span>
              </Button>
              <Button variant="outline" onClick={() => handleExport('xlsx')} disabled={!!exporting}>
                <span className="flex items-center gap-2">
                  {exporting === 'xlsx_gen' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                  Excel
                </span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Funcionários</p>
              <p className="text-2xl font-bold text-gray-900">{general.total_employees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tarefas</p>
              <p className="text-2xl font-bold text-gray-900">{general.total_tasks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{general.completed_tasks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Taxa de conclusão</p>
              <p className="text-2xl font-bold text-brand-600">{general.completion_rate}%</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-2 font-medium">Funcionário</th>
                  <th className="px-4 py-2 font-medium">Diárias Inteiras</th>
                  <th className="px-4 py-2 font-medium">Meias Diárias</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Concluídas</th>
                  <th className="px-4 py-2 font-medium">Conclusão</th>
                </tr>
              </thead>
              <tbody>
                {general.employees.map((emp) => (
                  <tr key={emp.employee_id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-800">{emp.employee_name}</td>
                    <td className="px-4 py-2">{emp.full_day_count}</td>
                    <td className="px-4 py-2">{emp.half_day_count}</td>
                    <td className="px-4 py-2">{emp.total_tasks}</td>
                    <td className="px-4 py-2">{emp.completed_tasks}</td>
                    <td className="px-4 py-2">
                      <Badge color={emp.total_tasks > 0 && emp.completed_tasks / emp.total_tasks > 0.7 ? 'green' : 'yellow'}>
                        {emp.total_tasks > 0
                          ? `${((emp.completed_tasks / emp.total_tasks) * 100).toFixed(0)}%`
                          : '-'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Relatório por funcionário */}
      {report && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Relatório de {report.employee_name}</h2>
              <p className="text-sm text-gray-500">
                {formatDate(report.period_start)} a {formatDate(report.period_end)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExport('pdf', report.employee_id)} disabled={!!exporting}>
                <span className="flex items-center gap-2">
                  {exporting === 'pdf_emp' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  PDF
                </span>
              </Button>
              <Button variant="outline" onClick={() => handleExport('xlsx', report.employee_id)} disabled={!!exporting}>
                <span className="flex items-center gap-2">
                  {exporting === 'xlsx_emp' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                  Excel
                </span>
              </Button>
              <Button variant="outline" onClick={exportCSV}>
                <span className="flex items-center gap-2">
                  <Download size={16} /> CSV
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-brand-50 rounded-lg p-3">
              <p className="text-xs text-brand-600">Dias trabalhados</p>
              <p className="text-2xl font-bold text-brand-700">{report.total_days_worked}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">Diárias inteiras</p>
              <p className="text-2xl font-bold text-purple-700">{report.full_day_count}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3">
              <p className="text-xs text-cyan-600">Meias diárias</p>
              <p className="text-2xl font-bold text-cyan-700">{report.half_day_count}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-700">{report.completed_tasks}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-600">Conclusão</p>
              <p className="text-2xl font-bold text-yellow-700">{report.completion_rate}%</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Apartamento</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.tasks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Sem tarefas no período.
                    </td>
                  </tr>
                )}
                {report.tasks.map((t) => (
                  <tr key={t.task_id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{formatDate(t.scheduled_date)}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{t.apartment_name}</td>
                    <td className="px-4 py-2">{taskTypeLabels[t.task_type]}</td>
                    <td className="px-4 py-2">
                      <Badge color={taskStatusColors[t.status]}>{taskStatusLabels[t.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}