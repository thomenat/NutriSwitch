# NutriSwitch

A web app where **nutritionists** share meal plans and **patients** can swap ingredients. The app recalculates quantities and nutrition totals automatically.

## What it does

- **Nutritionist → patient flow**: Create or share a plan; send the patient a link (e.g. `/share/demo-plan-1`).
- **Ingredient swapping**: Patient opens a swap modal, picks an alternative, and sees before/after grams and macro totals before confirming.
- **Recipes per meal**: Each meal is built from multiple recipes, closer to real practice.
- **Macros from USDA**: Nutrition data can be loaded from [USDA FoodData Central](https://fdc.nal.usda.gov/) (with optional local/seed fallback).

## Tech stack

| Layer        | Stack                          |
|-------------|---------------------------------|
| Framework   | [Next.js](https://nextjs.org) 16 (App Router) |
| UI          | React 19, [Tailwind CSS](https://tailwindcss.com) 4 |
| Language    | TypeScript                     |
| Nutrition   | USDA FDC API (macros per 100g) |
| Images      | Unsplash (stock photos), Supabase Storage (uploads) |

## Project structure

```
NutriSwitch/
├── README.md          ← you are here
└── web/               ← Next.js app
    ├── src/
    │   ├── app/       ← pages, layout, API routes
    │   ├── components/
    │   ├── data/      ← demo plan, ingredients
    │   └── lib/       ← nutrition logic, images, kitchen units
    ├── .env.example
    └── README.md      ← detailed setup (env, APIs, deploy)
```

## Quick start

1. **Install and run**

   ```bash
   cd web
   npm install
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000).

3. **Try the app**
   - **Open demo plan** → `/plan` (swap ingredients, see recalculated totals).
   - **Patient share link** → `/share/demo-plan-1`.

## Environment & APIs

For full setup (USDA FDC, Unsplash, Supabase), see **[web/README.md](web/README.md)**. Summary:

| Variable | Purpose |
|----------|---------|
| `FDC_API_KEY` | USDA FoodData Central – nutrition lookups (demo key used if unset) |
| `UNSPLASH_ACCESS_KEY` | Recipe stock photos |
| `SUPABASE_*` | Image uploads (public bucket via signed URLs) |

Copy `web/.env.example` to `web/.env.local` and fill in the keys you need.

## Scripts (from `web/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Deploy

The app is set up to deploy from the **`web/`** directory (e.g. Vercel: set root to `web/` and add `FDC_API_KEY` and other env vars). See [web/README.md](web/README.md) for Vercel and env details.

---

*Built with Next.js and Tailwind. Next steps: plan editing and a real backend API.*
