import { ok } from "@/lib/http";
import { getAuditTrail } from "@/lib/services/events";

export async function GET() {
  return ok({ audit: getAuditTrail() });
}
