import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, FileSpreadsheet, Printer, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "@/data/nitaplast-balancete-estrutura";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { resumoImplantacao, saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { usePrintMode } from "@/hooks/use-print-mode";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
const grupos = ["Todos", "Ativo", "Passivo e PL", "Receitas", "Custos e despesas"] as const;

type LinhaCalculada = LinhaEstruturaBalancete & {
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  movimento: number;
  saldoAtual: number;
  lancamentos: number;
};

function pertenceAoGrupo(classificacao: string, grupo: (typeof grupos)[number]) {
  if (grupo === "Todos") return true;
  if (grupo === "Ativo") return classificacao === "1" || classificacao.startsWith("1.");
  if (grupo === "Passivo e PL") return classificacao === "2" || classificacao.startsWith("2.");
  if (grupo === "Receitas") {
    return classificacao === "4"
      || classificacao.startsWith("4.")
      || classificacao === "5.7.12"
      || classificacao.startsWith("5.7.12.");
  }
  return (classificacao === "5" || classificacao.startsWith("5."))
    && classificacao !== "5.7.12"
    && !classificacao.startsWith("5.7.12.");
}

function descendente(analitica: LinhaEstruturaBalancete, sintetica: LinhaEstruturaBalancete) {
  return analitica.classificacao === sintetica.classificacao || analitica.classificacao.startsWith(`${sintetica.classificacao}.`);
}

function linhaZerada(linha: LinhaCalculada) {
  const epsilon = 0.005;
  return Math.abs(linha.saldoAnterior) < epsilon
    && Math.abs(linha.debitos) < epsilon
    && Math.abs(linha.creditos) < epsilon
    && Math.abs(linha.saldoAtual) < epsilon;
}

function BalancetePage() {
  useNitaplastJunho();
  const { reclassificacoes, aplicar } = useReclassificacoesInteligentes("2026-06");
  const { printing, printAll } = usePrintMode();
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<(typeof grupos)[number]>("Todos");
  const [somenteMovimento, setSomenteMovimento] = useState(false);
  const [mostrarZeradas, setMostrarZeradas] = useState(false);
  const [pagina, setPagina] = useState(1);

  const lancamentosComAjustes = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const totalDebitosIntegrados = useMemo(() => lancamentosComAjustes.reduce((total, linha) => total + linha.valor, 0), [lancamentosComAjustes]);
  const totalCreditosIntegrados = totalDebitosIntegrados;

  const linhasCalculadas = useMemo<LinhaCalculada[]>(() => {
    const saldos = new Map(saldosImplantacao.map((linha) => [linha.conta, linha]));
    const movimentos = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();

    for (const lancamento of lancamentosComAjustes) {
      const debito = movimentos.get(lancamento.debitoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      debito.debitos += lancamento.valor;
      debito.lancamentos += 1;
      movimentos.set(lancamento.debitoCodigo, debito);

      const credito = movimentos.get(lancamento.creditoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      credito.creditos += lancamento.valor;
      credito.lancamentos += 1;
      movimentos.set(lancamento.creditoCodigo, credito);
    }

    const analiticas = estruturaBalanceteNitaplast.filter((linha) => linha.tipo === "A");
    const valoresAnaliticos = new Map<string, { saldoAnterior: number; debitos: number; creditos: number; movimento: number; saldoAtual: number; lancamentos: number }>();

    for (const linha of analiticas) {
      const saldo = saldos.get(linha.conta);
      const movimentoConta = movimentos.get(linha.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      const saldoAnterior = saldo ? (saldo.natureza === "C" ? -Math.abs(saldo.saldo) : Math.abs(saldo.saldo)) : 0;
      const movimento = movimentoConta.debitos - movimentoConta.creditos;
      valoresAnaliticos.set(linha.conta, {
        saldoAnterior,
        debitos: movimentoConta.debitos,
        creditos: movimentoConta.creditos,
        movimento,
        saldoAtual: saldoAnterior + movimento,
        lancamentos: movimentoConta.lancamentos,
      });
    }

    return estruturaBalanceteNitaplast.map((linha) => {
      if (linha.tipo === "A") {
        return {
          ...linha,
          ...(valoresAnaliticos.get(linha.conta) ?? { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 }),
        };
      }

      const acumulado = { saldoAnterior: 0, debitos: 0, creditos: 0, movimento: 0, saldoAtual: 0, lancamentos: 0 };
      for (const analitica of analiticas) {
        if (!descendente(analitica, linha)) continue;
        const valor = valoresAnaliticos.get(analitica.conta);
        if (!valor) continue;
        acumulado.saldoAnterior += valor.saldoAnterior;
        acumulado.debitos += valor.debitos;
        acumulado.creditos += valor.creditos;
        acumulado.movimento += valor.movimento;
        acumulado.saldoAtual += valor.saldoAtual;
        acumulado.lancamentos += valor.lancamentos;
      }
      return { ...linha, ...acumulado };
    });
  }, [lancamentosComAjustes]);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    const correspondenciasAnaliticas = linhasCalculadas.filter((linha) => linha.tipo === "A" && (!q || [linha.conta, linha.classificacao, linha.descricao].join(" ").toLocaleLowerCase("pt-BR").includes(q)));

    return linhasCalculadas.filter((linha) => {
      if (!pertenceAoGrupo(linha.classificacao, grupo)) return false;
      if (!mostrarZeradas && linhaZerada(linha)) return false;
      if (somenteMovimento && linha.lancamentos === 0) return false;
      if (!q) return true;

      const corresponde = [linha.conta, linha.classificacao, linha.descricao, linha.tipo]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(q);

      return corresponde || (linha.tipo === "S" && correspondenciasAnaliticas.some((analitica) => descendente(analitica, linha)));
    });
  }, [busca, grupo, linhasCalculadas, somenteMovimento, mostrarZeradas]);

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;
  const linhasVisiveis = printing ? linhas : linhas.slice(inicio, fim);

  function abrirRazao(conta: string) {
    window.location.assign(`/contabil/razao?conta=${encodeURIComponent(conta)}`);
  }

  function exportarCsv() {
    const cabecalho = ["CONTA", "S/A", "CLASSIFICAÇÃO", "DESCRIÇÃO", "SALDO ANTERIOR", "DÉBITO", "CRÉDITO", "MOVIMENTO", "SALDO ATUAL"];
    const conteudo = [cabecalho, ...linhasCalculadas.map((linha) => [linha.conta, linha.tipo, linha.classificacao, linha.descricao, linha.saldoAnterior.toFixed(2).replace(".", ","), linha.debitos.toFixed(2).replace(".", ","), linha.creditos.toFixed(2).replace(".", ","), linha.movimento.toFixed(2).replace(".", ","), linha.saldoAtual.toFixed(2).replace(".", ",")])].map((colunas) => colunas.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Nitaplast_Balancete_062026.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportarBalanceteExcel() {
    const filtros = [grupo !== "Todos" ? `Grupo: ${grupo}` : null, somenteMovimento ? "Somente com movimento" : null, mostrarZeradas ? "Inclui contas zeradas" : "Oculta contas zeradas", busca.trim() ? `Busca: ${busca.trim()}` : null].filter(Boolean).join(" · ");
    exportarExcel({ arquivo: "Nitaplast_Balancete_062026.xlsx", aba: "Balancete", titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — BALANCETE CONSOLIDADO", subtitulo: `Período 01/06/2026 a 30/06/2026 · ${filtros}`, colunas: [{ cabecalho: "Conta contábil", largura: 16 }, { cabecalho: "S/A", largura: 8 }, { cabecalho: "Classificação", largura: 22 }, { cabecalho: "Descrição", largura: 52 }, { cabecalho: "Saldo anterior", largura: 18, tipo: "numero" }, { cabecalho: "Débito", largura: 18, tipo: "numero" }, { cabecalho: "Crédito", largura: 18, tipo: "numero" }, { cabecalho: "Movimento", largura: 18, tipo: "numero" }, { cabecalho: "Saldo atual", largura: 18, tipo: "numero" }], linhas: linhas.map((linha) => [linha.conta, linha.tipo, linha.classificacao, `${"  ".repeat(Math.max(0, linha.nivel - 1))}${linha.descricao}`, linha.saldoAnterior, linha.debitos, linha.creditos, linha.movimento, linha.saldoAtual]) });
  }

  return <PageShell>
    <PageHeader titulo="Balancete consolidado - Nitaplast" descricao="Saldos anteriores em 31/05/2026 e movimentação contábil da competência 06/2026." acoes={<div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Consolidado - 06/2026</Badge><Button variant="outline" size="sm" className="gap-2" onClick={exportarCsv}><Download className="size-4" />Exportar CSV</Button><Button variant="outline" size="sm" className="gap-2" onClick={exportarBalanceteExcel}><FileSpreadsheet className="size-4" />Exportar Excel</Button><Button variant="outline" size="sm" className="gap-2" onClick={printAll}><Printer className="size-4" />Imprimir / PDF</Button></div>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6 print:hidden"><Metric label="Ativo consolidado em 31/05" value={resumoImplantacao.ativo} /><Metric label="Passivo + PL consolidado em 31/05" value={resumoImplantacao.passivoPatrimonioLiquido} /><Metric label="Linhas do balancete" value={linhasCalculadas.filter((linha) => mostrarZeradas || !linhaZerada(linha)).length} /><Metric label="Débitos consolidados 06" value={totalDebitosIntegrados} /><Metric label="Créditos consolidados 06" value={totalCreditosIntegrados} /><Metric label="Reclassificações" value={reclassificacoes.length} /></div>
    <Card className="border-emerald-500/40 bg-emerald-500/5 print:hidden"><CardContent className="flex items-start gap-3 pt-6"><CheckCircle2 className="size-5 shrink-0 text-emerald-700" /><div><p className="font-medium">Balancete consolidado e recalculável</p><p className="text-sm text-muted-foreground">Matriz e filial são apresentadas no mesmo balancete. Reclassificações feitas no Razão entram como lançamentos de ajuste e recalculam automaticamente as contas analíticas e sintéticas. Débitos {brl.format(totalDebitosIntegrados)} e créditos {brl.format(totalCreditosIntegrados)} permanecem equilibrados.</p></div></CardContent></Card>
    <Card className="print:border-0 print:shadow-none"><CardHeader className="print:px-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Balancete consolidado - Débito, Crédito e Movimento</CardTitle><CardDescription className="print:text-black">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA · 01/06/2026 a 30/06/2026</CardDescription></div><div className="relative w-full sm:w-96 print:hidden"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar conta, classificação ou descrição" className="pl-9" /></div></div><div className="flex flex-wrap gap-2 pt-2 print:hidden">{grupos.map((item) => <button key={item} onClick={() => { setGrupo(item); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${grupo === item ? "bg-primary text-primary-foreground" : "bg-background"}`}>{item}</button>)}<button onClick={() => { setSomenteMovimento((valor) => !valor); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${somenteMovimento ? "bg-amber-100 text-amber-900" : "bg-background"}`}>Somente com movimento</button><button onClick={() => { setMostrarZeradas((valor) => !valor); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${mostrarZeradas ? "bg-slate-200 text-slate-900" : "bg-background"}`}>{mostrarZeradas ? "Ocultar contas zeradas" : "Exibir contas zeradas"}</button></div></CardHeader><CardContent className="overflow-x-auto print:px-0"><p className="mb-3 text-xs text-muted-foreground print:hidden">{linhas.length} linhas exibidas. Contas sem saldo anterior, sem movimentação e com saldo atual zero estão ocultas.</p><table className="w-full min-w-[1450px] text-sm print:min-w-0 print:text-[9px]"><thead><tr className="border-b bg-muted/40 text-left text-xs print:bg-white print:text-[8px]"><th className="p-2">Conta contábil</th><th className="p-2 text-center">S/A</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th><th className="p-2 text-right print:hidden">Detalhe</th></tr></thead><tbody>{linhasVisiveis.map((linha) => <tr key={`${linha.tipo}-${linha.conta}-${linha.classificacao}`} className={classeLinha(linha)}><td className="p-2 font-mono">{linha.conta}</td><td className="p-2 text-center font-medium">{linha.tipo}</td><td className="p-2 font-mono text-xs print:text-[8px]">{linha.classificacao}</td><td className="p-2" style={{ paddingLeft: `${8 + Math.max(0, linha.nivel - 1) * 12}px` }}>{linha.descricao}</td><Money value={linha.saldoAnterior} strong={linha.tipo === "S"} /><Money value={linha.debitos} /><Money value={linha.creditos} /><Money value={linha.movimento} /><Money value={linha.saldoAtual} strong /><td className="p-2 text-right print:hidden">{linha.tipo === "A" ? <Button variant="outline" size="sm" onClick={() => abrirRazao(linha.conta)}>Abrir Razão</Button> : <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody></table></CardContent><CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 print:hidden"><p className="text-xs text-muted-foreground">Exibindo {linhas.length ? inicio + 1 : 0}-{Math.min(fim, linhas.length)} de {linhas.length} linhas.</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button><span className="text-xs">Página {paginaAtual} de {totalPaginas}</span><Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button></div></CardContent></Card>
  </PageShell>;
}

function classeLinha(linha: LinhaCalculada) { if (linha.tipo === "A") return "border-b last:border-0 bg-background print:bg-white"; if (linha.nivel === 1) return "border-b bg-blue-200/80 font-bold print:bg-white"; if (linha.nivel === 2) return "border-b bg-emerald-200/70 font-bold print:bg-white"; if (linha.nivel === 3) return "border-b bg-emerald-100/70 font-bold print:bg-white"; return "border-b bg-emerald-50 font-semibold print:bg-white"; }
function Money({ value, strong = false }: { value: number; strong?: boolean }) { const conteudo = value < 0 ? `(${brl.format(Math.abs(value))})` : value ? brl.format(value) : "-"; return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{conteudo}</td>; }
function Metric({ label, value }: { label: string; value: number }) { const display = Number.isInteger(value) && value < 10000 ? String(value) : brl.format(value); return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{display}</p></CardContent></Card>; }
