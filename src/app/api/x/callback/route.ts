import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { setSetting } from "@/lib/services/settings";
import { exchangeAccessToken } from "@/lib/x-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthToken = url.searchParams.get("oauth_token");
  const oauthVerifier = url.searchParams.get("oauth_verifier");
  const denied = url.searchParams.get("denied");

  if (denied) {
    return NextResponse.redirect(new URL("/dashboard?x_error=Authorization denied", url.origin));
  }

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(new URL("/dashboard?x_error=Missing X callback parameters", url.origin));
  }

  const cookieStore = await cookies();
  const requestToken = cookieStore.get("x_oauth_request_token")?.value;
  const requestSecret = cookieStore.get("x_oauth_request_secret")?.value;
  const actorId = cookieStore.get("x_oauth_actor_id")?.value;

  cookieStore.delete("x_oauth_request_token");
  cookieStore.delete("x_oauth_request_secret");
  cookieStore.delete("x_oauth_actor_id");

  if (!requestToken || !requestSecret || requestToken !== oauthToken) {
    return NextResponse.redirect(new URL("/dashboard?x_error=Invalid or expired X auth session", url.origin));
  }

  try {
    const access = await exchangeAccessToken({
      oauthToken,
      oauthTokenSecret: requestSecret,
      oauthVerifier,
    });

    // Store tokens scoped to this actor so multiple users can each have
    // their own X account connected.
    setSetting("x_access_token", access.accessToken, actorId);
    setSetting("x_access_token_secret", access.accessTokenSecret, actorId);
    if (access.screenName) {
      setSetting("x_handle", access.screenName, actorId);
    }
    if (access.userId) {
      setSetting("x_user_id", access.userId, actorId);
    }

    return NextResponse.redirect(new URL("/dashboard?x_connected=1", url.origin));
  } catch (error) {
    const message = error instanceof Error ? error.message : "X authentication failed.";
    return NextResponse.redirect(new URL(`/dashboard?x_error=${encodeURIComponent(message)}`, url.origin));
  }
}
