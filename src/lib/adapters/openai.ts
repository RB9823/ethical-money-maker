import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";
import { OpenAIDraftPackageSchema } from "@/lib/adapters/schemas";

function extractJsonObject(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("OpenAI response did not contain JSON.");
  }

  return JSON.parse(input.slice(start, end + 1)) as Record<string, unknown>;
}

function makeFallbackLaunchImage(symbol: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0f172a" offset="0%"/>
          <stop stop-color="#0f766e" offset="52%"/>
          <stop stop-color="#d97706" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="220" fill="url(#g)"/>
      <circle cx="512" cy="390" r="210" fill="rgba(255,255,255,0.12)"/>
      <text x="512" y="600" fill="#ffffff" font-size="220" font-weight="700" text-anchor="middle" font-family="Arial, sans-serif">${symbol}</text>
      <text x="512" y="760" fill="#f8fafc" font-size="64" letter-spacing="16" text-anchor="middle" font-family="Arial, sans-serif">HYDE</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return withRetry(
    async () => {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          input: prompt,
          temperature: 0.7,
          max_output_tokens: 900,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      };
      // Responses API: try top-level shortcut first, then nested output[0].content[0].text
      return (
        payload.output_text ??
        payload.output?.[0]?.content?.find((c) => c.type === "output_text")?.text ??
        ""
      );
    },
    { shouldRetry: isRetryableHttpError },
  );
}

export async function generateDraftPackage(input: {
  title: string;
  summary: string;
  watchword: string;
  chain: string;
  confidence: number;
}) {
  const output = await callOpenAI(`
You are drafting launch metadata for a meme coin on Base. The token must feel born from the narrative — culturally sharp, memetically resonant, not corporate.

Return strict JSON only using this shape:
{
  "tokenName": string,
  "tokenSymbol": string,
  "thesis": string,
  "description": string,
  "imagePrompt": string,
  "postDraft": string,
  "hashtags": string[]
}

Event context:
- title: ${input.title}
- summary: ${input.summary}
- watchword: ${input.watchword}
- chain: ${input.chain}
- confidence: ${input.confidence}

Token naming rules:
- tokenName: catchy, 1-3 words, meme-native energy (think $PEPE, $DOGE, $TRUMP vibes — not "Signal" or "Protocol"). Use the watchword as the core meme hook.
- tokenSymbol: one memorable word or abbreviation, 3-5 uppercase letters, something people would type into a DEX search.

Few-shot examples of good vs bad:
  BAD: "Campaign Finance Signal" / "CFS"
  GOOD: "Ballot Liquidity" / "BALLOT"

  BAD: "AI Export Sanction Event" / "AISE"
  GOOD: "Compute Panic" / "CMPNK"

  BAD: "Hot Button Event Token" / "HBET"
  GOOD: "GAVEL DROP" / "GAVEL"

Other constraints:
- thesis: one sentence on why this narrative is a market-moving catalyst.
- description: 1-2 sentences suitable as on-chain token metadata.
- imagePrompt: describe a square token image. Make it topic-aware — political/election events get satirical or patriotic imagery, tech/AI events get futuristic imagery, culture war events get bold abstract imagery. Style: pop art, vaporwave, or bold illustration. No text, no watermarks, no realistic human faces, no brand logos.
- postDraft: reads like an internal desk update. No financial promises.
- hashtags: 2-4 items.
  `);

  if (!output) {
    return null;
  }

  return OpenAIDraftPackageSchema.parse(extractJsonObject(output));
}

export async function generateLaunchImage(input: {
  prompt: string;
  tokenSymbol: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return makeFallbackLaunchImage(input.tokenSymbol);
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: input.prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
      background: "opaque",
    }),
  });

  if (!response.ok) {
    return makeFallbackLaunchImage(input.tokenSymbol);
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };

  const imageBase64 = payload.data?.[0]?.b64_json;

  if (!imageBase64) {
    return makeFallbackLaunchImage(input.tokenSymbol);
  }

  return `data:image/png;base64,${imageBase64}`;
}
