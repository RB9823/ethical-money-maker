"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, LoaderCircle, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type PendingDraft = {
  id: string;
  eventId: string;
  eventTitle: string | null;
  content: string;
  hashtags: string;
  platform: string;
  createdAt: string;
};

function ApproveButton({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${draftId}/approve`, {
        method: "POST",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Approval failed.");
      }

      setDone(true);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Badge className="rounded-full bg-emerald-600 text-white">
        <CheckCheck className="size-3" /> Approved
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" className="rounded-full" disabled={busy} onClick={approve}>
        {busy ? <LoaderCircle className="size-3 animate-spin" /> : <CheckCheck className="size-3" />}
        Approve
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function PendingDraftCard({ draft }: { draft: PendingDraft }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(draft.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = 280 - content.length;

  async function save() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, hashtags: draft.hashtags }),
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Save failed.");
      }

      setEditing(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {draft.eventTitle ?? "Unknown event"} · {draft.platform}
          </p>
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setError(null); }}
                maxLength={280}
                rows={4}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs ${remaining < 20 ? "text-destructive" : "text-zinc-500"}`}>
                  {remaining} chars remaining
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => { setEditing(false); setContent(draft.content); setError(null); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={busy || content.trim().length === 0}
                    onClick={save}
                  >
                    {busy ? <LoaderCircle className="size-3 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          ) : (
            <>
              <p className="text-sm leading-6">{content}</p>
              {draft.hashtags ? (
                <p className="text-xs text-muted-foreground">{draft.hashtags}</p>
              ) : null}
            </>
          )}
        </div>
        {!editing ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ApproveButton draftId={draft.id} />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PendingDraftsPanel({ drafts }: { drafts: PendingDraft[] }) {
  if (drafts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending drafts. Generate one from a confirmed event.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft) => (
        <PendingDraftCard key={draft.id} draft={draft} />
      ))}
    </div>
  );
}
