import { z } from "zod";

// --- TinyFish ---

export const TinyFishStartSchema = z.object({
  run_id: z.string(),
});

export const TinyFishRunSchema = z.object({
  status: z.string().optional(),
  resultJson: z.record(z.string(), z.unknown()).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.unknown().optional(),
});

export const TinyFishBatchSchema = z.object({
  data: z.array(TinyFishRunSchema).optional(),
});

// --- Dune ---

export const DuneExecuteSchema = z.object({
  execution_id: z.string(),
});

export const DuneStatusSchema = z.object({
  state: z.string(),
});

export const DuneResultsSchema = z.object({
  result: z
    .object({
      rows: z.array(z.record(z.string(), z.unknown())).optional(),
    })
    .optional(),
});

// --- OpenAI draft package (highest risk — comes from LLM JSON extraction) ---

export const OpenAIDraftPackageSchema = z.object({
  tokenName: z.string(),
  tokenSymbol: z.string().max(10),
  thesis: z.string(),
  description: z.string(),
  imagePrompt: z.string(),
  postDraft: z.string(),
  hashtags: z.array(z.string()),
});

export type OpenAIDraftPackage = z.infer<typeof OpenAIDraftPackageSchema>;

// --- Flaunch ---

export const FlaunchUploadSchema = z.object({
  success: z.boolean(),
  ipfsHash: z.string(),
  tokenURI: z.string(),
  nsfwDetection: z.unknown().optional(),
});

export const FlaunchSubmitSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  jobId: z.string(),
  queueStatus: z
    .object({
      position: z.number().optional(),
      waitingJobs: z.number().optional(),
      activeJobs: z.number().optional(),
      estimatedWaitSeconds: z.number().optional(),
    })
    .optional(),
  privy: z.record(z.string(), z.unknown()).optional(),
});

export const FlaunchStatusSchema = z.object({
  success: z.boolean(),
  state: z.string(),
  queuePosition: z.number().nullish(),
  estimatedWaitTime: z.number().nullish(),
  transactionHash: z.string().nullish(),
  collectionToken: z
    .object({
      address: z.string().nullish(),
      imageIpfs: z.string().nullish(),
      name: z.string().nullish(),
      symbol: z.string().nullish(),
      tokenURI: z.string().nullish(),
      creator: z.string().nullish(),
    })
    .nullish(),
  revenueManagerAddress: z.string().nullish(),
  feeSplitManagerAddress: z.string().nullish(),
  feeSplitRecipients: z.array(z.string()).nullish(),
  error: z.string().nullish(),
});
