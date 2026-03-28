import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { approvePostDraft } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await requireOperator();
    const post = await approvePostDraft(id, actor);

    return ok({ post });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to approve draft.");
  }
}
