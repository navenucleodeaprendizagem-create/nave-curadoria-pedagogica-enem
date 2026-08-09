"use client";

import { useEffect, useState } from "react";

export default function ConnectivityStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const label = online === null ? "Verificando conexão" : online ? "Online" : "Offline";
  const detail =
    online === null
      ? "Aguarde"
      : online
        ? "Conexão disponível"
        : "Você pode continuar usando os recursos já armazenados neste dispositivo";

  return (
    <div aria-live="polite" className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${
          online === null ? "bg-slate-400" : online ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      <div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{detail}</div>
      </div>
    </div>
  );
}
