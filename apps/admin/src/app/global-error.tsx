"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ backgroundColor: "#0F0F1A", color: "#FFFFFF", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#B0B0CC", fontSize: 14, marginBottom: 16 }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            style={{ backgroundColor: "#6C5CE7", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
