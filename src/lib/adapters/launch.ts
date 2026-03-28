import type {
  LaunchAdapter,
  LaunchPrepareResult,
  LaunchStatusResult,
  LaunchSubmissionPayload,
  LaunchSubmitResult,
  LaunchUploadResult,
} from "@/lib/adapters/contracts";
import { isRetryableHttpError, withRetry } from "@/lib/adapters/retry";
import { FlaunchStatusSchema, FlaunchSubmitSchema, FlaunchUploadSchema } from "@/lib/adapters/schemas";
import type { LaunchNetwork } from "@/lib/types";

function getBaseUrl() {
  return process.env.FLAUNCH_API_BASE_URL || "https://web2-api.flaunch.gg";
}

function getNetwork(): LaunchNetwork {
  return process.env.FLAUNCH_NETWORK === "base" ? "base" : "base-sepolia";
}

async function readJson<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error?: unknown }).error || "Provider request failed.")
        : `Provider request failed with ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

export class FlaunchLaunchAdapter implements LaunchAdapter {
  async prepareLaunch(
    input: Omit<LaunchSubmissionPayload, "imageIpfs">,
  ): Promise<LaunchPrepareResult> {
    return {
      venue: "flaunch",
      authorized: true,
      chain: input.chain,
      network: input.network,
      creatorAddress: input.creatorAddress,
      payload: input,
    };
  }

  async uploadImage(base64Image: string): Promise<LaunchUploadResult> {
    return withRetry(async () => {
      const response = await fetch(`${getBaseUrl()}/api/v1/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
        cache: "no-store",
      });
      return FlaunchUploadSchema.parse(await readJson(response)) as LaunchUploadResult;
    }, { shouldRetry: isRetryableHttpError });
  }

  async submitLaunch(input: LaunchSubmissionPayload): Promise<LaunchSubmitResult> {
    const body: Record<string, unknown> = {
      name: input.tokenName,
      symbol: input.tokenSymbol,
      description: input.description,
      imageIpfs: input.imageIpfs,
      sniperProtection: input.sniperProtection,
    };

    if (input.creatorAddress) {
      body.creatorAddress = input.creatorAddress;
    }

    return withRetry(async () => {
      const response = await fetch(`${getBaseUrl()}/api/v1/${getNetwork()}/launch-memecoin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      return FlaunchSubmitSchema.parse(await readJson(response)) as LaunchSubmitResult;
    }, { shouldRetry: isRetryableHttpError });
  }

  async fetchLaunchStatus(jobId: string): Promise<LaunchStatusResult> {
    return withRetry(async () => {
      const response = await fetch(`${getBaseUrl()}/api/v1/launch-status/${jobId}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      return FlaunchStatusSchema.parse(await readJson(response)) as LaunchStatusResult;
    }, { shouldRetry: isRetryableHttpError });
  }
}
