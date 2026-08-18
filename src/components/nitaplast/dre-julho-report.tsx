import { useMemo } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  calcularDreJulhoFinal,
  ehCustoDreJulho,
  ehDespesaFinanceiraDreJulho,
  ehDespesaOperacionalDreJulho,
  ehReceitaFinanceiraDreJulho,
  type ComposicaoResultadoJulho,
} from "@/data/nitaplast-dre-julho-final";
import { receitaFiscalJulho } from "@/data/nitaplast-fechamento-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const arred = (valor: number) => Math.round(valor * 100) / 100;
type Item = ComposicaoResultadoJulho;
type LinhaReport = { id: string; descricao: string; valor: number; nivel: 0 | 1; tipo: "grupo" | "detalhe" | "subtotal" | "resultado" };

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999", "20002"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210", "502"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306", "501"]);
const creditosFederaisContas = new Set(["25946", "25947"]);
function soma(itens: Item[]) { return arred(itens.reduce((total, item) => total + item.valor, 0)); }
function zero(conta: string, classificacao: string, descricao: string, cc: string, centroCusto: string): Item { return { id: `REPORT-ZERO-${conta}`, conta, classificacao, descricao, cc, centroCusto, valor: 0, status: "validado", fonte: "Razão 07/2026 — sem movimento", debitos: 0, creditos: 0 }; }
function garantir(itens: Item[], conta: string, item: Item) { return itens.some((x) => x.conta === conta) ? itens : [...itens, item]; }

export function DreJulhoReport() {
  const { aplicar } = useReclassificacoesInteligentes("2026-07");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razaoAjustado), [razaoAjustado]);
  const dre = calculo.dre;
  const composicao = calculo.composicao;

  function mov(conta: string) { return arred(razaoAjustado.reduce((total, linha) => total + (linha.debitoCodigo === conta ? linha.valor : 0) - (linha.creditoCodigo === conta ? linha.valor : 0), 0)); }

  const base = useMemo(() => ({
    custos: composicao.filter(ehCustoDreJulho),
    despesas: composicao.filter(ehDespesaOperacionalDreJulho),
    despesasFinanceiras: composicao.filter(ehDespesaFinanceiraDreJulho),
    receitasFinanceiras: composicao.filter(ehReceitaFinanceiraDreJulho),
  }), [composicao]);

  const lancamentosNplog = useMemo(() => razaoAjustado.filter((linha) => linha.documento?.startsWith("11.02.003")), [razaoAjustado]);
  const nplogDebitos = arred(lancamentosNplog.reduce((total, linha) => total + (linha.debitoCodigo === "25938" ? linha.valor : 0), 0));
  const nplogCreditos = arred(lancamentosNplog.reduce((total, linha) => total + (linha.creditoCodigo === "25938" ? linha.valor : 0), 0));
  const valorNplog = arred(nplogDebitos - nplogCreditos);

  const despesasSemNplog = useMemo<Item[]>(() => base.despesas.map((item) => {
    if (item.conta !== "25938" || item.cc !== "304" || Math.abs(valorNplog) < 0.005) return item;
    const debitos = arred(item.debitos - nplogDebitos);
    const creditos = arred(item.creditos - nplogCreditos);
    return { ...item, debitos, creditos, valor: arred(debitos - creditos) };
  }).filter((item) => Math.abs(item.valor) >= 0.005), [base.despesas, nplogCreditos, nplogDebitos, valorNplog]);

  const grupos = useMemo(() => {
    const industrializacao = despesasSemNplog.filter((x) => x.conta === "25937");
    const depreciacao = despesasSemNplog.filter((x) => x.classificacao.startsWith("5.7.01.011"));
    const creditosFederais = despesasSemNplog.filter((x) => creditosFederaisContas.has(x.conta));
    const classificaveis = despesasSemNplog.filter((x) => x.conta !== "25937" && !x.classificacao.startsWith("5.7.01.011") && !creditosFederaisContas.has(x.conta));
    const ehComercial = (x: Item) => ccCom.has(x.cc) || (x.conta === "4253" && x.cc === "109");
    const comerciais = classificaveis.filter(ehComercial);
    const administrativas = classificaveis.filter((x) => ccAdm.has(x.cc));
    const producao = classificaveis.filter((x) => ccProd.has(x.cc) && !ehComercial(x));
    const outras = classificaveis.filter((x) => !producao.includes(x) && !comerciais.includes(x) && !administrativas.includes(x));
    const despesasFinanceiras = garantir(base.despesasFinanceiras, "25109", zero("25109", "5.8.01.006", "Variações Cambiais Passivas", "902", "DESPESAS FINANCEIRAS"));
    const receitasFinanceiras = garantir(base.receitasFinanceiras, "25096", zero("25096", "5.7.12.001.006", "Variações Cambiais Ativas", "901", "RECEITAS FINANCEIRAS"));
    return { custos: base.custos, industrializacao, depreciacao, creditosFederais, classificaveis, comerciais, administrativas, producao, outras, despesasFinanceiras, receitasFinanceiras };
  }, [base, despesasSemNplog]);

  const custosDre = soma(grupos.custos);
  const despesasOperacionais = arred(soma(grupos.classificaveis) + soma(grupos.industrializacao) + soma(grupos.depreciacao) + soma(grupos.creditosFederais) + valorNplog);
  const despesasFinanceiras = soma(base.despesasFinanceiras);
  const receitaLiquida = dre.receitaLiquida;
  const lucroBruto = arred(receitaLiquida - custosDre);
  const resultadoOperacional = arred(lucroBruto - despesasOperacionais);
  const resultadoFinal = dre.resultado;
  const resultadoConferido = arred(resultadoOperacional - despesasFinanceiras + dre.receitasFinanceiras);
  if (Math.abs(resultadoFinal - resultadoConferido) > 0.01) throw new Error(`DRE Report divergiu do Razão: ${resultadoConferido.toFixed(2)} / ${resultadoFinal.toFixed(2)}`);

  const linhas = useMemo<LinhaReport[]>(() => [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: dre.receitaBruta, nivel: 0, tipo: "grupo" },
    { id: "rmp", descricao: "Receita Venda Produção Matriz", valor: receitaFiscalJulho.matriz.producao, nivel: 1, tipo: "detalhe" },
    { id: "rmr", descricao: "Receita Revenda Matriz", valor: receitaFiscalJulho.matriz.revenda, nivel: 1, tipo: "detalhe" },
    { id: "rfp", descricao: "Receita Venda Produção Filial", valor: receitaFiscalJulho.filialSp.producaoOperacaoTriangular, nivel: 1, tipo: "detalhe" },
    { id: "rfr", descricao: "Receita Revenda Filial", valor: receitaFiscalJulho.filialSp.revenda, nivel: 1, tipo: "detalhe" },
    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: -dre.deducoes, nivel: 0, tipo: "grupo" },
    { id: "dev", descricao: "Devoluções de Produtos", valor: -dre.devolucoes, nivel: 1, tipo: "detalhe" },
    { id: "icms-m", descricao: "ICMS Matriz", valor: -Math.max(0, mov("2827")), nivel: 1, tipo: "detalhe" },
    { id: "icms-f", descricao: "ICMS s/ vendas Filial", valor: -Math.max(0, mov("25054")), nivel: 1, tipo: "detalhe" },
    { id: "ipi-m", descricao: "IPI Matriz", valor: -Math.max(0, mov("2826")), nivel: 1, tipo: "detalhe" },
    { id: "ipi-f", descricao: "IPI Filial", valor: -Math.max(0, mov("25055")), nivel: 1, tipo: "detalhe" },
    { id: "pis", descricao: "PIS", valor: -dre.pis, nivel: 1, tipo: "detalhe" },
    { id: "cofins", descricao: "COFINS", valor: -dre.cofins, nivel: 1, tipo: "detalhe" },
    { id: "icms-st", descricao: "ICMS ST", valor: -dre.icmsSt, nivel: 1, tipo: "detalhe" },
    { id: "receita-liquida", descricao: "Receita Operacional Líquida", valor: receitaLiquida, nivel: 0, tipo: "subtotal" },
    { id: "custos", descricao: "(-) Custos / CPV / CMV", valor: -custosDre, nivel: 0, tipo: "grupo" },
    ...grupos.custos.map<LinhaReport>((item) => ({ id: `custo-${item.id}`, descricao: `${item.conta} · ${item.descricao}${item.centroCusto ? ` — ${item.centroCusto}` : ""}`, valor: -item.valor, nivel: 1, tipo: "detalhe" })),
    { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: lucroBruto, nivel: 0, tipo: "subtotal" },
    { id: "despesas", descricao: "(-) Despesas Operacionais", valor: -despesasOperacionais, nivel: 0, tipo: "grupo" },
    { id: "industrializacao", descricao: "Despesas com Industrialização", valor: -soma(grupos.industrializacao), nivel: 1, tipo: "detalhe" },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog", valor: -valorNplog, nivel: 1, tipo: "detalhe" },
    { id: "desp-producao", descricao: "Despesas Produção", valor: -soma(grupos.producao), nivel: 1, tipo: "detalhe" },
    { id: "desp-comerciais", descricao: "Despesas Comerciais", valor: -soma(grupos.comerciais), nivel: 1, tipo: "detalhe" },
    { id: "desp-adm", descricao: "Despesas Administrativas", valor: -soma(grupos.administrativas), nivel: 1, tipo: "detalhe" },
    { id: "depreciacao", descricao: "Depreciação e Amortização", valor: -soma(grupos.depreciacao), nivel: 1, tipo: "detalhe" },
    { id: "creditos-federais", descricao: "(-) Créditos PIS/COFINS sobre Custos e Despesas", valor: -soma(grupos.creditosFederais), nivel: 1, tipo: "detalhe" },
    { id: "desp-outras", descricao: "Outras Despesas Operacionais", valor: -soma(grupos.outras), nivel: 1, tipo: "detalhe" },
    { id: "resultado-operacional", descricao: "RESULTADO OPERACIONAL", valor: resultadoOperacional, nivel: 0, tipo: "subtotal" },
    { id: "desp-fin", descricao: "(-) Despesas Financeiras", valor: -despesasFinanceiras, nivel: 0, tipo: "grupo" },
    ...grupos.despesasFinanceiras.sort((a,b)=>a.conta.localeCompare(b.conta)).map<LinhaReport>((item) => ({ id: `fin-d-${item.conta}-${item.cc}`, descricao: `${item.conta} · ${item.descricao}`, valor: -item.valor, nivel: 1, tipo: "detalhe" })),
    { id: "rec-fin", descricao: "(+) Receitas Financeiras", valor: dre.receitasFinanceiras, nivel: 0, tipo: "grupo" },
    ...grupos.receitasFinanceiras.sort((a,b)=>a.conta.localeCompare(b.conta)).map<LinhaReport>((item) => ({ id: `fin-r-${item.conta}-${item.cc}`, descricao: `${item.conta} · ${item.descricao}`, valor: -item.valor, nivel: 1, tipo: "detalhe" })),
    { id: "resultado", descricao: "LUCRO / PREJUÍZO LÍQUIDO", valor: resultadoFinal, nivel: 0, tipo: "resultado" },
  ], [custosDre, despesasFinanceiras, despesasOperacionais, dre, grupos, lucroBruto, receitaLiquida, resultadoFinal, resultadoOperacional, valorNplog]);

  const percentual = (valor: number) => dre.receitaBruta ? (valor / dre.receitaBruta) * 100 : 0;

  function exportarCsv() {
    const csv = [["DESCRIÇÃO", "VALOR", "% RECEITA"], ...linhas.map((linha) => [linha.descricao, linha.valor.toFixed(2).replace(".", ","), percentual(linha.valor).toFixed(2).replace(".", ",")])]
      .map((colunas) => colunas.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Nitaplast_DRE_Report_072026.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportarDreExcel() {
    exportarExcel({ arquivo: "Nitaplast_DRE_Report_072026.xlsx", aba: "DRE", titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE", colunas: [{ cabecalho: "Descrição", largura: 68 }, { cabecalho: "Valor", largura: 18, tipo: "numero" }, { cabecalho: "% Receita", largura: 14, tipo: "percentual" }], linhas: linhas.map((linha) => [`${linha.nivel === 1 ? "    " : ""}${linha.descricao}`, linha.valor, percentual(linha.valor) / 100]) });
  }

  return <><div className="print:hidden"><PageHeader titulo="DRE Report — Nitaplast" descricao="Competência 07/2026 · Razão → Balancete → DRE" acoes={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={exportarCsv}><Download className="size-4" /> Exportar CSV</Button><Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" /> Exportar Excel</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="size-4" /> Imprimir / PDF</Button></div>} /></div><section className="mx-auto w-full max-w-5xl bg-background print:max-w-none print:bg-white print:text-black"><header className="border-b-2 border-foreground pb-4 text-center print:hidden"><h1 className="text-lg font-bold uppercase tracking-wide">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</h1><p className="mt-1 text-sm">CNPJ 82.295.817/0001-07</p><h2 className="mt-4 text-base font-semibold uppercase">Demonstração do Resultado do Exercício</h2><p className="mt-1 text-sm">Período: 01/07/2026 a 31/07/2026</p></header><table className="mt-5 w-full border-collapse text-sm"><thead><tr className="border-y border-foreground text-left text-xs uppercase print:border-black"><th className="py-2 pr-3">Descrição</th><th className="w-44 py-2 text-right">Valor</th><th className="w-28 py-2 text-right">% Receita</th></tr></thead><tbody>{linhas.map((linha) => { const recuo = linha.nivel === 1 ? "pl-6" : ""; const classe = linha.tipo === "resultado" ? "border-t-2 border-t-foreground font-bold print:border-t-black" : linha.tipo === "subtotal" ? "font-bold" : linha.tipo === "grupo" ? "font-semibold" : ""; return <tr key={linha.id} className={`border-b border-border print:border-neutral-300 ${classe}`}><td className={`py-2 pr-3 ${recuo}`}>{linha.descricao}</td><td className="py-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="py-2 text-right tabular-nums">{pct.format(percentual(linha.valor))}%</td></tr>; })}</tbody></table></section></>;
}
