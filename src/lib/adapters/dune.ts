import {
  type DuneConfirmationAdapter,
  type DuneConfirmationPayload,
} from "@/lib/adapters/contracts";
import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";
import { DuneExecuteSchema, DuneResultsSchema, DuneStatusSchema } from "@/lib/adapters/schemas";
import { evaluateDuneThreshold } from "@/lib/workflow";

const DUNE_API_BASE = "https://api.dune.com/api/v1";
const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3000;

const TERMINAL_STATES = new Set([
  "QUERY_STATE_COMPLETED",
  "QUERY_STATE_FAILED",
  "QUERY_STATE_CANCELLED",
  "QUERY_STATE_EXPIRED",
]);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function duneHeaders(apiKey: string) {
  return { "X-Dune-API-Key": apiKey, "Content-Type": "application/json" };
}

// Try multiple column name conventions for a given metric name.
// e.g. "volumeVelocity" -> tries "volumeVelocity", "volume_velocity", "volume velocity"
function extractMetric(row: Record<string, unknown>, metricName: string): number | null {
  const snake = metricName.replace(/([A-Z])/g, "_$1").toLowerCase();
  const spaced = snake.replace(/_/g, " ");
  const candidates = [metricName, snake, spaced];

  for (const key of candidates) {
    if (key in row) {
      const v = Number(row[key]);
      if (!Number.isNaN(v)) return v;
    }
  }

  // Fall back to the first numeric value in the row
  for (const v of Object.values(row)) {
    const n = Number(v);
    if (!Number.isNaN(n) && v !== null && v !== "") return n;
  }

  return null;
}

async function executeQuery(
  apiKey: string,
  queryId: string,
): Promise<{ executionId: string; row: Record<string, unknown> }> {
  const retryOpts = { shouldRetry: isRetryableHttpError };

  const { execution_id } = await withRetry(async () => {
    const res = await fetch(`${DUNE_API_BASE}/query/${queryId}/execute`, {
      method: "POST",
      headers: duneHeaders(apiKey),
      body: JSON.stringify({}),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Dune execute failed (${res.status}) for query ${queryId}`);
    return DuneExecuteSchema.parse(await res.json());
  }, retryOpts);

  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const { state } = await withRetry(async () => {
      const res = await fetch(`${DUNE_API_BASE}/execution/${execution_id}/status`, {
        headers: duneHeaders(apiKey),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Dune status check failed (${res.status})`);
      return DuneStatusSchema.parse(await res.json());
    }, retryOpts);

    if (state === "QUERY_STATE_COMPLETED") break;

    if (TERMINAL_STATES.has(state) && state !== "QUERY_STATE_COMPLETED") {
      throw new Error(`Dune query ended with state: ${state}`);
    }

    if (i === POLL_ATTEMPTS - 1) {
      throw new Error("Dune query timed out after polling limit");
    }
  }

  const payload = await withRetry(async () => {
    const res = await fetch(`${DUNE_API_BASE}/execution/${execution_id}/results`, {
      headers: duneHeaders(apiKey),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Dune results fetch failed (${res.status})`);
    return DuneResultsSchema.parse(await res.json());
  }, retryOpts);

  return {
    executionId: execution_id,
    row: payload.result?.rows?.[0] ?? {},
  };
}

export class DuneAdapter implements DuneConfirmationAdapter {
  async confirmEvent(input: {
    title: string;
    confidence: number;
    topic: string;
  }): Promise<DuneConfirmationPayload> {
    const apiKey = process.env.DUNE_API_KEY;
    const volumeQueryId = process.env.DUNE_QUERY_VOLUME;
    const holdersQueryId = process.env.DUNE_QUERY_HOLDERS;

    // Demo mode: no API key or no query IDs configured
    if (!apiKey || !volumeQueryId || !holdersQueryId) {
      const metrics = {
        volumeVelocity: Number((1 + input.confidence / 150).toFixed(2)),
        newHolders: Math.round(input.confidence * 2.1),
        whaleShare: Math.max(18, 48 - Math.round(input.confidence / 4)),
      };
      const threshold = evaluateDuneThreshold(metrics);

      return {
        executionId: `demo-${Date.now()}`,
        metrics,
        verdict: threshold.passed ? "pass" : "review",
        rawResponse: { mode: "demo", topic: input.topic, title: input.title },
      };
    }

    // Live mode: execute both queries in parallel
    const [volumeResult, holdersResult] = await Promise.all([
      executeQuery(apiKey, volumeQueryId),
      executeQuery(apiKey, holdersQueryId),
    ]);

    const volumeVelocity = extractMetric(volumeResult.row, "volumeVelocity") ?? 0;
    const newHolders = extractMetric(holdersResult.row, "newHolders") ?? 0;
    const whaleShare = extractMetric(holdersResult.row, "whaleShare") ?? 100;

    const metrics = { volumeVelocity, newHolders, whaleShare };
    const threshold = evaluateDuneThreshold(metrics);

    return {
      executionId: `${volumeResult.executionId};${holdersResult.executionId}`,
      metrics,
      verdict: threshold.passed ? "pass" : "review",
      rawResponse: {
        mode: "live",
        volumeRow: volumeResult.row,
        holdersRow: holdersResult.row,
      },
    };
  }
}
