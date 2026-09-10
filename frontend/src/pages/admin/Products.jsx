import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services'
import { useI18n } from '../../contexts/I18nContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Minus, Plus as PlusIcon, Search } from 'lucide-react'

const emptyForm = {
  name: '',
  quantity: '',
  unit: 'un',
  min_quantity: '',
  observations: '',
}

const units = ['un', 'ml', 'l', 'kg', 'g', 'pacote', 'rolo', 'galão']

export default function Products() {
  const { t } = useI18n()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmProduct, setConfirmProduct] = useState(null)
  const [page, setPage] = useState(1)
  const perPage = 9

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

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.name.toLowerCase().includes(q) || (p.observations || '').toLowerCase().includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
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
      setError(err.response?.data?.detail || t('products.errorSave'))
    }
  }

  const handleDelete = (p) => {
    setConfirmProduct(p)
  }

  const confirmDelete = async () => {
    if (!confirmProduct) return
    try {
      await deleteProduct(confirmProduct.id)
      setConfirmProduct(null)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || t('products.errorDelete'))
    }
  }

  const adjustQuantity = async (p, delta) => {
    // delta respeita unidade: 1 para un/pacote, 0.1 para kg/l etc seria ideal, mas mantemos 1 e 0.5 para granular
    const step = ['kg', 'l', 'g', 'ml'].includes(p.unit) ? 0.5 : 1
    const newQty = Math.max(0, Number((p.quantity + delta * step).toFixed(2)))
    try {
      await updateProduct(p.id, { quantity: newQty })
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || t('products.errorQuantity'))
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">{t('products.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('products.subtitle')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={`${t('common.search')}...`}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <span className="flex items-center gap-2">
              <Plus size={16} /> {t('products.newProduct')}
            </span>
          </Button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {t('products.lowStockCount', { count: lowStockCount, plural: lowStockCount > 1 ? 's' : '' })}
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
            <Card className="p-10 text-center sm:col-span-2 lg:col-span-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mx-auto mb-3">
                <Package size={22} />
              </div>
              <p className="font-semibold text-gray-900">{t('products.noProducts')}</p>
              <p className="text-sm text-gray-500 mt-1">Cadastre itens para controlar reposição.</p>
              <Button onClick={openCreate} className="mt-4">
                <span className="flex items-center gap-2">
                  <Plus size={16} /> {t('products.newProduct')}
                </span>
              </Button>
            </Card>
          )}
          {products.length > 0 && filtered.length === 0 && (
            <Card className="p-8 text-center text-gray-500 sm:col-span-2 lg:col-span-3">
              {t('common.noResults', { q: search })}
            </Card>
          )}
          {paginated.map((p) => (
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
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustQuantity(p, -1)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-lg"
                    title={t('products.decrease')}
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
                    title={t('products.increase')}
                  >
                    <PlusIcon size={14} />
                  </button>
                </div>
                {p.is_low_stock ? (
                  <Badge color="red">{t('products.lowStock')}</Badge>
                ) : p.min_quantity > 0 ? (
                  <Badge color="green">{t('products.ok')}</Badge>
                ) : null}
              </div>

              {p.min_quantity > 0 && (
                <p className="text-xs text-gray-500">
                  {t('products.minLabel', { qty: p.min_quantity, unit: p.unit })}
                </p>
              )}
              {p.observations && (
                <p className="text-xs text-gray-500 mt-1 truncate">{p.observations}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {filtered.length > perPage && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'} · {t('common.of')} {page} {t('common.of')} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('common.previous')}
            </Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editing ? t('products.editProduct') : t('products.newProduct')}
              </h2>
              <form onSubmit={handleSubmit}>
                <Input
                  label={t('products.name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('products.namePlaceholder')}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('products.quantity')}
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('products.unit')}</label>
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
                  label={t('products.minQuantity')}
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                  placeholder={t('products.minQuantityPlaceholder')}
                />
                <Input
                  label={t('products.observations')}
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder={t('products.observationsPlaceholder')}
                />

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">{editing ? t('products.save') : t('products.create')}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900">{t('common.delete')}?</h3>
            <p className="text-sm text-gray-600 mt-2">
              {t('products.deleteConfirm')}
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">"{confirmProduct.name}"</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setConfirmProduct(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
