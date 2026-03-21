export default function NotFound() {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `.not-found-btn:hover{box-shadow:0 6px 24px rgba(0,0,0,0.2)!important;transform:translateY(-1px)}` }} />
      </head>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: "#fafafa",
            color: "#1a1a1a",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {/* Decorative background dots */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              opacity: 0.03,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)",
              backgroundSize: "24px 24px",
              pointerEvents: "none",
            }}
          />

          {/* 404 large text */}
          <div style={{ position: "relative" }}>
            <h1
              style={{
                fontSize: "clamp(100px, 20vw, 200px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                background:
                  "linear-gradient(180deg, #1a1a1a 0%, rgba(26,26,26,0.15) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                userSelect: "none",
              }}
            >
              404
            </h1>
          </div>

          {/* Message */}
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                margin: "0 0 0.75rem",
                letterSpacing: "-0.01em",
              }}
            >
              Page Not Found
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(26,26,26,0.55)",
                lineHeight: 1.6,
                margin: "0 0 2rem",
              }}
            >
              The page you are looking for might have been moved, deleted, or
              never existed. Let&apos;s get you back on track.
            </p>

            {/* Go Home button */}
            <a
              href="/"
              className="not-found-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                height: "44px",
                padding: "0 1.75rem",
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#ffffff",
                background: "#1a1a1a",
                textDecoration: "none",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go Home
            </a>
          </div>

          {/* Bottom decorative line */}
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              width: "48px",
              height: "2px",
              borderRadius: "1px",
              background: "rgba(26,26,26,0.1)",
            }}
          />
        </div>
      </body>
    </html>
  );
}
