/** Match reviewed source domains without accepting lookalike hostnames. */
export function captureSourceForUrl(value: string, sources: Array<{ source: string; domains: string[] }>): string | undefined {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase();
    return sources.find(row => row.domains.some(domain => {
      const normalized = domain.toLowerCase();
      return normalized.startsWith('*.')
        ? host === normalized.slice(2) || host.endsWith(`.${normalized.slice(2)}`)
        : host === normalized;
    }))?.source;
  } catch { return undefined; }
}

/** CSV quoting alone does not prevent spreadsheet formula interpretation. */
export function csvCell(value: string): string {
  const text = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

export function companionIsOnline(companion: { status: string; lastSeenAt: string | null; expiresAt: string }, now: number): boolean {
  return companion.status === 'ACTIVE' && Date.parse(companion.expiresAt) > now
    && companion.lastSeenAt !== null && now - Date.parse(companion.lastSeenAt) < 90_000;
}
