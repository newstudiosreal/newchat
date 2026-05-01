import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { format, isToday, isYesterday } from 'date-fns'
import { it } from 'date-fns/locale'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Oggi'
  if (isYesterday(d)) return 'Ieri'
  return format(d, 'd MMMM yyyy', { locale: it })
}

export default function ChatWindow({ currentUser, selectedUser, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!selectedUser) return
    fetchMessages()
    setupRealtime()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [selectedUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const setupRealtime = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channelName = [currentUser.id, selectedUser.id].sort().join('_')

    channelRef.current = supabase
      .channel(`chat:${channelName}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new
        const relevant =
          (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
        if (relevant) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setOtherTyping(false)
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id === selectedUser.id) {
          setOtherTyping(true)
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000)
        }
      })
      .subscribe()
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUser.id },
    })
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content,
    })

    if (error) console.error('Send error:', error)
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped = []
  let lastDate = null
  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.created_at)
    if (dateLabel !== lastDate) {
      grouped.push({ type: 'divider', label: dateLabel, id: `div-${msg.id}` })
      lastDate = dateLabel
    }
    grouped.push({ type: 'message', ...msg })
  })

  return (
    <div className="chat-area">
      {/* Top bar */}
      <div className="chat-topbar">
        <div className="chat-topbar-user">
          <button
            className="icon-btn"
            onClick={onBack}
            style={{ marginRight: 4 }}
            title="Indietro"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="contact-avatar-wrap">
            <div className="contact-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
              {getInitials(selectedUser.username)}
            </div>
            <div className={`status-dot ${selectedUser.is_online ? 'online' : 'offline'}`} />
          </div>
          <div className="chat-topbar-info">
            <div className="name">{selectedUser.username || selectedUser.email}</div>
            <div className={`status ${selectedUser.is_online ? 'online' : ''}`}>
              {otherTyping ? 'sta scrivendo…' : selectedUser.is_online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" title="Cerca nella chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
            Nessun messaggio. Di&apos; qualcosa! 👋
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === 'divider') {
            return (
              <div key={item.id} className="message-date-divider">
                <span>{item.label}</span>
              </div>
            )
          }

          const isSent = item.sender_id === currentUser.id
          return (
            <div key={item.id} className={`message-row ${isSent ? 'sent' : 'received'}`}>
              <div className="message-bubble-group">
                <div className="message-bubble last">
                  {item.content}
                </div>
                <span className="message-time">
                  {format(new Date(item.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          )
        })}

        {otherTyping && (
          <div className="message-row received">
            <div className="typing-indicator">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
              <span className="typing-indicator-text">{selectedUser.username} sta scrivendo…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            className="chat-input"
            placeholder={`Scrivi a ${selectedUser.username || 'contatto'}…`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            title="Invia"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
