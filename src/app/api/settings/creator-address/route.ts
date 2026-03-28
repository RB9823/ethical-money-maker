import { z } from "zod";

import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { deleteSetting, getCreatorAddress, setSetting } from "@/lib/services/settings";

export async function GET() {
  try {
    const actor = await requireOperator();
    const address = getCreatorAddress(actor.actorId);
    return ok({ address });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to fetch creator address.");
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireOperator();
    const body = (await request.json()) as unknown;
    const { address } = z.object({ address: z.string().min(1) }).parse(body);

    setSetting("creator_address", address.trim(), actor.actorId);
    return ok({ address: address.trim() });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to save creator address.");
  }
}

export async function DELETE() {
  try {
    const actor = await requireOperator();
    deleteSetting("creator_address", actor.actorId);
    return ok({ cleared: true });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to clear creator address.");
  }
}
