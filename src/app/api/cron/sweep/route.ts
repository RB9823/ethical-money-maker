import { failure, ok } from "@/lib/http";
import { runHotButtonSweep } from "@/lib/services/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("x-cron-secret");
    if (auth !== secret) {
      return failure("Unauthorized.", 401);
    }
  }

  try {
    const result = await runHotButtonSweep({
      actorId: "cron",
      actorName: "Automated Sweep",
    });
    return ok({ inserted: result.inserted.length });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Sweep failed.");
  }
}
