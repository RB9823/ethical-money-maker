import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";

import { DuneAdapter } from "@/lib/adapters/dune";
import { FunLaunchAdapter } from "@/lib/adapters/launch";
import { generateDraftPackage } from "@/lib/adapters/openai";
import { XSocialAdapter } from "@/lib/adapters/social";
import { TinyFishAdapter } from "@/lib/adapters/tinyfish";
import { db } from "@/lib/db/client";
import {
  approvals,
  duneQueryConfigs,
  duneQueryRuns,
  eventCandidates,
  eventSignals,
  executionLogs,
  launchPackets,
  postDrafts,
  trackedEvents,
} from "@/lib/db/schema";
import type { OperatorIdentity, WorkflowTransitionInput } from "@/lib/types";
import { scoreEventConfidence, canTransitionEvent, buildLaunchPacketDraft } from "@/lib/workflow";

const tinyFish = new TinyFishAdapter();
const dune = new DuneAdapter();
const launch = new FunLaunchAdapter();
const social = new XSocialAdapter();

function nowIso() {
  return new Date().toISOString();
}

function parseJson<T>(input: string | null | undefined, fallback: T) {
  if (!input) {
    return fallback;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

function logExecution(scope: string, status: string, message: string, metadata: Record<string, unknown>) {
  db.insert(executionLogs)
    .values({
      id: randomUUID(),
      scope,
      status,
      message,
      metadataJson: JSON.stringify(metadata),
      createdAt: nowIso(),
    })
    .run();
}

function recordApproval(input: {
  entityType: string;
  entityId: string;
  action: string;
  outcome: string;
  note?: string;
  actor: OperatorIdentity;
}) {
  db.insert(approvals)
    .values({
      id: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      outcome: input.outcome,
      note: input.note,
      actorId: input.actor.actorId,
      actorName: input.actor.actorName,
      createdAt: nowIso(),
    })
    .run();
}

export function getDashboardSnapshot(selectedEventId?: string) {
  const events = db
    .select()
    .from(trackedEvents)
    .orderBy(desc(trackedEvents.updatedAt))
    .all();

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ??
    events.find((event) => event.status === "confirmed") ??
    events[0] ??
    null;

  const eventId = selectedEvent?.id;

  const signals = eventId
    ? db.select().from(eventSignals).where(eq(eventSignals.eventId, eventId)).all()
    : [];
  const runs = eventId
    ? db.select().from(duneQueryRuns).where(eq(duneQueryRuns.eventId, eventId)).orderBy(desc(duneQueryRuns.executedAt)).all()
    : [];
  const packets = eventId
    ? db
        .select()
        .from(launchPackets)
        .where(eq(launchPackets.eventId, eventId))
        .orderBy(desc(launchPackets.preparedAt))
        .all()
    : [];
  const selectedDrafts = eventId
    ? db
        .select()
        .from(postDrafts)
        .where(eq(postDrafts.eventId, eventId))
        .orderBy(desc(postDrafts.createdAt))
        .all()
    : [];

  const audit = db
    .select()
    .from(approvals)
    .orderBy(desc(approvals.createdAt))
    .all()
    .slice(0, 8);

  const stats = [
    {
      label: "Tracked Events",
      value: String(events.length),
      detail: "Seeded from TinyFish and operator actions.",
    },
    {
      label: "Confirmed",
      value: String(events.filter((event) => event.status === "confirmed").length),
      detail: "Passed the current Dune confirmation rules.",
    },
    {
      label: "Draft Posts",
      value: String(
        db.select().from(postDrafts).where(eq(postDrafts.status, "draft")).all().length,
      ),
      detail: "Awaiting explicit approval before any outbound publication.",
    },
  ];

  return {
    stats,
    events,
    selectedEvent,
    selectedSignals: signals,
    selectedRuns: runs.map((run) => ({
      ...run,
      metrics: parseJson<Record<string, number | string>>(run.metricsJson, {}),
    })),
    selectedPackets: packets.map((packet) => ({
      ...packet,
      payload: parseJson<Record<string, unknown>>(packet.payloadJson, {}),
    })),
    selectedDrafts,
    audit,
  };
}

export function listEvents() {
  return db.select().from(trackedEvents).orderBy(desc(trackedEvents.updatedAt)).all();
}

export function getEventById(eventId: string) {
  const event = db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();

  if (!event) {
    return null;
  }

  return {
    event,
    signals: db.select().from(eventSignals).where(eq(eventSignals.eventId, eventId)).all(),
    runs: db.select().from(duneQueryRuns).where(eq(duneQueryRuns.eventId, eventId)).all(),
    packets: db.select().from(launchPackets).where(eq(launchPackets.eventId, eventId)).all(),
    drafts: db.select().from(postDrafts).where(eq(postDrafts.eventId, eventId)).all(),
  };
}

export function transitionEventStatus(
  eventId: string,
  input: WorkflowTransitionInput,
  actor: OperatorIdentity,
) {
  const event = db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();

  if (!event) {
    throw new Error("Event not found.");
  }

  if (!canTransitionEvent(event.status as typeof input.status, input.status)) {
    throw new Error(`Cannot move event from ${event.status} to ${input.status}.`);
  }

  db.update(trackedEvents)
    .set({
      status: input.status,
      operatorNote: input.note ?? event.operatorNote,
      updatedAt: nowIso(),
    })
    .where(eq(trackedEvents.id, eventId))
    .run();

  recordApproval({
    entityType: "event",
    entityId: eventId,
    action: `transition:${input.status}`,
    outcome: "recorded",
    note: input.note,
    actor,
  });

  return db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();
}

export async function confirmEvent(eventId: string, actor: OperatorIdentity) {
  const event = db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();

  if (!event) {
    throw new Error("Event not found.");
  }

  const payload = await dune.confirmEvent({
    title: event.title,
    confidence: event.confidence,
    topic: event.topic,
  });

  const verdictStatus = payload.verdict === "pass" ? "confirmed" : event.status;

  db.insert(duneQueryRuns)
    .values({
      id: randomUUID(),
      eventId: event.id,
      configId:
        db.select().from(duneQueryConfigs).where(eq(duneQueryConfigs.slug, "base-volume-velocity")).get()?.id ??
        null,
      executionId: payload.executionId,
      status: "success",
      verdict: payload.verdict,
      metricsJson: JSON.stringify(payload.metrics),
      rawResponse: JSON.stringify(payload.rawResponse),
      executedAt: nowIso(),
    })
    .run();

  db.insert(eventSignals)
    .values({
      id: randomUUID(),
      eventId: event.id,
      kind: "market",
      source: "Dune",
      label: "Confirmation verdict",
      value: payload.verdict,
      direction: payload.verdict === "pass" ? "up" : "flat",
      confidence: event.confidence,
      note: payload.verdict === "pass" ? "Thresholds passed." : "Needs more holder spread.",
      createdAt: nowIso(),
    })
    .run();

  db.update(trackedEvents)
    .set({
      status: verdictStatus,
      confidence: scoreEventConfidence({
        severity: event.severity as "critical" | "high" | "medium" | "low",
        signalCount: db
          .select()
          .from(eventSignals)
          .where(eq(eventSignals.eventId, event.id))
          .all().length,
        confirmationBoost: payload.verdict === "pass" ? 8 : 0,
      }),
      updatedAt: nowIso(),
    })
    .where(eq(trackedEvents.id, event.id))
    .run();

  recordApproval({
    entityType: "event",
    entityId: event.id,
    action: "dune-confirmation",
    outcome: payload.verdict === "pass" ? "approved" : "recorded",
    note: `Dune execution ${payload.executionId}`,
    actor,
  });

  logExecution("dune", "success", "Ran confirmation against the selected event.", {
    eventId: event.id,
    executionId: payload.executionId,
  });

  return getEventById(eventId);
}

export async function prepareLaunchPacket(eventId: string, actor: OperatorIdentity) {
  const event = db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();

  if (!event) {
    throw new Error("Event not found.");
  }

  const draft = buildLaunchPacketDraft({
    title: event.title,
    chain: event.chain,
    theme: event.topic,
    watchword: event.watchword,
  });
  const aiDraft = await generateDraftPackage({
    title: event.title,
    summary: event.summary,
    watchword: event.watchword,
    chain: event.chain,
    confidence: event.confidence,
  });

  const providerPayload = await launch.prepareLaunch({
    tokenName: aiDraft?.tokenName || draft.tokenName,
    tokenSymbol: aiDraft?.tokenSymbol || draft.tokenSymbol,
    thesis: aiDraft?.thesis || draft.thesis,
    chain: event.chain,
    watchword: event.watchword,
  });

  const packetId = randomUUID();

  db.insert(launchPackets)
    .values({
      id: packetId,
      eventId: event.id,
      chain: event.chain,
      venue: "fun.xyz",
      status: "draft",
      tokenName: aiDraft?.tokenName || draft.tokenName,
      tokenSymbol: aiDraft?.tokenSymbol || draft.tokenSymbol,
      thesis: aiDraft?.thesis || draft.thesis,
      payloadJson: JSON.stringify(providerPayload),
      preparedBy: actor.actorName,
      preparedAt: nowIso(),
    })
    .run();

  db.update(trackedEvents)
    .set({
      status: event.status === "confirmed" ? "approved" : event.status,
      updatedAt: nowIso(),
    })
    .where(eq(trackedEvents.id, event.id))
    .run();

  recordApproval({
    entityType: "launch_packet",
    entityId: packetId,
    action: "prepare-launch",
    outcome: "recorded",
    actor,
    note: "Prepared a draft-only launch packet.",
  });

  logExecution("launch", "success", "Prepared a launch packet draft.", {
    eventId: event.id,
    packetId,
  });

  return db.select().from(launchPackets).where(eq(launchPackets.id, packetId)).get();
}

export async function generatePostDraftForEvent(eventId: string, actor: OperatorIdentity) {
  const event = db.select().from(trackedEvents).where(eq(trackedEvents.id, eventId)).get();

  if (!event) {
    throw new Error("Event not found.");
  }

  const post = await social.generateDraft({
    title: event.title,
    watchword: event.watchword,
    chain: event.chain,
    confidence: event.confidence,
  });
  const aiDraft = await generateDraftPackage({
    title: event.title,
    summary: event.summary,
    watchword: event.watchword,
    chain: event.chain,
    confidence: event.confidence,
  });

  const postId = randomUUID();

  db.insert(postDrafts)
    .values({
      id: postId,
      eventId: event.id,
      platform: "x",
      status: "draft",
      content: aiDraft?.postDraft || post.content,
      hashtags: (aiDraft?.hashtags || post.hashtags).join(" "),
      providerResponse: JSON.stringify({ mode: "draft" }),
      createdAt: nowIso(),
    })
    .run();

  recordApproval({
    entityType: "post_draft",
    entityId: postId,
    action: "generate-draft",
    outcome: "recorded",
    actor,
    note: "Created a human-review draft for X.",
  });

  return db.select().from(postDrafts).where(eq(postDrafts.id, postId)).get();
}

export function approvePostDraft(postId: string, actor: OperatorIdentity) {
  const draft = db.select().from(postDrafts).where(eq(postDrafts.id, postId)).get();

  if (!draft) {
    throw new Error("Draft not found.");
  }

  db.update(postDrafts)
    .set({
      status: "approved",
      approvedBy: actor.actorName,
      approvedAt: nowIso(),
    })
    .where(eq(postDrafts.id, postId))
    .run();

  recordApproval({
    entityType: "post_draft",
    entityId: postId,
    action: "approve-post",
    outcome: "approved",
    actor,
    note: "Draft approved for downstream posting.",
  });

  return db.select().from(postDrafts).where(eq(postDrafts.id, postId)).get();
}

export function getAuditTrail() {
  return db.select().from(approvals).orderBy(desc(approvals.createdAt)).all();
}

export async function runHotButtonSweep(actor: OperatorIdentity) {
  const pulled = await tinyFish.pullHotButtonEvents();
  const inserted: string[] = [];

  for (const candidate of pulled) {
    const exists = db
      .select()
      .from(eventCandidates)
      .where(eq(eventCandidates.externalId, candidate.externalId))
      .get();

    if (exists) {
      continue;
    }

    const candidateId = randomUUID();
    const eventId = randomUUID();

    db.insert(eventCandidates)
      .values({
        id: candidateId,
        externalId: candidate.externalId,
        source: "tinyfish",
        cursor: `cursor-${Date.now()}`,
        headline: candidate.headline,
        summary: candidate.summary,
        topic: candidate.topic,
        rawPayload: JSON.stringify(candidate.rawPayload),
        occurredAt: candidate.occurredAt,
        createdAt: nowIso(),
      })
      .run();

    db.insert(trackedEvents)
      .values({
        id: eventId,
        candidateId,
        title: candidate.headline,
        summary: candidate.summary,
        topic: candidate.topic,
        chain: "Base",
        severity: "medium",
        status: "new",
        confidence: scoreEventConfidence({
          severity: "medium",
          signalCount: 1,
        }),
        watchword: (candidate.watchword || candidate.topic).replace(/\s+/g, "-"),
        marketBias: "breakout",
        recommendedAction: "Review narrative shape before escalation.",
        eventWindow: "Fresh ingest",
        operatorNote: "Created from TinyFish sweep.",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
      .run();

    db.insert(eventSignals)
      .values({
        id: randomUUID(),
        eventId,
        kind: "narrative",
        source: "TinyFish",
        label: "Ingested signal",
        value: candidate.topic,
        direction: "up",
        confidence: 67,
        note: "Generated during a manual sweep.",
        createdAt: nowIso(),
      })
      .run();

    inserted.push(eventId);
  }

  logExecution("tinyfish", "success", "Completed a hot-button sweep.", {
    insertedCount: inserted.length,
  });

  recordApproval({
    entityType: "sweep",
    entityId: randomUUID(),
    action: "run-hot-button-sweep",
    outcome: "recorded",
    actor,
    note: `Inserted ${inserted.length} new event(s).`,
  });

  return {
    inserted,
  };
}
