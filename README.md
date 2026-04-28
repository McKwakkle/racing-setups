# Racing Setups

A web app for saving and sharing car setups across racing games. Anyone can browse setups freely. Submitting a setup requires a shared group PIN (no accounts needed).

## Features

- Game tabs — one tab per game, add new games as they release
- Per-car setups with dynamic sections (Suspension, Tires, Aero — whatever the game supports)
- Filter by steering wheel or remote/controller
- Search by game name and/or car name independently
- Multiple setups per car per game, shown in tabs on the detail page
- Build categories (Drift, Street, Rally, Grip, Drag, etc.) — add custom ones too
- Copy setup as plain text (great for Discord)
- Direct shareable link per setup
- 4-digit PIN to protect submissions (stored securely, never in code)

---

## Tech Stack

| Layer | Tool | Hosting |
|---|---|---|
| Frontend | React + Vite | Vercel (free) |
| Database | Supabase (PostgreSQL) | Supabase (free tier) |
| REST API | Supabase auto-generated | Supabase (built-in) |
| PIN-protected writes | Supabase Edge Function | Supabase (built-in) |

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account (for auto-deploy)

---

## 1. Supabase Setup

### 1a. Create a project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `racing-setups`, set a database password, choose a region
3. Under project settings: enable **Data API**, enable **Expose new tables**, enable **Automatic RLS**
4. Wait ~2 minutes for the project to spin up

### 1b. Run SQL migrations

In Supabase dashboard → **SQL Editor** → **New query**, run each file in order:

1. Paste contents of `supabase/migrations/001_schema.sql` → **Run**
2. Paste contents of `supabase/migrations/002_rls.sql` → **Run**
3. Paste contents of `supabase/migrations/003_seed.sql` → **Run** (seeds games and categories)

Tables will appear under **Table Editor** after step 1.

### 1c. Deploy the Edge Function

The Supabase CLI is installed as a local dev dependency:

```bash
cd racing-setups

# Authenticate (opens browser)
npx supabase login

# Link to your project (find Reference ID in Supabase → Settings → General)
npx supabase link --project-ref YOUR_PROJECT_REF_ID

# Deploy the PIN-protected write function
npx supabase functions deploy submit-setup

# Store the PIN securely (replace 0000 with your actual PIN)
npx supabase secrets set SETUP_PIN=0000
```

### 1d. Get your API keys

In Supabase dashboard → **Settings** → **API**, copy:
- **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
- **anon public** key — safe to use in frontend code

---

## 2. Local Development

```bash
# Install frontend dependencies
cd frontend
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key
```

**.env.local**
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

```bash
# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 3. Deploy to Vercel via GitHub

### 3a. Push to GitHub

```bash
cd racing-setups
git add .
git commit -m "Initial commit"
```

Then create a new repo on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/racing-setups.git
git branch -M main
git push -u origin main
```

### 3b. Import into Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `racing-setups` GitHub repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon public key
5. Click **Deploy**

From this point on, every push to `main` on GitHub auto-deploys to Vercel.

---

## 4. Environment Variables Reference

| Variable | Where it's set | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel + `.env.local` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Supabase anon/publishable key |
| `SETUP_PIN` | Supabase secret | The group PIN for submissions |

---

## 5. How to Add a New Game

**Via the UI:** Click **+ Add Game** in the game tab bar, enter the game name and your PIN.

**Via SQL:** In Supabase SQL Editor:
```sql
insert into games (name, slug) values ('Game Name', 'game-name-slug');
```

---

## 6. How to Change the PIN

```bash
npx supabase secrets set SETUP_PIN=newpin
```

Then redeploy the Edge Function:
```bash
npx supabase functions deploy submit-setup
```

---

## 7. Free Tier Limits

| Service | Limit |
|---|---|
| Supabase | 500 MB database, 2 GB bandwidth/month, 500K Edge Function calls/month |
| Vercel | 100 GB bandwidth/month, unlimited deploys |

Both are more than enough for a private friend group.

---

## 8. Re-deploying the Edge Function After Changes

If you update `supabase/functions/submit-setup/index.ts`:

```bash
npx supabase functions deploy submit-setup
```
