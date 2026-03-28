import type {
  LaunchAdapter,
  LaunchPrepareResult,
  LaunchStatusResult,
  LaunchSubmissionPayload,
  LaunchSubmitResult,
  LaunchUploadResult,
} from "@/lib/adapters/contracts";
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
    const response = await fetch(`${getBaseUrl()}/api/v1/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image,
      }),
      cache: "no-store",
    });

    return readJson<LaunchUploadResult>(response);
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

    const response = await fetch(`${getBaseUrl()}/api/v1/${getNetwork()}/launch-memecoin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return readJson<LaunchSubmitResult>(response);
  }

  async fetchLaunchStatus(jobId: string): Promise<LaunchStatusResult> {
    const response = await fetch(`${getBaseUrl()}/api/v1/launch-status/${jobId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return readJson<LaunchStatusResult>(response);
  }
}
