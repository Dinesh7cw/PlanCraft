"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#080808", color: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
            A new version may have been deployed. Try refreshing the page.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 20px", background: "#0583d8", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            >
              Refresh page
            </button>
            <button
              onClick={reset}
              style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
