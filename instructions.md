# instructions.md — FRD to Docs Generator App Setup Guide

## App Overview
FRD (PDF/DOCX) upload → AI reads content → 4 planning docs auto-generate → ZIP download

---

## Step 1: Project Setup

```bash
# Next.js app create பண்ணு
npx create-next-app@latest frd-doc-generator --typescript --tailwind --app

cd frd-doc-generator

# Required packages install பண்ணு
npm install openai pdf-parse mammoth jszip zod
npm install -D @types/pdf-parse
```

---

## Step 2: Folder Structure

```
frd-doc-generator/
├── app/
│   ├── page.tsx                  ← Main UI (upload + button)
│   ├── layout.tsx
│   └── api/
│       └── generate/
│           └── route.ts          ← AI generation API
├── lib/
│   ├── extractText.ts            ← PDF/DOCX text extract
│   ├── generateDocs.ts           ← OpenAI prompts
│   └── buildZip.ts               ← ZIP file builder
├── .env.local                    ← API keys
├── package.json
└── README.md
```

---

## Step 3: Environment Variables

`.env.local` file create பண்ணி இதை add பண்ணு:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ இந்த file-ஐ NEVER git commit பண்ணாதே. `.gitignore`-ல இருக்கணும்.

---

## Step 4: Core Files — என்ன எழுதணும்

### `lib/extractText.ts`
- PDF upload → `pdf-parse` use பண்ணி raw text extract
- DOCX upload → `mammoth` use பண்ணி raw text extract
- Return: plain string (FRD content)

### `app/api/generate/route.ts`
- `POST` request accept பண்ணும்
- `multipart/form-data` — uploaded file படிக்கும்
- `extractText()` call பண்ணி FRD content எடுக்கும்
- OpenAI GPT-4o-க்கு 4 separate prompts அனுப்பும்
- 4 files content return பண்ணும் (JSON)

### `lib/generateDocs.ts`
- `generateSkills(frdText)` → skills.md content
- `generateInstructions(frdText)` → instructions.md content
- `generateRules(frdText)` → rules.json content
- `generateProjectPlan(frdText)` → project-plan.md content

### `lib/buildZip.ts`
- `jszip` use பண்ணி 4 files ஒரே ZIP-ல pack பண்ணும்
- Client-க்கு Blob return பண்ணும்

### `app/page.tsx`
- File upload input (PDF/DOCX accept)
- "Generate Docs" button
- Loading spinner (AI generate ஆகும்போது)
- Download ZIP button (generate ஆனா appear ஆகும்)

---

## Step 5: API Flow

```
User uploads FRD
      ↓
POST /api/generate (FormData with file)
      ↓
extractText(file) → plain text
      ↓
OpenAI GPT-4o (4 parallel calls)
      ↓
{ skills, instructions, rules, projectPlan }
      ↓
buildZip() → ZIP Blob
      ↓
Client downloads ZIP
```

---

## Step 6: Run Locally

```bash
npm run dev
# http://localhost:3000 open பண்ணு
```

---

## Step 7: Deploy to Vercel

```bash
# Vercel CLI install
npm i -g vercel

# Deploy
vercel

# Environment variable set பண்ணு
# Vercel Dashboard → Settings → Environment Variables
# OPENAI_API_KEY add பண்ணு
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'pdf-parse'` | Package install ஆகல | `npm install pdf-parse` |
| `401 Unauthorized` | Wrong API key | `.env.local` check பண்ணு |
| `413 Payload Too Large` | File too big | Next.js `bodyParser` limit increase பண்ணு |
| `500 Internal Server Error` | OpenAI timeout | Retry logic add பண்ணு |
