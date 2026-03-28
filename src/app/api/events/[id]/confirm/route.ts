import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { confirmEvent } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await requireOperator();
    const event = await confirmEvent(id, actor);

    return ok({ event });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to confirm event.");
  }
}
