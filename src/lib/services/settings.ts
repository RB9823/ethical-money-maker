import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

function nowIso() {
  return new Date().toISOString();
}

export function getSetting(key: string) {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value ?? null;
}

export function setSetting(key: string, value: string) {
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();

  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: nowIso() })
      .where(eq(settings.key, key))
      .run();
    return;
  }

  db.insert(settings)
    .values({
      key,
      value,
      updatedAt: nowIso(),
    })
    .run();
}

export function getXConnection() {
  const accessToken = getSetting("x_access_token") || process.env.X_ACCESS_TOKEN || null;
  const accessTokenSecret =
    getSetting("x_access_token_secret") || process.env.X_ACCESS_TOKEN_SECRET || null;
  const oauth2AccessToken =
    getSetting("x_oauth2_access_token") || process.env.X_OAUTH2_ACCESS_TOKEN || null;
  const oauth2RefreshToken =
    getSetting("x_oauth2_refresh_token") || process.env.X_OAUTH2_REFRESH_TOKEN || null;
  const handle = getSetting("x_handle") || process.env.X_HANDLE || null;
  const userId = getSetting("x_user_id") || null;

  return {
    connected: Boolean((accessToken && accessTokenSecret) || oauth2AccessToken),
    accessToken,
    accessTokenSecret,
    oauth2AccessToken,
    oauth2RefreshToken,
    handle,
    userId,
  };
}
