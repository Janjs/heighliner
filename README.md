# Heighliner

This repository contains two independent Next.js projects.

- The repository root is the local, authenticated application. It creates and uses `data/heighliner.db` automatically, so no database setup is required.
- `website/` is the public landing page and interactive demo. It is the only project that contains the Resend contact endpoint.

## Local app

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start a workspace. Accounts, sources, opportunities, and routes are stored in local SQLite.

Set `MISTRAL_API_KEY` to enable Mistral opportunity generation and Mistral OCR parsing for PDFs and images. Plain text, Markdown, and CSV files parse locally.

## Website

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

Website-only environment variables, including `RESEND_API_KEY`, belong in `website/.env.local`.

## Deployment

The GitHub Actions workflow triggers Coolify. The repository `Dockerfile` builds only `website/`, so deployed environments serve the landing page and demo, never the SQLite app. Configure Coolify to use the repository Dockerfile.
