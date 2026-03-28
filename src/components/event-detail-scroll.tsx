"use client";

import { useEffect } from "react";

export function EventDetailScroll({ eventId }: { eventId?: string | null }) {
  useEffect(() => {
    if (!eventId) {
      return;
    }

    if (!window.matchMedia("(max-width: 1279px)").matches) {
      return;
    }

    const element = document.getElementById("event-detail");
    if (!element) {
      return;
    }

    const storageKey = "hyde:last-scrolled-event";
    const previousEventId = window.sessionStorage.getItem(storageKey);

    if (previousEventId === eventId) {
      return;
    }

    window.sessionStorage.setItem(storageKey, eventId);

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [eventId]);

  return null;
}
