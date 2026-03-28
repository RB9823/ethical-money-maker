import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await import("@/lib/db/client");
    await db.get(sql`SELECT 1 as healthy`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("healthcheck failed", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
