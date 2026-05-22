'use client';

import { useEffect, useState } from 'react';
import { useResume } from '@/lib/useResume';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

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
        <Card className="border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-medium">Privacy notice</p>
            <p>
              Your résumé is stored only in your browser (localStorage). It is sent to Google
              (Gemini API) when you ask for ranking or a draft. Do not paste anything you would
              not share publicly.
            </p>
          </CardContent>
        </Card>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={compact ? 8 : 12}
            placeholder="Paste résumé here (min 100 chars)..."
            className="font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={!canSave} size="sm">
              Save résumé
            </Button>
            {hasSaved && (
              <Button variant="outline" size="sm" onClick={cancel}>
                Cancel
              </Button>
            )}
            <span className="text-xs text-muted-foreground">{draft.length} chars</span>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-2 p-3 text-sm">
            <span className="text-muted-foreground">
              Résumé saved locally ({resume.length.toLocaleString()} chars).
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Clear saved résumé?')) clear();
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
