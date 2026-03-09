import { NextResponse } from "next/server";
import { regenerateDocs } from "@/lib/generateDocs";
import { buildZip } from "@/lib/buildZip";

export const maxDuration = 120;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { frdText, skills, instructions, rules, projectPlan, userMessage } = body;

        if (!frdText || !skills || !instructions || !rules || !projectPlan || !userMessage) {
            return NextResponse.json(
                { error: "Missing: frdText, skills, instructions, rules, projectPlan, userMessage" },
                { status: 400 }
            );
        }

        const currentDocs = { skills, instructions, rules, projectPlan };
        const updated = await regenerateDocs(frdText, currentDocs, userMessage);
        const zipBuffer = await buildZip(updated);

        return NextResponse.json({
            docs: updated,
            zip: Buffer.from(zipBuffer).toString("base64"),
        });
    } catch (error: unknown) {
        console.error("Regenerate API Error:", error);
        const msg = (error as Error)?.message ?? "Regeneration failed.";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
