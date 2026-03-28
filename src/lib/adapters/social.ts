import type { SocialPostAdapter } from "@/lib/adapters/contracts";
import { buildPostDraft } from "@/lib/workflow";

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
}
