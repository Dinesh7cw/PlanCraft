import OpenAI from "openai";
import https from "https";

// keepAlive agent + long socket timeout so the TCP connection to OpenAI
// doesn't get dropped by Node.js after ~60s idle
const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
    timeout: 15 * 60 * 1000,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 10 * 60 * 1000,
    maxRetries: 2,
    httpAgent: httpsAgent,
});

const FRD_ONLY_RULE = `CRITICAL: Your output must be derived ONLY from the provided FRD content below. Do NOT add generic skills, technologies, steps, or phases not in the FRD. If the FRD mentions project name, features, tech stack, or timeline, use those exactly. Output ONLY the document content, no markdown code fence.`;

/**
 * Use OpenAI streaming so tokens flow continuously — prevents network-level
 * idle-timeout (~60s) which kills non-streaming requests.
 */
async function streamedCreate(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    jsonMode = false
): Promise<string> {
    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages,
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    let result = "";
    for await (const chunk of stream) {
        result += chunk.choices[0]?.delta?.content ?? "";
    }
    return result;
}

export async function generateSkills(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `You are an expert technical architect. Generate a 'skills.md' listing ONLY the technical skills, proficiency levels, and tech stack mentioned or clearly required by the FRD. ${FRD_ONLY_RULE} Format as clean markdown.`,
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}

export async function generateInstructions(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `You are an expert lead developer. Generate an 'instructions.md' with setup, folder structure, and development steps directly based on the FRD. Reference the actual project name, modules, and requirements. ${FRD_ONLY_RULE} Format as clean markdown.`,
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}

export async function generateRules(frdText: string): Promise<string> {
    return streamedCreate(
        [
            {
                role: "system",
                content: `You are an expert senior engineer. Generate a 'rules.json' with coding conventions, style, security, and git rules stated or implied in the FRD. ${FRD_ONLY_RULE} Output valid JSON only.`,
            },
            { role: "user", content: `FRD Content:\n\n${frdText}` },
        ],
        true
    );
}

export async function generateProjectPlan(frdText: string): Promise<string> {
    return streamedCreate([
        {
            role: "system",
            content: `You are an expert project manager. Generate a 'project-plan.md' with phases and tasks from the FRD. Use the project name, feature list, and timeline/milestones in the FRD. No placeholder dates. ${FRD_ONLY_RULE} Format as clean markdown.`,
        },
        { role: "user", content: `FRD Content:\n\n${frdText}` },
    ]);
}
