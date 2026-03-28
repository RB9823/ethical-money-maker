import type Database from "better-sqlite3";

const statements = [
  `CREATE TABLE IF NOT EXISTS event_candidates (
    id TEXT PRIMARY KEY,
    external_id TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    cursor TEXT,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    topic TEXT NOT NULL,
    raw_payload TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tracked_events (
    id TEXT PRIMARY KEY,
    candidate_id TEXT REFERENCES event_candidates(id),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    topic TEXT NOT NULL,
    chain TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    watchword TEXT NOT NULL,
    market_bias TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    event_window TEXT NOT NULL,
    operator_note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS event_signals (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES tracked_events(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    source TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    direction TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS dune_query_configs (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    query_id TEXT NOT NULL,
    description TEXT NOT NULL,
    threshold_metric TEXT NOT NULL,
    threshold_operator TEXT NOT NULL,
    threshold_value INTEGER NOT NULL,
    chain TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS dune_query_runs (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES tracked_events(id) ON DELETE CASCADE,
    config_id TEXT REFERENCES dune_query_configs(id),
    execution_id TEXT NOT NULL,
    status TEXT NOT NULL,
    verdict TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    raw_response TEXT NOT NULL,
    executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS launch_packets (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES tracked_events(id) ON DELETE CASCADE,
    chain TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'base-sepolia',
    venue TEXT NOT NULL,
    status TEXT NOT NULL,
    token_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    thesis TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    creator_address TEXT,
    job_id TEXT,
    transaction_hash TEXT,
    collection_token_address TEXT,
    token_uri TEXT,
    image_ipfs TEXT,
    image_prompt TEXT,
    image_data_url TEXT,
    provider_status TEXT,
    last_polled_at TEXT,
    error_message TEXT,
    payload_json TEXT NOT NULL,
    prepared_by TEXT NOT NULL,
    prepared_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS post_drafts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES tracked_events(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT NOT NULL,
    provider_response TEXT,
    approved_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    outcome TEXT NOT NULL,
    note TEXT,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS execution_logs (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

function ensureColumn(
  sqlite: Database.Database,
  table: string,
  column: string,
  definition: string,
) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;

  if (!columns.some((entry) => entry.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function bootstrapDatabase(sqlite: Database.Database) {
  sqlite.pragma("foreign_keys = ON");
  statements.forEach((statement) => sqlite.exec(statement));
  ensureColumn(sqlite, "launch_packets", "network", "TEXT NOT NULL DEFAULT 'base-sepolia'");
  ensureColumn(sqlite, "launch_packets", "description", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(sqlite, "launch_packets", "creator_address", "TEXT");
  ensureColumn(sqlite, "launch_packets", "job_id", "TEXT");
  ensureColumn(sqlite, "launch_packets", "transaction_hash", "TEXT");
  ensureColumn(sqlite, "launch_packets", "collection_token_address", "TEXT");
  ensureColumn(sqlite, "launch_packets", "token_uri", "TEXT");
  ensureColumn(sqlite, "launch_packets", "image_ipfs", "TEXT");
  ensureColumn(sqlite, "launch_packets", "image_prompt", "TEXT");
  ensureColumn(sqlite, "launch_packets", "image_data_url", "TEXT");
  ensureColumn(sqlite, "launch_packets", "provider_status", "TEXT");
  ensureColumn(sqlite, "launch_packets", "last_polled_at", "TEXT");
  ensureColumn(sqlite, "launch_packets", "error_message", "TEXT");
  sqlite.exec("UPDATE launch_packets SET venue = 'flaunch' WHERE venue = 'fun.xyz'");
}
