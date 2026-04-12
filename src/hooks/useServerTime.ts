"use client";

import { useState, useEffect } from "react";

const TIME_API = "https://worldtimeapi.org/api/ip";

/**
 * Returns a Date that tracks the real current time.
 * On mount it fetches WorldTimeAPI once to calculate the offset between
 * the server clock and the local clock, then ticks every 30 seconds
 * using the local clock + that offset. Falls back silently to the local
 * clock if the API is unreachable.
 */
export function useServerTime(): Date {
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t0 = Date.now();
        const res = await fetch(TIME_API);
        const data = await res.json();
        const t1 = Date.now();
        // Compensate for ~half round-trip latency
        const serverMs = new Date(data.datetime).getTime();
        const calculatedOffset = serverMs + (t1 - t0) / 2 - t1;
        if (!cancelled) {
          setOffset(calculatedOffset);
          setNow(new Date(t1 + calculatedOffset));
        }
      } catch {
        // silent fallback — offset stays 0 (local clock)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date(Date.now() + offset)), 30_000);
    return () => clearInterval(id);
  }, [offset]);

  return now;
}
