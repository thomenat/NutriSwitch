This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
cd web
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## USDA FoodData Central (FDC) API key

This app can fetch nutrition macros from USDA FoodData Central.

- **Environment variable (server-only)**: `FDC_API_KEY`
- **Demo behavior**: if `FDC_API_KEY` is not set in dev/preview, the app uses USDA's `DEMO_KEY` (rate-limited).
- **Production behavior**: `FDC_API_KEY` is required for USDA lookups; if missing, the app falls back to local seed values and shows a notice in the UI.

### Local setup

1. Create a local env file:

```bash
cp .env.example .env.local
```

2. Edit `web/.env.local` and set:

```dotenv
FDC_API_KEY=your_real_usda_fdc_api_key_here
```

3. Restart `npm run dev` after changing env vars.

## Images (Supabase Storage, free tier)

For a scalable, public image library (without storing images in git), this app can use **Supabase Storage**.

### What you get
- Uploads go **directly to Supabase Storage** via a signed upload URL (your server never receives the file bytes).
- The app serves images from Supabase's CDN endpoint (public bucket).

### Supabase setup
1. Create a Supabase project (free tier).
2. Create a **public** Storage bucket named `recipe-images` (or change `SUPABASE_STORAGE_BUCKET`).
3. In Supabase → Project Settings → API, copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep server-side only)

### Local setup
1. Create `.env.local`:

```bash
cp .env.example .env.local
```

2. Set these values in `web/.env.local`:

```dotenv
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=recipe-images
```

3. Restart `npm run dev`.

### API endpoints
- `POST /api/images/upload-url`: returns `{ uploadUrl, publicUrl, path }` for direct upload to Supabase Storage.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel setup

- **Root Directory**: `web/`
- **Env vars**: add `FDC_API_KEY` in Vercel → Project → Settings → Environment Variables
  - Set it for **Production** (and optionally **Preview** if you want higher limits in previews)

