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

The local app refuses to start until these are configured in `.env.local`:

- `MISTRAL_API_KEY` enables Mistral opportunity generation and Mistral OCR for PDFs and images.
- `COMPOSIO_API_KEY` prepares the local app for real integration connections.

`MISTRAL_MODEL`, `MISTRAL_OCR_MODEL`, and the specific `COMPOSIO_AUTH_CONFIG_*` values are optional until you need to override models or enable a particular integration.

## Website

```bash
cd website
npm install
cp .env.example .env.local
npm run dev
```

The website demo is fully mocked. Its only runtime integration is the contact form, which needs these variables in `website/.env` locally or in Coolify for deployment:

```env
RESEND_API_KEY=re_your_key
RESEND_FROM="Heighliner <hello@your-verified-domain.com>"
INQUIRY_TO_EMAIL=you@example.com
```

## Deployment

The GitHub Actions workflow triggers Coolify. The repository `Dockerfile` builds only `website/`, so deployed environments serve the landing page and demo, never the SQLite app. Configure Coolify to use the repository Dockerfile.

GitHub Environment `production` needs these deployment secrets:

```text
COOLIFY_TOKEN
COOLIFY_WEBHOOK
```

Coolify needs the three Resend variables above. It does not need Mistral or Composio for the website.
