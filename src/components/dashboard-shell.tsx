import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ExternalLink,
  Radar,
} from "lucide-react";

import { EventDetailScroll } from "@/components/event-detail-scroll";
import { EventActions } from "@/components/event-actions";
import { OutboundDraftsList } from "@/components/outbound-drafts-list";
import { PendingDraftsPanel } from "@/components/pending-drafts-panel";
import { StatusBadge } from "@/components/status-badge";
import { SweepButton } from "@/components/sweep-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

function KeyValue({ label, value }: { label: string; value: string }) {
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
    <div className={`${insetClass} px-3 py-3 ${tone === "accent" ? "border-amber-200/90 bg-amber-50/95" : ""}`}>
      <p className={monoLabelClass}>{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function DetailsDisclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="rounded-[22px] border border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-700">{label}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/55">
      <span className={`size-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-white/25"}`} />
      {label}
    </span>
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

      {/* Compact header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[linear-gradient(135deg,rgba(10,22,29,0.97),rgba(24,80,84,0.95)_60%,rgba(174,110,68,0.90))] backdrop-blur-xl">
        <div className="mx-auto flex h-13 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.2em] text-white uppercase">Hyde</span>
            <span className="hidden text-white/20 sm:block">·</span>
            <span className="hidden text-xs text-white/45 sm:block">
              {events.length} events · {pendingDrafts.length} pending
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <StatusDot
                active={!!xConnection.connected}
                label={xConnection.handle ? `@${xConnection.handle}` : "X"}
              />
              <StatusDot active={!!creatorAddress} label="Wallet" />
            </div>
            <SweepButton size="sm" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">

        {/* Alert banners */}
        {xError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            X connection failed: {xError}
          </div>
        ) : null}
        {xConnected ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            X account connected.
          </div>
        ) : null}

        <section className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* Event list */}
          <div className="xl:sticky xl:top-[calc(3.25rem+1.25rem)]">
            <Card id="event-board" className={surfaceClass}>
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <span className="font-semibold text-zinc-950">Events</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full text-xs">{events.length}</Badge>
                  <SweepButton size="sm" />
                </div>
              </div>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-11rem)] min-h-[480px] pr-3">
                  {events.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
                      <Radar className="size-9 text-zinc-300" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-zinc-700">No events yet</p>
                        <p className="max-w-[200px] text-xs text-zinc-400">
                          Run a sweep to pull narratives from TinyFish.
                        </p>
                      </div>
                      <SweepButton variant="default" />
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {events.map((event) => {
                        const selected = selectedEvent?.id === event.id;
                        return (
                          <Link
                            key={event.id}
                            href={`/dashboard?event=${event.id}`}
                            scroll={false}
                            className={`group block rounded-[22px] border px-3.5 py-3.5 transition-all ${
                              selected
                                ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_20px_56px_-32px_rgba(24,24,27,0.82)]"
                                : "border-zinc-200/80 bg-white/90 hover:border-zinc-900/25 hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge value={event.status} />
                                <StatusBadge value={event.severity} kind="severity" />
                              </div>
                              <span className={`text-[11px] ${selected ? "text-white/45" : "text-zinc-400"}`}>
                                {formatRelativeWindow(event.updatedAt)}
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h3 className="text-[14px] font-semibold leading-tight">{event.title}</h3>
                                <p className={`line-clamp-2 text-xs leading-[1.6] ${selected ? "text-white/60" : "text-zinc-500"}`}>
                                  {event.summary}
                                </p>
                              </div>
                              <ArrowUpRight className={`mt-0.5 size-3.5 shrink-0 transition ${selected ? "text-white/50" : "text-zinc-300 group-hover:text-zinc-600"}`} />
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${selected ? "bg-white/10 text-white/75" : "bg-zinc-100 text-zinc-500"}`}>
                                {event.chain}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${selected ? "bg-white/10 text-white/75" : "bg-zinc-100 text-zinc-500"}`}>
                                {event.confidence}%
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${selected ? "bg-white/8 text-white/60" : "bg-zinc-100 text-zinc-400"}`}>
                                {event.watchword}
                              </span>
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

          {/* Event detail */}
          <div id="event-detail" className="scroll-mt-[calc(3.25rem+1.25rem)]">
            {selectedEvent ? (
              <Card className={surfaceClass}>
                {/* Title + actions */}
                <div className="space-y-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={selectedEvent.status} />
                    <StatusBadge value={selectedEvent.severity} kind="severity" />
                    <Badge variant="secondary" className="rounded-full">{selectedEvent.topic}</Badge>
                    <span className="text-xs text-zinc-400">
                      Updated {formatRelativeWindow(selectedEvent.updatedAt)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                      {selectedEvent.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                      {selectedEvent.summary}
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

                {/* Tabs */}
                <div className="px-5 py-5 sm:px-6">
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 gap-1 rounded-[16px] bg-zinc-100/90 p-1 md:grid-cols-5">
                      <TabsTrigger value="overview" className="rounded-[14px]">Overview</TabsTrigger>
                      <TabsTrigger value="dune" className="rounded-[14px]">Dune</TabsTrigger>
                      <TabsTrigger value="outbound" className="rounded-[14px]">
                        Outbound
                        {(selectedPackets.length > 0 || selectedDrafts.length > 0) ? (
                          <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                            {selectedPackets.length + selectedDrafts.length}
                          </span>
                        ) : null}
                      </TabsTrigger>
                      <TabsTrigger value="audit" className="rounded-[14px]">Audit</TabsTrigger>
                      <TabsTrigger value="settings" className="rounded-[14px]">
                        Settings
                        {!xConnection.connected || !creatorAddress ? (
                          <span className="ml-1.5 size-2 rounded-full bg-amber-500" />
                        ) : null}
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview */}
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <SnapshotPill label="Watchword" value={selectedEvent.watchword} tone="accent" />
                        <SnapshotPill label="Confidence" value={`${selectedEvent.confidence}/100`} />
                        <SnapshotPill label="Window" value={selectedEvent.eventWindow} />
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_280px]">
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
                                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">{signal.source}</span>
                                  </div>
                                  <p className="mt-2.5 text-xl font-semibold text-zinc-950">{signal.value}</p>
                                  <p className="mt-1 text-xs leading-5 text-zinc-500">{signal.note}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {(selectedCandidate?.headline || selectedCandidate?.summary || selectedCandidate?.rawPayload) ? (
                            <div className={`${insetClass} space-y-3 px-4 py-4`}>
                              <p className={monoLabelClass}>Source · {selectedCandidate?.source ?? "TinyFish"}</p>
                              {selectedCandidate?.headline ? (
                                <p className="text-sm font-medium leading-6 text-zinc-950">
                                  {selectedCandidate.headline}
                                </p>
                              ) : null}
                              {selectedCandidate?.summary ? (
                                <p className="text-sm leading-6 text-zinc-500">
                                  {selectedCandidate.summary}
                                </p>
                              ) : null}
                              {selectedCandidate?.rawPayload && Object.keys(selectedCandidate.rawPayload).length > 0 ? (
                                <DetailsDisclosure label="Raw payload">
                                  <div className="space-y-2">
                                    {Object.entries(selectedCandidate.rawPayload).map(([key, value]) => (
                                      <div key={key} className="flex items-start justify-between gap-4">
                                        <span className="font-mono text-xs text-zinc-400">{key}</span>
                                        <span className="break-all text-right font-mono text-xs text-zinc-800">
                                          {typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                                            ? String(value)
                                            : JSON.stringify(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </DetailsDisclosure>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        {/* Detail column */}
                        <div className={`${insetClass} space-y-2.5 px-4 py-4`}>
                          <KeyValue label="Created" value={formatRelativeWindow(selectedEvent.createdAt)} />
                          <KeyValue label="Updated" value={formatRelativeWindow(selectedEvent.updatedAt)} />
                          <KeyValue label="Topic" value={selectedEvent.topic} />
                          <KeyValue label="Watchword" value={selectedEvent.watchword} />
                          <KeyValue label="Bias" value={selectedEvent.marketBias} />
                          <KeyValue label="Window" value={selectedEvent.eventWindow} />
                          <KeyValue label="Severity" value={selectedEvent.severity} />
                          {selectedCandidate?.externalId ? (
                            <KeyValue label="Source ID" value={selectedCandidate.externalId} />
                          ) : null}
                          {selectedCandidate?.occurredAt ? (
                            <KeyValue label="Occurred" value={formatRelativeWindow(selectedCandidate.occurredAt)} />
                          ) : null}
                          {selectedEvent.operatorNote ? (
                            <>
                              <Separator />
                              <div className="rounded-[14px] border border-amber-200/80 bg-amber-50 px-3 py-3">
                                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600">Note</p>
                                <p className="mt-1.5 text-xs leading-5 text-amber-800">{selectedEvent.operatorNote}</p>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Dune */}
                    <TabsContent value="dune" className="space-y-3">
                      {selectedRuns.length ? (
                        selectedRuns.slice(0, 2).map((run) => (
                          <div key={run.id} className={`${insetClass} px-5 py-4`}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-zinc-950">Execution {run.executionId}</p>
                                <p className="text-xs text-zinc-400">{formatRelativeWindow(run.executedAt)}</p>
                              </div>
                              <Badge variant="secondary" className="rounded-full">{run.verdict}</Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                              {Object.entries(run.metrics).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="rounded-[16px] border border-zinc-200/60 bg-white px-3 py-3">
                                  <p className={monoLabelClass}>{key}</p>
                                  <p className="mt-2 text-xl font-semibold text-zinc-950">
                                    {typeof value === "number" && value > 100
                                      ? formatCompactNumber(value)
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No Dune runs yet. Click <strong>Dune Confirm</strong> to fire the onchain check.
                        </p>
                      )}
                    </TabsContent>

                    {/* Outbound */}
                    <TabsContent value="outbound" className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-950">Launch</p>
                          <span className={monoLabelClass}>
                            {selectedPackets.length} packet{selectedPackets.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        {selectedPackets.length ? (
                          selectedPackets.slice(0, 1).map((packet) => (
                            <div key={packet.id} className={`${insetClass} p-4`}>
                              <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                                <div>
                                  {packet.imageDataUrl ? (
                                    <Image
                                      src={packet.imageDataUrl}
                                      alt={`${packet.tokenName} launch art`}
                                      width={1024}
                                      height={1024}
                                      unoptimized
                                      className="aspect-square w-full rounded-[14px] object-cover"
                                    />
                                  ) : (
                                    <div className="flex aspect-square w-full items-center justify-center rounded-[14px] border border-dashed border-zinc-300 bg-white/80">
                                      <p className="text-center text-xs text-zinc-400">No art yet</p>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-zinc-950">{packet.tokenName}</p>
                                      <p className="text-xs text-zinc-400">{packet.tokenSymbol} · {packet.network}</p>
                                    </div>
                                    <Badge variant="secondary" className="rounded-full">{packet.status}</Badge>
                                  </div>
                                  <p className="text-sm leading-6 text-zinc-600">{packet.thesis}</p>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                                    <span>Provider: <strong className="text-zinc-700">{packet.providerStatus || "draft"}</strong></span>
                                    <span>Job: <strong className="text-zinc-700">{packet.jobId ? `${packet.jobId.slice(0, 10)}…` : "–"}</strong></span>
                                  </div>
                                  {packet.errorMessage ? (
                                    <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                                      {packet.errorMessage}
                                    </p>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2">
                                    {packet.jobId ? (
                                      <Link href={getFlaunchStatusUrl(packet.jobId)} target="_blank" rel="noreferrer" className={linkButtonOutlineClass}>
                                        <ExternalLink className="size-3.5" /> Verify queue
                                      </Link>
                                    ) : null}
                                    {packet.transactionHash ? (
                                      <Link href={`${getBlockExplorerBase(packet.network)}/tx/${packet.transactionHash}`} target="_blank" rel="noreferrer" className={linkButtonOutlineClass}>
                                        <ExternalLink className="size-3.5" /> View tx
                                      </Link>
                                    ) : null}
                                    {packet.collectionTokenAddress ? (
                                      <Link href={`${getBlockExplorerBase(packet.network)}/address/${packet.collectionTokenAddress}`} target="_blank" rel="noreferrer" className={linkButtonOutlineClass}>
                                        <ExternalLink className="size-3.5" /> View token
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
                          <p className="text-sm font-semibold text-zinc-950">X Drafts</p>
                          <span className={monoLabelClass}>
                            {selectedDrafts.length} draft{selectedDrafts.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <OutboundDraftsList drafts={selectedDrafts} />
                      </div>
                    </TabsContent>

                    {/* Audit */}
                    <TabsContent value="audit" className="space-y-2.5">
                      {audit.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
                      ) : (
                        audit.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 rounded-[20px] border border-zinc-200/80 bg-white/80 px-4 py-3.5">
                            <Avatar className="size-8 border border-zinc-100">
                              <AvatarFallback className="bg-zinc-100 text-xs text-zinc-600">
                                {entry.actorName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-zinc-950">
                                {entry.actorName}{" "}
                                <span className="font-normal text-zinc-400">{entry.action}</span>
                              </p>
                              <p className="text-xs leading-5 text-zinc-500">{entry.note ?? "—"}</p>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                                {entry.outcome} · {formatRelativeWindow(entry.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    {/* Settings */}
                    <TabsContent value="settings">
                      <UserSettingsPanel
                        xConnected={xConnection.connected}
                        xHandle={xConnection.handle}
                        creatorAddress={creatorAddress}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            ) : (
              <Card className={surfaceClass}>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <Activity className="size-9 text-zinc-200" />
                  <div className="space-y-1.5">
                    <p className="font-medium text-zinc-950">Select an event</p>
                    <p className="max-w-xs text-sm text-zinc-400">
                      new → watch → confirm → packet → post → approve
                    </p>
                  </div>
                  {events.length === 0 ? <SweepButton variant="default" /> : null}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Pending drafts */}
        {pendingDrafts.length > 0 ? (
          <div className="rounded-[26px] border border-white/70 bg-white/86 px-5 py-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-zinc-950">Pending drafts</p>
              <span className="text-xs text-zinc-400">{pendingDrafts.length} awaiting approval</span>
            </div>
            <PendingDraftsPanel drafts={pendingDrafts.slice(0, 4)} />
          </div>
        ) : null}

        {!clerkEnabled ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-zinc-200 bg-white/50 px-5 py-4 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
            <p>
              Demo mode — Clerk not configured.{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5">.env.example</code> has the required keys.
            </p>
            <Link href="/" className={linkButtonOutlineClass}>Back to landing</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
