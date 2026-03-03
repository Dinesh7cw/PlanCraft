import mammoth from "mammoth";

export async function extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error("DOCX Extraction Error:", error);
        throw new Error("Failed to extract text from DOCX file.");
    }
}

export async function extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
    ) {
        return extractFromDOCX(buffer);
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        return buffer.toString("utf-8");
    } else if (file.type === "text/markdown" || file.name.endsWith(".md")) {
        return buffer.toString("utf-8");
    }

    throw new Error("Unsupported file format. Please upload a DOCX, TXT, or MD file.");
}
