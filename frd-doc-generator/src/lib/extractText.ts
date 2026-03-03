if (typeof global !== 'undefined') {
    if (typeof (global as any).DOMMatrix === 'undefined') (global as any).DOMMatrix = class DOMMatrix { };
    if (typeof (global as any).ImageData === 'undefined') (global as any).ImageData = class ImageData { };
    if (typeof (global as any).Path2D === 'undefined') (global as any).Path2D = class Path2D { };
}
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import mammoth from "mammoth";

const MIN_READABLE_LENGTH = 50;

/** Extract text using pdf2json (different parser; can succeed when pdf-parse gets nothing). */
function extractFromPDFWithPdf2Json(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const pdf2json = require("pdf2json");
            const PDFParser = pdf2json.default ?? pdf2json.PDFParser ?? pdf2json;
            const pdfParser = new PDFParser(undefined, 1);
            pdfParser.on("pdfParser_dataError", (errData: { parserError: unknown }) => {
                reject(new Error(String(errData?.parserError ?? "pdf2json parse error")));
            });
            pdfParser.on("pdfParser_dataReady", () => {
                try {
                    const text = pdfParser.getRawTextContent?.() ?? "";
                    resolve(typeof text === "string" ? text : "");
                } catch (e) {
                    reject(e);
                }
            });
            pdfParser.parseBuffer(buffer, 0);
        } catch (e) {
            reject(e);
        }
    });
}

export async function extractFromPDF(buffer: Buffer): Promise<string> {
    let text = "";
    try {
        console.log("PDF extraction started. Buffer size:", buffer.length);
        try { require('fs').writeFileSync('temp_debug_upload.pdf', buffer); } catch (e) { }
        const data = await pdfParse(buffer);
        text = data.text ?? "";
        console.log("PDF parsed successfully. Pages:", data.numpages, "Text length:", text.length);
        if (text.length < MIN_READABLE_LENGTH) {
            console.log("PDF parsed text is very short, trying pdf2json fallback...");
        }
    } catch (error) {
        console.error("PDF (pdf-parse) Extraction Error:", error);
    }

    if (!text || text.trim().length < MIN_READABLE_LENGTH) {
        try {
            const fallbackText = await extractFromPDFWithPdf2Json(buffer);
            if (fallbackText?.trim().length > (text?.trim().length ?? 0)) {
                console.log("pdf2json fallback got more text:", fallbackText.trim().length, "chars");
                return fallbackText;
            }
        } catch (fallbackError) {
            console.error("PDF (pdf2json) fallback error:", fallbackError);
        }
    }

    return text;
}

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

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        return extractFromPDF(buffer);
    } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
    ) {
        return extractFromDOCX(buffer);
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        return buffer.toString("utf-8");
    } else if (file.type === "text/markdown" || file.name.endsWith(".md")) {
        return buffer.toString("utf-8");
    }

    throw new Error("Unsupported file format. Use PDF, DOCX, TXT, or MD.");
}
