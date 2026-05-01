import { createClient } from '@supabase/supabase-js'

let _supabase = null

const getClient = () => {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  _supabase = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 10 } },
  })
  return _supabase
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = getClient()
    if (!client) return () => {}
    const val = client[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
