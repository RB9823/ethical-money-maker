import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

function nowIso() {
  return new Date().toISOString();
}

// Keys are scoped per actor: "{actorId}:{key}". Falls back to bare key for
// legacy global settings so nothing breaks on deploy.
function scopedKey(key: string, actorId?: string) {
  return actorId ? `${actorId}:${key}` : key;
}

export function getSetting(key: string, actorId?: string) {
  const sk = scopedKey(key, actorId);
  return db.select().from(settings).where(eq(settings.key, sk)).get()?.value ?? null;
}

export function setSetting(key: string, value: string, actorId?: string) {
  const sk = scopedKey(key, actorId);
  const existing = db.select().from(settings).where(eq(settings.key, sk)).get();

  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: nowIso() })
      .where(eq(settings.key, sk))
      .run();
    return;
  }

  db.insert(settings)
    .values({
      key: sk,
      value,
      updatedAt: nowIso(),
    })
    .run();
}

export function deleteSetting(key: string, actorId?: string) {
  db.delete(settings).where(eq(settings.key, scopedKey(key, actorId))).run();
}

export function getXConnection(actorId?: string) {
  const accessToken =
    getSetting("x_access_token", actorId) || process.env.X_ACCESS_TOKEN || null;
  const accessTokenSecret =
    getSetting("x_access_token_secret", actorId) || process.env.X_ACCESS_TOKEN_SECRET || null;
  const oauth2AccessToken =
    getSetting("x_oauth2_access_token", actorId) || process.env.X_OAUTH2_ACCESS_TOKEN || null;
  const oauth2RefreshToken =
    getSetting("x_oauth2_refresh_token", actorId) || process.env.X_OAUTH2_REFRESH_TOKEN || null;
  const handle = getSetting("x_handle", actorId) || process.env.X_HANDLE || null;
  const userId = getSetting("x_user_id", actorId) || null;

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

export function disconnectX(actorId?: string) {
  for (const key of [
    "x_access_token",
    "x_access_token_secret",
    "x_oauth2_access_token",
    "x_oauth2_refresh_token",
    "x_handle",
    "x_user_id",
  ]) {
    deleteSetting(key, actorId);
  }
}

export function getCreatorAddress(actorId?: string) {
  return (
    getSetting("creator_address", actorId) ||
    process.env.FLAUNCH_CREATOR_ADDRESS?.trim() ||
    null
  );
}
