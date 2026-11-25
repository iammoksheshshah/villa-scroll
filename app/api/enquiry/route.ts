import { NextResponse } from 'next/server';

/**
 * Appends an enquiry to a Google Sheet. The sheet is reached through a Google
 * Apps Script web app (see README) so there are no OAuth/service-account keys
 * in the project — just GOOGLE_SHEETS_WEBHOOK_URL in .env.local.
 */

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const SHARED_SECRET = process.env.GOOGLE_SHEETS_SECRET;

type EnquiryBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  project?: unknown;
  message?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const asText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export async function POST(request: Request) {
  // Sheet logging is optional: without the webhook the form still emails.
  if (!WEBHOOK_URL) {
    return NextResponse.json({ ok: false, reason: 'not-configured' }, { status: 503 });
  }

  let body: EnquiryBody;
  try {
    body = (await request.json()) as EnquiryBody;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid-json' }, { status: 400 });
  }

  const name = asText(body.name, 120);
  const email = asText(body.email, 200);
  const message = asText(body.message, 4000);

  if (!name || !emailPattern.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, reason: 'invalid-fields' }, { status: 400 });
  }

  const row = {
    submittedAt: new Date().toISOString(),
    name,
    email,
    phone: asText(body.phone, 40) || '—',
    project: asText(body.project, 60) || '—',
    message,
    secret: SHARED_SECRET ?? '',
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      // Apps Script reads e.postData.contents, so plain text is enough and
      // avoids a JSON preflight when the endpoint is hit directly.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row),
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, reason: 'sheet-rejected' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: 'sheet-unreachable' }, { status: 502 });
  }
}
