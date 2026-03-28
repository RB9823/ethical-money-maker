import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clerkEnabled } from "@/lib/server-auth";

const linkButtonClass =
  "inline-flex h-8 items-center justify-center rounded-full bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90";

export default function SignInPage() {
  if (!clerkEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fcfbf7,_#f4efe7)] px-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Clerk is not configured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Add the Clerk keys from <code>.env.example</code> to enable authentication. Until then,
              the dashboard runs in demo mode.
            </p>
            <Link href="/dashboard" className={linkButtonClass}>
              Continue To Demo Dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fcfbf7,_#f4efe7)] px-6 py-10">
      <SignIn />
    </main>
  );
}
