import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const eventCandidates = sqliteTable("event_candidates", {
  id: text("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  source: text("source").notNull(),
  cursor: text("cursor"),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  topic: text("topic").notNull(),
  rawPayload: text("raw_payload").notNull(),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const trackedEvents = sqliteTable("tracked_events", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id").references(() => eventCandidates.id),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  topic: text("topic").notNull(),
  chain: text("chain").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull(),
  confidence: integer("confidence").notNull(),
  watchword: text("watchword").notNull(),
  marketBias: text("market_bias").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  eventWindow: text("event_window").notNull(),
  operatorNote: text("operator_note"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const eventSignals = sqliteTable("event_signals", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => trackedEvents.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  source: text("source").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  direction: text("direction").notNull(),
  confidence: integer("confidence").notNull(),
  note: text("note"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const duneQueryConfigs = sqliteTable("dune_query_configs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  queryId: text("query_id").notNull(),
  description: text("description").notNull(),
  thresholdMetric: text("threshold_metric").notNull(),
  thresholdOperator: text("threshold_operator").notNull(),
  thresholdValue: integer("threshold_value").notNull(),
  chain: text("chain").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const duneQueryRuns = sqliteTable("dune_query_runs", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => trackedEvents.id, { onDelete: "cascade" }),
  configId: text("config_id").references(() => duneQueryConfigs.id),
  executionId: text("execution_id").notNull(),
  status: text("status").notNull(),
  verdict: text("verdict").notNull(),
  metricsJson: text("metrics_json").notNull(),
  rawResponse: text("raw_response").notNull(),
  executedAt: text("executed_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const launchPackets = sqliteTable("launch_packets", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => trackedEvents.id, { onDelete: "cascade" }),
  chain: text("chain").notNull(),
  network: text("network").notNull().default("base-sepolia"),
  venue: text("venue").notNull(),
  status: text("status").notNull(),
  tokenName: text("token_name").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  thesis: text("thesis").notNull(),
  description: text("description").notNull().default(""),
  creatorAddress: text("creator_address"),
  jobId: text("job_id"),
  transactionHash: text("transaction_hash"),
  collectionTokenAddress: text("collection_token_address"),
  tokenUri: text("token_uri"),
  imageIpfs: text("image_ipfs"),
  imagePrompt: text("image_prompt"),
  imageDataUrl: text("image_data_url"),
  providerStatus: text("provider_status"),
  lastPolledAt: text("last_polled_at"),
  errorMessage: text("error_message"),
  payloadJson: text("payload_json").notNull(),
  preparedBy: text("prepared_by").notNull(),
  preparedAt: text("prepared_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const postDrafts = sqliteTable("post_drafts", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => trackedEvents.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  status: text("status").notNull(),
  content: text("content").notNull(),
  hashtags: text("hashtags").notNull(),
  providerResponse: text("provider_response"),
  approvedBy: text("approved_by"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  approvedAt: text("approved_at"),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  outcome: text("outcome").notNull(),
  note: text("note"),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  scope: text("scope").notNull(),
  status: text("status").notNull(),
  message: text("message").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
