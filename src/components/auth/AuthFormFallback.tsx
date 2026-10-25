type AuthFormFallbackProps = {
  title: string;
  description: string;
};

/** Meaningful server-rendered fallback while search-parameter forms hydrate. */
export function AuthFormFallback({ title, description }: AuthFormFallbackProps) {
  return (
    <div className="ax-form-panel" aria-busy="true">
      <div className="ax-brand-row" aria-hidden="true">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 30, height: 30, background: "rgb(36 23 51 / 12%)" }} />
          <span style={{ width: 84, height: 14, background: "rgb(36 23 51 / 12%)" }} />
        </span>
      </div>
      <div style={{ fontSize: 42, fontFamily: "var(--ax-display, Georgia, serif)", lineHeight: 1.05 }} aria-hidden="true">
        {title}
      </div>
      <p style={{ marginTop: 10, fontSize: 13.5, color: "var(--ax-ink-soft, #6d5f76)" }}>{description}</p>
      <div style={{ marginTop: 28, display: "grid", gap: 18 }} aria-hidden="true">
        <span style={{ display: "block", height: 48, borderBottom: "1px solid rgb(36 23 51 / 30%)" }} />
        <span style={{ display: "block", height: 48, borderBottom: "1px solid rgb(36 23 51 / 30%)" }} />
        <span style={{ display: "block", height: 52, background: "rgb(36 23 51 / 12%)" }} />
      </div>
      <span className="sr-only">Loading form…</span>
    </div>
  );
}
