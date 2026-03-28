import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const now = new Date();

const demoCandidates = [
  {
    id: "candidate-election-fees",
    externalId: "tinyfish-election-fees",
    source: "tinyfish",
    cursor: "demo-cursor-1",
    headline: "Election funding narrative is spilling into Base gas clusters",
    summary:
      "Narrative velocity around campaign finance and Base-native wallets is increasing across high-engagement accounts.",
    topic: "politics",
    rawPayload: JSON.stringify({
      channel: "hot-button",
      sentiment: "polarized",
      model: "demo",
    }),
    occurredAt: new Date(now.getTime() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "candidate-ai-sanctions",
    externalId: "tinyfish-ai-sanctions",
    source: "tinyfish",
    cursor: "demo-cursor-2",
    headline: "AI export restriction chatter is rotating into Base social alpha",
    summary:
      "TinyFish picked up a sharp acceleration in posts linking chip restrictions, AI infra names, and speculative rotation on Base.",
    topic: "macro",
    rawPayload: JSON.stringify({
      channel: "narrative",
      sentiment: "aggressive",
      model: "demo",
    }),
    occurredAt: new Date(now.getTime() - 1000 * 60 * 88).toISOString(),
  },
];

const demoEvents = [
  {
    id: "event-election-fees",
    candidateId: "candidate-election-fees",
    title: "Campaign finance spike on Base social radar",
    summary:
      "Narrative heat is rising around campaign money, regulatory reaction, and Base-native retail speculation.",
    topic: "politics",
    chain: "Base",
    severity: "critical",
    status: "confirmed",
    confidence: 86,
    watchword: "ballot liquidity",
    marketBias: "momentum",
    recommendedAction: "Escalate to operator review and prepare launch packet shell.",
    eventWindow: "90-minute breakout",
    operatorNote: "Needs human review before any external action.",
  },
  {
    id: "event-ai-sanctions",
    candidateId: "candidate-ai-sanctions",
    title: "AI restriction narrative rotating into memetic Base flow",
    summary:
      "Export-control chatter is lifting adjacent AI and freedom-tech narratives, with early wallet clustering across Base pairs.",
    topic: "macro",
    chain: "Base",
    severity: "high",
    status: "watch",
    confidence: 74,
    watchword: "compute panic",
    marketBias: "breakout",
    recommendedAction: "Track holder spread before promotion.",
    eventWindow: "3-hour monitoring",
    operatorNote: "Await Dune confirmation on holder dispersion.",
  },
];

const demoSignals = [
  {
    id: "signal-1",
    eventId: "event-election-fees",
    kind: "narrative",
    source: "TinyFish",
    label: "Velocity delta",
    value: "+241%",
    direction: "up",
    confidence: 89,
    note: "Detected surge across clustered political discourse accounts.",
  },
  {
    id: "signal-2",
    eventId: "event-election-fees",
    kind: "market",
    source: "Dune",
    label: "Holder growth",
    value: "183 wallets",
    direction: "up",
    confidence: 82,
    note: "Holder spread broad enough for operator review.",
  },
  {
    id: "signal-3",
    eventId: "event-ai-sanctions",
    kind: "narrative",
    source: "TinyFish",
    label: "Engagement skew",
    value: "0.67",
    direction: "flat",
    confidence: 73,
    note: "Narrative is hot but still concentrated in a few repeat accounts.",
  },
];

const demoDuneConfigs = [
  {
    id: "dune-volume",
    slug: "base-volume-velocity",
    label: "Base volume velocity",
    queryId: "DUNE_QUERY_VOLUME",
    description: "Checks accelerated pair volume on Base-linked narratives.",
    thresholdMetric: "volumeVelocity",
    thresholdOperator: ">=",
    thresholdValue: 125,
    chain: "Base",
  },
  {
    id: "dune-holders",
    slug: "base-holder-dispersion",
    label: "Base holder dispersion",
    queryId: "DUNE_QUERY_HOLDERS",
    description: "Checks whether holder growth is broad enough to reduce concentration risk.",
    thresholdMetric: "newHolders",
    thresholdOperator: ">=",
    thresholdValue: 120,
    chain: "Base",
  },
];

const demoRuns = [
  {
    id: "run-1",
    eventId: "event-election-fees",
    configId: "dune-volume",
    executionId: "demo-exec-1",
    status: "success",
    verdict: "pass",
    metricsJson: JSON.stringify({
      volumeVelocity: 1.42,
      newHolders: 183,
      whaleShare: 24,
    }),
    rawResponse: JSON.stringify({ source: "demo", state: "QUERY_STATE_COMPLETED" }),
  },
];

const demoLaunchPackets = [
  {
    id: "packet-1",
    eventId: "event-election-fees",
    chain: "Base",
    network: "base-sepolia",
    venue: "flaunch",
    status: "draft",
    tokenName: "Campaign Signal",
    tokenSymbol: "CSIG",
    thesis: "Base social rotation around campaign finance rhetoric.",
    description: "A demo launch packet for the Hyde operator console.",
    creatorAddress: null,
    jobId: null,
    transactionHash: null,
    collectionTokenAddress: null,
    tokenUri: null,
    imageIpfs: null,
    imagePrompt: "A bold abstract campaign-signal token image with teal and amber contrasts.",
    imageDataUrl: null,
    providerStatus: "draft",
    lastPolledAt: null,
    errorMessage: null,
    payloadJson: JSON.stringify({
      disclaimer: "Human approval required.",
      slippageGuardBps: 200,
    }),
    preparedBy: "system:seed",
  },
];

const demoPosts = [
  {
    id: "post-1",
    eventId: "event-election-fees",
    platform: "x",
    status: "draft",
    content:
      "Campaign finance chatter just crossed the desk on Base. Watching holder spread and narrative velocity before escalation. Internal note only.",
    hashtags: "#base #signals",
    providerResponse: JSON.stringify({ mode: "draft" }),
  },
];

const demoApprovals = [
  {
    id: "approval-1",
    entityType: "event",
    entityId: "event-election-fees",
    action: "seed-status",
    outcome: "recorded",
    note: "Seeded as confirmed to populate the operator console.",
    actorId: "system",
    actorName: "System Seed",
  },
];

const demoLogs = [
  {
    id: "log-1",
    scope: "seed",
    status: "success",
    message: "Loaded demo operator dataset because no events existed yet.",
    metadataJson: JSON.stringify({ source: "bootstrap" }),
  },
];

export function seedDatabase(sqlite: Database.Database) {
  const count = sqlite
    .prepare("SELECT COUNT(*) as count FROM tracked_events")
    .get() as { count: number };

  if (count.count > 0) {
    return;
  }

  const insertCandidate = sqlite.prepare(
    `INSERT INTO event_candidates (
      id, external_id, source, cursor, headline, summary, topic, raw_payload, occurred_at
    ) VALUES (
      @id, @externalId, @source, @cursor, @headline, @summary, @topic, @rawPayload, @occurredAt
    )`,
  );

  const insertEvent = sqlite.prepare(
    `INSERT INTO tracked_events (
      id, candidate_id, title, summary, topic, chain, severity, status, confidence,
      watchword, market_bias, recommended_action, event_window, operator_note
    ) VALUES (
      @id, @candidateId, @title, @summary, @topic, @chain, @severity, @status, @confidence,
      @watchword, @marketBias, @recommendedAction, @eventWindow, @operatorNote
    )`,
  );

  const insertSignal = sqlite.prepare(
    `INSERT INTO event_signals (
      id, event_id, kind, source, label, value, direction, confidence, note
    ) VALUES (
      @id, @eventId, @kind, @source, @label, @value, @direction, @confidence, @note
    )`,
  );

  const insertConfig = sqlite.prepare(
    `INSERT INTO dune_query_configs (
      id, slug, label, query_id, description, threshold_metric, threshold_operator, threshold_value, chain
    ) VALUES (
      @id, @slug, @label, @queryId, @description, @thresholdMetric, @thresholdOperator, @thresholdValue, @chain
    )`,
  );

  const insertRun = sqlite.prepare(
    `INSERT INTO dune_query_runs (
      id, event_id, config_id, execution_id, status, verdict, metrics_json, raw_response
    ) VALUES (
      @id, @eventId, @configId, @executionId, @status, @verdict, @metricsJson, @rawResponse
    )`,
  );

  const insertPacket = sqlite.prepare(
    `INSERT INTO launch_packets (
      id, event_id, chain, network, venue, status, token_name, token_symbol, thesis, description,
      creator_address, job_id, transaction_hash, collection_token_address, token_uri, image_ipfs,
      image_prompt, image_data_url, provider_status, last_polled_at, error_message, payload_json, prepared_by
    ) VALUES (
      @id, @eventId, @chain, @network, @venue, @status, @tokenName, @tokenSymbol, @thesis, @description,
      @creatorAddress, @jobId, @transactionHash, @collectionTokenAddress, @tokenUri, @imageIpfs,
      @imagePrompt, @imageDataUrl, @providerStatus, @lastPolledAt, @errorMessage, @payloadJson, @preparedBy
    )`,
  );

  const insertPost = sqlite.prepare(
    `INSERT INTO post_drafts (
      id, event_id, platform, status, content, hashtags, provider_response
    ) VALUES (
      @id, @eventId, @platform, @status, @content, @hashtags, @providerResponse
    )`,
  );

  const insertApproval = sqlite.prepare(
    `INSERT INTO approvals (
      id, entity_type, entity_id, action, outcome, note, actor_id, actor_name
    ) VALUES (
      @id, @entityType, @entityId, @action, @outcome, @note, @actorId, @actorName
    )`,
  );

  const insertLog = sqlite.prepare(
    `INSERT INTO execution_logs (
      id, scope, status, message, metadata_json
    ) VALUES (
      @id, @scope, @status, @message, @metadataJson
    )`,
  );

  const transaction = sqlite.transaction(() => {
    demoCandidates.forEach((row) => insertCandidate.run(row));
    demoEvents.forEach((row) => insertEvent.run(row));
    demoSignals.forEach((row) => insertSignal.run(row));
    demoDuneConfigs.forEach((row) => insertConfig.run(row));
    demoRuns.forEach((row) => insertRun.run(row));
    demoLaunchPackets.forEach((row) => insertPacket.run(row));
    demoPosts.forEach((row) => insertPost.run(row));
    demoApprovals.forEach((row) => insertApproval.run(row));
    demoLogs.forEach((row) => insertLog.run(row));
  });

  transaction();
}

export function makeDemoCandidate() {
  const variants = [
    {
      key: "culture",
      headline: "Emergent culture-war narrative detected on Base social graph",
      summary:
        "TinyFish fallback mode detected a fresh high-volatility narrative cluster with rapid quote velocity.",
      topic: "culture",
    },
    {
      key: "macro",
      headline: "Macro anxiety is spilling into Base-native speculation chatter",
      summary:
        "Fallback ingest picked up a rising macro stress narrative with outsized engagement across speculative accounts.",
      topic: "macro",
    },
    {
      key: "politics",
      headline: "Political flashpoint rhetoric is rotating into Base trading discourse",
      summary:
        "Fallback mode flagged a politically polarizing story cluster that is spreading into Base memecoin conversations.",
      topic: "politics",
    },
  ] as const;

  const bucket = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
  const variant = variants[bucket % variants.length];

  return {
    id: randomUUID(),
    externalId: `tinyfish-fallback-${variant.key}-${bucket}`,
    source: "tinyfish",
    cursor: `cursor-fallback-${bucket}`,
    headline: variant.headline,
    summary: variant.summary,
    topic: variant.topic,
    rawPayload: JSON.stringify({ source: "mock", mode: "fallback", variant: variant.key }),
    occurredAt: new Date().toISOString(),
  };
}
