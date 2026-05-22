'use client';

import { useEffect, useState } from 'react';
import { useResume } from '@/lib/useResume';
import ResumeEditor from './ResumeEditor';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

const BTN_BASE =
  'inline-flex items-center gap-1.5 px-[14px] py-[7px] border border-border-c rounded-[7px] text-[13px] font-medium text-fg bg-surface cursor-pointer hover:bg-hover hover:border-border-strong active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const BTN_PRIMARY =
  'inline-flex items-center gap-1.5 px-[14px] py-[7px] border border-brand rounded-[7px] text-[13px] font-medium text-brand-contrast bg-brand cursor-pointer hover:bg-brand-hover hover:border-brand-hover active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const TEXTAREA_CLS =
  'w-full bg-surface border border-border-c rounded-xl px-4 py-3.5 font-mono text-[12.5px] leading-[1.6] text-fg outline-none resize-y transition-colors focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)] placeholder:text-fg-faint';
const SUMMARY_TAG_CLS =
  'inline-flex items-center gap-[5px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-brand mb-1.5';

export default function DraftPanel({
  postRawId,
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
  if (!hasResume) return null;

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
    <section className="mt-8 p-5 bg-bg-2 border border-border-c rounded-xl">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div className={`${SUMMARY_TAG_CLS} mb-0`}>
          ◇ Draft outreach
        </div>
        {hasResume && <span className="text-fg-muted text-xs">Résumé saved locally</span>}
      </div>
      <div className="space-y-4">
        {!hasResume ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Save your résumé below to draft a tailored email or cover letter. Stored only in
              your browser.
            </p>
            <ResumeEditor />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Style</Label>
              <RadioGroup
                value={style}
                onValueChange={(v) => setStyle(v as StyleId)}
                className="grid grid-cols-1 gap-2 md:grid-cols-2"
              >
                {STYLES.map((s) => (
                  <Label
                    key={s.id}
                    htmlFor={`style-${s.id}`}
                    className={`flex cursor-pointer items-start gap-2 rounded-md p-3 text-sm border ${style === s.id ? 'border-brand bg-brand-soft' : 'border-border-c bg-surface hover:bg-hover'}`}
                  >
                    <RadioGroupItem value={s.id} id={`style-${s.id}`} className="mt-1" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.hint}</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {style === 'custom' && (
              <div className="space-y-1">
                <Label htmlFor="custom-instr">Custom instructions</Label>
                <textarea
                  id="custom-instr"
                  className={TEXTAREA_CLS}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  placeholder="e.g. write it as if i'm applying with a friend and we want to job-share"
                />
                <p className="text-fg-muted text-xs">
                  The AI uses these instructions plus the job posting and your résumé as context.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={generate}
                disabled={!canDraft}
              >
                {draft.status === 'loading' ? 'Drafting…' : 'Draft email'}
              </button>
              {draft.status === 'done' && (
                <button type="button" className={BTN_BASE} onClick={generate} disabled={!canDraft}>
                  Regenerate
                </button>
              )}
            </div>

            {draft.status === 'error' && (
              <div className="relative bg-bg-2 border-l-2 border-destructive my-0 mb-6 px-5 py-4 rounded-r-lg">
                <span className="inline-flex items-center gap-[5px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-destructive mb-1.5">
                  Error
                </span>
                <p>{draft.message}</p>
              </div>
            )}

            {draft.status === 'done' && (
              <div className="space-y-3 text-sm bg-surface border border-border-c rounded-xl p-4">
                <div className="flex flex-wrap gap-3 text-xs">
                  {draft.to && (
                    <a
                      className="text-fg-muted underline"
                      href={`mailto:${draft.to}?subject=${encodeURIComponent(
                        draft.subject,
                      )}&body=${encodeURIComponent(draft.body)}`}
                    >
                      Open in mail app
                    </a>
                  )}
                  {draft.apply_url && (
                    <a
                      className="text-fg-muted underline"
                      href={draft.apply_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open apply link
                    </a>
                  )}
                </div>
                <div>
                  <div className={`${SUMMARY_TAG_CLS.replace('mb-1.5', '')} mb-1`}>
                    Subject
                  </div>
                  <p>{draft.subject}</p>
                </div>
                <div>
                  <div className={`${SUMMARY_TAG_CLS.replace('mb-1.5', '')} mb-1`}>
                    Body
                  </div>
                  <textarea
                    readOnly
                    value={draft.body}
                    rows={Math.min(20, Math.max(8, draft.body.split('\n').length + 2))}
                    className={`${TEXTAREA_CLS} mt-1`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={BTN_BASE} onClick={copyAll}>
                    {copied === 'all' ? 'Copied' : 'Copy subject + body'}
                  </button>
                  <button type="button" className={BTN_BASE} onClick={copyResume}>
                    {copied === 'resume' ? 'Copied' : 'Copy résumé text'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
