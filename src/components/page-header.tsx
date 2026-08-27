import { lazy, Suspense, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useErp } from "@/context/erp-context";
import {
  BalanceteJulhoAjustavel,
  DiarioJulhoAjustavel,
  LancamentosJulhoAjustavel,
} from "@/components/nitaplast/contabil-julho-ajustavel";
import { RazaoJulhoLivro } from "@/components/nitaplast/razao-julho-livro";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";
import { FechamentoNitaplastJulho } from "@/components/nitaplast/fechamento-julho";
import { FechamentoBancarioJulho } from "@/components/nitaplast/fechamento-bancario-julho";
import { LalurJulho } from "@/components/nitaplast/lalur-julho";

const DreJulhoReport = lazy(() => import("@/components/nitaplast/dre-julho-report").then((modulo) => ({ default: modulo.DreJulhoReport })));

const rotasSensiveisCompetencia = [
  "/contabil/balancete",
  "/contabil/razao",
  "/contabil/diario",
  "/contabil/dre",
  "/contabil/lalur",
  "/contabil/fechamento",
  "/contabil/lancamentos",
  "/contabil/lotes",
  "/contabil/encerramento",
  "/relatorios/razao",
  "/relatorios/diario",
  "/relatorios/dre",
];

// Rotas cujo conteúdo hoje é hardcoded para a Nitaplast e não podem herdar esses
// números quando outra empresa está selecionada. Superset de rotasSensiveisCompetencia:
// inclui rotas com visão própria (sem o fallback "sem visão própria de julho").
const rotasSensiveisEmpresa = [
  ...rotasSensiveisCompetencia,
  "/contabil/fechamento-assistido",
  "/contabil/conciliacao",
  "/patrimonio",
];

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const sensivel = rotasSensiveisCompetencia.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
  const sensivelEmpresa = rotasSensiveisEmpresa.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
  const relatorioImprimivel = rotasRelatorioImpressao.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
  const dreJulhoImpressao = relatorioImprimivel
    && competencia.id === "2026-07"
    && pathname === "/contabil/dre";

  let conteudo: ReactNode = children;

  // Todo o motor contábil hoje é hardcoded para a Nitaplast. Empresas cadastradas
  // fora desse grupo (ex.: cadastros de teste para validar implantação) não podem
  // herdar os números reais da Nitaplast nas rotas sensíveis a competência.
  const empresaComDadosCarregados = empresa.grupoId === "g-nitaplast";

  if (sensivelEmpresa && !empresaComDadosCarregados) {
    conteudo = (
      <>
        <PageHeader
          titulo={`${nomeModulo(pathname)} — ${empresa.nomeFantasia}`}
          descricao="Esta empresa ainda não possui escrituração contábil carregada no ERP. Nenhum dado de outra empresa (Nitaplast) é reutilizado como fallback."
          acoes={<StatusPill label="Sem dados desta empresa" />}
        />
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Importe os documentos e o balancete de abertura desta empresa para começar a escrituração.
        </div>
      </>
    );
  } else {
    if (competencia.id === "2026-07") {
      const tela = telaContabilJulho(pathname);
      if (tela) conteudo = tela;
    }

    const balanceteDominioMaioCarregado = competencia.id === "2026-05" && pathname === "/contabil/balancete";

    if (sensivel && competencia.id !== "2026-06" && competencia.id !== "2026-07" && !balanceteDominioMaioCarregado) {
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
  }

  return (
    <div
      className={`erp-page-shell mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 md:p-6 ${relatorioImprimivel ? "erp-report-page" : ""}`}
      data-report-kind={relatorioImprimivel ? nomeModulo(pathname) : undefined}
      data-report-period={relatorioImprimivel ? competencia.id : undefined}
      onClickCapture={(event) => {
        if (competencia.id !== "2026-07" || pathname !== "/relatorios/dre") return;
        const alvo = event.target as HTMLElement;
        const botao = alvo.closest("button");
        if (!botao?.textContent?.includes("Exportar Excel")) return;
        event.preventDefault();
        event.stopPropagation();
        exportarDreVisivelComoExcel();
      }}
    >
      {dreJulhoImpressao ? (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }

            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table button {
              display: inline-flex !important;
              padding: 0 !important;
              border: 0 !important;
              background: transparent !important;
              color: #000 !important;
              font: inherit !important;
            }

            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table button svg {
              display: none !important;
            }

            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table > tbody > tr:has(> td[colspan="3"]) {
              display: none !important;
            }

            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table > thead > tr > th:last-child,
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table > tbody > tr > td:last-child {
              display: none !important;
            }

            .erp-report-page[data-report-period="2026-07"][data-report-kind="Demonstração do Resultado do Exercício"] table {
              font-size: 9pt !important;
            }
          }
        `}</style>
      ) : null}

      {relatorioImprimivel && pathname === "/contabil/balancete" ? (
        <style>{`
          @media print {
            @page { size: A4 landscape; margin: 7mm; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content table {
              width: 100% !important; min-width: 0 !important; table-layout: fixed !important;
              border-collapse: collapse !important; font-size: 5.5pt !important; line-height: 1 !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead { display: table-header-group !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content tr { break-inside: avoid !important; page-break-inside: avoid !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th,
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td {
              height: auto !important; padding: 0.32mm 0.6mm !important; color: #000 !important; background: #fff !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th:nth-child(1),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td:nth-child(1) { width: 7% !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th:nth-child(2),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td:nth-child(2) { display: none !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th:nth-child(3),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td:nth-child(3) { width: 15% !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th:nth-child(4),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td:nth-child(4) { width: 30% !important; overflow-wrap: anywhere !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content th:nth-child(n+5),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content td:nth-child(n+5) { white-space: nowrap !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(1),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(3),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(4) { font-size: 0 !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(1)::after { content: "Código"; font-size: 5.5pt; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(3)::after { content: "Classificação"; font-size: 5.5pt; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content thead th:nth-child(4)::after { content: "Descrição da conta"; font-size: 5.5pt; }
            .erp-report-page[data-report-period="2026-06"][data-report-kind="Balancete"] .erp-route-content th:nth-child(8),
            .erp-report-page[data-report-period="2026-06"][data-report-kind="Balancete"] .erp-route-content td:nth-child(8) { display: none !important; }
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content th:nth-child(5),
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content td:nth-child(5),
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content th:nth-child(9),
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content td:nth-child(9),
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content th:nth-child(11),
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content td:nth-child(11) { display: none !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-page-header { display: none !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content { gap: 0 !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .rounded-xl,
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .rounded-lg { border-radius: 0 !important; }
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content > div > :not(:last-child) { display: none !important; }
            .erp-report-page[data-report-period="2026-07"][data-report-kind="Balancete"] .erp-route-content > div > :last-child > div:first-child { display: none !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content [class*="shadow"] { box-shadow: none !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .overflow-x-auto { overflow: visible !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-print-document-header {
              margin-bottom: 1.5mm !important; padding-bottom: 1mm !important; border-bottom: 0 !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-print-balancete-header { font-size: 6.5pt !important; line-height: 1.15 !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-print-balancete-header strong { display: inline-block; min-width: 15mm; }
            .erp-report-page[data-report-kind="Balancete"] .erp-print-balancete-title {
              margin-top: 2mm !important; border-bottom: 0.6px solid #000 !important; padding-bottom: 1mm !important;
              text-align: center !important; font-size: 8pt !important; font-weight: 700 !important;
            }

            /*
             * O Resumo do Balancete (erp-resumo-balancete) tem sua própria tabela de 5
             * colunas (Grupo/Saldo anterior/Débitos/Créditos/Saldo atual) e não deve herdar
             * o recorte de colunas acima, feito sob medida para a tabela analítica de 11
             * colunas. Estas regras, mais específicas, blindam a tabela do resumo.
             */
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table {
              table-layout: fixed !important; font-size: 8pt !important; line-height: 1.3 !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th,
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table td {
              padding: 1mm 1.5mm !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(n),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table td:nth-child(n) {
              display: table-cell !important; font-size: 8pt !important; white-space: normal !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(1) { width: 36% !important; }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(2),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(3),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(4),
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table th:nth-child(5) {
              width: 16% !important;
            }
            .erp-report-page[data-report-kind="Balancete"] .erp-route-content .erp-resumo-balancete-table thead th::after {
              content: none !important;
            }
          }
        `}</style>
      ) : null}

      {dreJulhoImpressao ? (
        <div className="erp-screen-only flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            Imprimir / PDF
          </button>
        </div>
      ) : null}

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

function exportarDreVisivelComoExcel() {
  if (typeof document === "undefined") return;
  const tabela = document.querySelector(".erp-route-content section table") as HTMLTableElement | null;
  if (!tabela || tabela.querySelectorAll("tbody tr").length === 0) {
    window.alert("A DRE ainda não terminou de carregar. Aguarde os dados aparecerem e tente exportar novamente.");
    return;
  }

  const tabelaClone = tabela.cloneNode(true) as HTMLTableElement;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body{font-family:Arial,sans-serif;font-size:10pt;color:#000}
h1{font-size:14pt;text-align:center;margin:0 0 4px}
p{text-align:center;margin:2px 0}
table{border-collapse:collapse;width:100%;margin-top:16px}
th{font-weight:bold;border-top:1px solid #000;border-bottom:1px solid #000;padding:6px}
td{border-bottom:1px solid #ddd;padding:6px}
th:nth-child(2),th:nth-child(3),td:nth-child(2),td:nth-child(3){text-align:right}
</style>
</head>
<body>
<h1>NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</h1>
<p>CNPJ 82.295.817/0001-07</p>
<p><strong>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</strong></p>
<p>Período: 01/07/2026 a 31/07/2026</p>
${tabelaClone.outerHTML}
</body>
</html>`;

  const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Nitaplast_DRE_Report_072026.xls";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
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
  if (titulo === "Balancete") {
    return (
      <header className="erp-print-document-header" aria-hidden="true">
        <div className="erp-print-balancete-header"><div><strong>Empresa:</strong> {empresa}</div><div><strong>C.N.P.J.:</strong> {cnpj}</div><div><strong>Período:</strong> {periodoCompetencia(competenciaId, competenciaLabel)}</div><div>CONSOLIDADO</div></div>
        <div className="erp-print-balancete-title">BALANCETE</div>
      </header>
    );
  }
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
  if (pathname === "/contabil/balancete") return <BalanceteJulhoAjustavel />;
  if (pathname === "/contabil/razao" || pathname === "/relatorios/razao") return <RazaoJulhoLivro />;
  if (pathname === "/contabil/diario" || pathname === "/relatorios/diario") return <DiarioJulhoAjustavel />;
  if (pathname === "/contabil/dre") return <DreJulhoCompleta />;
  if (pathname === "/contabil/lalur") return <LalurJulho />;
  if (pathname === "/relatorios/dre") return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando DRE Report 07/2026...</div>}><DreJulhoReport /></Suspense>;
  if (pathname === "/contabil/lancamentos") return <LancamentosJulhoAjustavel />;
  if (pathname === "/contabil/fechamento") return <><FechamentoBancarioJulho /><FechamentoNitaplastJulho /></>;
  return null;
}

function nomeModulo(pathname: string) {
  if (pathname.includes("balancete")) return "Balancete";
  if (pathname.includes("razao")) return "Razão";
  if (pathname.includes("diario")) return "Diário";
  if (pathname.includes("lalur")) return "LALUR";
  if (pathname.includes("dre")) return "Demonstração do Resultado do Exercício";
  if (pathname.includes("conciliacao")) return "Conciliação";
  if (pathname.includes("lancamentos")) return "Lançamentos Contábeis";
  if (pathname.includes("lotes")) return "Lotes";
  if (pathname.includes("encerramento")) return "Encerramento";
  if (pathname.includes("patrimonio")) return "Imobilizado";
  if (pathname.includes("fechamento-assistido")) return "Fechamento Assistido";
  return "Fechamento";
}

function StatusPill({ label }: { label: string }) {
  return <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">{label}</span>;
}
