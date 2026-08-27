import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, FileSpreadsheet, Printer, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calcularBalanceteCcJunho, type LinhaBalanceteCcJunho } from "@/data/nitaplast-balancete-cc-junho";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { usePrintMode } from "@/hooks/use-print-mode";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

export const Route = createFileRoute("/relatorios/balancete-centro-custo")({
  head: () => ({
    meta: [
      { title: "Balancete por Centro de Custo — Nitaplast" },
      { name: "description", content: "Balancete de junho de 2026 aberto por centro de custo a partir do Razão fechado." },
    ],
  }),
  component: BalanceteCentroCustoReportPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const eps = 0.005;
const gruposConta = ["Todos", "Ativo", "Passivo e PL", "Receitas", "Custos e despesas"] as const;

function grupoConta(classificacao: string, grupo: (typeof gruposConta)[number]) {
  if (grupo === "Todos") return true;
  if (grupo === "Ativo") return classificacao === "1" || classificacao.startsWith("1.");
  if (grupo === "Passivo e PL") return classificacao === "2" || classificacao.startsWith("2.");
  if (grupo === "Receitas") return classificacao === "4" || classificacao.startsWith("4.");
  return classificacao === "5" || classificacao.startsWith("5.");
}

function zerada(x: LinhaBalanceteCcJunho) {
  return Math.abs(x.saldoAnterior) < eps
    && Math.abs(x.debitos) < eps
    && Math.abs(x.creditos) < eps
    && Math.abs(x.saldoAtual) < eps;
}

function Money({ v, strong = false }: { v: number; strong?: boolean }) {
  return (
    <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>
      {v < 0 ? `(${brl.format(Math.abs(v))})` : brl.format(v)}
    </td>
  );
}

function Metric({ label, value, money = true }: { label: string; value: number; money?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold tabular-nums">
          {money ? brl.format(value) : value.toLocaleString("pt-BR")}
        </p>
      </CardContent>
    </Card>
  );
}

function BalanceteCentroCustoReportPage() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");
  const { printing, printAll } = usePrintMode();
  const [cc, setCc] = useState("todos");
  const [grupoCc, setGrupoCc] = useState("todos");
  const [grupo, setGrupo] = useState<(typeof gruposConta)[number]>("Todos");
  const [busca, setBusca] = useState("");
  const [soMov, setSoMov] = useState(false);
  const [mostrarZeradas, setMostrarZeradas] = useState(false);

  const lancamentos = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const report = useMemo(() => calcularBalanceteCcJunho(lancamentos), [lancamentos]);
  const gruposCcDisponiveis = useMemo(
    () => [...new Set(report.centros.map((x) => x.grupo))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [report.centros],
  );

  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return report.linhas.filter((x) => {
      if (cc !== "todos" && x.cc !== cc) return false;
      if (grupoCc !== "todos" && x.grupo !== grupoCc) return false;
      if (!grupoConta(x.classificacao, grupo)) return false;
      if (soMov && x.lancamentos === 0) return false;
      if (!mostrarZeradas && zerada(x)) return false;
      if (q && ![x.cc, x.centroCusto, x.conta, x.classificacao, x.descricao].join(" ").toLocaleLowerCase("pt-BR").includes(q)) return false;
      return true;
    });
  }, [busca, cc, grupo, grupoCc, mostrarZeradas, report.linhas, soMov]);

  const centrosVisiveis = useMemo(() => {
    const m = new Map<string, { cc: string; nome: string; grupo: string; linhas: LinhaBalanceteCcJunho[] }>();
    for (const x of linhas) {
      const item = m.get(x.cc) ?? { cc: x.cc, nome: x.centroCusto, grupo: x.grupo, linhas: [] };
      item.linhas.push(x);
      m.set(x.cc, item);
    }
    return [...m.values()];
  }, [linhas]);

  const totais = useMemo(() => ({
    saldoAnterior: linhas.reduce((s, x) => s + x.saldoAnterior, 0),
    debitos: linhas.reduce((s, x) => s + x.debitos, 0),
    creditos: linhas.reduce((s, x) => s + x.creditos, 0),
    saldoAtual: linhas.reduce((s, x) => s + x.saldoAtual, 0),
  }), [linhas]);

  function exportarCsv() {
    const dados = [
      ["CENTRO DE CUSTO", "DESCRIÇÃO CC", "GRUPO CC", "CONTA", "CLASSIFICAÇÃO", "DESCRIÇÃO DA CONTA", "SALDO ANTERIOR", "DÉBITO", "CRÉDITO", "MOVIMENTO", "SALDO ATUAL"],
      ...linhas.map((x) => [x.cc, x.centroCusto, x.grupo, x.conta, x.classificacao, x.descricao, x.saldoAnterior.toFixed(2), x.debitos.toFixed(2), x.creditos.toFixed(2), x.movimento.toFixed(2), x.saldoAtual.toFixed(2)]),
    ];
    const csv = dados.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Nitaplast_Balancete_por_CC_062026.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportarXlsx() {
    const filtroCc = cc === "todos" ? "Todos os centros" : `${cc} - ${report.centros.find((x) => x.codigo === cc)?.descricao ?? ""}`;
    exportarExcel({
      arquivo: "Nitaplast_Balancete_por_CC_062026.xlsx",
      aba: "Balancete CC",
      titulo: "NITAPLAST — BALANCETE REPORT POR CENTRO DE CUSTO",
      subtitulo: `01/06/2026 a 30/06/2026 · ${filtroCc}`,
      colunas: [
        { cabecalho: "Centro de custo", largura: 14 },
        { cabecalho: "Descrição CC", largura: 34 },
        { cabecalho: "Grupo CC", largura: 20 },
        { cabecalho: "Conta", largura: 16 },
        { cabecalho: "Classificação", largura: 22 },
        { cabecalho: "Descrição da conta", largura: 48 },
        { cabecalho: "Saldo anterior", largura: 18, tipo: "numero" },
        { cabecalho: "Débito", largura: 18, tipo: "numero" },
        { cabecalho: "Crédito", largura: 18, tipo: "numero" },
        { cabecalho: "Movimento", largura: 18, tipo: "numero" },
        { cabecalho: "Saldo atual", largura: 18, tipo: "numero" },
      ],
      linhas: linhas.map((x) => [x.cc, x.centroCusto, x.grupo, x.conta, x.classificacao, x.descricao, x.saldoAnterior, x.debitos, x.creditos, x.movimento, x.saldoAtual]),
    });
  }

  return (
    <PageShell>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 7mm; }
          html, body, #root { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .balancete-cc-print { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .balancete-cc-print .overflow-x-auto { overflow: visible !important; }
          .cc-print-block { break-inside: auto !important; page-break-inside: auto !important; margin-bottom: 4mm !important; }
          .cc-print-header { position: static !important; break-after: avoid !important; page-break-after: avoid !important; padding: 1.5mm 1mm !important; font-size: 7.5pt !important; }
          .cc-print-table { width: 100% !important; min-width: 0 !important; table-layout: fixed !important; border-collapse: collapse !important; font-size: 6.6pt !important; line-height: 1.12 !important; }
          .cc-print-table thead { display: table-header-group !important; }
          .cc-print-table tfoot { display: table-row-group !important; }
          .cc-print-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          .cc-print-table th, .cc-print-table td { padding: 1.15mm 0.8mm !important; vertical-align: top !important; }
          .cc-print-table th:nth-child(1), .cc-print-table td:nth-child(1) { width: 7% !important; }
          .cc-print-table th:nth-child(2), .cc-print-table td:nth-child(2) { width: 13% !important; overflow-wrap: anywhere !important; }
          .cc-print-table th:nth-child(3), .cc-print-table td:nth-child(3) { width: 25% !important; overflow-wrap: anywhere !important; }
          .cc-print-table th:nth-child(n+4), .cc-print-table td:nth-child(n+4) { width: 11% !important; white-space: nowrap !important; font-size: 6.2pt !important; }
          .cc-print-table th:nth-child(9), .cc-print-table td:nth-child(9) { display: none !important; }
          .cc-print-table tfoot tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `}</style>

      <div className="balancete-cc-print">
        <PageHeader
          titulo="Balancete Report por Centro de Custo"
          descricao="Nitaplast · competência 06/2026 fechada · abertura gerencial por centro de custo sem gerar lançamentos no Razão."
          acoes={(
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-emerald-500 text-emerald-700">06/2026 · Fechada</Badge>
              <Button variant="outline" size="sm" onClick={exportarCsv} className="gap-2"><Download className="size-4" />CSV</Button>
              <Button variant="outline" size="sm" onClick={exportarXlsx} className="gap-2"><FileSpreadsheet className="size-4" />Excel</Button>
              <Button variant="outline" size="sm" onClick={printAll} className="gap-2"><Printer className="size-4" />Imprimir / PDF</Button>
            </div>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6 print:hidden">
          <Metric label="Centros no relatório" value={report.resumo.centros} money={false} />
          <Metric label="Contas abertas por CC" value={report.resumo.contasComAberturaCc} money={false} />
          <Metric label="Linhas exibidas" value={linhas.length} money={false} />
          <Metric label="Débitos exibidos" value={totais.debitos} />
          <Metric label="Créditos exibidos" value={totais.creditos} />
          <Metric label="Saldo atual exibido" value={totais.saldoAtual} />
        </div>

        <Card className="border-emerald-500/40 bg-emerald-500/5 print:hidden">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium">Report conectado ao fechamento real de junho</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A movimentação vem do mesmo Razão definitivo que alimenta o Balancete de 06/2026. A abertura por centro usa o Balancete por Centro de Custos de 05/2026 somente nas contas que reconciliam exatamente com o saldo implantado; as demais permanecem em <strong>Sem centro de custo</strong>, sem rateio artificial.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conferência: abertura {report.resumo.aberturaReconciliada ? "reconciliada" : "com divergência"} · movimentos {report.resumo.movimentoReconciliado ? "reconciliados" : "com divergência"}. Esta camada é exclusivamente de relatório e não cria débito/crédito.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:px-0 print:pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base print:text-[10pt]">Balancete 06/2026 aberto por centro de custo</CardTitle>
                <CardDescription className="print:text-[8pt] print:text-black">Saldo em 31/05 + movimentos de 01/06/2026 a 30/06/2026</CardDescription>
              </div>
              <div className="relative w-full sm:w-96 print:hidden">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar CC, conta ou descrição" className="pl-9" />
              </div>
            </div>

            <div className="grid gap-2 pt-3 md:grid-cols-3 print:hidden">
              <select value={grupoCc} onChange={(e) => { setGrupoCc(e.target.value); setCc("todos"); }} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="todos">Todos os grupos de CC</option>
                {gruposCcDisponiveis.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select value={cc} onChange={(e) => setCc(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="todos">Todos os centros de custo</option>
                {report.centros.filter((x) => grupoCc === "todos" || x.grupo === grupoCc).map((x) => <option key={x.codigo} value={x.codigo}>{x.codigo} - {x.descricao}</option>)}
              </select>
              <select value={grupo} onChange={(e) => setGrupo(e.target.value as (typeof gruposConta)[number])} className="h-10 rounded-md border bg-background px-3 text-sm">
                {gruposConta.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 print:hidden">
              <Button size="sm" variant={soMov ? "default" : "outline"} onClick={() => setSoMov((v) => !v)}>Somente com movimento</Button>
              <Button size="sm" variant={mostrarZeradas ? "default" : "outline"} onClick={() => setMostrarZeradas((v) => !v)}>{mostrarZeradas ? "Ocultar zeradas" : "Exibir zeradas"}</Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-x-auto print:px-0 print:pt-0">
            {centrosVisiveis.map((bloco) => (
              <div key={bloco.cc} className="cc-print-block mb-6">
                <div className="cc-print-header sticky top-0 z-10 flex items-center justify-between border-y bg-muted px-3 py-2 print:bg-white">
                  <div>
                    <span className="font-mono font-semibold">CC {bloco.cc}</span>
                    <span className="ml-2 font-semibold">{bloco.nome}</span>
                    <span className="ml-2 text-xs text-muted-foreground print:text-[7pt] print:text-black">· {bloco.grupo}</span>
                  </div>
                  <span className="text-xs text-muted-foreground print:text-[7pt] print:text-black">{bloco.linhas.length} conta(s)</span>
                </div>

                <table className="cc-print-table w-full min-w-[1250px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs print:bg-white">
                      <th className="p-2">Conta</th>
                      <th className="p-2">Classificação</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2 text-right">Saldo anterior</th>
                      <th className="p-2 text-right">Débito</th>
                      <th className="p-2 text-right">Crédito</th>
                      <th className="p-2 text-right">Movimento</th>
                      <th className="p-2 text-right">Saldo atual</th>
                      <th className="p-2 text-right print:hidden">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloco.linhas.map((x) => (
                      <tr key={x.chave} className="border-b">
                        <td className="p-2 font-mono">{x.conta}</td>
                        <td className="p-2 font-mono text-xs">{x.classificacao}</td>
                        <td className="p-2">
                          {x.descricao}
                          {x.aberturaRateada && Math.abs(x.saldoAnterior) >= eps ? <Badge variant="outline" className="ml-2 text-[10px] print:hidden">abertura por CC</Badge> : null}
                        </td>
                        <Money v={x.saldoAnterior} />
                        <Money v={x.debitos} />
                        <Money v={x.creditos} />
                        <Money v={x.movimento} />
                        <Money v={x.saldoAtual} strong />
                        <td className="p-2 text-right print:hidden">
                          <Button size="sm" variant="outline" onClick={() => window.location.assign(`/contabil/razao?conta=${encodeURIComponent(x.conta)}`)}>Razão</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={3} className="p-2">Total CC {bloco.cc}</td>
                      <Money v={bloco.linhas.reduce((s, x) => s + x.saldoAnterior, 0)} />
                      <Money v={bloco.linhas.reduce((s, x) => s + x.debitos, 0)} />
                      <Money v={bloco.linhas.reduce((s, x) => s + x.creditos, 0)} />
                      <Money v={bloco.linhas.reduce((s, x) => s + x.movimento, 0)} />
                      <Money v={bloco.linhas.reduce((s, x) => s + x.saldoAtual, 0)} strong />
                      <td className="print:hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}

            {!centrosVisiveis.length ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma linha encontrada para os filtros selecionados.</p> : null}
          </CardContent>
        </Card>

        {!printing ? (
          <p className="text-xs text-muted-foreground">
            Fonte da abertura por CC: BALANCETE POR CENTRO DE CUSTOS 05.2026 - NITAPLAST. Fonte dos movimentos: Razão definitivo 06/2026. Nenhuma abertura gerencial é lançada no Razão.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
