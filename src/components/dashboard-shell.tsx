import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ExternalLink,
  MessageSquarePlus,
  Radar,
} from "lucide-react";

import { EventDetailScroll } from "@/components/event-detail-scroll";
import { EventActions } from "@/components/event-actions";
import { PendingDraftsPanel } from "@/components/pending-drafts-panel";
import { StatusBadge } from "@/components/status-badge";
import { SweepButton } from "@/components/sweep-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSettingsPanel } from "@/components/user-settings-panel";
import { formatCompactNumber, formatRelativeWindow } from "@/lib/format";
import { clerkEnabled } from "@/lib/server-auth";

const surfaceClass =
  "border-white/70 bg-white/86 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl";
const insetClass =
  "rounded-[22px] border border-zinc-200/80 bg-zinc-50/88";
const monoLabelClass = "text-[11px] uppercase tracking-[0.22em] text-zinc-500";
const linkButtonOutlineClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted";

type Snapshot = ReturnType<typeof import("@/lib/services/events").getDashboardSnapshot>;

function getFlaunchStatusUrl(jobId: string) {
  return `https://web2-api.flaunch.gg/api/v1/launch-status/${jobId}`;
}

function getBlockExplorerBase(network: string) {
  return network === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-950">{value}</span>
    </div>
  );
}

function SnapshotPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`${insetClass} px-3 py-3 ${
        tone === "accent"
          ? "border-amber-200/90 bg-amber-50/95"
          : ""
      }`}
    >
      <p className={monoLabelClass}>{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function DetailsDisclosure({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-[22px] border border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-700">
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export function DashboardShell({
  snapshot,
  xError,
  xConnected,
}: {
  snapshot: Snapshot;
  xError?: string;
  xConnected?: boolean;
}) {
  const {
    events,
    selectedEvent,
    selectedCandidate,
    selectedSignals,
    selectedRuns,
    selectedPackets,
    selectedDrafts,
    pendingDrafts,
    audit,
    xConnection,
    creatorAddress,
  } = snapshot;

  const latestDraft = selectedDrafts[0];
  const latestPacket = selectedPackets[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(12,102,116,0.18),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(202,113,53,0.18),_transparent_18%),linear-gradient(180deg,_#fbfaf6,_#f1ece2)]">
      <EventDetailScroll eventId={selectedEvent?.id} />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section>
          <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,_rgba(10,22,29,0.98),_rgba(24,80,84,0.92)_58%,_rgba(174,110,68,0.86))] text-white shadow-[0_28px_70px_-48px_rgba(15,23,42,0.58)]">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <Badge className="w-fit rounded-full bg-white/12 px-3 py-1 text-[11px] tracking-[0.2em] text-white uppercase">
                Hyde operator console
              </Badge>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-2xl font-semibold tracking-tight sm:text-4xl">
                    Track narratives, stage launches, and review outbound ops from one board.
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
                    Hyde is a human-in-the-loop signal desk. TinyFish provides narrative pressure,
                    Dune confirms flow, and outbound actions stay review-gated.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SnapshotPill label="Queue" value={`${events.length} live`} tone="accent" />
                    <SnapshotPill label="Drafts" value={`${pendingDrafts.length} pending`} />
                    <SnapshotPill label="Focus" value={selectedEvent?.watchword ?? "none"} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={clerkEnabled ? "bg-emerald-600 text-white" : "bg-white/14 text-white"}>Clerk</Badge>
                    <Badge className={process.env.TINYFISH_API_URL && process.env.TINYFISH_API_KEY ? "bg-emerald-600 text-white" : "bg-white/14 text-white"}>TinyFish</Badge>
                    <Badge className={process.env.DUNE_API_KEY ? "bg-emerald-600 text-white" : "bg-white/14 text-white"}>Dune</Badge>
                    <Badge className="bg-white/14 text-white">Flaunch</Badge>
                    <Badge className={xConnection.connected ? "bg-emerald-600 text-white" : "bg-white/14 text-white"}>
                      X {xConnection.connected ? (xConnection.handle ? `@${xConnection.handle}` : "ready") : "needs auth"}
                    </Badge>
                    <Badge className={creatorAddress ? "bg-emerald-600 text-white" : "bg-white/14 text-white"}>
                      Wallet {creatorAddress ? "set" : "not set"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {xError ? (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4 text-sm text-rose-900">
              X connection failed: {xError}
            </CardContent>
          </Card>
        ) : null}

        {xConnected ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 text-sm text-emerald-900">
              X account connected successfully.
            </CardContent>
          </Card>
        ) : null}

        <section className="grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-6">
            <Card id="event-board" className={surfaceClass}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Tracked Events</CardTitle>
                  <CardDescription>
                    Hyde treats this rail like an operator inbox. Sweep brings in fresh TinyFish narratives.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {events.length} live
                  </Badge>
                  <SweepButton size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-14rem)] min-h-[520px] pr-4">
                  {events.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
                      <Radar className="size-10 text-zinc-300" />
                      <div className="space-y-1">
                        <p className="font-medium">No events yet</p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                          Run a sweep to ingest the latest hot-button narratives from TinyFish.
                        </p>
                      </div>
                      <SweepButton variant="default" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => {
                        const selected = selectedEvent?.id === event.id;

                        return (
                          <Link
                            key={event.id}
                            href={`/dashboard?event=${event.id}`}
                            scroll={false}
                            className={`group block rounded-[24px] border px-3.5 py-3.5 transition-all ${
                              selected
                                ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_24px_64px_-38px_rgba(24,24,27,0.82)]"
                                : "border-zinc-200/80 bg-white/90 hover:border-zinc-900/25 hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge value={event.status} />
                                <StatusBadge value={event.severity} kind="severity" />
                              </div>
                              <span className={`text-xs uppercase tracking-[0.18em] ${selected ? "text-white/60" : "text-zinc-500"}`}>
                                {formatRelativeWindow(event.updatedAt)}
                              </span>
                            </div>

                            <div className="mt-3 flex items-start justify-between gap-3">
                              <div className="space-y-2">
                                <h3 className="text-[15px] font-semibold leading-tight sm:text-base">{event.title}</h3>
                                <p className={`line-clamp-2 text-sm leading-5.5 ${selected ? "text-white/74" : "text-zinc-600"}`}>
                                  {event.summary}
                                </p>
                              </div>
                              <ArrowUpRight className={`mt-1 size-4 shrink-0 transition ${selected ? "text-white/75" : "text-zinc-400 group-hover:text-zinc-900"}`} />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className={selected ? "bg-white/10 text-white" : ""}>
                                {event.chain}
                              </Badge>
                              <Badge variant="secondary" className={selected ? "bg-white/10 text-white" : ""}>
                                {event.confidence}/100 confidence
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div id="event-detail" className="space-y-6 scroll-mt-6">
            {selectedEvent ? (
              <>
                <Card className={surfaceClass}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="space-y-5">
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge value={selectedEvent.status} />
                          <StatusBadge value={selectedEvent.severity} kind="severity" />
                          <Badge variant="secondary" className="rounded-full">
                            {selectedEvent.topic}
                          </Badge>
                          <span className="text-sm text-zinc-500">
                            Updated {formatRelativeWindow(selectedEvent.updatedAt)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <h2 className="max-w-4xl text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                            {selectedEvent.title}
                          </h2>
                          <p className="max-w-4xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
                            {selectedEvent.summary}
                          </p>
                        </div>

                        <div className={`${insetClass} px-4 py-4`}>
                          <p className={monoLabelClass}>Operator brief</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-700">
                            {selectedEvent.recommendedAction}
                          </p>
                        </div>

                        <EventActions
                          eventId={selectedEvent.id}
                          status={selectedEvent.status as never}
                          latestDraftId={latestDraft?.id}
                          latestPacketId={latestPacket?.id}
                          latestPacketStatus={latestPacket?.status}
                          latestPacketJobId={latestPacket?.jobId}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={surfaceClass}>
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-2 gap-1 rounded-[18px] bg-zinc-100/90 p-1 md:grid-cols-5">
                        <TabsTrigger value="overview" className="rounded-[18px]">Overview</TabsTrigger>
                        <TabsTrigger value="dune" className="rounded-[18px]">Dune</TabsTrigger>
                        <TabsTrigger value="outbound" className="rounded-[18px]">
                          Outbound
                          {(selectedPackets.length > 0 || selectedDrafts.length > 0) && (
                            <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                              {selectedPackets.length + selectedDrafts.length}
                            </span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-[18px]">Audit</TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-[18px]">
                          Settings
                          {!xConnection.connected || !creatorAddress ? (
                            <span className="ml-1.5 inline-flex size-2 rounded-full bg-amber-500" />
                          ) : null}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-3">
                        <Card className="border-zinc-200/80 shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Event Snapshot</CardTitle>
                            <CardDescription>
                              The core facts, source context, and immediate operator read.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                              <SnapshotPill label="Watchword" value={selectedEvent.watchword} tone="accent" />
                              <SnapshotPill label="Bias" value={selectedEvent.marketBias} />
                              <SnapshotPill label="Window" value={selectedEvent.eventWindow} />
                              <SnapshotPill label="Confidence" value={`${selectedEvent.confidence}/100`} />
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
                              <div className="space-y-3">
                                {selectedSignals.length === 0 ? (
                                  <div className={`${insetClass} px-4 py-4 text-sm text-muted-foreground`}>
                                    No signals yet. Run <strong>Dune Confirm</strong> to add onchain data.
                                  </div>
                                ) : (
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {selectedSignals.slice(0, 4).map((signal) => (
                                      <div key={signal.id} className={`${insetClass} px-4 py-4`}>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-sm font-medium text-zinc-950">{signal.label}</span>
                                          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                            {signal.source}
                                          </span>
                                        </div>
                                        <p className="mt-2.5 text-xl font-semibold text-zinc-950">{signal.value}</p>
                                        <p className="mt-1.5 text-sm leading-5.5 text-zinc-600">{signal.note}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className={`${insetClass} space-y-4 px-4 py-4`}>
                                  <KeyValue label="Source" value={selectedCandidate?.source || "tracked-event"} />
                                  {selectedCandidate?.headline ? (
                                    <div className="space-y-1">
                                      <p className={monoLabelClass}>Candidate headline</p>
                                      <p className="text-sm font-medium leading-6 text-zinc-950">
                                        {selectedCandidate.headline}
                                      </p>
                                    </div>
                                  ) : null}
                                  {selectedCandidate?.summary ? (
                                    <div className="space-y-1">
                                      <p className={monoLabelClass}>Candidate summary</p>
                                      <p className="text-sm leading-7 text-zinc-600">
                                        {selectedCandidate.summary}
                                      </p>
                                    </div>
                                  ) : null}
                                  {selectedCandidate?.rawPayload ? (
                                    <DetailsDisclosure label="Raw source payload">
                                      <pre className="overflow-x-auto text-xs leading-6 text-zinc-700">
{JSON.stringify(selectedCandidate.rawPayload, null, 2)}
                                      </pre>
                                    </DetailsDisclosure>
                                  ) : null}
                                </div>
                              </div>

                              <div className={`${insetClass} space-y-2.5 px-4 py-4`}>
                                <KeyValue label="Created" value={formatRelativeWindow(selectedEvent.createdAt)} />
                                <KeyValue label="Updated" value={formatRelativeWindow(selectedEvent.updatedAt)} />
                                <KeyValue label="Topic" value={selectedEvent.topic} />
                                {selectedCandidate?.externalId ? (
                                  <KeyValue label="Source ID" value={selectedCandidate.externalId} />
                                ) : null}
                                {selectedCandidate?.occurredAt ? (
                                  <KeyValue label="Occurred" value={formatRelativeWindow(selectedCandidate.occurredAt)} />
                                ) : null}
                                <Separator />
                                <p className="text-sm leading-6 text-zinc-600">
                                  Hyde treats a Dune pass as a sanity check before escalation, not as an autonomous trigger.
                                </p>
                                {selectedEvent.operatorNote ? (
                                  <div className="rounded-[18px] border border-amber-200/80 bg-amber-50 px-3 py-3">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-700">
                                      Operator Note
                                    </p>
                                    <p className="mt-2 text-sm leading-7 text-amber-900">
                                      {selectedEvent.operatorNote}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="dune" className="space-y-3">
                        {selectedRuns.length ? (
                          selectedRuns.slice(0, 2).map((run) => (
                            <Card key={run.id} className="border-zinc-200/80 shadow-none">
                              <CardHeader className="pb-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <CardTitle className="text-base">Execution {run.executionId}</CardTitle>
                                    <CardDescription>{formatRelativeWindow(run.executedAt)}</CardDescription>
                                  </div>
                                  <Badge variant="secondary" className="rounded-full">
                                    {run.verdict}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                {Object.entries(run.metrics).slice(0, 4).map(([key, value]) => (
                                  <div key={key} className={`${insetClass} px-4 py-4`}>
                                    <p className={monoLabelClass}>{key}</p>
                                    <p className="mt-3 text-2xl font-semibold text-zinc-950">
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
                          <Card className="border-zinc-200/80 shadow-none">
                            <CardContent className="p-6 text-sm text-muted-foreground">
                              No Dune runs yet. Click <strong>Dune Confirm</strong> to fire the onchain check.
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="outbound">
                        <Card className="border-zinc-200/80 shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Outbound Stack</CardTitle>
                            <CardDescription>
                              The current launch surface and latest X drafts for this event.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-zinc-950">Launch</h3>
                                <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                  {selectedPackets.length} packet{selectedPackets.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              {selectedPackets.length ? (
                                selectedPackets.slice(0, 1).map((packet) => (
                                  <div key={packet.id} className="rounded-[22px] border border-zinc-200/80 bg-white px-4 py-4">
                                  <div className="grid gap-4 md:grid-cols-[156px_minmax(0,1fr)]">
                                    <div>
                                      {packet.imageDataUrl ? (
                                        <Image
                                          src={packet.imageDataUrl}
                                          alt={`${packet.tokenName} launch art`}
                                          width={1024}
                                          height={1024}
                                          unoptimized
                                          className="aspect-square w-full rounded-[18px] object-cover"
                                        />
                                      ) : (
                                        <div className="flex aspect-square w-full items-center justify-center rounded-[18px] border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center">
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium text-zinc-950">No launch art</p>
                                            <p className="text-xs leading-5 text-zinc-500">
                                              Prepare a fresh packet to generate token art.
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <p className="text-lg font-semibold text-zinc-950">{packet.tokenName}</p>
                                          <p className="text-sm text-zinc-500">
                                            {packet.tokenSymbol} · {packet.network}
                                          </p>
                                        </div>
                                        <Badge variant="secondary" className="rounded-full">
                                          {packet.status}
                                        </Badge>
                                      </div>

                                      <p className="text-sm leading-6 text-zinc-600">{packet.thesis}</p>

                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <div className={`${insetClass} px-4 py-3`}>
                                          <p className={monoLabelClass}>Provider</p>
                                          <p className="mt-2 text-sm font-medium text-zinc-950">
                                            {packet.providerStatus || "draft"}
                                          </p>
                                        </div>
                                        <div className={`${insetClass} px-4 py-3`}>
                                          <p className={monoLabelClass}>Job</p>
                                          <p className="mt-2 truncate text-sm font-medium text-zinc-950">
                                            {packet.jobId || "not queued"}
                                          </p>
                                        </div>
                                        {packet.errorMessage ? (
                                          <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
                                            {packet.errorMessage}
                                          </div>
                                        ) : null}
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        {packet.jobId ? (
                                          <Link
                                            href={getFlaunchStatusUrl(packet.jobId)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={linkButtonOutlineClass}
                                          >
                                            <ExternalLink className="size-4" />
                                            Verify queue
                                          </Link>
                                        ) : null}
                                        {packet.transactionHash ? (
                                          <Link
                                            href={`${getBlockExplorerBase(packet.network)}/tx/${packet.transactionHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={linkButtonOutlineClass}
                                          >
                                            <ExternalLink className="size-4" />
                                            View tx
                                          </Link>
                                        ) : null}
                                        {packet.collectionTokenAddress ? (
                                          <Link
                                            href={`${getBlockExplorerBase(packet.network)}/address/${packet.collectionTokenAddress}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={linkButtonOutlineClass}
                                          >
                                            <ExternalLink className="size-4" />
                                            View token
                                          </Link>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No launch packet yet. Click <strong>Prepare Packet</strong> to generate one.
                                </p>
                              )}
                            </div>

                            <Separator />

                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-zinc-950">X Drafts</h3>
                                <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                  {selectedDrafts.length} draft{selectedDrafts.length === 1 ? "" : "s"}
                                </span>
                              </div>
                              {selectedDrafts.length ? (
                                selectedDrafts.slice(0, 3).map((draft) => (
                                  <div key={draft.id} className="rounded-[22px] border border-zinc-200/80 bg-white px-4 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="rounded-full">
                                          {draft.status}
                                        </Badge>
                                        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                          {draft.platform}
                                        </span>
                                      </div>
                                      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                        {formatRelativeWindow(draft.createdAt)}
                                      </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-zinc-800">{draft.content}</p>
                                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
                                      {draft.hashtags}
                                    </p>
                                    {"url" in draft.provider && typeof draft.provider.url === "string" ? (
                                      <Link
                                        href={draft.provider.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted"
                                      >
                                        <ExternalLink className="size-4" />
                                        View post
                                      </Link>
                                    ) : null}
                                    {"error" in draft.provider && typeof draft.provider.error === "string" ? (
                                      <p className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                                        {draft.provider.error}
                                      </p>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No draft yet. Click <strong>Draft X Post</strong> to generate one.
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="audit" className="space-y-3">
                        {audit.length === 0 ? (
                          <Card className="border-zinc-200/80 shadow-none">
                            <CardContent className="p-6 text-sm text-muted-foreground">
                              No actions recorded yet.
                            </CardContent>
                          </Card>
                        ) : (
                          audit.map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3 rounded-[26px] border border-zinc-200/80 bg-white px-4 py-4">
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
                                <p className="font-medium text-zinc-950">
                                  {entry.actorName}{" "}
                                  <span className="font-normal text-zinc-500">{entry.action}</span>
                                </p>
                                <p className="text-sm leading-6 text-zinc-600">
                                  {entry.note || "No note attached."}
                                </p>
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                  {entry.outcome} · {formatRelativeWindow(entry.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-3">
                        <Card className="border-zinc-200/80 shadow-none">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Your Account Settings</CardTitle>
                            <CardDescription>
                              Each operator connects their own X account and Base wallet. Hyde uses
                              your credentials only for actions you explicitly approve.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <UserSettingsPanel
                              xConnected={xConnection.connected}
                              xHandle={xConnection.handle}
                              creatorAddress={creatorAddress}
                            />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className={surfaceClass}>
                <CardContent className="flex flex-col items-center justify-center gap-5 py-20 text-center">
                  <Activity className="size-10 text-zinc-300" />
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-zinc-950">Select an event to inspect it</p>
                    <p className="max-w-md text-sm leading-7 text-zinc-500">
                      Hyde’s operator flow is <strong>new → watch → Dune confirm → prepare packet → submit → draft post → approve</strong>.
                    </p>
                  </div>
                  {events.length === 0 ? (
                    <div className="space-y-2 text-sm text-zinc-500">
                      <p>Start by running a sweep to pull events from TinyFish.</p>
                      <SweepButton variant="default" />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {pendingDrafts.length > 0 ? (
          <Card className={surfaceClass}>
            <CardContent className="flex gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <MessageSquarePlus className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-zinc-950">Pending drafts</h3>
                <PendingDraftsPanel drafts={pendingDrafts.slice(0, 4)} />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!clerkEnabled ? (
          <Card className="border-dashed border-zinc-300 bg-white/70">
            <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                Clerk is not configured, so Hyde is running in demo mode. Add the keys from
                <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5">.env.example</code>
                to enable protected routes and real user attribution.
              </p>
              <Link href="/" className={linkButtonOutlineClass}>
                Back to landing
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
