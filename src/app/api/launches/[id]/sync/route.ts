import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { syncLaunchPacket } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await requireOperator();
    const packet = await syncLaunchPacket(id, actor);

    return ok({ packet });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to sync launch packet.");
  }
}
