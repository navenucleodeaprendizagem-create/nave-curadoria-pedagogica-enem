"use client";

import { useEffect, useState } from "react";
import {
  getMeta,
  initializeNaveDb,
} from "@/lib/db/nave-db";

type DatabaseState =
  | "checking"
  | "ready"
  | "error";

export default function LocalDatabaseStatus() {
  const [state, setState] =
    useState<DatabaseState>("checking");

  const [detail, setDetail] =
    useState("Inicializando banco local");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await initializeNaveDb();

        const version =
          await getMeta("database_version");

        if (!active) return;

        setState("ready");

        setDetail(
          `IndexedDB pronto · versão ${
            version?.value ?? "1"
          }`
        );
      } catch (error) {
        if (!active) return;

        console.error(
          "NAVE: falha no banco local.",
          error
        );

        setState("error");
        setDetail(
          "Não foi possível inicializar o banco local"
        );
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${
          state === "ready"
            ? "bg-emerald-500"
            : state === "error"
              ? "bg-red-500"
              : "bg-slate-400"
        }`}
      />

      <div>
        <div className="text-sm font-semibold text-slate-800">
          {state === "ready"
            ? "Banco local pronto"
            : state === "error"
              ? "Banco local indisponível"
              : "Preparando banco local"}
        </div>

        <div className="text-xs text-slate-500">
          {detail}
        </div>
      </div>
    </div>
  );
}