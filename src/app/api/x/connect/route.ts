import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getOperatorIdentity } from "@/lib/server-auth";
import { getAppBaseUrl, getRequestToken } from "@/lib/x-oauth";

export async function GET() {
  try {
    const actor = await getOperatorIdentity();
    const token = await getRequestToken();
    const cookieStore = await cookies();

    cookieStore.set("x_oauth_request_token", token.oauthToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    cookieStore.set("x_oauth_request_secret", token.oauthTokenSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    // Carry the actor ID through the OAuth redirect so the callback can
    // store the tokens under the correct user.
    cookieStore.set("x_oauth_actor_id", actor.actorId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return NextResponse.redirect(token.authorizeUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start X authentication.";
    return NextResponse.redirect(new URL(`/dashboard?x_error=${encodeURIComponent(message)}`, getAppBaseUrl()));
  }
}
