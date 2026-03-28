"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Link2Off, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const rowClass = "rounded-[20px] border border-zinc-200/80 bg-zinc-50/80 px-4 py-4";
const labelClass = "text-xs font-medium text-zinc-500";

function CreatorAddressForm({ current }: { current: string | null }) {
  const router = useRouter();
  const [address, setAddress] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!address.trim()) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/creator-address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Save failed.");
      }

      setSaved(true);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/creator-address", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Clear failed.");
      }

      setAddress("");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={rowClass}>
      <p className={labelClass}>Base wallet address</p>
      <p className="mt-0.5 text-xs text-zinc-400">
        Revenue from Flaunch launches routes here. Must be a valid EVM address (0x…).
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
          placeholder="0x…"
          className="h-9 flex-1 rounded-full border border-zinc-200 bg-white px-3 text-sm font-mono text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-zinc-400"
          spellCheck={false}
          autoComplete="off"
        />
        <Button
          size="sm"
          className="rounded-full"
          disabled={busy || !address.trim()}
          onClick={save}
        >
          {saved ? <CheckCircle className="size-3" /> : <Save className="size-3" />}
          {saved ? "Saved" : "Save"}
        </Button>
        {address ? (
          <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={clear}>
            <X className="size-3" />
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function XConnectionSection({
  connected,
  handle,
}: {
  connected: boolean;
  handle: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/x-disconnect", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Disconnect failed.");
      }

      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={rowClass}>
      <p className={labelClass}>X account</p>
      {connected ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-700">
            Connected{handle ? ` as @${handle}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={disconnect}>
              <Link2Off className="size-3" />
              Disconnect
            </Button>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            Connect to publish approved drafts directly from Hyde.
          </p>
          <a
            href="/api/x/connect"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-900 px-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Connect X
          </a>
        </div>
      )}
    </div>
  );
}

export function UserSettingsPanel({
  xConnected,
  xHandle,
  creatorAddress,
}: {
  xConnected: boolean;
  xHandle: string | null;
  creatorAddress: string | null;
}) {
  return (
    <div className="space-y-3">
      <XConnectionSection connected={xConnected} handle={xHandle} />
      <CreatorAddressForm current={creatorAddress} />
    </div>
  );
}
