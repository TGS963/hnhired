'use client';

import { useEffect, useState } from 'react';
import { useResume } from '@/lib/useResume';

export default function ResumeEditor({
  compact = false,
  onSaved,
}: {
  compact?: boolean;
  onSaved?: () => void;
}) {
  const { resume, setResume, clear, hydrated } = useResume();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (hydrated) setDraft(resume);
  }, [hydrated, resume]);

  if (!hydrated) return null;

  const hasSaved = resume.trim().length > 0;
  const isEditing = editing || !hasSaved;
  const canSave = draft.trim().length > 100;

  function save() {
    if (!canSave) return;
    setResume(draft);
    setEditing(false);
    onSaved?.();
  }

  function startEdit() {
    setDraft(resume);
    setEditing(true);
  }

  function cancel() {
    setDraft(resume);
    setEditing(false);
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="rounded-md border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Privacy notice</p>
          <p className="mt-1">
            Your résumé is stored only in your browser (localStorage). It is sent to Google
            (Gemini API) when you ask for ranking or a draft. Do not paste anything you would
            not share publicly.
          </p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={compact ? 8 : 12}
            placeholder="Paste résumé here (min 100 chars)..."
            className="w-full rounded-md border border-neutral-300 bg-white p-3 font-mono text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Save résumé
            </button>
            {hasSaved && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
              >
                Cancel
              </button>
            )}
            <span className="text-xs text-neutral-500">{draft.length} chars</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
          <span>
            Résumé saved locally ({resume.length.toLocaleString()} chars).
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear saved résumé?')) clear();
              }}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
