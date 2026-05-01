# 💬 NeW Chat — Real-time Messaging

> Applicazione di messaggistica in tempo reale sviluppata da **NeW Studios**.  
> Stack: Next.js · Supabase · Vercel

---

## 🚀 Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 14 (React) |
| Backend & Auth | Supabase |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime (WebSocket) |
| Hosting | Vercel |
| Styling | CSS custom (dark neon + light mode) |

---

## ✅ Funzionalità

- 🔐 Autenticazione (Signup / Login / Logout) via Supabase Auth
- 💬 Chat 1-to-1 in tempo reale
- ⚡ Messaggi istantanei con Supabase Realtime
- 👥 Lista contatti con stato online/offline
- ✍️ Typing indicator ("sta scrivendo…")
- 🌙 Dark mode neon / ☀️ Light mode
- 📱 Responsive mobile-first
- 🎨 Design futuristico stile NeW Studios

---

## ⚙️ Setup — Passo per passo

### 1. Clona il repository

```bash
git clone https://github.com/TUO_USER/new-chat.git
cd new-chat
npm install
```

---

### 2. Crea il progetto su Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Clicca **"New Project"**
3. Scegli un nome (es. `new-chat`) e una password per il DB
4. Attendi che il progetto si avvii (~1-2 minuti)

---

### 3. Esegui lo schema SQL

1. Nel pannello Supabase, vai su **SQL Editor**
2. Clicca **"New query"**
3. Copia e incolla tutto il contenuto di `supabase-schema.sql`
4. Clicca **"Run"**

Questo creerà:
- Tabella `users` con RLS
- Tabella `messages` con RLS
- Trigger per auto-creare profili al signup
- Pubblicazione Realtime

---

### 4. Configura le variabili d'ambiente

1. Nel pannello Supabase → **Settings → API**
2. Copia **Project URL** e **anon public key**
3. Crea il file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Non condividere mai la **service_role key** lato client.

---

### 5. Abilita Realtime in Supabase

1. Vai su **Database → Replication**
2. Assicurati che le tabelle `messages` e `users` siano nella pubblicazione `supabase_realtime`
3. (Lo schema SQL lo fa in automatico, ma verifica che sia attivo)

---

### 6. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy su Vercel

### Metodo 1 — Vercel CLI

```bash
npm i -g vercel
vercel
```

Segui le istruzioni e inserisci le variabili d'ambiente quando richiesto.

### Metodo 2 — Vercel Dashboard

1. Vai su [vercel.com](https://vercel.com) → **"New Project"**
2. Importa il repository GitHub
3. Vai su **Settings → Environment Variables**
4. Aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clicca **"Deploy"**

---

## 📁 Struttura del Progetto

```
new-chat/
├── components/
│   ├── Auth.js          # Login / Signup form
│   ├── Sidebar.js       # Lista contatti + header
│   └── ChatWindow.js    # Finestra messaggi
├── lib/
│   └── supabaseClient.js  # Client Supabase inizializzato
├── pages/
│   ├── _app.js          # App wrapper + tema
│   ├── _document.js     # HTML document base
│   ├── index.js         # Pagina principale
│   └── api/
│       └── set-offline.js  # API route per stato offline
├── styles/
│   └── globals.css      # Tema neon dark + light mode
├── supabase-schema.sql  # Schema DB completo
├── .env.local.example   # Template variabili ambiente
├── next.config.js
├── package.json
└── README.md
```

---

## 🎨 Design

Il tema usa una palette **dark neon** come default:

| Token | Valore |
|-------|--------|
| Background | `#080808` |
| Neon accent | `#e8ff00` |
| Secondary | `#00ffcc` |
| Text primary | `#f0f0f0` |

Toggle light/dark tramite il pulsante ☀️/🌙 nella sidebar.

---

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**
→ Assicurati di avere `.env.local` con le chiavi corrette.

**I messaggi non arrivano in realtime**
→ Verifica che Realtime sia abilitato per la tabella `messages` in Supabase → Database → Replication.

**Errore RLS / permission denied**
→ Riesegui `supabase-schema.sql` dall'SQL Editor.

**Utente non creato nel DB dopo signup**
→ Il trigger `on_auth_user_created` crea automaticamente il profilo. Verifica che il trigger esista in Database → Functions.

---

## 📄 Licenza

MIT — NeW Studios © 2024
