"use client";

/**
 * Root layout'un kendisi patlarsa devreye girer. Kendi <html>/<body>'sini
 * render etmek zorunda — bu noktada layout hiç çalışmadığı için global
 * stiller de yüklenmemiş olabilir, o yüzden stiller satır içi.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0b0b0f",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.25rem",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
          Beklenmeyen bir hata oluştu
        </h1>
        <p style={{ color: "#9a98a5", maxWidth: "28rem", margin: 0, lineHeight: 1.6 }}>
          Uygulama yüklenemedi. Sayfayı yenilemeyi dene.
        </p>
        {error.digest && (
          <p style={{ color: "#6b6a75", fontFamily: "monospace", fontSize: "0.75rem", margin: 0 }}>
            digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={retry}
          style={{
            marginTop: "0.5rem",
            border: "none",
            borderRadius: "999px",
            background: "#4f46e5",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
