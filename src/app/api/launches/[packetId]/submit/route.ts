import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { submitLaunchPacket } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ packetId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { packetId } = await context.params;
    const actor = await requireOperator();
    const packet = await submitLaunchPacket(packetId, actor);

    return ok({ packet });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to submit launch packet.");
  }
}
