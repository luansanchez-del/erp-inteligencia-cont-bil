import type { ReactNode } from "react";
import { useErp } from "@/context/erp-context";
import {
  entradasCentroCustoJulho,
  estoqueFinalMatrizJulhoTotal,
  fiscalJulho,
  itensManuaisJulho,
  receitaFiscalJulho,
} from "@/data/nitaplast-fechamento-julho";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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

  if (sensível && competencia.id !== "2026-06") {
    return (
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">
        <VisaoCompetenciaSelecionada competenciaId={competencia.id} competenciaLabel={competencia.label} pathname={pathname} />
      </div>
    );
  }

  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6">{children}</div>;
}

function VisaoCompetenciaSelecionada({
  competenciaId,
  competenciaLabel,
  pathname,
}: {
  competenciaId: string;
  competenciaLabel: string;
  pathname: string;
}) {
  const éJulho = competenciaId === "2026-07";
  const módulo = nomeModulo(pathname);

  if (!éJulho) {
    return (
      <>
        <PageHeader
          titulo={`${módulo} — ${competenciaLabel}`}
          descricao="A competência selecionada não possui escrituração contábil carregada neste projeto. Nenhum dado de 06/2026 é reutilizado como fallback."
          acoes={<StatusPill label="Sem base carregada" />}
        />
        <div className="rounded-lg border border-dashed p-6">
          <p className="font-medium">Competência {competenciaLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">Selecione 06/2026 para consultar o fechamento concluído ou 07/2026 para acompanhar o fechamento em andamento.</p>
        </div>
      </>
    );
  }

  const éDre = pathname.includes("dre");
  const éBalancete = pathname.includes("balancete");
  const éLancamentos = pathname.includes("lancamentos") || pathname.includes("lotes");
  const éRazaoDiario = pathname.includes("razao") || pathname.includes("diario");

  return (
    <>
      <PageHeader
        titulo={`${módulo} — 07/2026`}
        descricao="Competência de julho selecionada. A tela foi atualizada para a base real de 07/2026; dados fechados de junho não são exibidos como se fossem julho."
        acoes={<StatusPill label="Em fechamento" />}
      />

      {éDre && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Receita bruta preliminar" value={receitaFiscalJulho.totalBruto} />
          <Metric label="Deduções preliminares" value={receitaFiscalJulho.deducoesPreliminares.total} />
          <Metric label="Receita líquida preliminar" value={receitaFiscalJulho.receitaLiquidaPreliminar} />
          <Metric label="Estoque final matriz" value={estoqueFinalMatrizJulhoTotal} />
        </div>
      )}

      {éBalancete && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Estoque final matriz 31/07" value={estoqueFinalMatrizJulhoTotal} />
          <Metric label="Entradas matriz" value={fiscalJulho.matriz.entradasValor} />
          <Metric label="Saídas matriz" value={fiscalJulho.matriz.saidasValor} />
          <Metric label="Entradas por CC já distribuídas" value={entradasCentroCustoJulho.valorDistribuidoCentroCusto} />
        </div>
      )}

      {éRazaoDiario && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Documentos de entradas — matriz" value={fiscalJulho.matriz.entradasDocumentos} integer />
          <Metric label="Documentos de saídas — matriz" value={fiscalJulho.matriz.saidasDocumentos} integer />
          <Metric label="Documentos de entradas — filial" value={fiscalJulho.filialSp.entradasDocumentos} integer />
          <Metric label="Documentos de saídas — filial" value={fiscalJulho.filialSp.saidasDocumentos} integer />
        </div>
      )}

      {éLancamentos && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Valor distribuído por centro de custo" value={entradasCentroCustoJulho.valorDistribuidoCentroCusto} />
          <Metric label="Sem CC completo" value={entradasCentroCustoJulho.valorSemCentroCustoCompleto} />
          <Metric label="Documentos com diferença de CC" value={entradasCentroCustoJulho.documentosComDiferenca} integer />
        </div>
      )}

      {!éDre && !éBalancete && !éRazaoDiario && !éLancamentos && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Receita bruta preliminar" value={receitaFiscalJulho.totalBruto} />
          <Metric label="Estoque final matriz" value={estoqueFinalMatrizJulhoTotal} />
          <Metric label="PIS a recolher antes de retenções" value={fiscalJulho.contribuicoes.pisRecolherAntesDeRetencoes} />
          <Metric label="COFINS a recolher antes de retenções" value={fiscalJulho.contribuicoes.cofinsRecolherAntesDeRetencoes} />
        </div>
      )}

      <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-950">Escrituração de julho em formação</p>
            <p className="mt-1 max-w-4xl text-sm text-amber-900/80">
              Os documentos e alvos de fechamento de 07/2026 já estão carregados, mas Razão, Diário, Balancete e DRE ainda dependem da formação completa dos lançamentos. Até isso acontecer, esta tela mostra apenas valores efetivamente apurados para julho e nunca reaproveita o movimento de junho.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/contabil/fechamento-assistido" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Abrir Fechamento Assistido</a>
            <a href="/contabil/lancamentos" className="rounded-md border bg-background px-3 py-2 text-sm font-medium">Ver Lançamentos</a>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <p className="text-sm font-semibold">Itens mantidos fora do resultado financeiro nesta etapa</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {itensManuaisJulho.map((item) => (
            <span key={item.id} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">{item.nome} — manual</span>
          ))}
        </div>
      </div>
    </>
  );
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

function Metric({ label, value, integer = false }: { label: string; value: number; integer?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{integer ? value.toLocaleString("pt-BR") : brl.format(value)}</p>
    </div>
  );
}
