import type { ReactNode } from "react";
import { useErp } from "@/context/erp-context";
import {
  BalanceteJulho,
  LancamentosJulho,
  RazaoJulho,
} from "@/components/nitaplast/contabil-julho";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";

const rotasSensíveisCompetencia = [
  "/contabil/balancete",
  "/contabil/razao",
  "/contabil/diario",
  "/contabil/dre",
  "/contabil/fechamento",
  "/contabil/conciliacao",
  "/contabil/lancamentos",
  "/contabil/lotes",
  "/contabil/encerramento",
  "/relatorios/razao",
  "/relatorios/diario",
  "/relatorios/dre",
];

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  const { competencia } = useErp();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const sensível = rotasSensíveisCompetencia.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  if (competencia.id === "2026-07") {
    const telaJulho = telaContabilJulho(pathname);
    if (telaJulho) {
      return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">{telaJulho}</div>;
    }
  }

  if (sensível && competencia.id !== "2026-06" && competencia.id !== "2026-07") {
    return (
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">
        <PageHeader
          titulo={`${nomeModulo(pathname)} — ${competencia.label}`}
          descricao="A competência selecionada ainda não possui escrituração contábil carregada. Nenhum dado de outra competência é reutilizado como fallback."
          acoes={<StatusPill label="Sem base carregada" />}
        />
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Selecione 06/2026 para consultar o fechamento concluído ou 07/2026 para acompanhar o fechamento em andamento.
        </div>
      </div>
    );
  }

  if (sensível && competencia.id === "2026-07") {
    return (
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">
        <PageHeader
          titulo={`${nomeModulo(pathname)} — 07/2026`}
          descricao="Esta rota ainda está sendo migrada para a escrituração específica de julho. Balancete, Razão, DRE e Lançamentos já usam a base contábil real da competência."
          acoes={<StatusPill label="Em fechamento" />}
        />
      </div>
    );
  }

  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">{children}</div>;
}

function telaContabilJulho(pathname: string) {
  if (pathname === "/contabil/balancete") return <BalanceteJulho />;
  if (pathname === "/contabil/razao") return <RazaoJulho />;
  if (pathname === "/contabil/dre") return <DreJulhoCompleta />;
  if (pathname === "/contabil/lancamentos") return <LancamentosJulho />;
  return null;
}

function nomeModulo(pathname: string) {
  if (pathname.includes("balancete")) return "Balancete";
  if (pathname.includes("razao")) return "Razão";
  if (pathname.includes("diario")) return "Diário";
  if (pathname.includes("dre")) return "DRE";
  if (pathname.includes("conciliacao")) return "Conciliação";
  if (pathname.includes("lancamentos")) return "Lançamentos";
  if (pathname.includes("lotes")) return "Lotes";
  if (pathname.includes("encerramento")) return "Encerramento";
  return "Fechamento";
}

function StatusPill({ label }: { label: string }) {
  return <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">{label}</span>;
}
