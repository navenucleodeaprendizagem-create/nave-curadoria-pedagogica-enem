import type { Metadata } from "next";
import "./globals.css";

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AutoSyncManager from "@/components/AutoSyncManager";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "NAVE | Sistema de Inteligência e Gestão da Aprendizagem",
  description:
    "Sistema NAVE para curadoria pedagógica, sequências, validação e gestão da aprendizagem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <ServiceWorkerRegister />
          <AutoSyncManager />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}