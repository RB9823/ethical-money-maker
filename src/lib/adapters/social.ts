import { createHmac } from "node:crypto";
import type { SocialPostAdapter } from "@/lib/adapters/contracts";
import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";
import { buildPostDraft } from "@/lib/workflow";

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuthHeader(
  method: string,
  url: string,
  body: Record<string, string>,
  credentials: { apiKey: string; apiSecret: string; accessToken: string; accessTokenSecret: string },
): string {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  // Collect all params for the signature base string
  const allParams: Record<string, string> = { ...body, ...oauthParams };
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(credentials.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  const headerParts = { ...oauthParams, oauth_signature: signature };
  const headerStr = Object.entries(headerParts)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(", ");

  return `OAuth ${headerStr}`;
}

export type PublishResult = {
  tweetId: string;
  url: string;
};

export class XSocialAdapter implements SocialPostAdapter {
  async generateDraft(input: {
    title: string;
    watchword: string;
    chain: string;
    confidence: number;
  }) {
    return {
      content: buildPostDraft(input),
      hashtags: ["#base", "#signals", "#opsdesk"],
    };
  }

  async publishPost(content: string, hashtags: string[]): Promise<PublishResult | null> {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return null;
    }

    const text = hashtags.length > 0
      ? `${content}\n\n${hashtags.join(" ")}`
      : content;

    const url = "https://api.x.com/2/tweets";
    const bodyObj = { text };
    const bodyJson = JSON.stringify(bodyObj);

    const oauthHeader = buildOAuthHeader("POST", url, {}, {
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret,
    });

    const response = await withRetry(
      async () => {
        const r = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: oauthHeader,
          },
          body: bodyJson,
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`X API publish failed (${r.status})`);
        return r;
      },
      { shouldRetry: isRetryableHttpError },
    );

    const payload = (await response.json()) as {
      data?: { id?: string; text?: string };
    };

    const tweetId = payload.data?.id;
    if (!tweetId) return null;

    const handle = process.env.X_HANDLE ?? "i";
    return {
      tweetId,
      url: `https://x.com/${handle}/status/${tweetId}`,
    };
  }
}
