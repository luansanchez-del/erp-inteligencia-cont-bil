import type { ReactNode } from "react";
import { useErp } from "@/context/erp-context";
import { BalanceteJulho, DiarioJulho, LancamentosJulho, RazaoJulho } from "@/components/nitaplast/contabil-julho";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";
import { FechamentoNitaplastJulho } from "@/components/nitaplast/fechamento-julho";
import { FechamentoBancarioJulho } from "@/components/nitaplast/fechamento-bancario-julho";

const rotasSensiveisCompetencia = [
  "/contabil/balancete",
  "/contabil/razao",
  "/contabil/diario",
  "/contabil/dre",
  "/contabil/fechamento",
  "/contabil/lancamentos",
  "/contabil/lotes",
  "/contabil/encerramento",
  "/relatorios/razao",
  "/relatorios/diario",
  "/relatorios/dre",
];

/**
 * Regra estrutural de impressão do ERP.
 * Estas rotas representam documentos/livros contábeis e nunca devem imprimir a
 * interface da tela (cards, filtros, alertas ou botões). O CSS global usa a
 * classe erp-report-page para imprimir somente a demonstração/tabela.
 */
const rotasRelatorioImpressao = [
  "/contabil/balancete",
  "/contabil/razao",
  "/contabil/diario",
  "/contabil/dre",
  "/contabil/lancamentos",
  "/relatorios/razao",
  "/relatorios/diario",
  "/relatorios/dre",
];

export function PageHeader({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <header className="erp-page-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="erp-page-actions flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  const { empresa, competencia } = useErp();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const sensivel = rotasSensiveisCompetencia.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
  const relatorioImprimivel = rotasRelatorioImpressao.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  let conteudo: ReactNode = children;

  if (competencia.id === "2026-07") {
    const tela = telaContabilJulho(pathname);
    if (tela) conteudo = tela;
  }

  if (sensivel && competencia.id !== "2026-06" && competencia.id !== "2026-07") {
    conteudo = (
      <>
        <PageHeader
          titulo={`${nomeModulo(pathname)} — ${competencia.label}`}
          descricao="A competência selecionada ainda não possui escrituração contábil carregada. Nenhum dado de outra competência é reutilizado como fallback."
          acoes={<StatusPill label="Sem base carregada" />}
        />
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          A competência selecionada ainda não possui base contábil carregada.
        </div>
      </>
    );
  } else if (sensivel && competencia.id === "2026-07" && !telaContabilJulho(pathname)) {
    conteudo = (
      <PageHeader
        titulo={`${nomeModulo(pathname)} — 07/2026`}
        descricao="Esta rota auxiliar ainda não possui visão própria de julho; os livros principais já estão disponíveis em Balancete, Razão, Diário, DRE e Lançamentos."
        acoes={<StatusPill label="Em fechamento" />}
      />
    );
  }

  return (
    <div
      className={`erp-page-shell mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6 ${relatorioImprimivel ? "erp-report-page" : ""}`}
      data-report-kind={relatorioImprimivel ? nomeModulo(pathname) : undefined}
    >
      {relatorioImprimivel ? (
        <PrintDocumentHeader
          empresa={empresa.razaoSocial}
          nomeFantasia={empresa.nomeFantasia}
          cnpj={empresa.cnpj}
          titulo={nomeModulo(pathname)}
          competenciaId={competencia.id}
          competenciaLabel={competencia.label}
        />
      ) : null}
      <div className="erp-route-content contents">{conteudo}</div>
    </div>
  );
}

function PrintDocumentHeader({
  empresa,
  nomeFantasia,
  cnpj,
  titulo,
  competenciaId,
  competenciaLabel,
}: {
  empresa: string;
  nomeFantasia: string;
  cnpj: string;
  titulo: string;
  competenciaId: string;
  competenciaLabel: string;
}) {
  return (
    <header className="erp-print-document-header" aria-hidden="true">
      <div className="erp-print-company">{empresa}</div>
      <div className="erp-print-company-meta">{nomeFantasia} · CNPJ {cnpj}</div>
      <div className="erp-print-report-title">{titulo}</div>
      <div className="erp-print-period">Período: {periodoCompetencia(competenciaId, competenciaLabel)}</div>
    </header>
  );
}

function periodoCompetencia(id: string, fallback: string) {
  const match = id.match(/^(\d{4})-(\d{2})$/);
  if (!match) return fallback;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  if (!ano || mes < 1 || mes > 12) return fallback;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const mm = String(mes).padStart(2, "0");
  return `01/${mm}/${ano} a ${String(ultimoDia).padStart(2, "0")}/${mm}/${ano}`;
}

function telaContabilJulho(pathname: string) {
  if (pathname === "/contabil/balancete") return <BalanceteJulho />;
  if (pathname === "/contabil/razao" || pathname === "/relatorios/razao") return <RazaoJulho />;
  if (pathname === "/contabil/diario" || pathname === "/relatorios/diario") return <DiarioJulho />;
  if (pathname === "/contabil/dre" || pathname === "/relatorios/dre") return <DreJulhoCompleta />;
  if (pathname === "/contabil/lancamentos") return <LancamentosJulho />;
  if (pathname === "/contabil/fechamento") return <><FechamentoBancarioJulho /><FechamentoNitaplastJulho /></>;
  return null;
}

function nomeModulo(pathname: string) {
  if (pathname.includes("balancete")) return "Balancete";
  if (pathname.includes("razao")) return "Razão";
  if (pathname.includes("diario")) return "Diário";
  if (pathname.includes("dre")) return "Demonstração do Resultado do Exercício";
  if (pathname.includes("conciliacao")) return "Conciliação";
  if (pathname.includes("lancamentos")) return "Lançamentos Contábeis";
  if (pathname.includes("lotes")) return "Lotes";
  if (pathname.includes("encerramento")) return "Encerramento";
  return "Fechamento";
}

function StatusPill({ label }: { label: string }) {
  return <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">{label}</span>;
}
