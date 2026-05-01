import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Sidebar({ currentUser, selectedUser, onSelectUser, theme, toggleTheme }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [lastMessages, setLastMessages] = useState({})

  useEffect(() => {
    if (!currentUser) return
    fetchUsers()
    fetchLastMessages()

    // Realtime: presence updates
    const presenceChannel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === payload.new.id ? { ...u, ...payload.new } : u))
        )
      })
      .subscribe()

    // Realtime: new messages for last preview
    const msgChannel = supabase
      .channel('sidebar:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        const otherId =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
        if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {
          setLastMessages((prev) => ({
            ...prev,
            [otherId]: msg,
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [currentUser])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUser.id)
      .order('username')
    if (data) setUsers(data)
  }

  const fetchLastMessages = async () => {
    // Get last message per conversation
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const map = {}
      data.forEach((msg) => {
        const otherId =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id
        if (!map[otherId]) map[otherId] = msg
      })
      setLastMessages(map)
    }
  }

  const handleLogout = async () => {
    await supabase.from('users').update({ is_online: false }).eq('id', currentUser.id)
    await supabase.auth.signOut()
  }

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">N</div>
          <div className="sidebar-logo-text">
            Ne<span>W</span> Chat
          </div>
        </div>
        <div className="sidebar-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modalità chiara' : 'Modalità scura'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Cerca contatti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="contacts-list">
        <div className="contacts-section-label">CONTATTI — {filtered.length}</div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              padding: '24px 16px',
            }}
          >
            Nessun contatto trovato
          </div>
        )}

        {filtered.map((user) => {
          const lastMsg = lastMessages[user.id]
          const isActive = selectedUser?.id === user.id
          return (
            <div
              key={user.id}
              className={`contact-item${isActive ? ' active' : ''}`}
              onClick={() => onSelectUser(user)}
            >
              <div className="contact-avatar-wrap">
                <div className="contact-avatar">{getInitials(user.username)}</div>
                <div className={`status-dot ${user.is_online ? 'online' : 'offline'}`} />
              </div>
              <div className="contact-info">
                <div className="contact-name">{user.username || user.email}</div>
                <div className="contact-last-msg">
                  {lastMsg
                    ? lastMsg.sender_id === currentUser.id
                      ? `Tu: ${lastMsg.content}`
                      : lastMsg.content
                    : user.is_online
                    ? 'Online ora'
                    : 'Offline'}
                </div>
              </div>
              {lastMsg && (
                <div className="contact-meta">
                  <span className="contact-time">
                    {formatDistanceToNow(new Date(lastMsg.created_at), {
                      addSuffix: false,
                      locale: it,
                    })}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="current-user-avatar">
          {getInitials(currentUser.username || currentUser.email)}
        </div>
        <div className="current-user-info">
          <div className="current-user-name">
            {currentUser.username || currentUser.email}
          </div>
          <div className="current-user-status">Online</div>
        </div>
        <button
          className="icon-btn"
          onClick={handleLogout}
          title="Logout"
          style={{ color: 'var(--accent-danger)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
