import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAppBaseUrl, getRequestToken } from "@/lib/x-oauth";

export async function GET() {
  try {
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

    return NextResponse.redirect(token.authorizeUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start X authentication.";
    return NextResponse.redirect(new URL(`/dashboard?x_error=${encodeURIComponent(message)}`, getAppBaseUrl()));
  }
}
