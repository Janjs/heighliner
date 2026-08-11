# Heighliner

Heighliner is a Next.js app for mapping how a company works and turning those workflows into AI automation routes.

It includes:

- Opportunity discovery from company context and uploaded files
- A route editor for refining automation steps
- Optional integrations for OpenAI, Composio, and Resend
- English, Spanish, and Dutch UI copy

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- React Flow
- Composio

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root with the values you need:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini

RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Heighliner <onboarding@resend.dev>
INQUIRY_TO_EMAIL=you@example.com

COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_USER_ID=heighliner-demo
COMPOSIO_AUTH_CONFIG_GMAIL=your_auth_config_id
COMPOSIO_AUTH_CONFIG_GOOGLE_DRIVE=your_auth_config_id
COMPOSIO_AUTH_CONFIG_SLACK=your_auth_config_id
```

Only `OPENAI_API_KEY` is needed for the AI-backed route editing and analysis endpoints. If it is missing, the app falls back to local demo behavior.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm run start
```

## API Routes

- `POST /api/analyze` - Generates automation opportunities from company context
- `POST /api/routes/edit` - Edits an existing route using AI
- `POST /api/connect` - Starts a Composio connection flow for an integration
- `POST /api/inquiry` - Sends a contact inquiry email through Resend

## Notes

- The app includes demo content so it still works without external services.
- The integration list is tailored for automation and workflow discovery rather than a general-purpose dashboard.
