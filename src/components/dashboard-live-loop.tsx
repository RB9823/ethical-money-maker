"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 15_000;
const SWEEP_INTERVAL_MS = 90_000;

export function DashboardLiveLoop() {
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let sweepInFlight = false;

    const refreshTimer = window.setInterval(() => {
      if (!disposed) {
        router.refresh();
      }
    }, REFRESH_INTERVAL_MS);

    const runSweep = async () => {
      if (disposed || sweepInFlight) {
        return;
      }

      sweepInFlight = true;

      try {
        const response = await fetch("/api/jobs/run", {
          method: "POST",
          cache: "no-store",
        });

        if (response.ok && !disposed) {
          router.refresh();
        }
      } catch {
        // Ignore transient network failures during the polling loop.
      } finally {
        sweepInFlight = false;
      }
    };

    const sweepTimer = window.setInterval(() => {
      void runSweep();
    }, SWEEP_INTERVAL_MS);

    void runSweep();

    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      window.clearInterval(sweepTimer);
    };
  }, [router]);

  return null;
}
