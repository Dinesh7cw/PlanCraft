# skills.md — FRD to Docs Generator App

## இந்த App என்ன செய்யும்?
User ஒரு FRD document (PDF/DOCX) upload பண்ணி button click பண்ணா,
AI automatically 4 files generate பண்ணும்:
- skills.md
- instructions.md  
- rules.json
- project-plan.md

---

## Developer-க்கு தேவையான Skills

### 1. Frontend
| Skill | Level | Usage |
|-------|-------|-------|
| Next.js 14+ (App Router) | Advanced | Core framework |
| React (useState, useEffect) | Intermediate | UI state management |
| TypeScript | Intermediate | Type safety |
| Tailwind CSS | Basic | Styling |

### 2. Backend (Next.js API Routes)
| Skill | Level | Usage |
|-------|-------|-------|
| Next.js API Routes | Intermediate | File upload + AI call |
| Node.js (Buffer, fs) | Intermediate | File handling |
| FormData / multipart | Intermediate | PDF/DOCX upload handling |
| OpenAI API (GPT-4o) | Intermediate | AI doc generation |

### 3. File Processing
| Skill | Level | Usage |
|-------|-------|-------|
| pdf-parse (npm) | Basic | PDF text extract பண்ணணும் |
| mammoth (npm) | Basic | DOCX text extract பண்ணணும் |
| jszip (npm) | Basic | 4 files ஒரே ZIP-ல download |
| Blob + URL.createObjectURL | Basic | Client-side file download |

### 4. DevOps / Deployment
| Skill | Level | Usage |
|-------|-------|-------|
| Git | Basic | Version control |
| .env.local setup | Basic | OpenAI API key manage |
| npm scripts | Basic | Dev / build / start |
| Vercel | Basic | Production deploy |

---

## Required npm Packages
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "openai": "^4",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "jszip": "^3.10.1",
    "zod": "^3.22.0"
  }
}
```

---

## Skill Level Definition
- **Basic** — Documentation படிச்சா போதும்
- **Intermediate** — 1–2 projects பண்ணிருக்கணும்
- **Advanced** — Production-level experience வேணும்
