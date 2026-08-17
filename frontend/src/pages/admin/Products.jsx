import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Minus, Plus as PlusIcon } from 'lucide-react'

const emptyForm = {
  name: '',
  quantity: '',
  unit: 'un',
  min_quantity: '',
  observations: '',
}

const units = ['un', 'ml', 'l', 'kg', 'g', 'pacote', 'rolo', 'galão']

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await getProducts()
      setProducts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const lowStockCount = products.filter((p) => p.is_low_stock).length

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit || 'un',
      min_quantity: p.min_quantity,
      observations: p.observations || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
      min_quantity: form.min_quantity === '' ? 0 : Number(form.min_quantity),
    }
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar produto')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await deleteProduct(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir produto')
    }
  }

  const adjustQuantity = async (p, delta) => {
    const newQty = Math.max(0, p.quantity + delta)
    try {
      await updateProduct(p.id, { quantity: newQty })
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao atualizar quantidade')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">Estoque</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Controle de produtos e materiais de limpeza</p>
        </div>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-2">
            <Plus size={16} /> Novo Produto
          </span>
        </Button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {lowStockCount} produto{lowStockCount > 1 ? 's' : ''} com estoque baixo
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {products.filter((p) => p.is_low_stock).map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.length === 0 && (
            <Card className="p-8 text-center text-gray-500 sm:col-span-2 lg:col-span-3">
              Nenhum produto cadastrado ainda.
            </Card>
          )}
          {products.map((p) => (
            <Card key={p.id} className={`p-4 flex flex-col ${p.is_low_stock ? 'border-amber-300' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.is_low_stock ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand-600'}`}>
                    <Package size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustQuantity(p, -1)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-lg"
                    title="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className={`text-xl font-extrabold px-2 ${p.is_low_stock ? 'text-amber-600' : 'text-gray-900'}`}>
                    {p.quantity}
                    <span className="text-sm font-medium text-gray-400 ml-1">{p.unit}</span>
                  </span>
                  <button
                    onClick={() => adjustQuantity(p, 1)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-lg"
                    title="Aumentar"
                  >
                    <PlusIcon size={14} />
                  </button>
                </div>
                {p.is_low_stock ? (
                  <Badge color="red">Estoque baixo</Badge>
                ) : p.min_quantity > 0 ? (
                  <Badge color="green">Ok</Badge>
                ) : null}
              </div>

              {p.min_quantity > 0 && (
                <p className="text-xs text-gray-500">
                  Mínimo: {p.min_quantity} {p.unit}
                </p>
              )}
              {p.observations && (
                <p className="text-xs text-gray-500 mt-1 truncate">{p.observations}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <form onSubmit={handleSubmit}>
                <Input
                  label="Nome do produto"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Detergente"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantidade"
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidade</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 focus:bg-white transition-all"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Quantidade mínima (alerta de reposição)"
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                  placeholder="0 = sem alerta"
                />
                <Input
                  label="Observações"
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Ex: Comprar no atacado"
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