'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'mintushah94@gmail.com';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

const projectTypes = ['New residence', 'Renovation', 'Interior', 'Landscape', 'Other'];

type Fields = {
  name: string;
  email: string;
  phone: string;
  project: string;
  message: string;
  captcha: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

type Status =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'success' }
  | { state: 'error'; message: string };

const emptyFields: Fields = {
  name: '',
  email: '',
  phone: '',
  project: '',
  message: '',
  captcha: '',
};

type Enquiry = {
  to_email: string;
  reply_to: string;
  user_name: string;
  user_email: string;
  phone: string;
  project_type: string;
  message: string;
  time: string;
};

// Free, key-less email delivery for static sites. The destination mailbox has
// to click FormSubmit's one-time activation link before messages are forwarded.
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`;

const sendViaFormSubmit = async (enquiry: Enquiry) => {
  const response = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `Villa enquiry — ${enquiry.project_type}`,
      _template: 'table',
      _captcha: 'false',
      name: enquiry.user_name,
      email: enquiry.user_email,
      phone: enquiry.phone,
      project: enquiry.project_type,
      message: enquiry.message,
      time: enquiry.time,
    }),
  });

  const result = (await response.json().catch(() => null)) as
    | { success?: string | boolean; message?: string }
    | null;

  // FormSubmit replies 200 even for failures; success is the string "true".
  if (!response.ok || String(result?.success) !== 'true') {
    throw new Error(result?.message || 'The form service rejected the enquiry.');
  }
};

// Mirrors the enquiry into the studio's Google Sheet through a server route.
// The email is the record of truth, so a sheet failure never blocks a send.
const logToSheet = async (enquiry: Enquiry) => {
  try {
    await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: enquiry.user_name,
        email: enquiry.user_email,
        phone: enquiry.phone,
        project: enquiry.project_type,
        message: enquiry.message,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Deliberately ignored; the enquiry has already been emailed.
  }
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^[+\d][\d\s().-]{6,}$/;

const validate = (fields: Fields, captchaAnswer: number): Errors => {
  const errors: Errors = {};

  if (fields.name.trim().length < 2) {
    errors.name = 'Please enter your name.';
  }

  if (!emailPattern.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (fields.phone.trim() && !phonePattern.test(fields.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!fields.project) {
    errors.project = 'Please select a project type.';
  }

  if (fields.message.trim().length < 20) {
    errors.message = 'Please tell us a little more (at least 20 characters).';
  }

  if (Number(fields.captcha) !== captchaAnswer) {
    errors.captcha = 'That answer is not correct. Please try again.';
  }

  return errors;
};

const createCaptcha = () => ({
  a: Math.floor(Math.random() * 8) + 2,
  b: Math.floor(Math.random() * 8) + 2,
});

const inputClasses =
  'w-full border-b border-line bg-transparent px-0 py-3 text-sm font-light text-ink/90 outline-none transition-colors placeholder:text-ink/25 focus:border-ink/50';

const captchaClasses =
  'h-[46px] w-20 shrink-0 rounded-lg border border-line bg-ink/[0.04] px-0 text-center text-sm font-light text-ink/90 outline-none transition-colors focus:border-ink/40';

const labelClasses = 'text-[9px] uppercase tracking-[0.3em] text-ink/45';

const errorClasses = 'mt-2 text-[11px] font-light text-danger';

export default function ContactSection() {
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  // Deterministic first render keeps the prerender stable; the real question
  // is generated once the component reaches the browser.
  const [captcha, setCaptcha] = useState({ a: 3, b: 4 });
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Deferred so the random question is never part of the server render or
    // the first client render (which would mismatch and break prerendering).
    const timer = window.setTimeout(() => setCaptcha(createCaptcha()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const captchaAnswer = captcha.a + captcha.b;

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name as keyof Fields]) return current;
      const next = { ...current };
      delete next[name as keyof Fields];
      return next;
    });
    if (status.state === 'error' || status.state === 'success') {
      setStatus({ state: 'idle' });
    }
  };

  const refreshCaptcha = () => {
    setCaptcha(createCaptcha());
    setFields((current) => ({ ...current, captcha: '' }));
    setErrors((current) => {
      if (!current.captcha) return current;
      const next = { ...current };
      delete next.captcha;
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.state === 'sending') return;

    // Honeypot: real visitors never see or fill this field.
    if (honeypotRef.current?.value) {
      setStatus({ state: 'success' });
      return;
    }

    const nextErrors = validate(fields, captchaAnswer);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ state: 'error', message: 'Please check the highlighted fields.' });
      const fieldOrder: (keyof Fields)[] = ['name', 'email', 'phone', 'project', 'message', 'captcha'];
      const firstInvalid = fieldOrder.find((field) => nextErrors[field]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    setStatus({ state: 'sending' });

    const templateParams: Enquiry = {
      to_email: CONTACT_EMAIL,
      reply_to: fields.email.trim(),
      user_name: fields.name.trim(),
      user_email: fields.email.trim(),
      phone: fields.phone.trim() || '—',
      project_type: fields.project,
      message: fields.message.trim(),
      time: new Date().toLocaleString('en-GB', { timeZone: 'Europe/Rome' }),
    };

    try {
      if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY) {
        const emailjs = (await import('@emailjs/browser')).default;
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
          publicKey: PUBLIC_KEY,
        });
      } else {
        await sendViaFormSubmit(templateParams);
      }
      await logToSheet(templateParams);
      setFields(emptyFields);
      setCaptcha(createCaptcha());
      setStatus({ state: 'success' });
    } catch (error) {
      const activationNeeded = error instanceof Error && /activat/i.test(error.message);
      setStatus({
        state: 'error',
        message: activationNeeded
          ? `One-time setup needed: open the activation email sent to ${CONTACT_EMAIL}, click “Activate Form”, then send your message again.`
          : `We could not deliver the enquiry just now. Please email ${CONTACT_EMAIL} directly.`,
      });
    }
  };

  return (
    <section
      id="contact"
      className="ambient-glow relative border-t border-line bg-base px-5 py-28 sm:px-8 md:px-16 md:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.24em] text-ink/35">04</span>
          <span className="h-px w-8 bg-ink/25" />
          <span className="text-[10px] font-light uppercase tracking-[0.34em] text-ink/45">
            Contact
          </span>
        </div>
        <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.5rem,6vw,5.25rem)] font-light leading-[0.95] tracking-[-0.015em] text-ink">
          Begin a <span className="italic text-ink/55">conversation.</span>
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div>
            <p className="max-w-sm text-sm font-light leading-relaxed text-ink/55">
              Tell us about the house you have in mind — the site, the light, the way you
              want to live in it. We reply to every enquiry within two working days.
            </p>

            <dl className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-1">
              <div>
                <dt className={labelClasses}>Enquiries</dt>
                <dd className="mt-3">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="break-all font-display text-xl font-normal tracking-[0.01em] text-ink/80 transition-colors hover:text-ink md:text-2xl"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={labelClasses}>Studio</dt>
                <dd className="mt-3 text-sm font-light leading-relaxed text-ink/60">
                  Via della Quiete 12
                  <br />
                  Milano, Italia
                </dd>
              </div>
              <div>
                <dt className={labelClasses}>Hours</dt>
                <dd className="mt-3 text-sm font-light leading-relaxed text-ink/60">
                  Monday — Friday
                  <br />
                  09:00 — 18:00 CET
                </dd>
              </div>
            </dl>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit}
            aria-label="Contact form"
            data-animate="depth"
            className="contact-card relative rounded-3xl border border-line bg-ink/[0.035] p-6 backdrop-blur-2xl md:p-9"
          >
            <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-ink/40">
                Project enquiry
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-ink/30">
                01 / 01
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="name" className={labelClasses}>
                  Name <span className="text-ink/30">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={fields.name}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`${inputClasses} mt-3`}
                />
                {errors.name && (
                  <p id="name-error" className={errorClasses}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="email" className={labelClasses}>
                  Email <span className="text-ink/30">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`${inputClasses} mt-3`}
                />
                {errors.email && (
                  <p id="email-error" className={errorClasses}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="phone" className={labelClasses}>
                  Phone <span className="text-ink/30">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+39 000 000 0000"
                  value={fields.phone}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={`${inputClasses} mt-3`}
                />
                {errors.phone && (
                  <p id="phone-error" className={errorClasses}>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="project" className={labelClasses}>
                  Project <span className="text-ink/30">*</span>
                </label>
                <div className="relative mt-3">
                  <select
                    id="project"
                    name="project"
                    value={fields.project}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.project)}
                    aria-describedby={errors.project ? 'project-error' : undefined}
                    className={`${inputClasses} mt-0 appearance-none pr-8 ${
                      fields.project ? 'text-ink/90' : 'text-ink/30'
                    }`}
                  >
                    <option value="" disabled className="bg-surface text-ink/50">
                      Select a project type
                    </option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type} className="bg-surface text-ink">
                        {type}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                    className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-ink/40"
                  >
                    <path
                      d="M2 4.5 6 8.5 10 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {errors.project && (
                  <p id="project-error" className={errorClasses}>
                    {errors.project}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className={labelClasses}>
                  Message <span className="text-ink/30">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="The site, the light, the rooms you imagine…"
                  value={fields.message}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  className={`${inputClasses} mt-3 resize-none`}
                />
                {errors.message && (
                  <p id="message-error" className={errorClasses}>
                    {errors.message}
                  </p>
                )}
              </div>
            </div>

            {/* Honeypot — hidden from people, tempting to bots. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="company-website">Company website</label>
              <input
                ref={honeypotRef}
                id="company-website"
                name="company-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="mt-8 flex flex-col gap-6 border-t border-line pt-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <label htmlFor="captcha" className={labelClasses}>
                  Verification <span className="text-ink/30">*</span>
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-3">
                  <span className="rounded-lg border border-line bg-ink/[0.04] px-3.5 py-3 text-sm font-light tracking-[0.12em] text-ink/70">
                    {captcha.a} + {captcha.b} =
                  </span>
                  <input
                    id="captcha"
                    name="captcha"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="?"
                    value={fields.captcha}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.captcha)}
                    aria-describedby={errors.captcha ? 'captcha-error' : undefined}
                    className={`${captchaClasses} mt-0`}
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-[9px] uppercase tracking-[0.24em] text-ink/40 transition-colors hover:text-ink/75"
                  >
                    New question
                  </button>
                </div>
                {errors.captcha && (
                  <p id="captcha-error" className={errorClasses}>
                    {errors.captcha}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status.state === 'sending'}
                className="group inline-flex w-full shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-ink px-7 py-3.5 text-[10px] uppercase tracking-[0.24em] text-base transition-all duration-300 hover:gap-4 hover:bg-ink/85 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
              >
                {status.state === 'sending' ? 'Sending…' : 'Send enquiry'}
                <span className="h-px w-5 bg-current opacity-40 transition-all duration-300 group-hover:w-8" />
              </button>
            </div>

            <div aria-live="polite" className="min-h-[1.5rem]">
              {status.state === 'success' && (
                <p className="mt-5 text-[11px] font-light leading-relaxed text-success">
                  Thank you — your enquiry has been sent. We will be in touch shortly.
                </p>
              )}
              {status.state === 'error' && (
                <p className="mt-5 text-[11px] font-light leading-relaxed text-danger">
                  {status.message}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mt-24 flex items-end justify-between border-t border-line pt-8">
          <span className="font-display text-2xl font-normal tracking-[0.18em] text-ink/45">
            VILLA
          </span>
          <span className="text-[10px] font-light tracking-[0.2em] text-ink/30">© 2026</span>
        </div>
      </div>
    </section>
  );
}
