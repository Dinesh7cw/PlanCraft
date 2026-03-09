// validateDocs.ts
// Automatically runs after 4 files are generated.
// Checks all known quality gaps and returns a structured report.

export interface QualityIssue {
    file: string;
    severity: "error" | "warning";
    message: string;
}

export interface QualityReport {
    score: number;           // 0–100
    passed: number;
    total: number;
    issues: QualityIssue[];
    checks: { label: string; passed: boolean }[];
}

// ─── Helpers ───────────────────────────────────────────────
function detectProjectType(skills: string): "wordpress" | "node" | "python" | "mobile" | "extension" | "generic" {
    const s = skills.toLowerCase();
    if (s.includes("wordpress") || s.includes("cms plugin")) return "wordpress";
    if (s.includes("react native") || s.includes("flutter") || s.includes("swift") || s.includes("kotlin")) return "mobile";
    if (s.includes("chrome extension") || s.includes("browser extension")) return "extension";
    if (s.includes("python") && !s.includes("node.js")) return "python";
    if (s.includes("node.js") || s.includes("next.js") || s.includes("express")) return "node";
    return "generic";
}

function find(text: string, patterns: RegExp[]): string[] {
    const found: string[] = [];
    for (const p of patterns) {
        const matches = text.match(p);
        if (matches) found.push(...matches.map(m => m.trim()));
    }
    return [...new Set(found)];
}

// ─── Main Validator ─────────────────────────────────────────
export function validateDocs(docs: {
    skills: string;
    instructions: string;
    rules: string;
    projectPlan: string;
}): QualityReport {
    const issues: QualityIssue[] = [];
    const checks: { label: string; passed: boolean }[] = [];

    const all = `${docs.skills} ${docs.instructions} ${docs.rules} ${docs.projectPlan}`;
    const projectType = detectProjectType(docs.skills);

    // ── CHECK 1: No Tamil characters ──────────────────────────
    const tamil = find(all, [/[\u0B80-\u0BFF]+/g]);
    const c1 = tamil.length === 0;
    checks.push({ label: "No Tamil characters in any file", passed: c1 });
    if (!c1) issues.push({ file: "all files", severity: "error", message: `Tamil characters found — AI coding tools cannot process non-English content: "${tamil[0]}"` });

    // ── CHECK 2: No Tanglish words ────────────────────────────
    const tanglish = find(all, [/\b(pann|paru|sollu|enna|intha|athu|ithu|iruku|illai|nalla|sari)\w*\b/gi]);
    const c2 = tanglish.length === 0;
    checks.push({ label: "No Tanglish words in any file", passed: c2 });
    if (!c2) issues.push({ file: "all files", severity: "error", message: `Tanglish words found: ${tanglish.join(", ")}` });

    // ── CHECK 3: No TBD anywhere ──────────────────────────────
    const tbd = find(all, [/\bTBD\b/g, /\bto be determined\b/gi]);
    const c3 = tbd.length === 0;
    checks.push({ label: 'No "TBD" in any file', passed: c3 });
    if (!c3) issues.push({ file: "project-plan.md", severity: "error", message: `"TBD" found ${tbd.length} time(s) — AI needs concrete values, not placeholders` });

    // ── CHECK 4: No vague technology claims ──────────────────
    const vague = find(docs.skills, [
        /\bpotentially\b/gi,
        /\bmay be used\b/gi,
        /\bimplied\b/gi,
        /\bpossibly\b/gi,
        /\bnot explicitly mentioned\b/gi,
        /\bcould be used\b/gi,
        /\blikely used\b/gi,
    ]);
    const c4 = vague.length === 0;
    checks.push({ label: 'No vague tech claims ("potentially", "implied", etc.)', passed: c4 });
    if (!c4) issues.push({ file: "skills.md", severity: "error", message: `Vague language found: "${vague[0]}" — only include tech explicitly stated in FRD` });

    // ── CHECK 5: No wrong patterns for project type ───────────
    if (projectType === "wordpress") {
        const wrongPatterns = find(all, [
            /Promise\.all\s*\(/g,
            /process\.env\b/g,
            /\.next\//g,
            /require\s*\(\s*['"]express['"]\s*\)/g,
        ]);
        const c5 = wrongPatterns.length === 0;
        checks.push({ label: "No Node.js patterns in WordPress/PHP project", passed: c5 });
        if (!c5) issues.push({ file: "rules.json / instructions.md", severity: "error", message: `Node.js/JS patterns found in a PHP WordPress project: ${[...new Set(wrongPatterns)].join(", ")} — use PHP equivalents` });
    } else if (projectType === "node") {
        const wrongPatterns = find(all, [
            /wp_options/g,
            /register_rest_route/g,
            /add_action\s*\(/g,
            /get_option\s*\(/g,
        ]);
        const c5 = wrongPatterns.length === 0;
        checks.push({ label: "No WordPress/PHP patterns in Node.js project", passed: c5 });
        if (!c5) issues.push({ file: "rules.json / instructions.md", severity: "error", message: `WordPress/PHP patterns found in a Node.js project: ${[...new Set(wrongPatterns)].join(", ")}` });
    } else {
        checks.push({ label: "Project type pattern check", passed: true });
    }

    // ── CHECK 6: Config storage matches project type ──────────
    if (projectType === "wordpress") {
        const hasDotEnv = /create a \.env file/i.test(docs.instructions) || /OPENAI_API_KEY=sk/i.test(docs.instructions);
        const hasWpOptions = /wp_options|get_option|update_option/i.test(docs.instructions);
        const c6 = !hasDotEnv || hasWpOptions;
        checks.push({ label: "Config uses wp_options (not .env) for WordPress", passed: c6 });
        if (!c6) issues.push({ file: "instructions.md", severity: "error", message: 'WordPress plugins use wp_options for config — not .env files. Replace .env setup with get_option()/update_option()' });
    } else if (projectType === "node") {
        const hasDotEnv = /\.env|OPENAI_API_KEY/i.test(docs.instructions);
        const c6 = hasDotEnv;
        checks.push({ label: "Config uses .env file for Node.js project", passed: c6 });
        if (!c6) issues.push({ file: "instructions.md", severity: "warning", message: ".env file setup not found — Node.js projects need .env.local for secrets" });
    } else {
        checks.push({ label: "Config storage pattern check", passed: true });
    }

    // ── CHECK 7: do_not_build has no active tech ──────────────
    let rulesJson: Record<string, unknown> = {};
    try { rulesJson = JSON.parse(docs.rules); } catch { /* invalid json */ }

    const doNotBuild: string[] = Array.isArray(rulesJson?.do_not_build)
        ? rulesJson.do_not_build as string[]
        : [];

    const techKeywords = ["redis", "mongodb", "mysql", "postgres", "python", "node.js", "react", "php", "docker", "typescript"];
    const contaminated = doNotBuild.filter(item =>
        techKeywords.some(kw => {
            const itemLower = item.toLowerCase();
            return itemLower.startsWith(kw) || itemLower.includes(`use ${kw}`) || itemLower === kw;
        })
    );
    const c7 = contaminated.length === 0;
    checks.push({ label: "do_not_build contains only features (not active tech)", passed: c7 });
    if (!c7) issues.push({ file: "rules.json", severity: "error", message: `Active technologies found in do_not_build: ${contaminated.join(", ")} — only list FRD "Out of Scope" features here` });

    // ── CHECK 8: Key Files count ──────────────────────────────
    const keyFileMatches = docs.projectPlan.match(/\|\s*`?[\w\/\-\.]+\.(php|js|jsx|ts|tsx|py|json|md|css|html)`?\s*\|/g) || [];
    const c8 = keyFileMatches.length >= 6;
    checks.push({ label: "Key Files table has 6+ files with exact paths", passed: c8 });
    if (!c8) issues.push({ file: "project-plan.md", severity: "warning", message: `Only ${keyFileMatches.length} file(s) listed in Key Files table — need at least 6 with exact paths so AI knows what to create` });

    // ── CHECK 9: Future phases present and labeled ────────────
    const hasFuturePhases = /FUTURE|⚠️/i.test(docs.projectPlan);
    const hasMultiplePhases = (docs.projectPlan.match(/### Phase [2-9]/g) || []).length >= 1;
    const c9 = !hasMultiplePhases || hasFuturePhases;
    checks.push({ label: "Future phases labeled ⚠️ FUTURE", passed: c9 });
    if (!c9) issues.push({ file: "project-plan.md", severity: "warning", message: "Phase 2+ tasks are not labeled ⚠️ FUTURE — AI might build future features in Phase 1" });

    // ── CHECK 10: Out of Scope section in project-plan ────────
    const hasOutOfScope = /out of scope|do not build|⛔/i.test(docs.projectPlan);
    const c10 = hasOutOfScope;
    checks.push({ label: "project-plan.md has Out of Scope section", passed: c10 });
    if (!c10) issues.push({ file: "project-plan.md", severity: "warning", message: 'No "Out of Scope" section found — AI needs this to avoid building Phase 2+ features' });

    // ── CHECK 11: API endpoints table present ─────────────────
    const hasApiTable = /\|\s*POST\s*\||\|\s*GET\s*\||\|\s*PUT\s*\|/i.test(docs.instructions);
    const c11 = hasApiTable;
    checks.push({ label: "API Endpoints table in instructions.md", passed: c11 });
    if (!c11) issues.push({ file: "instructions.md", severity: "warning", message: "No API Endpoints table found — AI needs exact routes, methods, and payloads to implement correctly" });

    // ── CHECK 12: DB Schema present ───────────────────────────
    const hasDbSchema = /database schema|collection:|table:|wp_options|wp_postmeta|mongodb|schema/i.test(docs.instructions);
    const c12 = hasDbSchema;
    checks.push({ label: "Database Schema present in instructions.md", passed: c12 });
    if (!c12) issues.push({ file: "instructions.md", severity: "warning", message: "No database schema found — AI needs field names, types, and relationships to build correct data models" });

    // ── CHECK 13: 100% English ────────────────────────────────
    const nonEnglish = find(all, [/[\u0B80-\u0BFF\u0900-\u097F\u0600-\u06FF]/g]);
    const c13 = nonEnglish.length === 0;
    checks.push({ label: "100% English — no non-Latin scripts", passed: c13 });
    if (!c13 && c1) issues.push({ file: "all files", severity: "error", message: "Non-English characters detected in generated files" });

    // ── Score ─────────────────────────────────────────────────
    const passed = checks.filter(c => c.passed).length;
    const total = checks.length;
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warnCount = issues.filter(i => i.severity === "warning").length;

    const score = Math.max(0, Math.min(100, 100 - errorCount * 8 - warnCount * 4));

    return { score, passed, total, issues, checks };
}
