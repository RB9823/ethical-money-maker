import { DashboardLiveLoop } from "@/components/dashboard-live-loop";
import { DashboardShell } from "@/components/dashboard-shell";
import { clerkEnabled } from "@/lib/server-auth";
import { getDashboardSnapshot } from "@/lib/services/events";

type DashboardPageProps = {
  searchParams: Promise<{ event?: string; x_error?: string; x_connected?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const snapshot = getDashboardSnapshot(params.event);

  return (
    <>
      <DashboardLiveLoop />
      <DashboardShell
        snapshot={snapshot}
        xError={params.x_error}
        xConnected={params.x_connected === "1"}
        key={clerkEnabled ? "secure" : "demo"}
      />
    </>
  );
}
