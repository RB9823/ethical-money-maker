import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, ShieldCheck, Sparkles, Waves } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clerkEnabled } from "@/lib/server-auth";
import { getDashboardSnapshot } from "@/lib/services/events";

const linkButtonClass =
  "inline-flex h-8 items-center justify-center rounded-full px-2.5 text-sm font-medium transition";
const linkButtonOutlineClass =
  `${linkButtonClass} border border-border bg-background hover:bg-muted`;
const linkButtonSolidClass =
  `${linkButtonClass} bg-primary text-primary-foreground hover:opacity-90`;

export default async function Home() {
  const session = clerkEnabled ? await auth() : null;
  const snapshot = getDashboardSnapshot();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(19,120,134,0.22),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(215,117,39,0.18),_transparent_28%),linear-gradient(180deg,_#fcfbf7,_#f4efe7)] px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-950 text-white">
              <Waves className="size-4" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Ethical Money Maker</p>
              <p className="text-sm text-muted-foreground">Operator-first signal console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={linkButtonOutlineClass}>
              Open Dashboard
            </Link>
            {clerkEnabled && !session?.userId ? (
              <Link href="/sign-in" className={linkButtonSolidClass}>
                Sign In
              </Link>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,_rgba(12,24,30,0.98),_rgba(17,80,87,0.9)_55%,_rgba(190,110,54,0.88))] px-8 py-10 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.75)]">
            <Badge className="rounded-full bg-white/12 px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-white">
              TinyFish / Dune / Base / Clerk
            </Badge>
            <div className="mt-6 space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Track hot-button events, confirm them onchain, and stage operator-reviewed actions.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/78">
                The app is built for a small internal team: narrative ingest, Dune confirmation,
                launch packet drafting, and X post review all live in one SQLite-backed Next.js console.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className={`${linkButtonClass} rounded-full bg-white text-zinc-950 hover:bg-white/90`}
              >
                Explore Live Queue
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md"
                className={`${linkButtonClass} rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white`}
              >
                Superpowers Install Notes
              </Link>
            </div>
          </div>

          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Current Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {snapshot.stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-zinc-200/80 bg-zinc-50 px-5 py-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <ShieldCheck className="size-5 text-teal-700" />
              <CardTitle>Approval-Gated</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              Every transition, packet draft, and post approval is recorded in an operator ledger.
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <Sparkles className="size-5 text-amber-700" />
              <CardTitle>Dune As Confirmation Layer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              TinyFish detects narrative pressure first; Dune metrics decide whether the event is worth escalation.
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <Waves className="size-5 text-violet-700" />
              <CardTitle>Base-First Outbound Surface</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              Launch packets are drafted for Base and fun.xyz, while X output remains human-approved.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
