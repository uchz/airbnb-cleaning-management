import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTasks, getEmployees, getApartments, getSchedules, getGeneralReport, getDashboardData } from '../../services'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { taskStatusLabels, taskStatusColors, getWeekStart, formatDate } from '../../utils'
import { Building2, Users, CalendarDays, CheckCircle2, Clock4, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
}

const STATUS_NAMES = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const weekStart = getWeekStart()
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        const [employees, apartments, schedules, tasksRes, dashRes] = await Promise.all([
          getEmployees(),
          getApartments(),
          getSchedules(),
          getTasks({
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(weekEnd, 'yyyy-MM-dd'),
          }),
          getDashboardData(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')),
        ])

        const general = await getGeneralReport(
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd')
        )

        const allTasks = tasksRes.data
        const completed = allTasks.filter((t) => t.status === 'completed').length
        const pending = allTasks.filter((t) => t.status === 'pending').length
        const inProgress = allTasks.filter((t) => t.status === 'in_progress').length

        setStats({
          employees: employees.data.length,
          apartments: apartments.data.length,
          schedules: schedules.data.length,
          totalTasks: allTasks.length,
          completed,
          pending,
          inProgress,
          completionRate: general.data.completion_rate,
        })

        setDashboard(dashRes.data)
        setRecentTasks(allTasks.slice(0, 8))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const gradientCards = [
    {
      label: 'Funcionários',
      value: stats.employees,
      icon: Users,
      grad: 'from-sky-500 to-cyan-400',
      shadow: 'shadow-sky-500/30',
    },
    {
      label: 'Apartamentos',
      value: stats.apartments,
      icon: Building2,
      grad: 'from-brand-500 to-violet-500',
      shadow: 'shadow-brand-500/30',
    },
    {
      label: 'Escalas',
      value: stats.schedules,
      icon: CalendarDays,
      grad: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/30',
    },
    {
      label: 'Conclusão na semana',
      value: `${stats.completionRate || 0}%`,
      icon: TrendingUp,
      grad: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/30',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Painel de <span className="text-gradient">Controle</span>
        </h1>
        <p className="text-gray-500 mt-1">Visão geral da operação desta semana</p>
      </div>

      {/* Cards de gradiente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {gradientCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.grad} text-white p-5 shadow-xl ${card.shadow} animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white/85">{card.label}</p>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Status de execução */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Clock4 size={20} />
            </div>
            <p className="font-semibold text-gray-700">Tarefas na semana</p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{stats.totalTasks}</p>
          <div className="flex gap-2 mt-3">
            <Badge color="yellow">{stats.pending} pendentes</Badge>
            <Badge color="blue">{stats.inProgress} em andamento</Badge>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="font-semibold text-gray-700">Limpezas concluídas</p>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{stats.completed}</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.totalTasks > 0
              ? `${((stats.completed / stats.totalTasks) * 100).toFixed(0)}% da semana concluída`
              : 'Sem tarefas ainda'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <p className="font-semibold text-gray-700">Taxa de conclusão</p>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{stats.completionRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-3">Média geral do período selecionado</p>
        </Card>
      </div>

      {/* Gráficos */}
      {dashboard && (
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-5 mb-8">
          {/* Tarefas por dia */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tarefas por dia</h2>
                <p className="text-xs text-gray-500">Total vs concluídas na semana</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.tasks_by_day.map((d) => ({
                ...d,
                dia: format(new Date(d.date + 'T00:00:00'), 'dd/MM'),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} width={28} />
                <Tooltip
                  formatter={(value, name) => (name === 'total' ? ['Total', 'Tarefas'] : ['Concluídas', 'Tarefas'])}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="total" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="completed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Status */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <PieChartIcon size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Status das tarefas</h2>
                <p className="text-xs text-gray-500">Distribuição do período</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dashboard.tasks_by_status.filter((s) => s.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {dashboard.tasks_by_status.filter((s) => s.count > 0).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, STATUS_NAMES[name] || name]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => STATUS_NAMES[value] || value}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Por apartamento */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Apartamentos mais atendidos</h2>
                <p className="text-xs text-gray-500">Número de limpezas no período</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dashboard.tasks_by_apartment}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="apartment_name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [value, 'Limpezas']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Diárias por funcionário */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Diárias por funcionário</h2>
                <p className="text-xs text-gray-500">Inteiras vs meias no período</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.employee_diarias} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="employee_name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} width={28} />
                <Tooltip
                  formatter={(value, name) => (name === 'full_days' ? [value, 'Diárias inteiras'] : [value, 'Meias diárias'])}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="full_days" fill="#10b981" radius={[4, 4, 0, 0]} name="full_days" />
                <Bar dataKey="half_days" fill="#fbbf24" radius={[4, 4, 0, 0]} name="half_days" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Tarefas recentes */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900">Tarefas da semana</h2>
            <p className="text-sm text-gray-500">Acompanhe o andamento das limpezas</p>
          </div>
          <Link
            to="/schedules"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            Ver escalas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Data</th>
                <th className="px-5 py-3 font-semibold">Apartamento</th>
                <th className="px-5 py-3 font-semibold">Funcionário</th>
                <th className="px-5 py-3 font-semibold">Horário</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    Nenhuma tarefa nesta semana. Crie a escala para começar.
                  </td>
                </tr>
              )}
              {recentTasks.map((task) => (
                <tr key={task.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap font-medium">{formatDate(task.scheduled_date)}</td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{task.apartment_name}</td>
                  <td className="px-5 py-3 text-gray-600">{task.employee_name}</td>
                  <td className="px-5 py-3 text-gray-600">{task.scheduled_time?.substring(0, 5)}</td>
                  <td className="px-5 py-3">
                    <Badge color={taskStatusColors[task.status]}>{taskStatusLabels[task.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}