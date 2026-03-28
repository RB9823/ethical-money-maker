export const eventStatuses = [
  "new",
  "watch",
  "confirmed",
  "approved",
  "dispatched",
  "closed",
  "rejected",
] as const;

export const eventSeverities = ["critical", "high", "medium", "low"] as const;
export const approvalOutcomes = ["approved", "rejected", "recorded"] as const;
export const packetStatuses = [
  "draft",
  "submitting",
  "queued",
  "active",
  "completed",
  "failed",
] as const;
export const postStatuses = ["draft", "approved", "published", "failed"] as const;
export const runStatuses = ["pending", "success", "warning", "failed"] as const;

export type EventStatus = (typeof eventStatuses)[number];
export type EventSeverity = (typeof eventSeverities)[number];
export type ApprovalOutcome = (typeof approvalOutcomes)[number];
export type PacketStatus = (typeof packetStatuses)[number];
export type PostStatus = (typeof postStatuses)[number];
export type RunStatus = (typeof runStatuses)[number];

export type MetricMap = Record<string, number | string | boolean | null>;

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type WorkflowTransitionInput = {
  status: EventStatus;
  note?: string;
};

export type OperatorIdentity = {
  actorId: string;
  actorName: string;
};

export type LaunchNetwork = "base" | "base-sepolia";
