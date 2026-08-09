"use client";

import { useEffect, useState } from "react";

type ConnectionState = "checking" | "online" | "offline";

export default function ConnectivityStatus() {
  const [state, setState] = useState<ConnectionState>("checking");

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const controller = new AbortController();

        const timeout = window.setTimeout(() => {
          controller.abort();
        }, 3000);

        const response = await fetch(
          `/api/health?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        window.clearTimeout(timeout);

        if (!active) return;

        setState(response.ok ? "online" : "offline");
      } catch {
        if (!active) return;
        setState("offline");
      }
    }

    const handleOnline = () => {
      void checkConnection();
    };

    const handleOffline = () => {
      setState("offline");
    };

    void checkConnection();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = window.setInterval(() => {
      void checkConnection();
    }, 15000);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(interval);
    };
  }, []);

  const label =
    state === "checking"
      ? "Verificando"
      : state === "online"
        ? "Online"
        : "Offline";

  const detail =
    state === "checking"
      ? "Testando conexão"
      : state === "online"
        ? "Conexão disponível"
        : "Trabalhando com recursos locais";

  return (
    <div
      aria-live="polite"
      className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${
          state === "online"
            ? "bg-emerald-500"
            : state === "offline"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
      />

      <div>
        <div className="text-sm font-semibold text-slate-800">
          {label}
        </div>

        <div className="text-xs text-slate-500">
          {detail}
        </div>
      </div>
    </div>
  );
}