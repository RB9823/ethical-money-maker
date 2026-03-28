export type TimingAdvice = {
  recommendation: "launch_now" | "wait" | "window_closing" | "missed";
  reason: string;
};

// US market hours in UTC: 13:30 – 21:00 (9:30 AM – 5:00 PM ET, non-DST)
function isUsMarketHours(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const minuteOfDay = utcHour * 60 + utcMinute;
  return minuteOfDay >= 810 && minuteOfDay <= 1260; // 13:30 – 21:00 UTC
}

// Returns the age of the newest signal in minutes.
function newestSignalAgeMinutes(
  signals: Array<{ createdAt: string }>,
): number {
  if (signals.length === 0) return Infinity;
  const newestMs = Math.max(...signals.map((s) => new Date(s.createdAt).getTime()));
  return (Date.now() - newestMs) / 60000;
}

export function evaluateLaunchTiming(input: {
  signals: Array<{ createdAt: string; source: string }>;
  eventCreatedAt: string;
}): TimingAdvice {
  const signalAgeMinutes = newestSignalAgeMinutes(input.signals);
  const eventAgeMinutes = (Date.now() - new Date(input.eventCreatedAt).getTime()) / 60000;
  const marketHours = isUsMarketHours();

  // Window missed — signal has gone cold (>12h old)
  if (signalAgeMinutes > 720) {
    return {
      recommendation: "missed",
      reason: "Signals are over 12 hours old. The narrative momentum has likely faded.",
    };
  }

  // Window closing — signal between 4–12h old
  if (signalAgeMinutes > 240) {
    return {
      recommendation: "window_closing",
      reason: `Signals are ${Math.round(signalAgeMinutes / 60)}h old. Launch soon or the moment will pass.`,
    };
  }

  // Signals are fresh — check if market hours improve timing
  if (signalAgeMinutes <= 240 && eventAgeMinutes <= 480) {
    if (marketHours) {
      return {
        recommendation: "launch_now",
        reason: "Signals are fresh and US market hours are active — optimal launch window.",
      };
    }
    return {
      recommendation: "wait",
      reason: "Signals are fresh but outside US market hours. Consider waiting for peak engagement (9:30 AM – 5:00 PM ET).",
    };
  }

  return {
    recommendation: "launch_now",
    reason: "Signals are active. Proceed when ready.",
  };
}
