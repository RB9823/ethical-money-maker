"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <div key={draft.id} className="rounded-2xl border border-zinc-200/80 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {draft.eventTitle ?? "Unknown event"} · {draft.platform}
              </p>
              <p className="text-sm leading-6">{draft.content}</p>
              {draft.hashtags ? (
                <p className="text-xs text-muted-foreground">{draft.hashtags}</p>
              ) : null}
            </div>
            <ApproveButton draftId={draft.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
