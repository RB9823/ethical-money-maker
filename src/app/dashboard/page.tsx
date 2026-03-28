import { DashboardShell } from "@/components/dashboard-shell";
import { clerkEnabled } from "@/lib/server-auth";
import { getDashboardSnapshot } from "@/lib/services/events";

type DashboardPageProps = {
  searchParams: Promise<{ event?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const snapshot = getDashboardSnapshot(params.event);

  return <DashboardShell snapshot={snapshot} key={clerkEnabled ? "secure" : "demo"} />;
}
