# Moozhaf — Al-Qur'an, Hadits & Doa

A modern, server-side-rendered web app to read the Holy Qur'an, study hadith, track prayer times, and practice daily dhikr — built with React Router 7 and deployed on Cloudflare Workers.

## Features

**Al-Qur'an**
- Full 114-surah Qur'an with Indonesian translation (`/quran`)
- Per-surah pages with Arabic text, description, bismillah, and audio recitation (murottal) (`/quran/:number`)
- Per-ayah pages with multiple reciters, share, juz/page info, ayah image, and Kemenag tafsir (short & long) (`/quran/:number/:ayah`)
- Surah index with grid/list views and Meccan/Medinan filter
- Daily verse of the day with audio and share on the home page
- Continue-reading cards driven by local reading history

**Hadits**
- 9 canonical books (Sahih Bukhari, Sahih Muslim, Sunan Tirmidzi, Sunan Nasai, Sunan Abu Daud, Sunan Ibnu Majah, Musnad Ahmad, Sunan Darimi, Muwaththa Malik)
- Paginated reading with jump-to-number, Arabic text + Indonesian translation (`/hadith/:book`)

**AI Search**
- Semantic vector search across surahs, ayahs, tafsir, and doa via the equran.id API (`/search`)
- `⌘K` command-palette search dialog with instant surah lookup + AI results
- Type filters (Semua / Ayat / Tafsir / Surat / Doa) and relevance badges

**Ibadah & Daily Tools**
- Prayer times marquee + qibla direction card (geolocation-aware) on the home page
- Azkar & daily doa with tap counters (`/prayer`)
- Prayer times, Asmaul Husna, and settings pages (in progress)

**Platform**
- Full i18n: Indonesian (id) & English (en), toggleable from the nav
- Light / dark / system theme with no-flash SSR script
- SEO-ready: per-route meta, Open Graph, Twitter cards, JSON-LD WebSite schema, `sitemap.xml`

## Tech Stack

- [React Router 7](https://reactrouter.com/) — SSR + client routing
- [React 19](https://react.dev/) + TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- [adhan](https://github.com/batoulapps/adhan-js) — prayer times & qibla calculations
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — edge deployment (SSR)
- [equran.id API](https://equran.id/) — AI vector search backend

Design follows the **Sacred Emerald** spec in `app/spec/design/light.md` (deep emerald primary, burnished gold accent, Noto Serif headings, Manrope body, 8px rhythm).

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the dev server with HMR:

```bash
npm run dev
```

Your app will be available at `http://localhost:5173`.

### Configuration

- `VITE_VECTOR_SEARCH_ENDPOINT` — the AI search API endpoint (equran.id `/api/vector`). Leave unset to disable AI results.
- `SITE_URL` in `app/lib/seo.ts` — replace the placeholder with your production domain before deploying (used for canonicals, OG, and `sitemap.xml`).

## Data

Static content is generated from raw JSON by `scripts/prepare-data.mjs`:

```bash
npm run data:prepare
```

This produces:
- `app/data/` — small bundles (surah index, daily verses, hadith book list, asmaul-husna, azkar)
- `public/data/quran/:number.json` — one file per surah (lazy-loaded)
- `public/data/hadith/:book/:start-:end.json` — hadith chunks of 250 (lazy-loaded)

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server with HMR |
| `npm run typecheck` | Generate Worker types + `tsc -b` |
| `npm run build` | Production build (`react-router build`) |
| `npm run check` | Typecheck + build + wrangler dry-run |
| `npm run preview` | Preview the production build locally |
| `npm run data:prepare` | Regenerate data bundles from raw JSON |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run cf-typegen` | Regenerate Cloudflare + React Router types |

## Project Structure

```
app/
  components/       # UI components (app shell, surah index, search dialog, ...)
    ui/             # shadcn/ui primitives
    home/           # home-page sections (daily verse, last read, prayer marquee, ...)
  data/             # prepared static JSON bundles
  lib/
    data/           # typed data access (quran, hadith, content, types)
    i18n.tsx        # id/en dictionary + useI18n()
    prayer.ts       # adhan calculations (prayer times, qibla, cities)
    theme.tsx       # light/dark/system theme
    vector-search.ts# equran.id AI search client
    seo.ts          # SITE_URL
  routes/           # React Router pages
  spec/design/      # design system spec
scripts/
  prepare-data.mjs  # data pipeline
workers/app.ts      # Cloudflare Worker entrypoint
```

## Deployment

Build and deploy to Cloudflare:

```bash
npm run build
npm run deploy
```

Or deploy a preview version:

```bash
npx wrangler versions upload
npx wrangler versions deploy
```

## License

Private project — source available for personal and educational use.
