# ARGUS — Analytical Research & Geopolitical Understanding System

**A real-time geopolitical intelligence platform by Weiss & Hirsch**

ARGUS aggregates data from 12+ intelligence sources, visualizes global events
on an interactive Mapbox globe, detects threat patterns with a 9-pattern
correlation engine, and generates AI intelligence briefs via OpenAI.

## Features

- **Live Event Aggregation** — GDELT, USGS, GDACS, ReliefWeb, UCDP, WHO, NASA FIRMS, ACLED, RSS from 10+ news outlets (100+ events per load)
- **Interactive Globe** — Mapbox GL with event markers, chokepoints, undersea cables, vessel/aircraft tracking
- **Correlation Engine** — 9 threat patterns: maritime interdiction, conflict escalation, compound crisis, regional instability, infrastructure threat, humanitarian convergence, political destabilization, cascading failure, cross-border spillover
- **AI Intelligence Briefs** — GPT-4o-mini generated briefs with IC probability language, Wikipedia RAG context, analyst workspace integration
- **Analyst Workspace** — Supabase-backed auth, custom map plots (point/zone/polygon), workspace persistence
- **Situation Tracking** — Auto-groups events into named crises with escalation/de-escalation trend analysis
- **Country Profiles** — Risk scoring, World Bank economic data, Freedom House + Fragile States Index, 5-year GDP charts
- **Market Data** — Real-time commodity prices via Yahoo Finance (WTI, Brent, Gold, Bitcoin, etc.)
- **Country Comparison** — Side-by-side metric comparison with bar charts
- **Undersea Cables** — 8 major cable routes visualized on the globe
- **OFAC SDN Check** — Real-time vessel sanctions screening against US Treasury list

## Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · Mapbox GL · Zustand · TanStack Query · OpenAI · Supabase · jsPDF · Recharts

## Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=      # Required — mapbox.com
OPENAI_API_KEY=                # Required — openai.com
NEXT_PUBLIC_SUPABASE_URL=      # Optional — supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Optional — supabase.com
NASA_FIRMS_KEY=                # Optional — firms.modaps.eosdis.nasa.gov
ACLED_EMAIL=                   # Optional — acleddata.com
ACLED_PASSWORD=                # Optional — acleddata.com
```

## Getting Started

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

Open http://localhost:3000

## Architecture

```
Browser (React + Zustand + TanStack Query)
└── Next.js App Router
    ├── /api/events        ← 12+ data sources aggregated, deduplicated
    ├── /api/correlations  ← 9-pattern threat detection engine
    ├── /api/situations    ← Crisis grouping + trend analysis
    ├── /api/country/[code]← Country profile + World Bank indicators
    ├── /api/brief         ← AI intelligence briefs (OpenAI + RAG)
    ├── /api/commodities   ← Real-time market prices (Yahoo Finance)
    ├── /api/aviation      ← Aircraft tracking
    ├── /api/vessels       ← Vessel tracking + OFAC SDN sanctions
    └── /api/rag           ← Wikipedia context for briefs
```

## Data Sources

| Source | Type | Cadence |
|--------|------|---------|
| GDELT v2 | Conflict/political news | 5 min |
| USGS | Earthquakes | 5 min |
| GDACS | Multi-hazard disasters | 5 min |
| ReliefWeb | Humanitarian reports | 5 min |
| UCDP | Armed conflict events | 5 min |
| WHO | Disease outbreaks | 5 min |
| NASA FIRMS | Wildfire hotspots | 5 min |
| RSS (10 feeds) | Crisis news | 5 min |
| ACLED | Conflict events (if key) | 5 min |
| Yahoo Finance | Commodity prices | 2 min |
| US Treasury OFAC | SDN sanctions list | 24 hr |

---
*Built by Weiss & Hirsch Intelligence*
