import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 10 * 60 * 1000,
    maxRetries: 2,
});

/**
 * MASTER RULE — injected into every prompt.
 * These 4 files will be given to an AI coding assistant (Claude) to build
 * the entire project. So every file must be a complete, unambiguous blueprint.
 * No gaps. No assumptions. No "TBD". No generic content.
 */
const MASTER_RULE = `
CRITICAL RULES — READ BEFORE GENERATING:
1. These 4 files will be fed directly to an AI coding assistant (Claude Code) to build the entire project from scratch. If anything is missing, vague, or generic — the AI will make wrong assumptions and build the wrong thing.
2. Extract EVERYTHING from the FRD — tech stack, modules, APIs, DB schema, auth method, roles, business logic, validations, error cases, performance rules, security rules, deployment target.
3. NEVER write "TBD", "to be determined", "as needed", or "optional" — always make a concrete decision based on what the FRD implies.
4. NEVER add generic content not implied by the FRD.
5. NEVER skip a section even if FRD has limited info — derive it from context.
6. Output ONLY the document content. No markdown code fences. No preamble. No "Here is your file:".

GAP FIXES — STRICT ENFORCEMENT:

[GAP 1 — NO INVENTED TECH]
NEVER add any language, framework, library, tool, or service that is NOT explicitly stated or clearly and directly implied by the FRD.
- If the FRD says "Node.js + React" → do NOT add Python, Go, or any other language.
- If the FRD says "PostgreSQL" → do NOT add Redis or MongoDB unless FRD explicitly mentions them.
- If unsure whether a tech is implied → DO NOT include it. Omit rather than invent.
- Every technology in your output must map to an exact line or section in the FRD.

[GAP 2 — EXACT FRD NAMING FOR FILES AND FOLDERS]
ALWAYS use the exact file names, folder names, module names, and component names stated in the FRD.
- If FRD says "auth-service.ts" → use that exact name, not "authService.ts" or "auth.ts".
- If FRD says "components/CampaignCard" → use that exact path, not "components/Card" or "components/campaign-card".
- If FRD uses a naming convention consistently (e.g. kebab-case) → apply it throughout all file/folder names.
- NEVER rename or genericize FRD-specified names.

[GAP 3 — FUTURE PHASES CLEARLY SEPARATED FROM PHASE 1]
Any feature, module, or requirement that the FRD marks as Phase 2, Phase 3, "future", "v2", "later", or "out of scope" MUST be:
- Listed under "Out of Scope" or "DO NOT BUILD" sections.
- NEVER included in Phase 1 tasks, folder structure, API endpoints, or DB schema.
- Labeled with ⛔ DO NOT BUILD in Phase 1 wherever it appears.
- If FRD has no explicit phases, infer scope from priority/MVP language and mark non-MVP items as out of scope.
`.trim();

async function streamedCreate(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    jsonMode = false,
    maxTokens = 4096
): Promise<string> {
    const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        stream: true,
        max_tokens: maxTokens,
        messages,
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    let result = "";
    for await (const chunk of stream) {
        result += chunk.choices[0]?.delta?.content ?? "";
    }
    return result;
}

// ─────────────────────────────────────────────
// FILE 1 — skills.md
// ─────────────────────────────────────────────
export async function generateSkills(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `
You are a senior technical architect. Your job is to generate a 'skills.md' file so complete that an AI coding assistant can look at it and immediately know every technology, package, and expertise level needed to build this project — with zero guessing.

${MASTER_RULE}

STEP 1 — DETECT PROJECT TYPE from the FRD:
Identify which category this project belongs to (can be multiple):
- Web Application (React/Vue/Angular/Next.js frontend + backend)
- Website (CMS like WordPress, Webflow, static)
- REST / GraphQL API (Node.js / Python / Go / PHP backend)
- LLM Application (OpenAI, Anthropic, Gemini, local models)
- MCP Server (Model Context Protocol tool/server)
- AI Agent / Chatbot
- Browser Plugin / Extension (Chrome, Firefox)
- CMS Plugin (WordPress, Shopify, Strapi)
- Mobile App (React Native, Flutter, Swift, Kotlin)
- Desktop App (Electron, Tauri)
- Data Pipeline / ETL
- DevOps / Infrastructure (Docker, CI/CD)
- Other

STEP 2 — BEFORE LISTING ANY SKILL, APPLY THIS CHECK:
For EVERY technology you are about to list — ask yourself: "Is this EXPLICITLY stated in the FRD?"
- If YES → include it.
- If NO or UNSURE → DO NOT include it. Write nothing rather than guess.
This means: if FRD has zero mention of Python → do not write Python. If FRD has zero mention of Redis → do not write Redis. Zero exceptions.

STRICT RULE — NO INVENTED TECH, NO VAGUE WORDS:
Only list technologies explicitly stated in the FRD tech stack section.
If a technology is not directly mentioned in the FRD, DO NOT include it.
FORBIDDEN in your output: "potentially", "implied", "may be used", "could be used", "possibly", "not explicitly mentioned", "likely used".
Write only concrete statements. If uncertain — exclude it entirely.

STEP 3 — EXTRACT ALL SKILLS:

Generate skills.md with these EXACT sections:

# skills.md — [Project Name from FRD]

## Project Type
[State the detected project type(s) clearly]

## All Languages & Runtimes
[List EVERY language and runtime explicitly stated in the FRD — e.g. TypeScript, PHP, Python, Rust, Swift. For each: name, version if mentioned, why it's needed in this project. Do NOT use the word "implied".]

## Frontend Skills
[Only if project has a frontend. For each skill: name | proficiency level (Basic/Intermediate/Advanced) | specific usage in THIS project]

## Backend Skills
[Only if project has a backend. For each skill: name | proficiency level | specific usage in THIS project]

## Database & Storage
[List ALL databases, caches, vector stores, file storage from FRD. For each: type, version if mentioned, what data is stored, schema summary if described in FRD]

## AI / LLM Skills
[Only if FRD mentions AI/LLM/embeddings. For each: model name, provider, specific usage — e.g. "OpenAI gpt-4o — generates chatbot replies using retrieved context chunks"]

## Third-Party APIs & External Services
[List EVERY external API, OAuth provider, webhook, payment gateway, ad platform, email service mentioned in FRD. For each: service name, what it does in this project, auth method used]

## Required Packages / Dependencies
[List ALL packages needed. Organized by language/runtime. Include exact package name and one-line reason]
Example format:
### npm (Node.js / TypeScript)
- openai@^4 — OpenAI API calls
- pdf-parse@^1 — extract text from PDF uploads
### pip (Python)
- fastapi — REST API framework
### composer (PHP)
- guzzlehttp/guzzle — HTTP client for Pinecone API calls

## DevOps & Deployment
[List deployment target explicitly stated in FRD. e.g. Vercel, AWS Lambda, VPS, Docker, WordPress hosting. Include any CI/CD, environment management needed. Do NOT use "implied" or "could be".]

## Skill Summary Table
| Skill / Technology | Level Required | Why Needed in This Project |
|--------------------|---------------|----------------------------|
[Fill every row with actual skills from FRD — minimum 10 rows]

FINAL CHECK: Before outputting, search your draft for: "implied", "potentially", "may be used", "could be used", "possibly". If found — remove or rephrase. Output must contain ZERO vague words.
`.trim(),
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}

// ─────────────────────────────────────────────
// FILE 2 — instructions.md
// ─────────────────────────────────────────────
export async function generateInstructions(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `
You are a senior lead developer. Your job is to generate an 'instructions.md' file so complete that an AI coding assistant can follow it step by step and build the entire project — with zero ambiguity.

${MASTER_RULE}

Generate instructions.md with these EXACT sections:

# instructions.md — [Project Name from FRD]

## What We Are Building
[2-3 sentences: project name, what it does, who uses it — taken directly from FRD]

## Prerequisites
[List EVERY tool, runtime, account, and credential needed BEFORE starting. Be specific about versions.]
Example:
- Node.js 20+ (download: nodejs.org)
- PHP 8.2+ with extensions: curl, mbstring, openssl
- WordPress 6.4+ installation
- OpenAI account + API key (platform.openai.com)
- Pinecone account + API key (pinecone.io)
- MongoDB Atlas account OR local MongoDB 7+

## Environment Variables / Config Storage
Config storage MUST match the project type:
- WordPress Plugin → wp_options table via get_option() / update_option(). Never .env.
- Node.js / Next.js → .env.local file. Never hardcode.
- Python → .env file + python-dotenv. Never hardcode.
- Mobile App → Platform secure storage (Keychain / Keystore). Never plaintext.
- Chrome Extension → chrome.storage.sync or .env at build time. Never expose in content scripts.

[List ALL environment variables or config keys the project needs. Use the correct format for this project type.]
\`\`\`env
# Example — derive actual names from FRD
OPENAI_API_KEY=sk-...
DATABASE_URL=mongodb+srv://...
\`\`\`

## Project Setup — Step by Step
[Numbered steps from zero to running locally. Include exact commands.]

## Complete Folder Structure
[Full directory tree using EXACT names from FRD. Rules:
- Use the EXACT file/folder names stated in the FRD — never rename, never genericize.
- If FRD uses kebab-case → use kebab-case. If camelCase → use camelCase. Match exactly.
- Only include folders/files for Phase 1 scope. Mark any future-phase files with ⛔ comment.
- Do NOT add folders for tech/features not in the FRD.]
\`\`\`
project-root/
├── src/
│   ├── ...     # use FRD exact names
\`\`\`

## Module-by-Module Build Guide
[For EACH module, feature, or component named in the FRD — give a dedicated subsection.
ONLY include Phase 1 / MVP modules. Mark any Phase 2+ modules with ⛔ DO NOT BUILD IN PHASE 1.]

### [Exact Module Name from FRD — use FRD's exact wording]
- **What it does:** [from FRD]
- **File(s) to create:** [exact file paths using FRD naming convention]
- **Key logic to implement:** [bullet points of what the code must do]
- **Depends on:** [other modules or APIs it needs]
- **Phase:** Phase 1 ✅ | Phase 2 ⛔ (choose one)

## Database Schema
[For EVERY database/collection/table implied or stated in the FRD — define the schema]
Example:
### Collection: campaigns
| Field | Type | Required | Description |
|-------|------|----------|-------------|

## API Endpoints
[List EVERY API endpoint the project needs based on FRD functional requirements]
| Method | Route | Auth Required | Request Body | Response | Description |
|--------|-------|--------------|-------------|----------|-------------|

## Authentication & Authorization Flow
[Describe the exact auth flow from FRD — login steps, token storage, role checks. If role-based access is in FRD, list every role and what they can/cannot do]

## Business Logic Rules
Business Logic Rules MUST be extracted directly from the FRD functional requirements.
Include specifically:
- Every mandatory field validation rule stated in FRD
- Every status flow / lifecycle (e.g. Draft → Active → Completed)
- Every role-based permission rule (who can do what)
- Every conditional logic rule (e.g. "cannot publish unless X and Y are filled")
- Every data constraint (e.g. "chunk size: 500-1000 tokens with overlap")
Write each rule as a specific, testable statement. Never write generic rules.
Example:
- Campaign cannot be published unless: Campaign Name + Platform + Budget + Start Date all filled
- Status flow: Draft → Scheduled → Active → Paused → Completed → Failed
- Only Admin role can delete campaigns

## Error Handling Guide
[For each major operation — file upload, API call, DB write, auth — list what errors can occur and how to handle them]

## Running & Testing Locally
[Exact commands to start dev server, seed database if needed, test key features]

## Deployment
[Step-by-step deploy guide based on the deployment target implied by the FRD tech stack]
`.trim(),
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}

// ─────────────────────────────────────────────
// FILE 3 — rules.json
// ─────────────────────────────────────────────
export async function generateRules(frdText: string): Promise<string> {
    return streamedCreate(
        [
            {
                role: "system",
                content: `
You are a senior software engineer and tech lead. Your job is to generate a 'rules.json' file so complete that an AI coding assistant follows these rules automatically while writing every line of code — no exceptions.

${MASTER_RULE}

CRITICAL — RULES MUST MATCH PROJECT TYPE:
Every rule, pattern, and convention must match the project type detected from the FRD.

- WordPress Plugin (PHP): Use wp_options for config storage, register_rest_route() for APIs, add_action()/add_filter() for hooks, guzzlehttp/guzzle for HTTP calls, WP_Error for errors. NEVER use: .env files, process.env, Promise.all(), .next/, npm patterns. forbidden_commits: [".env", "node_modules/", "vendor/", "*.log"]

- Node.js / Next.js API: Use .env.local for secrets, Express/Next.js API routes, Promise.all() for parallel calls, Zod for validation. NEVER use: PHP patterns, wp_options, composer. forbidden_commits: [".env", ".env.local", "node_modules/", ".next/", "dist/"]

- Python API (FastAPI/Flask): Use .env + python-dotenv, Pydantic for validation, asyncio.gather() for parallel calls, pip/requirements.txt. NEVER use: npm, composer, Node.js patterns. forbidden_commits: [".env", "__pycache__/", "venv/", ".venv/"]

- React / Next.js Frontend: Use .env.local, React hooks, Tailwind, fetch/axios. NEVER use: PHP patterns, Python patterns.

- Mobile App (React Native / Flutter): Use AsyncStorage or SecureStore for secrets, platform-specific navigation, native APIs.

- Chrome Extension: Use chrome.storage API, background service workers, manifest.json rules. NEVER use: server-side patterns.

Always match every rule to the actual project type from the FRD.

Generate a valid JSON object with ALL of these keys. Derive values from the FRD — do not use generic defaults:

{
  "project": {
    "name": "exact project name from FRD",
    "type": "WebApp | API | LLMApp | MCPServer | Plugin | Website | Mobile | etc",
    "description": "one sentence from FRD"
  },

  "tech_stack": {
    "languages": ["list every language from FRD"],
    "frontend": "framework or null",
    "backend": "framework or null",
    "database": "db name or null",
    "ai_models": ["list if any"],
    "deployment": "Vercel | AWS | Docker | WordPress hosting | etc"
  },

  "code_conventions": {
    "per_language": {
      "[language from FRD e.g. TypeScript]": {
        "style": "e.g. Functional components only, no class components",
        "naming": { "variables": "camelCase", "files": "kebab-case", "classes": "PascalCase" },
        "imports": "e.g. named imports only, no default exports for utils",
        "comments": "JSDoc for all exported functions"
      },
      "[another language if in FRD e.g. PHP]": {
        "style": "PSR-12 coding standard",
        "naming": { "functions": "camelCase", "classes": "PascalCase", "files": "kebab-case" },
        "comments": "PHPDoc for all methods"
      }
    },
    "general": {
      "max_function_length": "50 lines",
      "max_file_length": "300 lines",
      "no_hardcoded_values": "match project type — WordPress: wp_options; Node.js: .env.local; Python: .env"
    }
  },

  "architecture_rules": {
    "api_calls_location": "match project type — WordPress: register_rest_route; Node.js: API routes; Python: FastAPI routes",
    "business_logic_location": "service layer — not in controllers or UI",
    "ai_calls_location": "only in dedicated AI service file — never inline",
    "database_calls_location": "only in repository/model layer",
    "env_variables": "match project type — WordPress: get_option/update_option; Node.js: .env.local; Python: .env + python-dotenv"
  },

  "security_rules": {
    "api_keys": "match project type — WordPress: wp_options; Node.js: .env.local; Python: .env — never hardcoded, never exposed to client",
    "authentication_method": "exact method from FRD e.g. JWT | OAuth2 | Session | API Key",
    "input_validation": "all user inputs validated with schema (Zod/Joi/Yup for JS, Pydantic for Python, WP sanitize functions for PHP) before processing",
    "rate_limiting": "value from FRD if mentioned, else '20 requests per minute per user'",
    "sql_injection": "use ORM/prepared statements only — never raw string queries",
    "xss_prevention": "sanitize all output rendered to DOM",
    "forbidden": [
      "Never expose API keys in client-side code",
      "Never commit .env files",
      "Never store plain-text passwords",
      "Never trust unvalidated user input"
    ]
  },

  "out_of_scope": {
    "phase_1_exclusions": [
      "LIST ONLY features/modules the FRD explicitly marks as Phase 2, Phase 3, future, v2, later, or out of scope",
      "If FRD has no explicit phases — infer from MVP/priority language and list non-MVP features here",
      "IMPORTANT: Claude must NEVER build any feature in this list, even if it seems useful",
      "WARNING: Do NOT put actively-used technologies here — only deferred FEATURES go in this list"
    ],
    "future_phases": ["features listed as Phase 2 / future enhancements in FRD — FEATURES only, not tech"],
    "tech_not_in_frd": [
      "ONLY list technologies that are genuinely absent from the FRD AND not implied by the project",
      "If a technology IS used in the project (e.g. Redis for job queuing, Python for scripts) — do NOT list it here",
      "This field is ONLY for tech you deliberately excluded — not for tech you included",
      "If all required tech is already listed in tech_stack, leave this array empty: []"
    ]
  },

  "error_handling_rules": {
    "api_errors": "always return { error: string, status: number } — never expose stack traces",
    "external_service_errors": "retry 3 times with exponential backoff for 429/503 — fail fast for 401/400",
    "database_errors": "wrap all DB operations in try/catch — log error, return user-friendly message",
    "file_upload_errors": "validate type and size before processing — return specific error message",
    "never_silent_errors": "never swallow errors with empty catch blocks"
  },

  "performance_rules": {
    "parallel_calls": "match project type — Node.js: Promise.all(); Python: asyncio.gather(); PHP: avoid — use sequential or WP Cron",
    "caching": "derive from FRD — e.g. cache AI responses for 24h, cache DB queries for 5min",
    "batch_processing": "derive from FRD — e.g. batch Pinecone upserts in groups of 100",
    "file_size_limit": "derive from FRD or default to 10MB",
    "response_streaming": "stream LLM responses if UX requires real-time output"
  },

  "testing_rules": {
    "required_tests": [
      "derive at least 10 specific test cases from FRD functional requirements",
      "e.g. Campaign with missing mandatory field cannot be published",
      "e.g. PDF upload extracts correct text",
      "e.g. Admin can delete campaign, Marketing Manager cannot"
    ],
    "test_coverage_minimum": "80% for service layer functions"
  },

  "git_rules": {
    "branch_naming": "feature/[feature-name] | fix/[issue] | chore/[task]",
    "commit_format": "[type]: [short description] — types: feat, fix, docs, refactor, test, chore",
    "pull_request": "all changes reviewed before merge — include description of what changed and why",
    "forbidden_commits": [".env", ".env.local", "node_modules/", ".next/", "dist/", "__pycache__/", "vendor/"]
  },

  "do_not_build": [
    "MUST contain ONLY features listed in the FRD Out of Scope section",
    "NEVER add technologies to do_not_build if they are actively used in the project",
    "tech_not_in_frd is only for technologies genuinely absent from the FRD",
    "Cross-check: every item in do_not_build must be traceable to the FRD Out of Scope section",
    "e.g. CORRECT: 'Automated campaign optimization — Phase 2'",
    "e.g. WRONG: 'Redis — not in FRD' when Redis IS used for job queues in this project",
    "List each deferred feature from out_of_scope.phase_1_exclusions here with phase label"
  ]
}
`.trim(),
            },
            { role: "user", content: `FRD Content:\n\n${frdText}` },
        ],
        true
    );
}

// ─────────────────────────────────────────────
// FILE 4 — project-plan.md
// ─────────────────────────────────────────────
export async function generateProjectPlan(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `
You are a senior project manager and tech lead. Your job is to generate a 'project-plan.md' file so complete that an AI coding assistant can follow it phase by phase and build the entire project — knowing exactly what to build, in what order, and how to verify it's done correctly.

${MASTER_RULE}

Generate project-plan.md with these EXACT sections:

# project-plan.md — [Project Name from FRD]

## Project Summary
| Key | Value |
|-----|-------|
| Project Name | [from FRD] |
| Project Type | [WebApp / API / LLM App / Plugin / etc] |
| Tech Stack | [all technologies from FRD] |
| Goal | [one sentence from FRD] |
| Total Estimated Duration | [sum of all phases] |

## How the System Works — End to End
[ASCII flow diagram showing the complete system flow from user action to final output. Be specific to THIS project.]
\`\`\`
User uploads FRD (PDF/DOCX)
        ↓
Next.js API Route receives file
        ↓
extractText() → plain string
        ↓
OpenAI GPT-4o (4 parallel calls)
        ↓
buildZip() → skills.md + instructions.md + rules.json + project-plan.md
        ↓
Client downloads ZIP
\`\`\`

## Out of Scope (⛔ DO NOT BUILD — PHASE 1)
[Copy EVERY item the FRD marks as Phase 2, Phase 3, future, v2, out of scope, or non-MVP.
If FRD has no explicit phases — infer from MVP/priority language.
Claude MUST NOT build any of these even if they seem related to Phase 1 features.]
- ⛔ [item 1]
- ⛔ [item 2]

## Tech Excluded (Genuinely Not in FRD)
[ONLY list tech that is genuinely absent from the FRD AND not implied by any feature.
Do NOT list tech that IS actively used in this project.
If all required tech is covered in skills.md — leave this section empty or omit it.]
- [e.g. only include tech you explicitly decided NOT to use and why]

## Phase Breakdown

CRITICAL RULES FOR PHASES:
- Include EVERY phase mentioned in the FRD — Phase 1, Phase 2, Phase 3, etc. NEVER omit a phase.
- Phase 1 tasks: mark as "🔨 Build Now". Phase 2+ tasks: mark as "⚠️ FUTURE — DO NOT BUILD IN PHASE 1".
- Never omit future phases. Never include future phase tasks without the warning label.
- NEVER mix Phase 2+ tasks into Phase 1 task list.
- File/folder names in tasks MUST exactly match FRD naming.
- If FRD has no explicit phases — create logical phases (Setup → Core Features → Polish).

[Create one section for EACH phase in the FRD. All phases must appear, even future ones:]

---
### Phase [N] — [Exact Phase Name from FRD]
**Status:** [🔨 Build Now | ⚠️ FUTURE — DO NOT BUILD IN PHASE 1]
**Goal:** [what this phase achieves — from FRD]
**Estimated Duration:** [e.g. Day 1–3 | Week 1 — NEVER write TBD]
**Scope boundary:** [exact features listed in FRD for this phase only]

#### Tasks
For any process that has multiple steps in the FRD (sync pipelines, data flows, generation workflows, publish workflows) — break into individual tasks, one per step. Never combine a multi-step process into a single task. Each task must have: task name, file to create/edit, specific logic to implement.

[For Phase 1: list every task to build now]
[For Phase 2+: list every task but prefix each with ⚠️ FUTURE:]
- [ ] [Exact task name from FRD] — [what to build, which file, what logic]
- ⚠️ FUTURE — [Phase 2+ task name] — DO NOT BUILD IN PHASE 1

#### Done Criteria
[3-5 verifiable checks to confirm this phase is complete]
- [ ] [check 1]
- [ ] [check 2]

---

## Complete Task Reference Table
[Every single task across all phases in one table]
| # | Task | Phase | File(s) to Create/Edit | Depends On |
|---|------|-------|----------------------|------------|

## Key Files to Create
Key Files table MUST include EVERY file needed to build the project.
For each module mentioned in the FRD — list at minimum: main logic file, any template/UI file, any config/constants file.
Do not group multiple modules into one file entry.
Minimum 8 files. If project has 5+ modules — list each module's files separately.

| File Path | Purpose |
|-----------|---------|

## Data Models Reference
[Quick reference for every DB collection/table/model — field names and types]

## API Reference
[Quick reference for every endpoint]
| Method | Route | Purpose |
|--------|-------|---------|

## Timeline Summary
| Phase | What Gets Built | Duration | Done When |
|-------|----------------|----------|-----------|
`.trim(),
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}

// ─────────────────────────────────────────────
// REGENERATE — Apply user feedback to existing docs
// ─────────────────────────────────────────────
export type DocsPayload = {
    skills: string;
    instructions: string;
    rules: string;
    projectPlan: string;
};

/** Parse @filename mentions from user feedback. Returns which files to update. */
function parseTargetFiles(userFeedback: string): ("skills" | "instructions" | "rules" | "projectPlan")[] {
    const targets: ("skills" | "instructions" | "rules" | "projectPlan")[] = [];
    if (/\@skills\.md/i.test(userFeedback)) targets.push("skills");
    if (/\@instructions\.md/i.test(userFeedback)) targets.push("instructions");
    if (/\@rules\.json/i.test(userFeedback)) targets.push("rules");
    if (/\@project-plan\.md/i.test(userFeedback)) targets.push("projectPlan");
    return targets.length > 0 ? targets : ["skills", "instructions", "rules", "projectPlan"];
}

export async function regenerateDocs(
    frdText: string,
    currentDocs: DocsPayload,
    userFeedback: string
): Promise<DocsPayload> {
    const targetFiles = parseTargetFiles(userFeedback);
    const targetList = targetFiles.map((f) => (f === "rules" ? "rules.json" : f === "projectPlan" ? "project-plan.md" : f + ".md")).join(", ");
    const keepUnchanged = targetFiles.length < 4
        ? `CRITICAL: The user mentioned specific files with @. ONLY update: ${targetList}. For all other files, return the EXACT same content as provided — do not modify them at all.`
        : "";

    // ALWAYS pass FULL content for ALL 4 files — AI needs complete context to apply user feedback correctly to every file
    const skillsContent = currentDocs.skills;
    const instructionsContent = currentDocs.instructions;
    const rulesContent = currentDocs.rules;
    const projectPlanContent = currentDocs.projectPlan;

    const result = await streamedCreate(
        [
            {
                role: "system",
                content: `You are a senior technical architect. The user has generated 4 project docs (skills.md, instructions.md, rules.json, project-plan.md) from an FRD. They now want changes based on their feedback.

${MASTER_RULE}

PRIMARY DIRECTIVE — USER FEEDBACK IS MANDATORY:
The user's feedback is the #1 priority. Whatever they request MUST appear in your output.
- Apply changes to EVERY file where the feedback is relevant — skills.md, instructions.md, rules.json, project-plan.md.
- If they say "add Redis" → add Redis to skills.md, instructions.md (prereqs/env), rules.json (tech_stack), project-plan.md (tech summary) — wherever it belongs.
- If they say "Fix Phase 2" → fix Phase 2 in project-plan.md and any other file that mentions Phase 2.
- Do NOT ignore, generalize, or skip any part of their request.
- Do NOT apply changes to only one file when the feedback affects multiple files.
- Apply their changes exactly as they described, across ALL relevant files.

${keepUnchanged}

If user did NOT @mention any file — apply their feedback to ALL 4 files wherever the change is relevant (skills, instructions, rules, project-plan).

OUTPUT: Return a valid JSON object with exactly these keys:
{
  "skills": "full updated skills.md content",
  "instructions": "full updated instructions.md content",
  "rules": "full updated rules.json content (valid JSON string)",
  "projectPlan": "full updated project-plan.md content"
}

- Output ONLY the JSON. No markdown fences. No preamble.
- If the feedback affects only one file, still return all 4 — update the affected one, keep others EXACTLY as provided.
- rules must be valid JSON (escape quotes in strings).
- Preserve all MASTER_RULE and GAP FIXES in your updates.`,
            },
            {
                role: "user",
                content: `USER FEEDBACK — APPLY THESE CHANGES (this is the primary instruction):
${userFeedback}

---
FRD Content:\n${frdText.slice(0, 8000)}

---
CURRENT DOCS:

skills.md:
${skillsContent}

---
instructions.md:
${instructionsContent}

---
rules.json:
${rulesContent}

---
project-plan.md:
${projectPlanContent}`,
            },
        ],
        true,
        16384 // Larger output for full 4-doc JSON
    );

    const parsed = JSON.parse(result) as DocsPayload;
    // Only use AI output for @mentioned files; keep others unchanged
    return {
        skills: targetFiles.includes("skills") ? (parsed.skills ?? currentDocs.skills) : currentDocs.skills,
        instructions: targetFiles.includes("instructions") ? (parsed.instructions ?? currentDocs.instructions) : currentDocs.instructions,
        rules: targetFiles.includes("rules") ? (parsed.rules ?? currentDocs.rules) : currentDocs.rules,
        projectPlan: targetFiles.includes("projectPlan") ? (parsed.projectPlan ?? currentDocs.projectPlan) : currentDocs.projectPlan,
    };
}
