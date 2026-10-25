/** Accept only local paths, including after browser URL normalization. */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512 || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (/[\\\u0000-\u0020\u007f]/.test(raw)) return null;
  try {
    const base = "https://profileai.invalid";
    const target = new URL(raw, base);
    if (target.origin !== base) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function twoFactorLoginPath(email: string, redirect: string | null | undefined): string {
  const params = new URLSearchParams({ email });
  const destination = safeRedirectPath(redirect);
  if (destination) params.set("redirect", destination);
  return `/login/2fa?${params.toString()}`;
}
