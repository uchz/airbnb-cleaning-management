import { useEffect, useState } from 'react'
import { getApartments, createApartment, updateApartment, deleteApartment, getChecklistTemplates, createChecklistTemplate, deleteChecklistTemplate } from '../../services'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Pencil, Trash2, Plus, MapPin, ListChecks, X, Search } from 'lucide-react'

const emptyForm = {
  name: '',
  address: '',
  address_complement: '',
  city: '',
  state: '',
  zipcode: '',
  estimated_cleaning_time: '',
  observations: '',
}

function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

async function searchCep(cep, cb) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return
  cb('loading')
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json()
    if (data.erro) {
      cb('not_found')
      return
    }
    cb('ok', data)
  } catch {
    cb('error')
  }
}

export default function Apartments() {
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [cepState, setCepState] = useState('idle') // idle | loading | ok | not_found | error
  const [checklistApartment, setChecklistApartment] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [search, setSearch] = useState('')

  const filtered = apartments.filter((ap) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return ap.name.toLowerCase().includes(q) || ap.city.toLowerCase().includes(q) || ap.address.toLowerCase().includes(q)
  })

  const load = async () => {
    try {
      const res = await getApartments()
      setApartments(res.data)
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
    setCepState('idle')
    setShowModal(true)
  }

  const handleCepChange = (e) => {
    const value = formatCep(e.target.value)
    setForm((prev) => ({ ...prev, zipcode: value }))
    setCepState('idle')

    if (value.replace(/\D/g, '').length === 8) {
      setCepState('loading')
      searchCep(value, (status, data) => {
        if (status === 'ok') {
          setForm((prev) => ({
            ...prev,
            address: prev.address || data.logradouro || '',
            address_complement: prev.address_complement || data.bairro || '',
            city: prev.city || data.localidade || '',
            state: prev.state || data.uf || '',
          }))
          setCepState('ok')
        } else if (status === 'not_found') {
          setCepState('not_found')
        } else if (status === 'error') {
          setCepState('error')
        }
      })
    }
  }

  const openChecklist = async (ap) => {
    setChecklistApartment(ap)
    setNewChecklistItem('')
    try {
      const res = await getChecklistTemplates(ap.id)
      setChecklistItems(res.data)
    } catch (err) {
      console.error(err)
      setChecklistItems([])
    }
  }

  const closeChecklist = () => {
    setChecklistApartment(null)
    setChecklistItems([])
  }

  const addChecklistItem = async (e) => {
    e.preventDefault()
    if (!newChecklistItem.trim() || !checklistApartment) return
    try {
      const res = await createChecklistTemplate({
        apartment_id: checklistApartment.id,
        item_name: newChecklistItem.trim(),
        order: checklistItems.length + 1,
      })
      setChecklistItems((prev) => [...prev, res.data])
      setNewChecklistItem('')
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao adicionar item')
    }
  }

  const removeChecklistItem = async (item) => {
    if (!confirm(`Remover "${item.item_name}" do checklist?`)) return
    try {
      await deleteChecklistTemplate(item.id)
      setChecklistItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao remover item')
    }
  }

  const openEdit = (ap) => {
    setEditing(ap)
    setForm({
      name: ap.name,
      address: ap.address,
      address_complement: ap.address_complement || '',
      city: ap.city,
      state: ap.state || '',
      zipcode: ap.zipcode || '',
      estimated_cleaning_time: ap.estimated_cleaning_time || '',
      observations: ap.observations || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await updateApartment(editing.id, form)
      } else {
        await createApartment(form)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar apartamento')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este apartamento?')) return
    try {
      await deleteApartment(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir apartamento')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            <span className="text-gradient">Apartamentos</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre e gerencie os imóveis atendidos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou cidade..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <span className="flex items-center gap-2">
              <Plus size={16} /> Novo
            </span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apartments.length === 0 && (
            <Card className="p-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">
              Nenhum apartamento cadastrado ainda.
            </Card>
          )}
          {apartments.length > 0 && filtered.length === 0 && (
            <Card className="p-8 text-center text-gray-500 md:col-span-2 lg:col-span-3">
              Nenhum resultado para "{search}".
            </Card>
          )}
          {filtered.map((ap) => (
            <Card key={ap.id} className="p-4 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{ap.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openChecklist(ap)}
                    title="Checklist de limpeza"
                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <ListChecks size={16} />
                  </button>
                  <button
                    onClick={() => openEdit(ap)}
                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(ap.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  {ap.address}
                  {ap.address_complement ? `, ${ap.address_complement}` : ''} - {ap.city}
                </span>
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                <span>
                  {ap.estimated_cleaning_time ? `~${ap.estimated_cleaning_time} min de limpeza` : 'Tempo não definido'}
                </span>
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
                {editing ? 'Editar Apartamento' : 'Novo Apartamento'}
              </h2>
              <form onSubmit={handleSubmit}>
                <Input
                  label="Nome / Código"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Apto Praia"
                  required
                />
                <Input
                  label="Endereço"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Rua das Flores, 123"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Complemento"
                    value={form.address_complement}
                    onChange={(e) => setForm({ ...form, address_complement: e.target.value })}
                    placeholder="Apto 45"
                  />
                    <div>
                    <Input
                      label="CEP"
                      value={form.zipcode}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      inputMode="numeric"
                      maxLength={9}
                      autoComplete="postal-code"
                    />
                    {cepState === 'loading' && (
                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></span>
                        Buscando endereço...
                      </p>
                    )}
                    {cepState === 'ok' && (
                      <p className="mt-1 text-xs text-emerald-600">Endereço encontrado e preenchido</p>
                    )}
                    {cepState === 'not_found' && (
                      <p className="mt-1 text-xs text-amber-600">CEP não encontrado</p>
                    )}
                    {cepState === 'error' && (
                      <p className="mt-1 text-xs text-rose-600">Erro ao buscar CEP</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cidade"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                  <Input
                    label="Estado"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="SC"
                  />
                </div>
                <Input
                  label="Tempo estimado de limpeza (minutos)"
                  type="number"
                  value={form.estimated_cleaning_time}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '' || Number(v) >= 0) setForm({ ...form, estimated_cleaning_time: v })
                  }}
                  min={5}
                  step={5}
                  placeholder="Ex: 60"
                />
                <Input
                  label="Observações"
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Instruções, códigos, etc."
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

      {/* Modal do Checklist */}
      {checklistApartment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Checklist de Limpeza</h2>
                  <p className="text-sm text-gray-500">{checklistApartment.name}</p>
                </div>
                <button
                  onClick={closeChecklist}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                A funcionária marca estes itens ao concluir a limpeza de cada visita.
              </p>

              <div className="space-y-2 mb-4">
                {checklistItems.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nenhum item ainda. Adicione abaixo.
                  </p>
                )}
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-800 flex items-center gap-2">
                      <ListChecks size={14} className="text-brand-600 shrink-0" />
                      {item.item_name}
                    </span>
                    <button
                      onClick={() => removeChecklistItem(item)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={addChecklistItem} className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Ex: Trocar toalhas"
                  className="flex-1"
                />
                <Button type="submit" variant="outline" className="shrink-0">
                  <Plus size={16} /> Adicionar
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}