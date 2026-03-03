const fs = require('fs');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

global.DOMMatrix = class DOMMatrix { };
global.ImageData = class ImageData { };
global.Path2D = class Path2D { };

async function run() {
    try {
        console.log("Reading test PDF...");
        const buffer = fs.readFileSync('temp_debug_upload.pdf');
        console.log("Buffer size:", buffer.length);

        console.log("Parsing PDF...");
        const data = await pdfParse(buffer);
        console.log("Success! Pages:", data.numpages);
        console.log("Text length:", data.text?.length);
        if (data.text?.length < 50) {
            console.log("Extracted Text:", JSON.stringify(data.text));
        } else {
            console.log("Extracted Text snippet:", JSON.stringify(data.text.slice(0, 100)));
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
