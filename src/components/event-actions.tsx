"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Radar,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Stamp,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/lib/types";

type ActionSpec = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  body?: Record<string, unknown>;
};

export function EventActions({
  eventId,
  status,
  latestDraftId,
  latestPacketId,
  latestPacketStatus,
}: {
  eventId: string;
  status: EventStatus;
  latestDraftId?: string;
  latestPacketId?: string;
  latestPacketStatus?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: ActionSpec[] = [
    {
      label: "Run Sweep",
      icon: Radar,
      url: "/api/jobs/run",
    },
    ...(status === "new"
      ? [
          {
            label: "Move To Watch",
            icon: Sparkles,
            url: `/api/events/${eventId}/transition`,
            body: { status: "watch", note: "Operator moved event into the watch queue." },
          },
        ]
      : []),
    {
      label: "Dune Confirm",
      icon: ShieldCheck,
      url: `/api/events/${eventId}/confirm`,
    },
    ...(status === "confirmed" || status === "watch"
      ? [
          {
            label: "Approve Event",
            icon: Stamp,
            url: `/api/events/${eventId}/transition`,
            body: { status: "approved", note: "Operator approved the event for outbound prep." },
          },
        ]
      : []),
    {
      label: "Prepare Packet",
      icon: WandSparkles,
      url: `/api/events/${eventId}/launch/prepare`,
    },
    ...(latestPacketId && (latestPacketStatus === "draft" || latestPacketStatus === "failed")
      ? [
          {
            label: "Submit To Flaunch",
            icon: Rocket,
            url: `/api/launches/${latestPacketId}/submit`,
          },
        ]
      : []),
    ...(latestPacketId && latestPacketStatus && latestPacketStatus !== "draft"
      ? [
          {
            label: "Refresh Launch",
            icon: RefreshCcw,
            url: `/api/launches/${latestPacketId}/sync`,
          },
        ]
      : []),
    {
      label: "Draft X Post",
      icon: Sparkles,
      url: `/api/posts/${eventId}/generate`,
    },
    ...(latestDraftId
      ? [
          {
            label: "Approve Draft",
            icon: Stamp,
            url: `/api/posts/${latestDraftId}/approve`,
          },
        ]
      : []),
  ];

  async function invoke(action: ActionSpec) {
    setBusy(action.label);
    setError(null);

    try {
      const response = await fetch(action.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Request failed.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isBusy = busy === action.label;

          return (
            <Button
              key={action.label}
              type="button"
              variant={
                action.label === "Prepare Packet" || action.label === "Submit To Flaunch"
                  ? "default"
                  : "outline"
              }
              className="rounded-full"
              disabled={Boolean(busy)}
              onClick={() => invoke(action)}
            >
              {isBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
