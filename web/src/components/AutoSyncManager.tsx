"use client";

import { useEffect, useRef } from "react";
import { runSync } from "@/lib/sync/sync-engine";

const AUTO_SYNC_DELAY_MS = 2500;
const AUTO_SYNC_INTERVAL_MS = 60000;

export default function AutoSyncManager() {
  const syncingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    async function synchronize() {
      if (syncingRef.current) return;

      try {
        syncingRef.current = true;

        const result = await runSync();

        if (result.sent > 0) {
          console.info(
            "NAVE: sincronização automática concluída.",
            result
          );
        }
      } catch (error) {
        console.error(
          "NAVE: falha na sincronização automática.",
          error
        );
      } finally {
        syncingRef.current = false;
      }
    }

    function scheduleSync() {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        void synchronize();
      }, AUTO_SYNC_DELAY_MS);
    }

    function handleOnline() {
      scheduleSync();
    }

    window.addEventListener("online", handleOnline);

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void synchronize();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    // Se a aplicação abrir já online, faz uma tentativa inicial.
    if (navigator.onLine) {
      scheduleSync();
    }

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.clearInterval(interval);

      if (timeoutRef.current !== null) {
        window.clearTimeout(
          timeoutRef.current
        );
      }
    };
  }, []);

  return null;
}