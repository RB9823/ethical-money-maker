import { failure, ok } from "@/lib/http";
import { requireOperator } from "@/lib/server-auth";
import { runHotButtonSweep } from "@/lib/services/events";

export async function POST() {
  try {
    const actor = await requireOperator();
    const result = await runHotButtonSweep(actor);

    return ok({ result });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unable to run sweep.");
  }
}
