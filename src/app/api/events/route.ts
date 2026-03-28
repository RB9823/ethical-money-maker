import { ok } from "@/lib/http";
import { listEvents } from "@/lib/services/events";

export async function GET() {
  return ok({ events: listEvents() });
}
