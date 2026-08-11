# Heighliner

Heighliner is an AI automation app for companies or personal use.

## How to use it

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Add the required keys to `.env.local`:

- `MISTRAL_API_KEY` for opportunity generation and OCR
- `COMPOSIO_API_KEY` for integration connections

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000), create an account, and start a workspace.

Your data is stored locally in `data/heighliner.db`, and it is created automatically the first time you run the app.

## Run in production

```bash
npm run build
npm run start
```

