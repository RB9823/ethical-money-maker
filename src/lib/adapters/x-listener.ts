import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";

const X_API_BASE = "https://api.x.com/2";

export type XSignalResult = {
  watchword: string;
  tweetCount: number;
  engagementVelocity: number; // (retweets + quotes + replies) per hour
  topEngagement: number;      // highest engagement score in result set
  sampleAt: string;
};

function bearerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function searchRecentTweets(
  token: string,
  query: string,
): Promise<XSignalResult | null> {
  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    max_results: "10",
    "tweet.fields": "public_metrics,created_at",
  });

  const res = await withRetry(
    async () => {
      const r = await fetch(`${X_API_BASE}/tweets/search/recent?${params}`, {
        headers: bearerHeaders(token),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`X search failed (${r.status}) for "${query}"`);
      return r;
    },
    { shouldRetry: isRetryableHttpError },
  );

  const payload = (await res.json()) as {
    data?: Array<{
      id: string;
      created_at?: string;
      public_metrics?: {
        retweet_count?: number;
        reply_count?: number;
        like_count?: number;
        quote_count?: number;
      };
    }>;
    meta?: { result_count?: number };
  };

  const tweets = payload.data ?? [];
  if (tweets.length === 0) return null;

  const now = Date.now();
  let totalVelocity = 0;
  let topEngagement = 0;

  for (const tweet of tweets) {
    const m = tweet.public_metrics ?? {};
    const engagement =
      (m.retweet_count ?? 0) + (m.quote_count ?? 0) + (m.reply_count ?? 0);
    const ageHours = tweet.created_at
      ? Math.max(0.1, (now - new Date(tweet.created_at).getTime()) / 3600000)
      : 1;
    totalVelocity += engagement / ageHours;
    if (engagement > topEngagement) topEngagement = engagement;
  }

  return {
    watchword: query,
    tweetCount: tweets.length,
    engagementVelocity: Math.round(totalVelocity * 10) / 10,
    topEngagement,
    sampleAt: new Date().toISOString(),
  };
}

/**
 * Searches X/Twitter for each watchword and returns engagement velocity signals.
 * Returns null entries for watchwords that return no results or if X is not configured.
 */
export async function pullXSignals(
  watchwords: string[],
): Promise<XSignalResult[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || watchwords.length === 0) return [];

  const results: XSignalResult[] = [];

  for (const watchword of watchwords) {
    try {
      const result = await searchRecentTweets(token, watchword);
      if (result) results.push(result);
    } catch {
      // Non-fatal: skip watchwords that fail (rate limit, no results, etc.)
    }

    // Respect X API rate limits: 1 req/sec on Basic plan
    await new Promise((r) => setTimeout(r, 1100));
  }

  return results;
}
