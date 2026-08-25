import Link from "next/link";
import OrientationClient from "@/components/OrientationClientV01400";
import {requireNavePermission} from "@/lib/auth/require-nave-permission";

export default async function OrientationPage({params}:{params:Promise<{id:string}>}) {
  await requireNavePermission("sequencias");
  const {id} = await params;
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/sequencias" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
          ← Voltar às atividades
        </Link>
        <OrientationClient id={id} />
      </div>
    </main>
  );
}
