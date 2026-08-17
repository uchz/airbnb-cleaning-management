import { useEffect, useState } from 'react'
import { getEmployees, createUser, updateUser, deleteUser } from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PhoneInput from '../../components/ui/PhoneInput'
import Badge from '../../components/ui/Badge'
import { Pencil, Trash2, Plus, Phone, User } from 'lucide-react'

const emptyForm = {
  username: '',
  password: '',
  full_name: '',
  phone: '',
  payment_info: '',
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getEmployees()
      setEmployees(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({
      username: emp.username,
      password: '',
      full_name: emp.full_name,
      phone: emp.phone || '',
      payment_info: emp.payment_info || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        const data = { ...form }
        if (!data.password) delete data.password
        await updateUser(editing.id, data)
      } else {
        await createUser({ ...form, role: 'employee' })
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar funcionário')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return
    try {
      await deleteUser(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir funcionário')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">Funcionários</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Equipe de limpeza e dados para pagamento</p>
        </div>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-2">
            <Plus size={16} /> Novo Funcionário
          </span>
        </Button>
      </div>

      {loading ? (
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.length === 0 && (
            <Card className="p-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">
              Nenhum funcionário cadastrado ainda.
            </Card>
          )}
          {employees.map((emp) => (
            <Card key={emp.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-semibold">
                    {emp.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{emp.full_name}</h3>
                    <Badge color={emp.is_active ? 'green' : 'gray'}>
                      {emp.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(emp)}
                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center gap-2">
                  <User size={14} /> @{emp.username}
                </p>
                {emp.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} /> {emp.phone}
                  </p>
                )}
                {emp.payment_info && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    Pagamento: {emp.payment_info}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editing ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <form onSubmit={handleSubmit}>
                <Input
                  label="Nome completo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
                <Input
                  label="Usuário"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
                <Input
                  label={editing ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
                <PhoneInput
                  label="Telefone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Dados para pagamento (PIX, conta)"
                  value={form.payment_info}
                  onChange={(e) => setForm({ ...form, payment_info: e.target.value })}
                  placeholder="Chave PIX, etc."
                />

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editing ? 'Salvar' : 'Criar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}