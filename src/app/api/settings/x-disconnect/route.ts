import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { disconnectX } from "@/lib/services/settings";

export async function DELETE() {
  try {
    const actor = await requireOperator();
    disconnectX(actor.actorId);
    return ok({ disconnected: true });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to disconnect X.");
  }
}
