/**
 * Converts raw extracted text (from PDF/DOCX/TXT) into a cleaner markdown format
 * before sending to AI. So "enna file upload pannalum" — we give AI .md-style content.
 */
export function formatAsMarkdown(raw: string): string {
    if (!raw?.trim()) return raw;

    const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
    const out: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            out.push("");
            i++;
            continue;
        }

        // Already markdown heading
        if (/^#{1,6}\s/.test(trimmed)) {
            out.push(trimmed);
            i++;
            continue;
        }

        // Short line that looks like a section header (e.g. "OVERVIEW", "Tech Stack", "1. Introduction")
        const isShort = trimmed.length <= 80;
        const looksLikeHeader =
            /^[A-Z][A-Z\s\-:]+$/.test(trimmed) || // ALL CAPS
            /^\d+[.)]\s/.test(trimmed) || // "1. " or "1) "
            /^[•\-*]\s+[A-Z]/.test(trimmed) || // "• Title"
            trimmed.endsWith(":");

        if (isShort && looksLikeHeader) {
            out.push("## " + trimmed);
        } else {
            out.push(trimmed);
        }
        i++;
    }

    // Normalize: max one blank line between blocks
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
