import { createHmac, randomBytes } from "node:crypto";

function percentEncode(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function parseFormEncoded(input: string) {
  const params = new URLSearchParams(input);
  return Object.fromEntries(params.entries());
}

type OAuthCredentials = {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
};

function buildOAuthHeader(input: {
  method: string;
  url: string;
  credentials: OAuthCredentials;
  extraOAuthParams?: Record<string, string>;
  bodyParams?: Record<string, string>;
}) {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: input.credentials.consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
    ...input.extraOAuthParams,
  };

  if (input.credentials.token) {
    oauthParams.oauth_token = input.credentials.token;
  }

  const allParams: Record<string, string> = {
    ...input.bodyParams,
    ...oauthParams,
  };

  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join("&");

  const signatureBase = [
    input.method.toUpperCase(),
    percentEncode(input.url),
    percentEncode(sortedParams),
  ].join("&");

  const signingKey = `${percentEncode(input.credentials.consumerSecret)}&${percentEncode(input.credentials.tokenSecret || "")}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  const headerParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return `OAuth ${Object.entries(headerParams)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(", ")}`;
}

function getRequiredCredentials() {
  const consumerKey = process.env.X_API_KEY;
  const consumerSecret = process.env.X_API_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("X API key and secret are required.");
  }

  return { consumerKey, consumerSecret };
}

export function getXCallbackUrl() {
  return (
    process.env.X_OAUTH_CALLBACK_URL ||
    `${getAppBaseUrl()}/api/x/callback`
  );
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://hyde-live-production.up.railway.app";
}

export async function getRequestToken() {
  const url = "https://api.x.com/oauth/request_token";
  const credentials = getRequiredCredentials();
  const callbackUrl = getXCallbackUrl();
  const oauthHeader = buildOAuthHeader({
    method: "POST",
    url,
    credentials,
    extraOAuthParams: {
      oauth_callback: callbackUrl,
    },
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`X request token failed (${response.status}).`);
  }

  const payload = parseFormEncoded(await response.text());

  if (!payload.oauth_token || !payload.oauth_token_secret) {
    throw new Error("X request token response was incomplete.");
  }

  return {
    oauthToken: payload.oauth_token,
    oauthTokenSecret: payload.oauth_token_secret,
    authorizeUrl: `https://api.x.com/oauth/authorize?oauth_token=${payload.oauth_token}`,
  };
}

export async function exchangeAccessToken(input: {
  oauthToken: string;
  oauthTokenSecret: string;
  oauthVerifier: string;
}) {
  const url = "https://api.x.com/oauth/access_token";
  const credentials = getRequiredCredentials();
  const body = new URLSearchParams({
    oauth_verifier: input.oauthVerifier,
  }).toString();
  const oauthHeader = buildOAuthHeader({
    method: "POST",
    url,
    credentials: {
      ...credentials,
      token: input.oauthToken,
      tokenSecret: input.oauthTokenSecret,
    },
    bodyParams: {
      oauth_verifier: input.oauthVerifier,
    },
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`X access token exchange failed (${response.status}).`);
  }

  const payload = parseFormEncoded(await response.text());

  if (!payload.oauth_token || !payload.oauth_token_secret) {
    throw new Error("X access token response was incomplete.");
  }

  return {
    accessToken: payload.oauth_token,
    accessTokenSecret: payload.oauth_token_secret,
    screenName: payload.screen_name || null,
    userId: payload.user_id || null,
  };
}
