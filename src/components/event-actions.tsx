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
  emphasized?: boolean;
};

export function EventActions({
  eventId,
  status,
  latestDraftId,
  latestPacketId,
  latestPacketStatus,
  latestPacketJobId,
}: {
  eventId: string;
  status: EventStatus;
  latestDraftId?: string;
  latestPacketId?: string;
  latestPacketStatus?: string;
  latestPacketJobId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moveToWatchAction: ActionSpec = {
    label: "Move To Watch",
    icon: Sparkles,
    url: `/api/events/${eventId}/transition`,
    body: { status: "watch", note: "Operator moved event into the watch queue." },
    emphasized: true,
  };
  const duneConfirmAction: ActionSpec = {
    label: "Dune Confirm",
    icon: ShieldCheck,
    url: `/api/events/${eventId}/confirm`,
    emphasized: true,
  };
  const approveEventAction: ActionSpec = {
    label: "Approve Event",
    icon: Stamp,
    url: `/api/events/${eventId}/transition`,
    body: { status: "approved", note: "Operator approved the event for outbound prep." },
    emphasized: true,
  };
  const preparePacketAction: ActionSpec = {
    label: "Prepare Packet",
    icon: WandSparkles,
    url: `/api/events/${eventId}/launch/prepare`,
    emphasized: true,
  };
  const submitLaunchAction: ActionSpec | null =
    latestPacketId && (latestPacketStatus === "draft" || latestPacketStatus === "failed")
      ? {
          label: "Submit To Flaunch",
          icon: Rocket,
          url: `/api/launches/${latestPacketId}/submit`,
          emphasized: true,
        }
      : null;
  const refreshLaunchAction: ActionSpec | null =
    latestPacketId && latestPacketJobId && latestPacketStatus && latestPacketStatus !== "draft"
      ? {
          label: "Refresh Launch",
          icon: RefreshCcw,
          url: `/api/launches/${latestPacketId}/sync`,
        }
      : null;
  const draftPostAction: ActionSpec = {
    label: "Draft X Post",
    icon: Sparkles,
    url: `/api/posts/${eventId}/generate`,
  };
  const approveDraftAction: ActionSpec | null = latestDraftId
    ? {
        label: "Approve Draft",
        icon: Stamp,
        url: `/api/posts/${latestDraftId}/approve`,
        emphasized: true,
      }
    : null;
  const runSweepAction: ActionSpec = {
    label: "Run Sweep",
    icon: Radar,
    url: "/api/jobs/run",
  };

  let primaryAction: ActionSpec | null = null;
  const secondaryActions: ActionSpec[] = [];

  if (status === "new") {
    primaryAction = moveToWatchAction;
    secondaryActions.push(duneConfirmAction);
  } else if (status === "watch") {
    primaryAction = duneConfirmAction;
    secondaryActions.push(approveEventAction);
  } else if (status === "confirmed") {
    primaryAction = approveEventAction;
    secondaryActions.push(preparePacketAction);
  } else if (approveDraftAction) {
    primaryAction = approveDraftAction;
  } else if (submitLaunchAction) {
    primaryAction = submitLaunchAction;
    secondaryActions.push(draftPostAction);
  } else if (!latestPacketId) {
    primaryAction = preparePacketAction;
    secondaryActions.push(draftPostAction);
  } else {
    primaryAction = draftPostAction;
  }

  if (refreshLaunchAction && (!primaryAction || refreshLaunchAction.label !== primaryAction.label)) {
    secondaryActions.push(refreshLaunchAction);
  }

  if (
    status !== "new" &&
    status !== "watch" &&
    (!primaryAction || duneConfirmAction.label !== primaryAction.label)
  ) {
    secondaryActions.push(duneConfirmAction);
  }

  if (
    latestPacketId &&
    (!primaryAction || preparePacketAction.label !== primaryAction.label) &&
    latestPacketStatus !== "submitting"
  ) {
    secondaryActions.push(preparePacketAction);
  }

  if (!latestDraftId && (!primaryAction || draftPostAction.label !== primaryAction.label)) {
    secondaryActions.push(draftPostAction);
  }

  secondaryActions.push(runSweepAction);

  const actions = secondaryActions.filter(
    (action, index, all) =>
      action.label !== primaryAction?.label &&
      all.findIndex((candidate) => candidate.label === action.label) === index,
  );
  const PrimaryIcon = primaryAction?.icon;

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
      {primaryAction ? (
        <Button
          type="button"
          variant="default"
          className="h-auto min-h-12 w-full justify-start rounded-[22px] px-4 py-3 text-left whitespace-normal"
          disabled={Boolean(busy)}
          onClick={() => invoke(primaryAction)}
        >
          <span className="flex items-center gap-2">
            {busy === primaryAction.label ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : PrimaryIcon ? (
              <PrimaryIcon className="size-4" />
            ) : null}
            <span>{primaryAction.label}</span>
          </span>
        </Button>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isBusy = busy === action.label;

          return (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={Boolean(busy)}
              onClick={() => invoke(action)}
            >
              <span className="flex items-center gap-2">
                {isBusy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Icon className="size-4" />
                )}
                <span>{action.label}</span>
              </span>
            </Button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
