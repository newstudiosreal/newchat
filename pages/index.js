import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Auth from '../components/Auth'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import Head from 'next/head'

export default function Home({ theme, toggleTheme }) {
  const [session, setSession] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState('sidebar') // 'sidebar' | 'chat'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await loadUserProfile(session.user)
      } else {
        setCurrentUser(null)
        setSelectedUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser) => {
    setLoading(true)
    let { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()

    if (!data) {
      // Create profile if not exists (e.g. OAuth)
      const username = authUser.user_metadata?.username || authUser.email.split('@')[0]
      const { data: newUser } = await supabase
        .from('users')
        .upsert({ id: authUser.id, email: authUser.email, username, is_online: true })
        .select()
        .single()
      data = newUser
    }

    if (data) {
      await supabase.from('users').update({ is_online: true }).eq('id', authUser.id)
      setCurrentUser({ ...data, is_online: true })
    }
    setLoading(false)

    // Set offline on tab close
    const handleUnload = () => {
      navigator.sendBeacon(
        `/api/set-offline?id=${authUser.id}`,
      )
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setMobileView('chat')
  }

  const handleBack = () => {
    setMobileView('sidebar')
    setSelectedUser(null)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">N</div>
        <div className="loading-text">CARICAMENTO...</div>
      </div>
    )
  }

  if (!session || !currentUser) {
    return (
      <>
        <Head>
          <title>NeW Chat — Login</title>
        </Head>
        <Auth />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>NeW Chat{selectedUser ? ` — ${selectedUser.username}` : ''}</title>
      </Head>
      <div className="app-layout">
        <div className={`sidebar${mobileView === 'chat' ? ' hidden-mobile' : ''}`}>
          <Sidebar
            currentUser={currentUser}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </div>

        {selectedUser ? (
          <ChatWindow
            currentUser={currentUser}
            selectedUser={selectedUser}
            onBack={handleBack}
            className={mobileView === 'chat' ? 'visible-mobile' : ''}
          />
        ) : (
          <div className="chat-area" style={{ display: mobileView === 'chat' ? 'flex' : undefined }}>
            <div className="neon-bg" />
            <div className="empty-chat">
              <div className="empty-chat-icon">💬</div>
              <h3>NeW Chat</h3>
              <p>Seleziona un contatto dalla barra laterale per iniziare a chattare in tempo reale.</p>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: 2,
                marginTop: 8,
              }}>
                BY NEW STUDIOS
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
