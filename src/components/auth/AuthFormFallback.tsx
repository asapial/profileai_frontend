type AuthFormFallbackProps = {
  title: string;
  description: string;
};

/** Meaningful server-rendered fallback while search-parameter forms hydrate. */
export function AuthFormFallback({ title, description }: AuthFormFallbackProps) {
  return (
    <div className="auth-surface" aria-busy="true">
      <div className="auth-form-panel relative rounded-2xl border border-border/60 bg-card p-6 sm:p-9">
        <div className="mb-6 flex items-center gap-2" aria-hidden="true">
          <span className="h-9 w-9 animate-pulse rounded-xl bg-primary/20" />
          <span className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="text-2xl font-bold tracking-tight sm:text-3xl" aria-hidden="true">{title}</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-7 space-y-4" aria-hidden="true">
          <span className="block h-11 animate-pulse rounded-xl bg-muted" />
          <span className="block h-11 animate-pulse rounded-xl bg-muted" />
          <span className="block h-11 animate-pulse rounded-xl bg-primary/20" />
        </div>
        <span className="sr-only">Loading form…</span>
      </div>
    </div>
  );
}
