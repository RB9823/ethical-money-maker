import Link from "next/link";
import { Activity, ArrowUpRight, DatabaseZap, Flame, RadioTower, ScrollText } from "lucide-react";

import { EventActions } from "@/components/event-actions";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactNumber, formatRelativeWindow } from "@/lib/format";
import { clerkEnabled } from "@/lib/server-auth";

const linkButtonOutlineClass =
  "inline-flex h-8 items-center justify-center rounded-full border border-border bg-background px-2.5 text-sm font-medium transition hover:bg-muted";

type Snapshot = ReturnType<typeof import("@/lib/services/events").getDashboardSnapshot>;

function IntegrationBadge({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <Badge className={enabled ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}>
        {enabled ? "ready" : "demo"}
      </Badge>
    </div>
  );
}

export function DashboardShell({
  snapshot,
}: {
  snapshot: Snapshot;
}) {
  const { events, selectedEvent, selectedSignals, selectedRuns, selectedPackets, selectedDrafts, audit, stats } =
    snapshot;

  const latestDraft = selectedDrafts[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(19,120,134,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(213,117,43,0.18),_transparent_22%),linear-gradient(180deg,_#fcfbf7,_#f4efe7)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10">
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(7,27,36,0.96),_rgba(13,71,78,0.9)_55%,_rgba(190,110,54,0.88))] text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.7)]">
            <CardContent className="space-y-6 p-8 md:p-10">
              <Badge className="w-fit rounded-full bg-white/12 px-3 py-1 text-[11px] tracking-[0.2em] text-white uppercase">
                TinyFish + Dune + Operator Review
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Hot-button event tracking with approval-gated launch and X ops.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/76">
                  The console ingests narrative pressure, confirms it against Base onchain flow,
                  and stages outbound actions for a human operator instead of running an autonomous loop.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/84">
                <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  Small-team workflow via Clerk
                </div>
                <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  SQLite-backed operator history
                </div>
                <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  Base-first launch packet drafting
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Integration State</CardTitle>
              <CardDescription>
                Protected routes are enabled automatically when Clerk keys are present.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <IntegrationBadge label="Clerk Auth" enabled={clerkEnabled} />
              <IntegrationBadge
                label="TinyFish Source"
                enabled={Boolean(process.env.TINYFISH_API_URL && process.env.TINYFISH_API_KEY)}
              />
              <IntegrationBadge label="Dune API" enabled={Boolean(process.env.DUNE_API_KEY)} />
              <IntegrationBadge
                label="fun.xyz Launch Adapter"
                enabled={Boolean(process.env.FUNXYZ_API_URL && process.env.FUNXYZ_API_KEY)}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card id="event-board" className="border-white/60 bg-white/82 shadow-[0_25px_60px_-40px_rgba(18,32,40,0.4)] backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Tracked Events</CardTitle>
                <CardDescription>
                  The left rail is the operator queue. Select an event to inspect the full action surface.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {events.length} live
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[620px] pr-4">
                <div className="space-y-4">
                  {events.map((event) => {
                    const selected = selectedEvent?.id === event.id;
                    return (
                      <Link
                        key={event.id}
                        href={`/dashboard?event=${event.id}`}
                        className={`block rounded-3xl border px-5 py-5 transition-all ${
                          selected
                            ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_24px_60px_-32px_rgba(24,24,27,0.75)]"
                            : "border-zinc-200/80 bg-white hover:border-zinc-900/25 hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge value={event.status} />
                            <StatusBadge value={event.severity} kind="severity" />
                          </div>
                          <span className={`text-sm ${selected ? "text-white/70" : "text-muted-foreground"}`}>
                            {formatRelativeWindow(event.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-4 flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
                            <p className={`max-w-xl text-sm leading-6 ${selected ? "text-white/76" : "text-muted-foreground"}`}>
                              {event.summary}
                            </p>
                          </div>
                          <ArrowUpRight className={`mt-1 size-4 shrink-0 ${selected ? "text-white/80" : "text-zinc-400"}`} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]">
                          <span className={selected ? "text-white/60" : "text-muted-foreground"}>{event.chain}</span>
                          <span className={selected ? "text-white/60" : "text-muted-foreground"}>{event.topic}</span>
                          <span className={selected ? "text-white/60" : "text-muted-foreground"}>
                            {event.confidence}/100
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedEvent ? (
              <Card className="border-white/60 bg-white/82 backdrop-blur">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={selectedEvent.status} />
                    <StatusBadge value={selectedEvent.severity} kind="severity" />
                    <Badge variant="secondary" className="rounded-full">
                      {selectedEvent.chain}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <CardTitle className="text-2xl">{selectedEvent.title}</CardTitle>
                    <CardDescription className="text-base leading-7 text-zinc-600">
                      {selectedEvent.summary}
                    </CardDescription>
                  </div>
                  <EventActions
                    eventId={selectedEvent.id}
                    status={selectedEvent.status as never}
                    latestDraftId={latestDraft?.id}
                  />
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4 rounded-full bg-zinc-100 p-1">
                      <TabsTrigger value="overview" className="rounded-full">
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="dune" className="rounded-full">
                        Dune
                      </TabsTrigger>
                      <TabsTrigger value="outbound" className="rounded-full">
                        Outbound
                      </TabsTrigger>
                      <TabsTrigger value="audit" className="rounded-full">
                        Audit
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-zinc-200/80 shadow-none">
                          <CardHeader>
                            <CardTitle className="text-base">Operator Brief</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>{selectedEvent.recommendedAction}</p>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span>Watchword</span>
                              <span className="font-medium text-foreground">{selectedEvent.watchword}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Bias</span>
                              <span className="font-medium text-foreground">{selectedEvent.marketBias}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Window</span>
                              <span className="font-medium text-foreground">{selectedEvent.eventWindow}</span>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-zinc-200/80 shadow-none">
                          <CardHeader>
                            <CardTitle className="text-base">Signal Strip</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {selectedSignals.map((signal) => (
                              <div key={signal.id} className="rounded-2xl border border-zinc-200/80 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium">{signal.label}</span>
                                  <span className="text-sm text-muted-foreground">{signal.source}</span>
                                </div>
                                <p className="mt-2 text-xl font-semibold">{signal.value}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{signal.note}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="dune" className="space-y-4">
                      {selectedRuns.length ? (
                        selectedRuns.map((run) => (
                          <Card key={run.id} className="border-zinc-200/80 shadow-none">
                            <CardHeader>
                              <div className="flex items-center justify-between gap-3">
                                <CardTitle className="text-base">Execution {run.executionId}</CardTitle>
                                <Badge variant="secondary" className="rounded-full">
                                  {run.verdict}
                                </Badge>
                              </div>
                              <CardDescription>{formatRelativeWindow(run.executedAt)}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-3">
                              {Object.entries(run.metrics).map(([key, value]) => (
                                <div key={key} className="rounded-2xl border border-zinc-200/80 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                                  <p className="mt-2 text-lg font-semibold">
                                    {typeof value === "number" && value > 100
                                      ? formatCompactNumber(value)
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No Dune runs yet for this event.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="outbound" className="grid gap-4 md:grid-cols-2">
                      <Card className="border-zinc-200/80 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-base">Launch Packets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {selectedPackets.length ? (
                            selectedPackets.map((packet) => (
                              <div key={packet.id} className="rounded-2xl border border-zinc-200/80 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">{packet.tokenName}</p>
                                    <p className="text-sm text-muted-foreground">{packet.tokenSymbol}</p>
                                  </div>
                                  <Badge variant="secondary" className="rounded-full">
                                    {packet.status}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{packet.thesis}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No launch packet yet.</p>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border-zinc-200/80 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-base">X Drafts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {selectedDrafts.length ? (
                            selectedDrafts.map((draft) => (
                              <div key={draft.id} className="rounded-2xl border border-zinc-200/80 px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <Badge variant="secondary" className="rounded-full">
                                    {draft.status}
                                  </Badge>
                                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    {draft.platform}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{draft.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No draft generated yet.</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="audit">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead>Actor</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {audit.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.action}</TableCell>
                              <TableCell>{entry.outcome}</TableCell>
                              <TableCell>{entry.actorName}</TableCell>
                              <TableCell>{formatRelativeWindow(entry.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ScrollText className="size-5" />
                Approval Ledger
              </CardTitle>
              <CardDescription>The console records each operator-side state transition.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audit.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 px-4 py-4">
                    <Avatar className="size-10 border border-zinc-200">
                      <AvatarFallback className="bg-zinc-100 text-sm text-zinc-700">
                        {entry.actorName
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {entry.actorName} <span className="font-normal text-muted-foreground">{entry.action}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{entry.note || "No note attached."}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {entry.outcome} · {formatRelativeWindow(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/60 bg-white/82 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="size-5" />
                Operating Notes
              </CardTitle>
              <CardDescription>V1 is set up for safe operator workflows, not autonomous market actions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50 px-5 py-5">
                <Flame className="size-5 text-orange-600" />
                <h3 className="mt-3 font-semibold">TinyFish Primary</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Narrative ingest enters the queue from TinyFish first, then receives internal scoring.
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50 px-5 py-5">
                <DatabaseZap className="size-5 text-teal-700" />
                <h3 className="mt-3 font-semibold">Dune Confirmation</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Saved-query checks add an operator-readable verdict before escalation.
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-zinc-50 px-5 py-5">
                <RadioTower className="size-5 text-violet-700" />
                <h3 className="mt-3 font-semibold">Manual Outbound</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Launch packets and X drafts remain approval-gated and draft-first even when provider keys exist.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {!clerkEnabled ? (
          <Card className="border-dashed border-zinc-300 bg-white/70">
            <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                Clerk is not configured, so the app is running in demo mode. Add the keys from
                <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5">.env.example</code>
                to turn on protected routes and real user attribution.
              </p>
              <Link
                href="/"
                className={linkButtonOutlineClass}
              >
                Back to landing
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
