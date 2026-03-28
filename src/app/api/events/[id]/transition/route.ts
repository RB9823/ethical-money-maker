import { z } from "zod";

import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { transitionEventStatus } from "@/lib/services/events";
import { eventStatuses } from "@/lib/types";

const transitionSchema = z.object({
  status: z.enum(eventStatuses),
  note: z.string().max(500).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actor = await requireOperator();
    const payload = transitionSchema.parse(await request.json());

    const event = transitionEventStatus(id, payload, actor);
    return ok({ event });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to transition event.");
  }
}
