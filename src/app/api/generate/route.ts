import { NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";
import { formatAsMarkdown } from "@/lib/formatAsMarkdown";
import { generateSkills, generateInstructions, generateRules, generateProjectPlan } from "@/lib/generateDocs";
import { buildZip } from "@/lib/buildZip";
import { validateDocs } from "@/lib/validateDocs";

export const maxDuration = 300;

function sseMessage(obj: object): string {
    return `data: ${JSON.stringify(obj)}\n\n`;
}

const HEARTBEAT = `data: ${JSON.stringify({ heartbeat: true })}\n\n`;

/** Retry a generate fn up to 3 times on timeout. */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const msg = String((err as Error)?.message ?? "");
            const isTimeout = msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out");
            console.warn(`[${label}] attempt ${attempt} failed: ${msg}`);
            if (isTimeout && attempt < 3) continue;
            throw err;
        }
    }
    throw new Error(`${label} failed after 3 attempts`);
}

export async function POST(req: Request) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 20) {
        return NextResponse.json({ error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local (local) or GitHub Secrets (server)." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No document provided. Please upload a DOCX, TXT, or MD file." }, { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const enc = new TextEncoder();
            const send = (obj: object) => controller.enqueue(enc.encode(sseMessage(obj)));
            const ping = () => controller.enqueue(enc.encode(HEARTBEAT));

            // Send heartbeat every 20s so client connection never idles for 60s
            const heartbeatTimer = setInterval(ping, 20_000);

            try {
                let frdText = "";
                try {
                    frdText = await extractText(file);
                } catch (err: unknown) {
                    send({ error: (err as Error).message || "Failed to extract text from file." });
                    return;
                }

                const trimmedLength = frdText?.trim().length ?? 0;
                if (!frdText || trimmedLength < 50) {
                    send({ error: `Too little readable text (${trimmedLength} chars). Use a file with selectable text or run OCR.` });
                    return;
                }
                if (trimmedLength < 150) {
                    send({ error: `Very little text (${trimmedLength} chars). Add more FRD content.` });
                    return;
                }

                let frdMarkdown = formatAsMarkdown(frdText);
                if (frdMarkdown.length > 10000) {
                    frdMarkdown = frdMarkdown.slice(0, 10000) + "\n\n[... FRD truncated ...]";
                }

                // Run all 4 docs in parallel — 4x faster than sequential
                send({ progress: 0, message: "Generating all 4 docs in parallel…" });
                const [skills, instructions, rules, projectPlan] = await Promise.all([
                    withRetry(() => generateSkills(frdMarkdown),       "skills"),
                    withRetry(() => generateInstructions(frdMarkdown), "instructions"),
                    withRetry(() => generateRules(frdMarkdown),        "rules"),
                    withRetry(() => generateProjectPlan(frdMarkdown),  "projectPlan"),
                ]);
                send({ progress: 4, message: "All docs generated!" });

                // Quality check — auto-run after generation
                const qualityReport = validateDocs({ skills, instructions, rules, projectPlan });
                send({ quality: qualityReport });

                // Send docs + frdText first (for chat/regenerate), then zip
                send({ docs: { skills, instructions, rules, projectPlan }, frdText: frdMarkdown });
                const zipBuffer = await buildZip({ skills, instructions, rules, projectPlan });
                send({ zip: Buffer.from(zipBuffer).toString("base64") });

            } catch (error: unknown) {
                const err = error as { status?: number; message?: string };
                console.error("API Generation Error:", error);
                send({ error: err?.status === 401 ? "Invalid OpenAI API Key. Check .env.local." : err?.message || "An unexpected error occurred." });
            } finally {
                clearInterval(heartbeatTimer);
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
