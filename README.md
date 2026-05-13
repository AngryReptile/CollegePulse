# CollegePulse — NHCM Community Network

<div align="center">
  <h3>⚡ A Premium College Social Platform</h3>
  <p>React · Supabase · Tailwind CSS · Framer Motion</p>
</div>

---

## ✨ Features

| Module | Description |
|---|---|
| 🧵 **Discussion Forum** | Threaded discussions, trending topics, pinned posts, real-time comments |
| 📸 **Social Feed** | Scrollable image feed with likes, nested comments, Supabase Storage uploads |
| 💬 **Real-time DMs** | Private messaging with Supabase Realtime, read receipts, conversation list |
| 🤖 **AI Portfolio** | Gemini-powered professional bio generation, skills, GitHub/LinkedIn links |
| 🧩 **Community Board** | Teammate Finder, Lost & Found, with DM shortcut on every card |
| 🎟 **Events & QR Wallet** | Event bento grid with live countdown, RSVP, and downloadable QR tickets |
| 🎨 **macOS Dock** | Spring-physics magnetic floating dock with icon scaling on hover |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
cd "college project final year"
npm install          # requires internet access
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_storage.sql`
3. Go to **Storage** and verify 4 buckets exist:
   - `avatars`, `feed-images`, `event-banners`, `board-images`
4. Go to **Settings → API** and copy your Project URL + anon key

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key  # optional
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🏗 Architecture

```
src/
├── components/
│   ├── layout/     → AppShell, FloatingDock, Sidebar
│   ├── forum/      → ThreadCard, CommentThread, ActiveNow
│   ├── feed/       → PostCard, NewPostModal
│   ├── dm/         → ChatWindow, ConversationList, MessageBubble
│   ├── board/      → BoardCard, NewBoardItemModal
│   └── events/     → EventBentoCard, CountdownTimer, QRWallet
├── pages/          → One page per module
├── hooks/          → useAuth, useRealtime, usePresence
├── lib/            → supabase.js, gemini.js, utils.js
├── store/          → Zustand authStore
supabase/
└── migrations/     → 3 SQL migration files
```

---

## 👥 Role System

| Role | Capabilities |
|---|---|
| `student` | Post, comment, like, DM, RSVP to events, create board items |
| `admin` | Everything + create events, pin threads, manage all content |

**Auto-detection**: Email domains `@faculty.nhcm.ac.in`, `@admin.nhcm.ac.in`, `@nhcm.edu.in` → auto-assigned `admin` role.

---

## 🛠 Tech Stack

- **React 18** + **Vite** — Fast dev experience
- **Tailwind CSS v3** — Utility-first styling with custom glass tokens
- **Framer Motion** — Spring animations, layout animations, page transitions
- **Supabase** — Auth, PostgreSQL, Realtime, Storage
- **Zustand** — Lightweight global state
- **Google Gemini API** — AI portfolio generation (optional)
- **qrcode.react** — QR ticket generation
- **react-hot-toast** — Toast notifications
- **react-dropzone** — Drag-and-drop image uploads
- **date-fns** — Date formatting

---

## 📋 Database Schema

8 tables: `profiles`, `forum_threads`, `forum_comments`, `posts`, `post_likes`, `post_comments`, `conversations`, `messages`, `board_items`, `events`, `event_rsvps`

Full Row Level Security (RLS) on all tables. Students can only access their own sensitive data. DMs are private to participants only.
