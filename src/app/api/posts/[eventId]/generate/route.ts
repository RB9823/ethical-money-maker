import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { generatePostDraftForEvent } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const actor = await requireOperator();
    const post = await generatePostDraftForEvent(eventId, actor);

    return ok({ post });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to generate post draft.");
  }
}
