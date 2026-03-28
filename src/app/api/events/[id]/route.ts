import { failure, ok } from "@/lib/http";
import { getEventById } from "@/lib/services/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const event = getEventById(id);

  if (!event) {
    return failure("Event not found.", 404);
  }

  return ok(event);
}
