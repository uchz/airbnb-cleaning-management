import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ClipboardList, Sparkles } from 'lucide-react'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../services'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const load = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([getNotifications({ limit: 20 }), getUnreadCount()])
      setNotifications(notifsRes.data)
      setUnread(countRes.data.count)
    } catch {
      // ignora erros de polling
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClick = async (n) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id)
        setUnread((u) => Math.max(0, u - 1))
        setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      } catch {
        // segue mesmo se falhar
      }
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      setUnread(0)
      setNotifications((list) => list.map((x) => ({ ...x, is_read: true })))
    } catch {
      // ignora
    }
  }

  const typeIcon = (type) => {
    if (type === 'task_created') return <ClipboardList size={16} className="text-brand-500 shrink-0 mt-0.5" />
    if (type === 'task_completed') return <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
    return <Bell size={16} className="text-gray-400 shrink-0 mt-0.5" />
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notificações"
        className="relative p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-300 hover:text-white"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800">Notificações</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma notificação</p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-gray-50 ${
                        !n.is_read ? 'bg-brand-50/60' : ''
                      }`}
                    >
                      {typeIcon(n.notification_type)}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.is_read ? 'text-gray-600 font-medium' : 'text-gray-900 font-semibold'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}