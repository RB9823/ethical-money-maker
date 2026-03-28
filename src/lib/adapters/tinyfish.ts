import { makeDemoCandidate } from "@/lib/db/seed";
import type { TinyFishSourceAdapter } from "@/lib/adapters/contracts";
import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";
import { TinyFishBatchSchema, TinyFishStartSchema } from "@/lib/adapters/schemas";

export class TinyFishAdapter implements TinyFishSourceAdapter {
  async pullHotButtonEvents() {
    const apiUrl = process.env.TINYFISH_API_URL || "https://agent.tinyfish.ai/v1/automation/run-async";
    const apiKey = process.env.TINYFISH_API_KEY;
    const sourceUrl =
      process.env.TINYFISH_SOURCE_URL ||
      "https://news.google.com/home?hl=en-US&gl=US&ceid=US:en";

    if (!apiUrl || !apiKey) {
      const fallback = makeDemoCandidate();
      return [
        {
          externalId: fallback.externalId,
          headline: fallback.headline,
          summary: fallback.summary,
          topic: fallback.topic,
          watchword: "fallback-signal",
          rawPayload: JSON.parse(fallback.rawPayload),
          occurredAt: fallback.occurredAt,
        },
      ];
    }

    try {
      const queued = await withRetry(
        async () => {
          const start = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey,
            },
            body: JSON.stringify({
              url: sourceUrl,
              goal:
                "Extract up to 15 current hot-button events likely to move speculative online attention in the US. Focus on politically polarizing, culturally divisive, regulatory, or macro narratives. Return as many distinct events as you can find, up to 15. Respond as strict JSON with {\"events\":[{\"id\":\"string\",\"headline\":\"string\",\"summary\":\"string\",\"topic\":\"string\",\"watchword\":\"string\"}]}. No markdown.",
              browser_profile: "lite",
              proxy_config: {
                enabled: true,
                country_code: "US",
              },
              api_integration: "hyde",
            }),
            cache: "no-store",
          });

          if (!start.ok) {
            throw new Error(`TinyFish request failed with ${start.status}`);
          }

          return TinyFishStartSchema.parse(await start.json());
        },
        { shouldRetry: isRetryableHttpError },
      );

      let completedRun:
        | {
            status?: string;
            result?: Record<string, unknown> | null;
            resultJson?: Record<string, unknown> | null;
            error?: unknown | null;
          }
        | undefined;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const payload = await withRetry(
          async () => {
            const poll = await fetch("https://agent.tinyfish.ai/v1/runs/batch", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey,
              },
              body: JSON.stringify({ run_ids: [queued.run_id] }),
              cache: "no-store",
            });

            if (!poll.ok) {
              throw new Error(`TinyFish polling failed with ${poll.status}`);
            }

            return TinyFishBatchSchema.parse(await poll.json());
          },
          { shouldRetry: isRetryableHttpError },
        );

        const run = payload.data?.[0];

        if (!run) {
          continue;
        }

        if (run.status === "COMPLETED") {
          completedRun = run;
          break;
        }

        if (run.status === "FAILED" || run.status === "CANCELLED") {
          throw new Error("TinyFish automation did not complete successfully.");
        }
      }

      if (!completedRun) {
        throw new Error("TinyFish automation timed out.");
      }

      const resultObject =
        completedRun.resultJson ||
        completedRun.result ||
        {};

      const events = (
        (resultObject.events as Array<{
          id?: string;
          headline?: string;
          summary?: string;
          topic?: string;
          watchword?: string;
        }>) || []
      )
        .filter((event) => event.headline && event.summary)
        .map((event, index) => ({
          externalId: event.id || `${queued.run_id}-${index}`,
          headline: event.headline || `TinyFish event ${index + 1}`,
          summary: event.summary || "TinyFish returned an event without a summary.",
          topic: event.topic || "general",
          watchword: event.watchword || event.topic || "hot-button",
          rawPayload: event,
          occurredAt: new Date().toISOString(),
        }));

      if (events.length === 0) {
        const fallback = makeDemoCandidate();
        return [
          {
            externalId: fallback.externalId,
            headline: fallback.headline,
            summary: fallback.summary,
            topic: fallback.topic,
            watchword: "fallback-signal",
            rawPayload: JSON.parse(fallback.rawPayload),
            occurredAt: fallback.occurredAt,
          },
        ];
      }

      return events.map((event) => ({
        externalId: event.externalId,
        headline: event.headline,
        summary: event.summary,
        topic: event.topic,
        watchword: event.watchword,
        rawPayload: event.rawPayload,
        occurredAt: event.occurredAt,
      }));
    } catch {
      const fallback = makeDemoCandidate();
      return [
        {
          externalId: fallback.externalId,
          headline: fallback.headline,
          summary: fallback.summary,
          topic: fallback.topic,
          watchword: "fallback-signal",
          rawPayload: JSON.parse(fallback.rawPayload),
          occurredAt: fallback.occurredAt,
        },
      ];
    }
  }
}
