"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Radar } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SweepButton({
  variant = "outline",
  size = "default",
}: {
  variant?: "outline" | "default";
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/run", { method: "POST", cache: "no-store" });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Sweep failed.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={variant} size={size} className="rounded-full" disabled={busy} onClick={run}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Radar className="size-4" />}
        {busy ? "Sweeping…" : "Run Sweep"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
