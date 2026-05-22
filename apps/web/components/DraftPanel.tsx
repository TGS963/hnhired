'use client';

import { useEffect, useState } from 'react';
import { useResume } from '@/lib/useResume';
import ResumeEditor from './ResumeEditor';

const STYLES = [
  { id: 'classic_cover_letter', label: 'Classic cover letter', hint: 'Formal, 3 paragraphs, mentions résumé attached' },
  { id: 'modern_cold_email', label: 'Modern cold email', hint: 'Punchy, ≤6 lines, value-first' },
  { id: 'casual_intro', label: 'Casual intro', hint: 'Friendly, conversational' },
  { id: 'show_dont_tell', label: "Show, don't tell", hint: 'Lead with one concrete project + numbers' },
  { id: 'referral_warm', label: 'Warm referral-style', hint: 'Relaxed, as if mutually introduced' },
  { id: 'haiku_hook', label: 'Haiku hook (fun)', hint: 'Opens with a 5-7-5 haiku, then 2 plain sentences' },
  { id: 'custom', label: 'Custom instructions', hint: 'Write your own style brief' },
] as const;

type StyleId = (typeof STYLES)[number]['id'];

const STYLE_KEY = 'hnhired:draft_style';

type DraftState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; subject: string; body: string; to?: string | null; apply_url?: string | null };

export default function DraftPanel({
  postRawId,
  applyEmail,
  applyUrl,
}: {
  postRawId: number;
  applyEmail?: string | null;
  applyUrl?: string | null;
}) {
  const { resume, hydrated } = useResume();
  const [style, setStyle] = useState<StyleId>('modern_cold_email');
  const [customInstructions, setCustomInstructions] = useState('');
  const [draft, setDraft] = useState<DraftState>({ status: 'idle' });
  const [copied, setCopied] = useState<'none' | 'all' | 'resume'>('none');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STYLE_KEY);
      if (saved && STYLES.some((s) => s.id === saved)) setStyle(saved as StyleId);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {}
  }, [style]);

  if (!hydrated) return null;

  const hasResume = resume.trim().length >= 100;
  const customValid = style !== 'custom' || customInstructions.trim().length > 0;
  const canDraft = hasResume && customValid && draft.status !== 'loading';

  async function generate() {
    setDraft({ status: 'loading' });
    setCopied('none');
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          post_raw_id: postRawId,
          consent: true,
          style,
          custom_instructions: style === 'custom' ? customInstructions : undefined,
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        if (res.status === 429) {
          const retry = res.headers.get('Retry-After');
          msg = retry
            ? `Rate limit hit, try again in ${retry}s`
            : 'Rate limit hit, try again shortly';
        } else {
          try {
            const body = await res.json();
            if (body?.error) msg = body.error;
          } catch {}
        }
        setDraft({ status: 'error', message: msg });
        return;
      }
      const data = await res.json();
      setDraft({
        status: 'done',
        subject: data.subject ?? '',
        body: data.body ?? '',
        to: data.to,
        apply_url: data.apply_url,
      });
    } catch (err) {
      setDraft({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  async function copyAll() {
    if (draft.status !== 'done') return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied('all');
      setTimeout(() => setCopied('none'), 1500);
    } catch {}
  }

  async function copyResume() {
    try {
      await navigator.clipboard.writeText(resume);
      setCopied('resume');
      setTimeout(() => setCopied('none'), 1500);
    } catch {}
  }

  return (
    <section className="space-y-4 rounded-md border border-neutral-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Draft outreach
        </h2>
        {hasResume && <span className="text-xs text-neutral-500">Résumé saved locally</span>}
      </div>

      {!hasResume ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Save your résumé below to draft a tailored email or cover letter. Stored only in your
            browser.
          </p>
          <ResumeEditor />
        </div>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-neutral-800">Style</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {STYLES.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
                    style === s.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="draft-style"
                    value={s.id}
                    checked={style === s.id}
                    onChange={() => setStyle(s.id)}
                    className="mt-1"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-neutral-900">{s.label}</span>
                    <span className="text-xs text-neutral-600">{s.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {style === 'custom' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-800" htmlFor="custom-instr">
                Custom instructions
              </label>
              <textarea
                id="custom-instr"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. write it as if i'm applying with a friend and we want to job-share"
                className="w-full rounded-md border border-neutral-300 bg-white p-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none"
              />
              <p className="text-xs text-neutral-500">
                The AI uses these instructions plus the job posting and your résumé as context.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={!canDraft}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {draft.status === 'loading' ? 'Drafting…' : 'Draft email'}
            </button>
            {draft.status === 'done' && (
              <button
                type="button"
                onClick={generate}
                disabled={!canDraft}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Regenerate
              </button>
            )}
          </div>

          {draft.status === 'error' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {draft.message}
            </div>
          )}

          {draft.status === 'done' && (
            <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <div className="flex flex-wrap gap-3 text-xs text-neutral-700">
                {draft.to && (
                  <a className="underline" href={`mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>
                    Open in mail app
                  </a>
                )}
                {draft.apply_url && (
                  <a className="underline" href={draft.apply_url} target="_blank" rel="noreferrer">
                    Open apply link
                  </a>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Subject
                </div>
                <p className="text-neutral-900">{draft.subject}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Body
                </div>
                <textarea
                  readOnly
                  value={draft.body}
                  rows={Math.min(20, Math.max(8, draft.body.split('\n').length + 2))}
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white p-2 font-mono text-xs text-neutral-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyAll}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                >
                  {copied === 'all' ? 'Copied' : 'Copy subject + body'}
                </button>
                <button
                  type="button"
                  onClick={copyResume}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                >
                  {copied === 'resume' ? 'Copied' : 'Copy résumé text'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
