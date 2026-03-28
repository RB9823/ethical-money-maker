"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, LoaderCircle, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeWindow } from "@/lib/format";

type OutboundDraft = {
  id: string;
  content: string;
  hashtags: string;
  status: string;
  platform: string;
  createdAt: string;
  provider: Record<string, unknown>;
};

function OutboundDraftCard({ draft }: { draft: OutboundDraft }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(draft.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = 280 - content.length;
  const canEdit = draft.status === "draft";

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
    <div className="rounded-[22px] border border-zinc-200/80 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {draft.status}
          </Badge>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {draft.platform}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !editing ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3" />
              Edit
            </Button>
          ) : null}
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {formatRelativeWindow(draft.createdAt)}
          </span>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
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
          <p className="mt-3 text-sm leading-6 text-zinc-800">{content}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
            {draft.hashtags}
          </p>
          {"url" in draft.provider && typeof draft.provider.url === "string" ? (
            <Link
              href={draft.provider.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              View post
            </Link>
          ) : null}
          {"error" in draft.provider && typeof draft.provider.error === "string" ? (
            <p className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              {draft.provider.error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function OutboundDraftsList({ drafts }: { drafts: OutboundDraft[] }) {
  if (drafts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No draft yet. Click <strong>Draft X Post</strong> to generate one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.slice(0, 3).map((draft) => (
        <OutboundDraftCard key={draft.id} draft={draft} />
      ))}
    </div>
  );
}
