# Daftarcha Landing Page

Static landing page for [daftarcha.tj](https://daftarcha.tj). Single HTML file served via `serve`.

## Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `Qarzi-man/fehrist`
3. In **Root Directory** set: `landing`
4. Railway will detect `package.json` and run `npm start` automatically
5. In **Settings → Networking** → add a custom domain (e.g. `daftarcha.tj`)

### Environment

No environment variables needed. `$PORT` is injected by Railway automatically.

### Local preview

```bash
cd landing
npx serve . -l 3000
```

Open [http://localhost:3000](http://localhost:3000).
