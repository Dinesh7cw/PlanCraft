"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, ArrowDownToLine, Loader2, FileWarning, Send, Plus, Shield, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { validateDocs } from "@/lib/validateDocs";

type DocsState = {
  skills: string;
  instructions: string;
  rules: string;
  projectPlan: string;
};

type QualityReport = {
  score: number;
  passed: number;
  total: number;
  issues: { file: string; severity: "error" | "warning"; message: string }[];
  checks: { label: string; passed: boolean }[];
};

const FILE_NAMES = ["skills.md", "instructions.md", "rules.json", "project-plan.md"] as const;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocsState | null>(null);
  const [frdText, setFrdText] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [previewTab, setPreviewTab] = useState<(typeof FILE_NAMES)[number]>("skills.md");
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [qualityExpanded, setQualityExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".docx") && !selectedFile.name.endsWith(".txt") && !selectedFile.name.endsWith(".md")) {
      setError("Please upload a valid DOCX, TXT, or MD file.");
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
        setDocs(null);
        setFrdText(null);
        setChatHistory([]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setZipUrl(null);
        setDocs(null);
        setFrdText(null);
        setChatHistory([]);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setZipUrl(null);
    setDocs(null);
    setFrdText(null);
    setQualityReport(null);
    setChatHistory([]);
    setChatMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setZipUrl(null);
    setDocs(null);
    setFrdText(null);
    setQualityReport(null);
    setChatHistory([]);
    setProgressMessage("Uploading…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/generate", { method: "POST", body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Something went wrong.");
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
          const data = JSON.parse(line.slice(6)) as {
            error?: string;
            message?: string;
            docs?: DocsState;
            frdText?: string;
            zip?: string;
            quality?: QualityReport;
          };
          if (data.error) throw new Error(data.error);
          if (data.message) setProgressMessage(data.message);
          if (data.docs) setDocs(data.docs);
          if (data.frdText) setFrdText(data.frdText);
          if (data.quality) setQualityReport(data.quality);
          if (data.zip) {
            const binary = atob(data.zip);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: "application/zip" });
            setZipUrl(URL.createObjectURL(blob));
            setProgressMessage(null);
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

  const handleRegenerate = async (feedbackOverride?: string) => {
    const message = feedbackOverride ?? chatMessage.trim();
    if (!docs || !frdText || !message) return;
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frdText,
          skills: docs.skills,
          instructions: docs.instructions,
          rules: docs.rules,
          projectPlan: docs.projectPlan,
          userMessage: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed.");
      setDocs(data.docs);
      setQualityReport(validateDocs(data.docs));
      const binary = atob(data.zip);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      setZipUrl(URL.createObjectURL(new Blob([bytes], { type: "application/zip" })));
      setChatHistory((h) => [...h, { role: "user", text: message }, { role: "assistant", text: "Changes applied. Check preview and download when ready." }]);
      setChatMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!zipUrl) return;
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "FRD_Generated_Docs.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDocContent = (name: (typeof FILE_NAMES)[number]) => {
    if (!docs) return "";
    if (name === "skills.md") return docs.skills;
    if (name === "instructions.md") return docs.instructions;
    if (name === "rules.json") return docs.rules;
    if (name === "project-plan.md") return docs.projectPlan;
    return "";
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      {/* LEFT COLUMN */}
      <aside className="w-60 flex flex-col shrink-0 min-h-0 border-r border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="px-4 py-4 border-b border-[var(--app-border)]">
          <h1 className="font-bold text-lg" style={{ color: "var(--primary-color)" }}>PlanCraft</h1>
        </div>
        <div className="p-2">
          <button
            onClick={clearFile}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--app-text-muted)] hover:text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
        <div className="flex-1 min-h-0 px-3 pb-4 overflow-y-auto overflow-x-hidden space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl p-5 text-center cursor-pointer transition-colors border border-dashed ${
              isDragging
                ? "border-[var(--secondary-color)] bg-[var(--secondary-color)]/10"
                : "border-[var(--app-border)] hover:border-[var(--secondary-color)]/40 hover:bg-[var(--secondary-color)]/5"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 mx-auto mb-2 text-[var(--secondary-color)]" />
            <p className="text-sm font-medium text-[var(--app-text)]">Upload FRD</p>
            <p className="text-xs text-[var(--app-text-dim)] mt-0.5">DOCX, TXT, MD</p>
            {file && (
              <p className="text-xs mt-2 truncate px-2 py-1 rounded bg-[var(--secondary-color)]/15" style={{ color: "var(--secondary-color)" }} title={file.name}>
                {file.name}
              </p>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
              isLoading
                ? "border border-[var(--secondary-color)]/50 bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]"
                : "text-white"
            }`}
            style={!isLoading ? { backgroundColor: "var(--primary-color)" } : {}}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="truncate text-sm">{progressMessage || "Generating…"}</span>
              </>
            ) : (
              "Generate"
            )}
          </button>
          {zipUrl && (
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              <ArrowDownToLine className="w-4 h-4 shrink-0" />
              Download
            </button>
          )}
        </div>
      </aside>

      {/* CENTER COLUMN */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden border-r border-[var(--app-border)] bg-[var(--app-surface)]">
        {error && (
          <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ backgroundColor: "rgba(230, 47, 48, 0.08)", borderColor: "rgba(230, 47, 48, 0.3)" }}>
            <FileWarning className="w-4 h-4 shrink-0" style={{ color: "var(--primary-color)" }} />
            <p className="text-sm text-[var(--app-text)]">{error}</p>
          </div>
        )}
        {!docs && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--app-text-dim)]" />
              <p className="text-[var(--app-text-muted)] text-sm">Upload FRD and click Generate</p>
              <p className="text-xs mt-1 text-[var(--app-text-dim)]">Preview appears here</p>
            </div>
          </div>
        )}
        {docs && zipUrl && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {qualityReport && (
              <div className="shrink-0 border-b border-[var(--app-border)]">
                <div
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--app-bg)]/50 transition-colors"
                  onClick={() => setQualityExpanded(!qualityExpanded)}
                >
                  <Shield className="w-4 h-4 shrink-0 text-[var(--secondary-color)]" />
                  <span className="font-medium text-sm text-[var(--app-text)]">Quality</span>
                  <span className="font-mono text-sm" style={{ color: qualityReport.score >= 90 ? "var(--secondary-color)" : "var(--primary-color)" }}>
                    {qualityReport.score}/100
                  </span>
                  <span className="text-xs text-[var(--app-text-dim)]">({qualityReport.passed}/{qualityReport.total})</span>
                  {qualityExpanded ? <ChevronUp className="w-4 h-4 ml-auto text-[var(--app-text-dim)]" /> : <ChevronDown className="w-4 h-4 ml-auto text-[var(--app-text-dim)]" />}
                </div>
                {qualityReport.score < 90 && qualityReport.issues.length > 0 && (
                  <div className="px-4 pb-2 space-y-1">
                    {qualityReport.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="text-xs flex items-start gap-2 text-[var(--primary-color)]">
                        {issue.severity === "error" ? "✕" : "!"}
                        <span>{issue.file}: {issue.message}</span>
                      </div>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(qualityReport.issues.map((i) => `Fix ${i.file}: ${i.message}`).join(". "));
                      }}
                      disabled={isRegenerating}
                      className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      style={{ backgroundColor: "var(--secondary-color)" }}
                    >
                      <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
                      Fix
                    </button>
                  </div>
                )}
                {qualityExpanded && (
                  <div className="px-4 pb-2 pt-1 border-t border-[var(--app-border)] space-y-1 max-h-48 overflow-y-auto">
                    {qualityReport.checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {c.passed ? <span className="text-[var(--secondary-color)]">✓</span> : <span className="text-[var(--primary-color)]">✕</span>}
                        <span className={c.passed ? "text-[var(--app-text-dim)]" : "text-[var(--app-text)]"}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--app-border)] shrink-0">
              {FILE_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setPreviewTab(name);
                    setChatMessage((prev) => {
                      const mention = `@${name}`;
                      const withoutMentions = prev.replace(/\@(skills\.md|instructions\.md|rules\.json|project-plan\.md)\s*/gi, "").trim();
                      if (!withoutMentions) return mention + " ";
                      return mention + " " + withoutMentions;
                    });
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    previewTab === name
                      ? "text-white"
                      : "text-[var(--app-text-dim)] hover:text-[var(--app-text)] hover:bg-[var(--secondary-color)]/10"
                  }`}
                  style={previewTab === name ? { backgroundColor: "var(--secondary-color)" } : {}}
                >
                  {name}
                </button>
              ))}
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 select-text font-mono text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-mono), monospace", backgroundColor: "var(--app-bg)", color: "var(--app-text-muted)" }}
              onContextMenu={(e) => {
                e.preventDefault();
                const mention = `@${previewTab}`;
                setChatMessage((prev) => (prev.trim() ? `${prev} ${mention}` : mention));
              }}
            >
              <pre className="whitespace-pre-wrap">{getDocContent(previewTab)}</pre>
            </div>
          </div>
        )}
        {isLoading && !docs && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--secondary-color)]" />
          </div>
        )}
      </section>

      {/* RIGHT COLUMN - Chat */}
      <aside className="w-[340px] min-w-[300px] shrink-0 min-h-0 flex flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="px-4 py-3 shrink-0 border-b border-[var(--app-border)]">
          <h2 className="font-semibold text-[var(--app-text)] text-sm">Chat</h2>
          <p className="text-xs text-[var(--app-text-dim)] mt-0.5">Request changes to docs</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 overscroll-contain">
          {chatHistory.length === 0 && docs && (
            <p className="text-sm text-[var(--app-text-dim)] leading-relaxed">e.g. &quot;Add Redis to skills&quot;, &quot;Fix Phase 2&quot;</p>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[95%] px-3 py-2 rounded-lg text-sm ${
                  m.role === "user" ? "text-white" : "bg-[var(--app-surface-elevated)] text-[var(--app-text)]"
                }`}
                style={m.role === "user" ? { backgroundColor: "var(--secondary-color)" } : {}}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 shrink-0 border-t border-[var(--app-border)]">
          <div className="flex gap-2 min-w-0">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRegenerate()}
              placeholder="Type changes..."
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40 border bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-text)] placeholder-[var(--app-text-dim)]"
              disabled={isRegenerating || !docs}
            />
            <button
              onClick={handleRegenerate}
              disabled={!chatMessage.trim() || isRegenerating || !docs}
              className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Apply
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
