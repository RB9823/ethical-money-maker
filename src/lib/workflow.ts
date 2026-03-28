import {
  type EventSeverity,
  type EventStatus,
  eventStatuses,
  type MetricMap,
} from "@/lib/types";

const transitionMap: Record<EventStatus, EventStatus[]> = {
  new: ["watch", "rejected"],
  watch: ["confirmed", "approved", "rejected", "closed"],
  confirmed: ["approved", "watch", "rejected", "closed"],
  approved: ["dispatched", "closed", "rejected"],
  dispatched: ["closed"],
  closed: [],
  rejected: [],
};

export function canTransitionEvent(from: EventStatus, to: EventStatus) {
  return transitionMap[from].includes(to);
}

export function getSeverityTone(severity: EventSeverity) {
  switch (severity) {
    case "critical":
      return "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20";
    case "high":
      return "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20";
    case "medium":
      return "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/20";
    case "low":
      return "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getStatusTone(status: EventStatus) {
  switch (status) {
    case "new":
      return "bg-zinc-900 text-white";
    case "watch":
      return "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/20";
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20";
    case "approved":
      return "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/20";
    case "dispatched":
      return "bg-orange-500/15 text-orange-700 ring-1 ring-orange-500/20";
    case "closed":
      return "bg-zinc-500/10 text-zinc-700 ring-1 ring-zinc-500/15";
    case "rejected":
      return "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function assertEventStatus(input: string): EventStatus {
  if ((eventStatuses as readonly string[]).includes(input)) {
    return input as EventStatus;
  }

  throw new Error(`Unsupported event status: ${input}`);
}

export function scoreEventConfidence({
  severity,
  signalCount,
  confirmationBoost = 0,
}: {
  severity: EventSeverity;
  signalCount: number;
  confirmationBoost?: number;
}) {
  const severityBase = {
    critical: 82,
    high: 72,
    medium: 61,
    low: 48,
  }[severity];

  return Math.min(99, severityBase + signalCount * 3 + confirmationBoost);
}

export function evaluateDuneThreshold(metrics: MetricMap) {
  const velocity = Number(metrics.volumeVelocity ?? 0);
  const holders = Number(metrics.newHolders ?? 0);
  const whaleShare = Number(metrics.whaleShare ?? 100);

  const passed = velocity >= 1.25 && holders >= 120 && whaleShare <= 32;

  return {
    passed,
    summary: passed
      ? "Flow and holder spread are inside the operator threshold."
      : "Onchain confirmation is incomplete for promotion.",
  };
}

export function buildLaunchPacketDraft(input: {
  title: string;
  chain: string;
  theme: string;
  watchword: string;
}) {
  const base = input.title
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  const symbol = base
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 5) || "HBX";

  return {
    tokenName: `${base.join(" ") || "Hot Button"} Signal`,
    tokenSymbol: symbol,
    thesis: `${input.theme} rotation around ${input.watchword} on ${input.chain}.`,
  };
}

export function buildPostDraft(input: {
  title: string;
  watchword: string;
  chain: string;
  confidence: number;
}) {
  return [
    `${input.title} moved into operator review on ${input.chain}.`,
    `Confidence ${input.confidence}/100 after cross-checking narrative velocity and holder flow.`,
    `Watchword: ${input.watchword}. Internal desk note only until approval clears.`,
  ].join(" ");
}
