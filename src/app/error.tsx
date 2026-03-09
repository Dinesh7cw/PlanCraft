"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", padding: 24, background: "#080808", color: "#f8fafc" }}>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
        A new version may have been deployed. Try refreshing.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
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
  );
}
