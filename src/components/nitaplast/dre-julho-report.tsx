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
import { estabelecimentoResultadoNitaplast } from "@/data/nitaplast-estabelecimento";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const arred = (valor: number) => Math.round(valor * 100) / 100;
type Item = ComposicaoResultadoJulho;
type LinhaReport = { id: string; descricao: string; valor: number; nivel: 0 | 1 | 2; tipo: "grupo" | "detalhe" | "subtotal" | "resultado" };
type Estab = "Matriz" | "Filial SP";

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999", "20002"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306"]);
const creditosFederaisContas = new Set(["25946", "25947"]);
const soma = (itens: Item[]) => arred(itens.reduce((total, item) => total + item.valor, 0));
function zero(conta: string, classificacao: string, descricao: string, cc: string, centroCusto: string): Item { return { id: `REPORT-ZERO-${conta}`, conta, classificacao, descricao, cc, centroCusto, estabelecimento: "Matriz", valor: 0, status: "validado", fonte: "Razão 07/2026 — sem movimento", debitos: 0, creditos: 0 }; }
function garantir(itens: Item[], conta: string, item: Item) { return itens.some((x) => x.conta === conta) ? itens : [...itens, item]; }

export function DreJulhoReport() {
  const { aplicar } = useReclassificacoesInteligentes("2026-07");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razaoAjustado), [razaoAjustado]);
  const dre = calculo.dre;
  const composicao = calculo.composicao;

  const creditoPorEstabelecimento = (conta: string, estabelecimento: Estab) => arred(-razaoAjustado.reduce((s, l) => {
    if (estabelecimentoResultadoNitaplast(l, conta) !== estabelecimento) return s;
    return s + (l.debitoCodigo === conta ? l.valor : 0) - (l.creditoCodigo === conta ? l.valor : 0);
  }, 0));
  const receitaProducaoMatriz = creditoPorEstabelecimento("2606", "Matriz");
  const receitaProducaoFilial = creditoPorEstabelecimento("2606", "Filial SP");
  const receitaRevendaMatriz = creditoPorEstabelecimento("2655", "Matriz");
  const receitaRevendaFilial = creditoPorEstabelecimento("2655", "Filial SP");

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
    if (item.conta !== "25938" || item.cc !== "304" || item.estabelecimento !== "Matriz" || Math.abs(valorNplog) < 0.005) return item;
    const debitos = arred(item.debitos - nplogDebitos);
    const creditos = arred(item.creditos - nplogCreditos);
    return { ...item, debitos, creditos, valor: arred(debitos - creditos) };
  }).filter((item) => Math.abs(item.valor) >= 0.005), [base.despesas, nplogCreditos, nplogDebitos, valorNplog]);

  const grupos = useMemo(() => {
    const custosMatriz = base.custos.filter((x) => x.estabelecimento === "Matriz");
    const custosFilial = base.custos.filter((x) => x.estabelecimento === "Filial SP");
    const fechamentoEstoqueMatriz = custosMatriz.filter((x) => x.conta === "25944");
    const fechamentoEstoqueFilial = custosFilial.filter((x) => x.conta === "25945");
    const componentesCpvMatriz = custosMatriz.filter((x) => x.conta !== "25944");
    const componentesCpvFilial = custosFilial.filter((x) => x.conta !== "25945");

    const filial = despesasSemNplog.filter((x) => x.estabelecimento === "Filial SP");
    const matriz = despesasSemNplog.filter((x) => x.estabelecimento === "Matriz");
    const industrializacao = composicao.filter((x) => x.conta === "25937" && x.estabelecimento === "Matriz");
    const depreciacao = matriz.filter((x) => x.classificacao.startsWith("5.7.01.011"));
    const creditosFederais = matriz.filter((x) => creditosFederaisContas.has(x.conta));
    const importacao = matriz.filter((x) => x.conta === "25070");
    const exportacao = matriz.filter((x) => x.conta === "25072");
    const veiculos = matriz.filter((x) => x.classificacao.startsWith("5.7.05") || x.classificacao.startsWith("5.7.01.015"));
    const energia = composicao.filter((x) => x.conta === "3494" && x.estabelecimento === "Matriz");
    const excluidas = new Set([...industrializacao, ...depreciacao, ...creditosFederais, ...importacao, ...exportacao, ...veiculos, ...energia].map((x) => x.id));
    const classificaveis = matriz.filter((x) => !excluidas.has(x.id));
    const comerciais = classificaveis.filter((x) => ccCom.has(x.cc));
    const administrativas = classificaveis.filter((x) => ccAdm.has(x.cc));
    const producao = classificaveis.filter((x) => ccProd.has(x.cc) && !comerciais.includes(x));
    const outras = classificaveis.filter((x) => !producao.includes(x) && !comerciais.includes(x) && !administrativas.includes(x));
    const despesasFinanceiras = garantir(base.despesasFinanceiras, "25109", zero("25109", "5.8.01.006", "Variações Cambiais Passivas", "902", "DESPESAS FINANCEIRAS"));
    const receitasFinanceiras = garantir(base.receitasFinanceiras, "25096", zero("25096", "5.7.12.001.006", "Variações Cambiais Ativas", "901", "RECEITAS FINANCEIRAS"));
    return { custosMatriz, custosFilial, fechamentoEstoqueMatriz, fechamentoEstoqueFilial, componentesCpvMatriz, componentesCpvFilial, filial, matriz, industrializacao, depreciacao, creditosFederais, importacao, exportacao, veiculos, energia, comerciais, administrativas, producao, outras, despesasFinanceiras, receitasFinanceiras };
  }, [base, despesasSemNplog, composicao]);

  const custosDre = soma(base.custos);
  const despesasOperacionais = arred(soma(despesasSemNplog) + valorNplog);
  const despesasMatriz = arred(soma(grupos.matriz) + valorNplog);
  const despesasFilial = soma(grupos.filial);
  const despesasFinanceiras = soma(base.despesasFinanceiras);
  const receitaLiquida = dre.receitaLiquida;
  const lucroBruto = arred(receitaLiquida - custosDre);
  const resultadoOperacional = arred(lucroBruto - despesasOperacionais);
  const resultadoFinal = dre.resultado;
  const resultadoConferido = arred(resultadoOperacional - despesasFinanceiras + dre.receitasFinanceiras + dre.resultadoAlienacaoImobilizado);

  if (Math.abs(custosDre - arred(dre.cpvMatriz + dre.cpvFilial)) > 0.01) throw new Error("CPV Matriz/Filial não concilia com Custos no DRE Report.");
  if (Math.abs(despesasOperacionais - arred(despesasMatriz + despesasFilial)) > 0.01) throw new Error("Despesas Matriz/Filial não conciliam no DRE Report.");
  if (Math.abs(resultadoFinal - resultadoConferido) > 0.01) throw new Error(`DRE Report divergiu do Razão: ${resultadoConferido.toFixed(2)} / ${resultadoFinal.toFixed(2)}`);
  if (Math.abs(soma(grupos.energia) - dre.energiaEletricaMatriz) > 0.01) throw new Error("Energia elétrica no DRE Report não concilia ao Razão.");

  const linhas = useMemo<LinhaReport[]>(() => [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: dre.receitaBruta, nivel: 0, tipo: "grupo" },
    { id: "rmp", descricao: "Receita Venda Produção — Matriz", valor: receitaProducaoMatriz, nivel: 1, tipo: "detalhe" },
    { id: "rmr", descricao: "Receita Revenda — Matriz", valor: receitaRevendaMatriz, nivel: 1, tipo: "detalhe" },
    { id: "rfp", descricao: "Receita Venda Produção — Filial SP", valor: receitaProducaoFilial, nivel: 1, tipo: "detalhe" },
    { id: "rfr", descricao: "Receita Revenda — Filial SP", valor: receitaRevendaFilial, nivel: 1, tipo: "detalhe" },

    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: -dre.deducoes, nivel: 0, tipo: "grupo" },
    { id: "dev-m", descricao: "Devoluções de Produtos — Matriz", valor: -dre.devolucoesMatriz, nivel: 1, tipo: "detalhe" },
    { id: "dev-f", descricao: "Devoluções de Produtos — Filial SP", valor: -dre.devolucoesFilial, nivel: 1, tipo: "detalhe" },
    { id: "icms-m", descricao: "ICMS sobre vendas — Matriz", valor: -dre.icmsMatriz, nivel: 1, tipo: "detalhe" },
    { id: "icms-f", descricao: "ICMS sobre vendas — Filial SP (sem transferências internas)", valor: -dre.icmsFilial, nivel: 1, tipo: "detalhe" },
    { id: "ipi-m", descricao: "IPI — Matriz", valor: -dre.ipiMatriz, nivel: 1, tipo: "detalhe" },
    { id: "ipi-f", descricao: "IPI — Filial SP", valor: -dre.ipiFilial, nivel: 1, tipo: "detalhe" },
    { id: "pis-m", descricao: "PIS — Matriz", valor: -dre.pisMatriz, nivel: 1, tipo: "detalhe" },
    { id: "pis-f", descricao: "PIS — Filial SP", valor: -dre.pisFilial, nivel: 1, tipo: "detalhe" },
    { id: "cof-m", descricao: "COFINS — Matriz", valor: -dre.cofinsMatriz, nivel: 1, tipo: "detalhe" },
    { id: "cof-f", descricao: "COFINS — Filial SP", valor: -dre.cofinsFilial, nivel: 1, tipo: "detalhe" },
    { id: "st-m", descricao: "ICMS ST — Matriz", valor: -dre.icmsStMatriz, nivel: 1, tipo: "detalhe" },
    { id: "st-f", descricao: "ICMS ST — Filial SP", valor: -dre.icmsStFilial, nivel: 1, tipo: "detalhe" },

    { id: "receita-liquida", descricao: "Receita Operacional Líquida", valor: receitaLiquida, nivel: 0, tipo: "subtotal" },
    { id: "custos", descricao: "(-) CPV / CMV", valor: -custosDre, nivel: 0, tipo: "grupo" },
    { id: "cpv-m", descricao: "CPV — Matriz", valor: -dre.cpvMatriz, nivel: 1, tipo: "detalhe" },
    { id: "cpv-m-fech", descricao: "Fechamento / Variação de estoque — Matriz (25944)", valor: -dre.fechamentoEstoqueMatriz, nivel: 2, tipo: "detalhe" },
    { id: "cpv-m-comp", descricao: "Compras líquidas — Matriz", valor: -dre.outrosCustosMatriz, nivel: 2, tipo: "detalhe" },
    { id: "cpv-f", descricao: "CPV — Filial SP", valor: -dre.cpvFilial, nivel: 1, tipo: "detalhe" },
    { id: "cpv-f-fech", descricao: "CPV periódico consolidado — Filial SP (25945)", valor: -dre.fechamentoEstoqueFilial, nivel: 2, tipo: "detalhe" },
    { id: "cpv-f-comp", descricao: "Componentes fora da conta 25945 — Filial SP", valor: -dre.outrosCustosFilial, nivel: 2, tipo: "detalhe" },
    { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: lucroBruto, nivel: 0, tipo: "subtotal" },

    { id: "despesas", descricao: "(-) Despesas Operacionais", valor: -despesasOperacionais, nivel: 0, tipo: "grupo" },
    { id: "desp-m", descricao: "Despesas Operacionais — Matriz", valor: -despesasMatriz, nivel: 1, tipo: "detalhe" },
    { id: "industrializacao", descricao: "Despesas com Industrialização — Matriz", valor: -soma(grupos.industrializacao), nivel: 2, tipo: "detalhe" },
    { id: "energia", descricao: "Energia Elétrica — Matriz (movimento 07/2026)", valor: -dre.energiaEletricaMatriz, nivel: 2, tipo: "detalhe" },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog — Matriz", valor: -valorNplog, nivel: 2, tipo: "detalhe" },
    { id: "desp-producao", descricao: "Despesas Produção — Matriz", valor: -soma(grupos.producao), nivel: 2, tipo: "detalhe" },
    { id: "veiculos", descricao: "Despesas com Veículos — Matriz", valor: -soma(grupos.veiculos), nivel: 2, tipo: "detalhe" },
    { id: "importacao", descricao: "Despesas com Importação — Matriz", valor: -soma(grupos.importacao), nivel: 2, tipo: "detalhe" },
    { id: "exportacao", descricao: "Despesas com Exportação — Matriz", valor: -soma(grupos.exportacao), nivel: 2, tipo: "detalhe" },
    { id: "desp-comerciais", descricao: "Despesas Comerciais — Matriz", valor: -soma(grupos.comerciais), nivel: 2, tipo: "detalhe" },
    { id: "desp-adm", descricao: "Despesas Administrativas — Matriz", valor: -soma(grupos.administrativas), nivel: 2, tipo: "detalhe" },
    { id: "depreciacao", descricao: "Depreciação e Amortização — Matriz", valor: -soma(grupos.depreciacao), nivel: 2, tipo: "detalhe" },
    { id: "creditos-federais", descricao: "(-) Créditos PIS/COFINS sobre Custos e Despesas — Matriz", valor: -soma(grupos.creditosFederais), nivel: 2, tipo: "detalhe" },
    { id: "desp-outras", descricao: "Outras Despesas Operacionais — Matriz", valor: -soma(grupos.outras), nivel: 2, tipo: "detalhe" },
    { id: "desp-filial", descricao: "Despesas Operacionais — Filial SP", valor: -despesasFilial, nivel: 1, tipo: "detalhe" },
    { id: "resultado-operacional", descricao: "RESULTADO OPERACIONAL", valor: resultadoOperacional, nivel: 0, tipo: "subtotal" },

    { id: "desp-fin", descricao: "(-) Despesas Financeiras", valor: -despesasFinanceiras, nivel: 0, tipo: "grupo" },
    ...[...grupos.despesasFinanceiras].sort((a,b)=>a.conta.localeCompare(b.conta)).map<LinhaReport>((item) => ({ id: `fin-d-${item.conta}-${item.cc}-${item.estabelecimento}`, descricao: `${item.conta} · ${item.descricao} — ${item.estabelecimento}`, valor: -item.valor, nivel: 1, tipo: "detalhe" })),
    { id: "rec-fin", descricao: "(+) Receitas Financeiras", valor: dre.receitasFinanceiras, nivel: 0, tipo: "grupo" },
    ...[...grupos.receitasFinanceiras].sort((a,b)=>a.conta.localeCompare(b.conta)).map<LinhaReport>((item) => ({ id: `fin-r-${item.conta}-${item.cc}-${item.estabelecimento}`, descricao: `${item.conta} · ${item.descricao} — ${item.estabelecimento}`, valor: -item.valor, nivel: 1, tipo: "detalhe" })),

    { id: "alienacao", descricao: "Resultado na Alienação de Imobilizado — Matriz", valor: dre.resultadoAlienacaoImobilizado, nivel: 0, tipo: "grupo" },
    { id: "alien-rec", descricao: "(+) Venda de Ativo Imobilizado — Mini + Corolla + Transformador", valor: dre.receitaAlienacaoImobilizado, nivel: 1, tipo: "detalhe" },
    { id: "alien-custo", descricao: "(-) Custo dos Ativos Imobilizados Vendidos", valor: -dre.custoAlienacaoImobilizado, nivel: 1, tipo: "detalhe" },
    { id: "alien-res", descricao: "(=) Ganho na Alienação — Mini + Corolla + Transformador", valor: dre.resultadoAlienacaoImobilizado, nivel: 1, tipo: "subtotal" },
    { id: "resultado", descricao: "RESULTADO CONTÁBIL", valor: resultadoFinal, nivel: 0, tipo: "resultado" },
  ], [custosDre, despesasFinanceiras, despesasFilial, despesasMatriz, despesasOperacionais, dre, grupos, lucroBruto, receitaLiquida, receitaProducaoFilial, receitaProducaoMatriz, receitaRevendaFilial, receitaRevendaMatriz, resultadoFinal, resultadoOperacional, valorNplog]);

  const percentual = (valor: number) => dre.receitaBruta ? (valor / dre.receitaBruta) * 100 : 0;
  function exportarCsv() {
    const csv = [["DESCRIÇÃO", "VALOR", "% RECEITA"], ...linhas.map((linha) => [linha.descricao, linha.valor.toFixed(2).replace(".", ","), percentual(linha.valor).toFixed(2).replace(".", ",")])]
      .map((colunas) => colunas.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Nitaplast_DRE_Report_072026.csv"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportarDreExcel() {
    exportarExcel({ arquivo: "Nitaplast_DRE_Report_072026.xlsx", aba: "DRE", titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE · Matriz e Filial SP segregadas · Mini, Corolla e Transformador baixados", colunas: [{ cabecalho: "Descrição", largura: 82 }, { cabecalho: "Valor", largura: 18, tipo: "numero" }, { cabecalho: "% Receita", largura: 14, tipo: "percentual" }], linhas: linhas.map((linha) => [`${"    ".repeat(linha.nivel)}${linha.descricao}`, linha.valor, percentual(linha.valor) / 100]) });
  }

  return <><div className="print:hidden"><PageHeader titulo="DRE Report — Nitaplast" descricao="Competência 07/2026 · Mini, Corolla e Transformador contabilizados · Razão → Balancete → DRE" acoes={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={exportarCsv}><Download className="size-4" /> Exportar CSV</Button><Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" /> Exportar Excel</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="size-4" /> Imprimir / PDF</Button></div>} /></div><section className="mx-auto w-full max-w-5xl bg-background print:max-w-none print:bg-white print:text-black"><header className="border-b-2 border-foreground pb-4 text-center"><h1 className="text-lg font-bold uppercase tracking-wide">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</h1><p className="mt-1 text-sm">CNPJ 82.295.817/0001-07 · Consolidado com abertura Matriz / Filial SP</p><h2 className="mt-4 text-base font-semibold uppercase">Demonstração do Resultado do Exercício</h2><p className="mt-1 text-sm">Período: 01/07/2026 a 31/07/2026</p><p className="mt-1 text-xs text-muted-foreground print:text-black">Energia elétrica 3494: movimento líquido de julho {brl.format(dre.energiaEletricaMatriz)}; saldos acumulados do Balancete não são usados como despesa mensal.</p></header><table className="mt-5 w-full border-collapse text-sm"><thead><tr className="border-y border-foreground text-left text-xs uppercase print:border-black"><th className="py-2 pr-3">Descrição</th><th className="w-44 py-2 text-right">Valor</th><th className="w-28 py-2 text-right">% Receita</th></tr></thead><tbody>{linhas.map((linha) => { const recuo = linha.nivel === 2 ? "pl-12" : linha.nivel === 1 ? "pl-6" : ""; const classe = linha.tipo === "resultado" ? "border-t-2 border-t-foreground font-bold print:border-t-black" : linha.tipo === "subtotal" ? "font-bold" : linha.tipo === "grupo" ? "font-semibold" : ""; return <tr key={linha.id} className={`border-b border-border print:border-neutral-300 ${classe}`}><td className={`py-2 pr-3 ${recuo}`}>{linha.descricao}</td><td className="py-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="py-2 text-right tabular-nums">{pct.format(percentual(linha.valor))}%</td></tr>; })}</tbody></table><div className="mt-5 border border-amber-500/40 p-3 text-xs"><strong>Observações de auditoria:</strong> Mini Cooper: venda R$ 119.900,00, residual R$ 52.500,00, ganho R$ 67.400,00. Corolla: venda R$ 127.000,00, residual R$ 93.139,29, ganho R$ 33.860,71. Transformador seco 1000KVA (NF 93639): vendido em 14/07/2026 por R$ 60.000,00, custo original R$ 98.016,00, depreciação acumulada até a venda R$ 40.377,14, valor contábil líquido R$ 57.638,86, ganho R$ 2.361,14; recebimento em parcelas previstas para agosto e setembro/2026. Ganho total reconhecido R$ 103.621,85. Energia 3494: débitos {brl.format(dre.energiaDebitosMatriz)} menos créditos {brl.format(dre.energiaCreditosMatriz)} = {brl.format(dre.energiaEletricaMatriz)}. ICMS de transferências internas da Filial SP de {brl.format(dre.icmsFilialTransferenciasInternas)} permanece no Razão e fica fora da dedução de vendas. NF 93567 de R$ 127.000,00 está cancelada.</div></section></>;
}
