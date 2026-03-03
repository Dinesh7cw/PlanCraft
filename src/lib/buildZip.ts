import JSZip from "jszip";

export async function buildZip(docs: {
    skills: string;
    instructions: string;
    rules: string;
    projectPlan: string;
}): Promise<Buffer> {
    const zip = new JSZip();

    // Format JSON properly if the AI didn't
    let rulesContent = docs.rules;
    try {
        const parsed = JSON.parse(docs.rules);
        rulesContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
        // If it's not valid JSON, just use the raw string
    }

    // Clean Markdown output in case OpenAI wrapped it in code blocks
    const cleanMarkdown = (text: string) => {
        return text.replace(/^```markdown\n?/g, "").replace(/\n?```$/g, "").trim();
    };

    zip.file("skills.md", cleanMarkdown(docs.skills));
    zip.file("instructions.md", cleanMarkdown(docs.instructions));
    zip.file("rules.json", rulesContent);
    zip.file("project-plan.md", cleanMarkdown(docs.projectPlan));

    // Generate ZIP correctly for the API response
    const arrayBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return arrayBuffer;
}
