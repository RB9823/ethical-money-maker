import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { prepareLaunchPacket } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const actor = await requireOperator();
    const packet = await prepareLaunchPacket(eventId, actor);

    return ok({ packet });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to prepare launch packet.");
  }
}
