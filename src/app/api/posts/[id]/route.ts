import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { updatePostDraft } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await requireOperator();
    const body = (await request.json()) as { content?: string; hashtags?: string };

    if (typeof body.content !== "string" || body.content.trim() === "") {
      return failure("content is required.");
    }

    const draft = updatePostDraft(id, body.content, body.hashtags ?? "");
    return ok({ draft });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to update draft.");
  }
}
