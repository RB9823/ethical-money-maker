import { inArray } from "drizzle-orm";
import { failure, ok } from "@/lib/http";
import { db } from "@/lib/db/client";
import { launchPackets } from "@/lib/db/schema";
import { syncLaunchPacket } from "@/lib/services/events";

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
    const inflight = db
      .select({ id: launchPackets.id })
      .from(launchPackets)
      .where(inArray(launchPackets.status, ["queued", "active", "submitting"]))
      .all();

    const synced: string[] = [];
    for (const packet of inflight) {
      await syncLaunchPacket(packet.id).catch(() => null);
      synced.push(packet.id);
    }

    return ok({ synced: synced.length });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Sync failed.");
  }
}
