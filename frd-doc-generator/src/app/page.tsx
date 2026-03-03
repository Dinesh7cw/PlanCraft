"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, XCircle, FileArchive, ArrowDownToLine, Loader2, FileWarning } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (selectedFile: File) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.txt') && !selectedFile.name.endsWith('.md')) {
      setError("Please upload a valid PDF, DOCX, TXT, or MD file.");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setZipUrl(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setZipUrl(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setZipUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setZipUrl(null);
    setProgressMessage("Uploading…");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let msg = "Something went wrong.";
        try {
          const errData = await response.json();
          if (errData.error) msg = errData.error;
        } catch (e) { }
        throw new Error(msg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let buffer = "";
      let gotZip = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6)) as { error?: string; progress?: number; message?: string; zip?: string };
          if (data.error) throw new Error(data.error);
          if (data.message) setProgressMessage(data.message);
          if (data.zip) {
            const binary = atob(data.zip);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: "application/zip" });
            const url = URL.createObjectURL(blob);
            setZipUrl(url);
            setProgressMessage(null);
            const a = document.createElement("a");
            a.href = url;
            a.download = "FRD_Generated_Docs.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            gotZip = true;
            break;
          }
        }
        if (gotZip) break;
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setProgressMessage(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--cream-color)] to-[var(--lightgrey-color)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[var(--light-color)] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-[var(--lightgrey-color)]/30">

        {/* Header */}
        <div className="bg-[var(--primary-color)] p-8 text-center text-[var(--light-color)]">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">FRD Doc Generator</h1>
          <p className="text-[var(--cream-color)] font-medium text-lg opacity-90">Upload your FRD (PDF/DOCX) and let AI generate your project docs.</p>
        </div>

        {/* Content Body */}
        <div className="p-8">

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-[var(--primary-color)] p-4 rounded-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <FileWarning className="text-[var(--primary-color)] w-6 h-6 shrink-0 mt-0.5" />
              <div className="text-[var(--primary-dark-color)] font-medium text-sm">
                Error: {error}
              </div>
            </div>
          )}

          {/* Download Ready State */}
          {zipUrl && !isLoading && (
            <div className="mb-8 p-8 border-2 border-dashed border-[var(--secondary-color)] rounded-2xl bg-blue-50/50 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-[var(--secondary-color)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileArchive className="w-10 h-10 text-[var(--secondary-color)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--dark-color)] mb-2">Documents Generated!</h3>
              <p className="text-[var(--dark-color)]/70 mb-6">Your ZIP file is ready for download.</p>
              <div className="flex justify-center gap-4">
                <a
                  href={zipUrl}
                  download="FRD_Generated_Docs.zip"
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--secondary-color)] hover:bg-[var(--secondary-dark-color)] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  Download Again
                </a>
                <button
                  onClick={clearFile}
                  className="px-6 py-3 border border-[var(--lightgrey-color)] text-[var(--dark-color)] font-medium rounded-xl hover:bg-[var(--cream-color)] transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Upload & Generate Flow */}
          {!zipUrl && (
            <div className="space-y-6">
              {!file ? (
                /* Drop Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-4 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out group
                    ${isDragging ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5 scale-[1.02]' : 'border-[var(--lightgrey-color)] hover:border-[var(--secondary-color)] hover:bg-slate-50'}
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    className="hidden"
                  />
                  <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <UploadCloud className={`w-12 h-12 ${isDragging ? 'text-[var(--primary-color)]' : 'text-slate-400 group-hover:text-[var(--secondary-color)]'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--dark-color)] mb-2 group-hover:text-[var(--secondary-color)] transition-colors">Drag & drop your FRD</h3>
                  <p className="text-[var(--dark-color)]/60">or click to browse files</p>
                  <div className="mt-6 flex items-center justify-center gap-3 text-xs font-semibold text-[var(--dark-color)]/50 uppercase tracking-wider">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">PDF</span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">DOCX</span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">TXT</span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">MD</span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">Max 10MB</span>
                  </div>
                </div>
              ) : (
                /* File Selected Preview */
                <div className="p-6 rounded-2xl border-2 border-[var(--secondary-color)]/30 bg-[var(--secondary-color)]/5 flex items-center justify-between group animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-[var(--secondary-color)]/20">
                      <FileText className="w-8 h-8 text-[var(--secondary-color)]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[var(--dark-color)] truncate">{file.name}</p>
                      <p className="text-sm font-medium text-[var(--dark-color)]/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 text-slate-400 hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-full transition-colors flex-shrink-0"
                    title="Remove file"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!file || isLoading}
                className={`
                  w-full py-4 px-6 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all duration-300 
                  ${(!file || isLoading)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[var(--primary-color)] hover:bg-[var(--primary-dark-color)] text-white shadow-[0_10px_20px_-10px_var(--primary-dark-color)] hover:shadow-[0_15px_25px_-10px_var(--primary-dark-color)] hover:-translate-y-1'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {progressMessage || "Generating docs…"}
                  </>
                ) : (
                  <>Generate Docs</>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
