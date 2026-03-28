import type { MetricMap } from "@/lib/types";
import type { LaunchNetwork } from "@/lib/types";

export type SourceCandidate = {
  externalId: string;
  headline: string;
  summary: string;
  topic: string;
  watchword?: string;
  rawPayload: Record<string, unknown>;
  occurredAt: string;
};

export type DuneConfirmationPayload = {
  executionId: string;
  metrics: MetricMap;
  verdict: "pass" | "review";
  rawResponse: Record<string, unknown>;
};

export type LaunchSubmissionPayload = {
  tokenName: string;
  tokenSymbol: string;
  thesis: string;
  description: string;
  chain: string;
  watchword: string;
  network: LaunchNetwork;
  imageIpfs: string;
  creatorAddress?: string;
  sniperProtection: boolean;
  imagePrompt?: string;
};

export type LaunchPrepareResult = {
  venue: "flaunch";
  authorized: true;
  chain: string;
  network: LaunchNetwork;
  creatorAddress?: string;
  payload: Omit<LaunchSubmissionPayload, "imageIpfs">;
};

export type LaunchUploadResult = {
  success: boolean;
  ipfsHash: string;
  tokenURI: string;
  nsfwDetection: unknown;
};

export type LaunchSubmitResult = {
  success: boolean;
  message: string;
  jobId: string;
  queueStatus?: {
    position: number;
    waitingJobs: number;
    activeJobs: number;
    estimatedWaitSeconds: number;
  };
  privy?: Record<string, unknown>;
};

export type LaunchStatusResult = {
  success: boolean;
  state: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  transactionHash?: string | null;
  collectionToken?: {
    address?: string | null;
    imageIpfs?: string | null;
    name?: string | null;
    symbol?: string | null;
    tokenURI?: string | null;
    creator?: string | null;
  } | null;
  revenueManagerAddress?: string | null;
  feeSplitManagerAddress?: string | null;
  feeSplitRecipients?: string[] | null;
  error?: string | null;
};

export interface TinyFishSourceAdapter {
  pullHotButtonEvents(): Promise<SourceCandidate[]>;
}

export interface DuneConfirmationAdapter {
  confirmEvent(input: {
    title: string;
    confidence: number;
    topic: string;
  }): Promise<DuneConfirmationPayload>;
}

export interface LaunchAdapter {
  prepareLaunch(input: Omit<LaunchSubmissionPayload, "imageIpfs">): Promise<LaunchPrepareResult>;
  uploadImage(base64Image: string): Promise<LaunchUploadResult>;
  submitLaunch(input: LaunchSubmissionPayload): Promise<LaunchSubmitResult>;
  fetchLaunchStatus(jobId: string): Promise<LaunchStatusResult>;
}

export interface SocialPostAdapter {
  generateDraft(input: {
    title: string;
    watchword: string;
    chain: string;
    confidence: number;
  }): Promise<{ content: string; hashtags: string[] }>;
}
