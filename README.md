# SlickReceipts (website / mobile app)

React + Vite + Tailwind front end for [SlickReceipts.com](https://slickreceipts.com): snap or upload a receipt,
get the data back as CSV (Excel and JSON on Premium). Installable on phones as an app (PWA).

- Sign-in: Supabase Auth (Google or email).
- Everything else: the FastAPI backend in [receipt2Xcl](https://github.com/narm2005/receipt2Xcl).

## Run locally

```bash
npm install
cp .env.example .env   # set VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run build` writes the static site to `dist/`.
