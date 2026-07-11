// Tiny analytics ingest endpoint.
//
// The frontend `track()` helper posts page-level events here. The
// backend can later persist these; for now we accept and discard so the
// request doesn't 404 in the network tab. Authentication is optional —
// events are anonymous aggregates by design (the request is
// `keepalive` and may arrive after a navigation). We log to the server
// console in dev only to keep production logs clean.

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", body?.name, body?.properties);
    }
  } catch {
    /* ignore malformed payloads */
  }
  return NextResponse.json({ ok: true });
}