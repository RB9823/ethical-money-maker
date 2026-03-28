import {
  type DuneConfirmationAdapter,
  type DuneConfirmationPayload,
} from "@/lib/adapters/contracts";
import { evaluateDuneThreshold } from "@/lib/workflow";

export class DuneAdapter implements DuneConfirmationAdapter {
  async confirmEvent(input: {
    title: string;
    confidence: number;
    topic: string;
  }): Promise<DuneConfirmationPayload> {
    const apiKey = process.env.DUNE_API_KEY;

    if (!apiKey) {
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

    return {
      executionId: `configured-${Date.now()}`,
      metrics: {
        volumeVelocity: 1.31,
        newHolders: 146,
        whaleShare: 29,
      },
      verdict: "pass",
      rawResponse: { mode: "configured", note: "Wire Dune query execution here." },
    };
  }
}
