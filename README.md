# Mammoths Collection Market Analytics App

A [T3 Stack](https://create.t3.gg/) project that tracks and indexes marketplace data for the Mammoths NFT collection.

## Features

- 5-minute interval data polling via cron jobs
- Price history tracking with multiple data sources:
  - CoinMarketCap (primary)
  - CoinGecko (fallback)
- Supabase PostgreSQL database integration
- Multi-level caching strategy:
  - tRPC client-side caching
  - Next.js unstable cache implementation
- Real-time market analytics including:
  - Holder statistics
  - Listing quantities
  - Volume tracking (Native token & USD)
  - Price history (Native token & USD)

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Supabase PostgreSQL](https://supabase.com) - Database
- [tRPC](https://trpc.io) - Type-safe API
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling

## Getting Started

1. Clone the repository
2. Install dependencies:

```
pnpm install
```

3. Copy the `.env.example` file to `.env` and fill in the required parameters
4. Start the development server:
```
pnpm dev
```

## Environment Variables

See `.env.example` for the required configuration parameters, including:
- Database credentials
- API keys for CoinMarketCap and CoinGecko
- Project configuration

## Deployment

This project is configured for deployment on Vercel. For other deployment options, follow deployment guides for [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker).

## Database Schema

The price history schema is defined in `src/server/db/schema.ts` and includes fields for:
- Collection address
- Timestamp tracking
- Price data (native token and USD)
- Holder statistics
- Listing quantities
- Volume metrics
  
