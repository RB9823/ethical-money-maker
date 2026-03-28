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

// Source quality weights — Dune (on-chain) is most authoritative, TinyFish (AI news) least.
const SOURCE_WEIGHTS: Record<string, number> = {
  Dune: 1.0,
  BaseMonitor: 0.9,
  X: 0.8,
  TinyFish: 0.6,
};

export function scoreEventConfidence({
  severity,
  signals,
  confirmationBoost = 0,
}: {
  severity: EventSeverity;
  signals: Array<{ source: string; confidence: number; createdAt: string }>;
  confirmationBoost?: number;
}) {
  const severityBase = {
    critical: 82,
    high: 72,
    medium: 61,
    low: 48,
  }[severity];

  // Weighted signal bonus — each signal contributes based on source quality (capped at 15).
  let signalBonus = 0;
  if (signals.length > 0) {
    const weightedSum = signals.reduce((sum, s) => {
      const weight = SOURCE_WEIGHTS[s.source] ?? 0.5;
      return sum + weight;
    }, 0);
    signalBonus = Math.min(15, Math.round((weightedSum / signals.length) * signals.length * 2));
  }

  // Diversity bonus — reward corroboration across multiple source types.
  const uniqueSources = new Set(signals.map((s) => s.source)).size;
  const diversityBonus = Math.max(0, uniqueSources - 1) * 4;

  // Recency decay — if all signals are older than 6h, reduce score up to 30%.
  let recencyMultiplier = 1.0;
  if (signals.length > 0) {
    const newestMs = Math.max(...signals.map((s) => new Date(s.createdAt).getTime()));
    const ageMinutes = (Date.now() - newestMs) / 60000;
    if (ageMinutes > 360) {
      // Decays from 1.0 at 6h to 0.7 at 26h
      recencyMultiplier = Math.max(0.7, 1.0 - (ageMinutes - 360) / 1200);
    }
  }

  const raw = severityBase + signalBonus + diversityBonus + confirmationBoost;
  return Math.min(99, Math.round(raw * recencyMultiplier));
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

// Topic-to-archetype map for meme-native fallback token names.
// Pick an archetype that fits the narrative vibe, combine with the watchword.
const topicArchetypes: Record<string, string[]> = {
  politics: ["BALLOT", "GAVEL", "VETO", "LOBBY", "FILI"],
  macro: ["PUMP", "HAWK", "FOMO", "BULL", "CRATER"],
  culture: ["RAGE", "COPE", "SEETHE", "BASED", "DEGEN"],
  tech: ["CHIP", "COMPUTE", "STACK", "FORK", "JEET"],
  regulation: ["BAN", "GENSLER", "SEC", "RULE", "COMPLY"],
  crypto: ["MOON", "RUG", "GAS", "NGMI", "WAGMI"],
  geopolitics: ["NUKE", "SANCTION", "SIEGE", "PACT", "HAWK"],
};

function pickArchetype(topic: string): string {
  const key = topic.toLowerCase();
  const list = topicArchetypes[key] ?? topicArchetypes.macro!;
  return list[Math.floor(Math.random() * list.length)]!;
}

function watchwordToSymbol(watchword: string): string {
  // Take the first meaningful word from the watchword, uppercase, max 5 chars.
  const word = watchword
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)[0] ?? "HBX";
  return word.toUpperCase().slice(0, 5);
}

export function buildLaunchPacketDraft(input: {
  title: string;
  chain: string;
  theme: string;
  watchword: string;
  topic?: string;
}) {
  const archetype = pickArchetype(input.topic ?? "macro");
  const symbol = watchwordToSymbol(input.watchword);
  const tokenName = `${archetype} ${input.watchword.split(/\s+/)[0]?.toUpperCase() ?? "SIGNAL"}`;

  return {
    tokenName,
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
