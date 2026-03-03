# project-plan.md — FRD to Docs Generator App

## Project Summary
**App Name:** FRD Doc Generator  
**Tech Stack:** Next.js 14 + TypeScript + OpenAI GPT-4o + Tailwind CSS  
**Goal:** FRD document (PDF/DOCX) upload → AI reads → 4 planning docs generate + ZIP download

---

## Full Flow (What We're Building)

```
┌─────────────────────────────────────────────────────┐
│                    USER                             │
│  1. FRD Document upload பண்ணுவாங்க (PDF / DOCX)    │
│  2. "Generate Docs" button click பண்ணுவாங்க        │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│                  BACKEND API                        │
│  3. File receive → PDF/DOCX text extract            │
│  4. OpenAI GPT-4o → 4 parallel prompts             │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│               GENERATED OUTPUT                      │
│  5. skills.md      — Required skills list           │
│  6. instructions.md — Setup & dev guide             │
│  7. rules.json     — Coding conventions             │
│  8. project-plan.md — Phases & tasks                │
│  9. All 4 files → ZIP → User download               │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1 — Foundation Setup (Day 1–2)

### Tasks
- [ ] `npx create-next-app@latest` — project create
- [ ] Required packages install (`openai`, `pdf-parse`, `mammoth`, `jszip`, `zod`)
- [ ] Folder structure setup (`lib/`, `app/api/generate/`)
- [ ] `.env.local` — OpenAI API key configure
- [ ] `.gitignore` — `.env.local`, `node_modules`, `.next` add
- [ ] Tailwind config verify

### Done Criteria
> `npm run dev` — localhost:3000 error இல்லாம திறக்கணும்

---

## Phase 2 — File Upload UI (Day 2–3)

### Tasks
- [ ] `app/page.tsx` — Upload zone UI build
  - Drag & drop area
  - Click to browse (PDF/DOCX only)
  - File name display after upload
  - File size validation (max 10MB)
  - Wrong file type → error message
- [ ] "Generate Docs" button — file upload ஆகாம disabled
- [ ] Loading spinner component
- [ ] Error banner component (red)

### Done Criteria
> PDF/DOCX file select பண்ணா file name காட்டணும். Wrong type → error காட்டணும்.

---

## Phase 3 — File Text Extraction (Day 3–4)

### Tasks
- [ ] `lib/extractText.ts` — create
  - `extractFromPDF(buffer)` — `pdf-parse` use
  - `extractFromDOCX(buffer)` — `mammoth` use
  - Return: plain text string
- [ ] Unit test manually:
  - Sample PDF upload → text console-ல print ஆகுதா?
  - Sample DOCX upload → text console-ல print ஆகுதா?

### Done Criteria
> Any FRD PDF/DOCX upload பண்ணா — plain text correctly extract ஆகணும்

---

## Phase 4 — AI Generation API (Day 4–6)

### Tasks
- [ ] `lib/generateDocs.ts` — 4 prompts create
  - `generateSkills(frdText)` prompt
  - `generateInstructions(frdText)` prompt
  - `generateRules(frdText)` prompt (JSON format)
  - `generateProjectPlan(frdText)` prompt
- [ ] `app/api/generate/route.ts` — POST route
  - FormData file receive
  - `extractText()` call
  - `Promise.all()` — 4 OpenAI calls parallel
  - Response: `{ skills, instructions, rules, projectPlan }`
- [ ] Error handling:
  - Invalid API key → 401 clear message
  - Rate limit → retry 3 times
  - Timeout → user message

### Done Criteria
> API call பண்ணா — 4 files content correctly JSON-ல return ஆகணும்

---

## Phase 5 — ZIP Build + Download (Day 6–7)

### Tasks
- [ ] `lib/buildZip.ts` — create
  - `jszip` — 4 files pack பண்ணும்
  - `skills.md`, `instructions.md`, `rules.json`, `project-plan.md`
  - Return: ZIP blob
- [ ] `app/page.tsx` — Download logic
  - API response receive
  - ZIP build
  - Auto-trigger download
  - "Download Again" button

### Done Criteria
> Generate click → ZIP download ஆகணும் → ZIP open பண்ணா 4 files இருக்கணும்

---

## Phase 6 — Polish + Testing (Day 7–8)

### Tasks
- [ ] Full flow test — PDF → generate → download
- [ ] Full flow test — DOCX → generate → download
- [ ] Edge cases:
  - [ ] Empty PDF (no text) → error message
  - [ ] 15MB file → reject message
  - [ ] Wrong OpenAI key → clear error
  - [ ] Network error → retry / error message
- [ ] UI polish:
  - [ ] Mobile responsive check
  - [ ] Loading states smooth ஆ இருக்கா?
  - [ ] Error messages clear ஆ இருக்கா?

### Done Criteria
> 5 different FRD files test பண்ணா — எல்லாமே correct 4 docs generate ஆகணும்

---

## Phase 7 — Deploy (Day 8–9)

### Tasks
- [ ] Vercel account setup
- [ ] `vercel` CLI deploy
- [ ] Environment variables — Vercel dashboard-ல `OPENAI_API_KEY` add
- [ ] Production URL test
- [ ] README.md write

### Done Criteria
> Production URL-ல full flow work ஆகணும்

---

## Timeline Summary

| Phase | What | Days |
|-------|------|------|
| Phase 1 | Setup | Day 1–2 |
| Phase 2 | Upload UI | Day 2–3 |
| Phase 3 | Text Extraction | Day 3–4 |
| Phase 4 | AI Generation API | Day 4–6 |
| Phase 5 | ZIP + Download | Day 6–7 |
| Phase 6 | Testing | Day 7–8 |
| Phase 7 | Deploy | Day 8–9 |
| **Total** | **Complete App** | **9 Days** |

---

## Key Files Reference

| File | Role |
|------|------|
| `app/page.tsx` | Main UI — upload + button + download |
| `app/api/generate/route.ts` | Backend — file receive + AI call |
| `lib/extractText.ts` | PDF/DOCX → plain text |
| `lib/generateDocs.ts` | OpenAI prompts for 4 docs |
| `lib/buildZip.ts` | 4 files → ZIP |
| `.env.local` | OpenAI API key |

---

*Plan created for: FRD Doc Generator App — Phase 1 Development*
