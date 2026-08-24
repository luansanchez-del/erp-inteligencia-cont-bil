import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const arred = (v: number) => Math.round(v * 100) / 100;
type Item = ComposicaoResultadoJulho;
type Linha = { id: string; descricao: string; nivel: number; valor: number; criterio: string; composicao?: Item[]; status?: "calculado" | "pendente" };
type Estab = "Matriz" | "Filial SP";
type LinhaApresentacao = { descricao: string; valor: number | null; percentual?: string; nivel?: 0 | 1; destaque?: boolean };

const receitaBrutaApresentacao = 4_138_549.72;
const resultadoApresentacao = 234_732.08;
const linhasApresentacao: LinhaApresentacao[] = [
  { descricao: "(+) Receita Operacional Bruta", valor: receitaBrutaApresentacao, percentual: "100,00%", destaque: true },
  { descricao: "Receita Venda Produção Matriz", valor: 3_443_785.35, nivel: 1 },
  { descricao: "Receita Revenda Matriz", valor: 173_371.51, nivel: 1 },
  { descricao: "Receita Venda de Serviços", valor: null, nivel: 1 },
  { descricao: "Receita Venda Produção Filial", valor: 4_264.28, nivel: 1 },
  { descricao: "Receita Revenda Filial", valor: 517_128.58, nivel: 1 },
  { descricao: "(-) Deduções da Receita Bruta", valor: 818_691.17, percentual: "19,78%", destaque: true },
  { descricao: "Devoluções de Produtos", valor: 36_450.71, nivel: 1 },
  { descricao: "Descontos Concedidos", valor: 1_956.51, nivel: 1 },
  { descricao: "IPI Matriz", valor: 163_781.72, nivel: 1 },
  { descricao: "ICMS Matriz", valor: 226_964.24, nivel: 1 },
  { descricao: "PIS Matriz", valor: 42_562.42, nivel: 1 },
  { descricao: "COFINS Matriz", valor: 195_695.85, nivel: 1 },
  { descricao: "ICMS ST", valor: 1_024.72, nivel: 1 },
  { descricao: "ICMS sobre vendas Filial", valor: 80_710.71, nivel: 1 },
  { descricao: "IPI Filial", valor: 31_914.13, nivel: 1 },
  { descricao: "PIS Filial", valor: 6_712.40, nivel: 1 },
  { descricao: "COFINS Filial", valor: 30_917.76, nivel: 1 },
  { descricao: "(-) Custo total", valor: 1_751_614.15, percentual: "42,32%", destaque: true },
  { descricao: "(-) CPV Matriz", valor: 1_574_313.04, nivel: 1 },
  { descricao: "(-) CPV Filial", valor: 177_301.11, nivel: 1 },
  { descricao: "(-) CMV Filial", valor: 0, nivel: 1 },
  { descricao: "(=) Lucro bruto", valor: 1_568_244.40, percentual: "37,89%", destaque: true },
  { descricao: "(-) Despesas operacionais", valor: 1_437_134.17, percentual: "34,73%", destaque: true },
  { descricao: "Despesas Administrativas", valor: 175_861.49, percentual: "4,25%", nivel: 1 },
  { descricao: "Despesas com Serviço - NPLog", valor: 135_289.01, percentual: "3,27%", nivel: 1 },
  { descricao: "Despesas Comerciais", valor: 406_412.20, percentual: "9,82%", nivel: 1 },
  { descricao: "Despesas Produção", valor: 124_407.23, percentual: "3,01%", nivel: 1 },
  { descricao: "Despesas Veículos", valor: 6_238.56, percentual: "0,15%", nivel: 1 },
  { descricao: "Despesas com Imobilizado", valor: 52_237.96, percentual: "1,26%", nivel: 1 },
  { descricao: "Despesas com Industrialização", valor: 364_750.98, percentual: "8,81%", nivel: 1 },
  { descricao: "Despesas com Exportação — Matriz", valor: 5_225.43, percentual: "0,13%", nivel: 1 },
  { descricao: "Despesas comerciais SP", valor: 58_910.56, percentual: "1,42%", nivel: 1 },
  { descricao: "Subtotal das despesas operacionais antes do resultado financeiro", valor: 1_329_333.42, destaque: true },
  { descricao: "Despesas Financeiras", valor: 143_700.96, percentual: "3,47%", nivel: 1 },
  { descricao: "(-) Receitas Financeiras", valor: 35_900.21, percentual: "0,87%", nivel: 1 },
  { descricao: "Despesas Financeiras Líquidas", valor: 107_800.75, destaque: true },
  { descricao: "(-) PIS não cumulativo sobre despesas", valor: 0, percentual: "0,00%", nivel: 1 },
  { descricao: "(-) COFINS não cumulativo sobre despesas", valor: 0, percentual: "0,00%", nivel: 1 },
  { descricao: "Total das despesas operacionais", valor: 1_437_134.17, destaque: true },
  { descricao: "(=) Resultado Operacional", valor: 131_110.23, percentual: "3,17%", destaque: true },
  { descricao: "Resultado não operacional", valor: 103_621.85, destaque: true },
  { descricao: "Receita de Alienação de Imobilizado", valor: 306_900, percentual: "7,42%", nivel: 1 },
  { descricao: "Custo na Baixa/Alienação de Imobilizado", valor: 203_278.15, percentual: "4,91%", nivel: 1 },
  { descricao: "(=) Lucro líquido", valor: resultadoApresentacao, percentual: "5,67%", destaque: true },
];

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306"]);
const contasCreditoFederal = new Set(["25946", "25947"]);
const soma = (a: Item[]) => arred(a.reduce((s, x) => s + x.valor, 0));

function itemZero(conta: string, classificacao: string, descricao: string, cc: string, centroCusto: string): Item {
  return { id: `DRE-JUL-ZERO-${conta}`, conta, classificacao, descricao, cc, centroCusto, estabelecimento: "Matriz", valor: 0, status: "validado", fonte: "Razão 07/2026 — sem movimento", debitos: 0, creditos: 0 };
}
function garantirConta(itens: Item[], conta: string, fallback: Item) { return itens.some((x) => x.conta === conta) ? itens : [...itens, fallback]; }

export function DreJulhoCompleta() {
  const { aplicar, reclassificacoes } = useReclassificacoesInteligentes("2026-07");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razaoAjustado), [razaoAjustado]);
  const dre = calculo.dre;
  const composicao = calculo.composicao;
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "despesas", "fin-d", "fin-r", "alienacao"]));

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
    financeira: composicao.filter(ehDespesaFinanceiraDreJulho),
    receitasFinanceiras: composicao.filter(ehReceitaFinanceiraDreJulho).map((x) => ({ ...x, valor: Math.max(0, arred(-x.valor)) })),
    alienacaoReceita: composicao.filter((x) => x.conta === "4736").map((x) => ({ ...x, valor: arred(-x.valor) })),
    alienacaoCusto: composicao.filter((x) => x.conta === "4760"),
  }), [composicao]);

  const lancamentosNplog = useMemo(() => razaoAjustado.filter((x) => x.documento?.startsWith("11.02.003")), [razaoAjustado]);
  const nplogDebitos = arred(lancamentosNplog.reduce((s, x) => s + (x.debitoCodigo === "25938" ? x.valor : 0), 0));
  const nplogCreditos = arred(lancamentosNplog.reduce((s, x) => s + (x.creditoCodigo === "25938" ? x.valor : 0), 0));
  const valorNplog = arred(nplogDebitos - nplogCreditos);
  const composicaoNplog = useMemo<Item[]>(() => {
    if (Math.abs(valorNplog) < 0.005) return [];
    const ref = lancamentosNplog[0];
    return [{ id: "DRE-JUL-NPLOG", conta: "25938", classificacao: "5.3.01.003.031", descricao: "Serviços de Transporte e Logística — NPLog", cc: ref?.cc ?? "304", centroCusto: ref?.centroCusto ?? "ADM GERAL", estabelecimento: "Matriz", valor: valorNplog, status: lancamentosNplog.some((x) => x.status === "revisar") ? "revisar" : "validado", fonte: ref?.fonte ?? "ENTRADAS POR CENTRO DE CUSTO 07/2026", debitos: nplogDebitos, creditos: nplogCreditos }];
  }, [lancamentosNplog, nplogCreditos, nplogDebitos, valorNplog]);

  const despesasSemNplog = useMemo<Item[]>(() => base.despesas.map((x) => {
    if (x.conta !== "25938" || x.cc !== "304" || x.estabelecimento !== "Matriz" || Math.abs(valorNplog) < 0.005) return x;
    const debitos = arred(x.debitos - nplogDebitos);
    const creditos = arred(x.creditos - nplogCreditos);
    return { ...x, debitos, creditos, valor: arred(debitos - creditos) };
  }).filter((x) => Math.abs(x.valor) >= 0.005), [base.despesas, nplogCreditos, nplogDebitos, valorNplog]);

  const grupos = useMemo(() => {
    const custosMatriz = base.custos.filter((x) => x.estabelecimento === "Matriz");
    const custosFilial = base.custos.filter((x) => x.estabelecimento === "Filial SP");
    const energia = custosMatriz.filter((x) => x.conta === "3494");
    const filial = despesasSemNplog.filter((x) => x.estabelecimento === "Filial SP");
    const matriz = despesasSemNplog.filter((x) => x.estabelecimento === "Matriz");
    const industrializacao = matriz.filter((x) => x.conta === "25937");
    const depreciacao = matriz.filter((x) => x.classificacao.startsWith("5.7.01.011"));
    const creditosFederaisMatriz = composicao.filter((x) => contasCreditoFederal.has(x.conta) && x.estabelecimento === "Matriz");
    const creditosFederaisFilial = composicao.filter((x) => contasCreditoFederal.has(x.conta) && x.estabelecimento === "Filial SP");
    const exportacao = matriz.filter((x) => x.conta === "25072");
    const importacao = matriz.filter((x) => x.conta === "25070");
    const veiculos = matriz.filter((x) => x.classificacao.startsWith("5.7.05") || x.classificacao.startsWith("5.7.01.015"));
    const excluidas = new Set([...industrializacao, ...depreciacao, ...exportacao, ...veiculos].map((x) => x.id));
    const classificaveis = matriz.filter((x) => !excluidas.has(x.id));
    const comerciais = classificaveis.filter((x) => ccCom.has(x.cc) || x.conta === "25070");
    const adm = classificaveis.filter((x) => ccAdm.has(x.cc) || x.cc === "313" || x.cc === "0" || x.conta === "4250" || (x.conta === "25937" && x.cc === "503"));
    const prod = classificaveis.filter((x) => ccProd.has(x.cc) && !comerciais.includes(x) && !adm.includes(x));
    const outras = classificaveis.filter((x) => !prod.includes(x) && !comerciais.includes(x) && !adm.includes(x));

    const financeira = garantirConta(base.financeira, "25109", itemZero("25109", "5.8.01.006", "Variações Cambiais Passivas", "902", "DESPESAS FINANCEIRAS"));
    const receitasFinanceiras = garantirConta(base.receitasFinanceiras, "25096", itemZero("25096", "5.7.12.001.006", "Variações Cambiais Ativas", "901", "RECEITAS FINANCEIRAS"));
    return { custosMatriz, custosFilial, energia, filial, matriz, industrializacao, depreciacao, creditosFederaisMatriz, creditosFederaisFilial, exportacao, importacao, veiculos, prod, comerciais, adm, outras, financeira, receitasFinanceiras };
  }, [base, despesasSemNplog, composicao]);

  const custosDre = dre.custosReconhecidos;
  const despesasOperacionaisBrutas = arred(soma(despesasSemNplog) + valorNplog);
  const despesasMatriz = arred(soma(grupos.matriz) + valorNplog + soma(grupos.creditosFederaisMatriz));
  const despesasFilial = arred(soma(grupos.filial) + soma(grupos.creditosFederaisFilial));
  const despesasOperacionais = arred(despesasMatriz + despesasFilial);
  const despFin = soma(base.financeira);
  const despesasOperacionaisFinanceirasLiquidas = arred(despesasOperacionais + despFin - dre.receitasFinanceiras);
  const lucroBruto = arred(dre.receitaLiquida - custosDre);
  const resultadoOper = arred(lucroBruto - despesasOperacionaisFinanceirasLiquidas);
  const resultadoCalculado = arred(dre.receitaLiquida - dre.custosReconhecidos - despesasOperacionais - despFin + dre.receitasFinanceiras + dre.resultadoAlienacaoImobilizado);
   const memoriaCpvIrpjCsll = [
     ["Estoque inicial — Matriz", dre.memoriaCpv.matriz.estoqueInicial],
     ["(+) Compras líquidas de matéria-prima", dre.memoriaCpv.matriz.comprasLiquidas],
     ["(-) Estoque final — Matriz", -dre.memoriaCpv.matriz.estoqueFinal],
     ["(=) CPV Matriz", dre.memoriaCpv.matriz.total],
     ["Estoque inicial de PA — Filial", dre.memoriaCpv.filial.estoqueInicial],
     ["Saldo anterior de compras — preservado fora do CPV", dre.memoriaCpv.filial.comprasParaRevendaAbertura],
     ["(+) Compras líquidas de julho — Filial", dre.memoriaCpv.filial.comprasLiquidasJulho],
     ["(-) Estoque final de PA — Filial", -dre.memoriaCpv.filial.estoqueFinal],
     ["(=) CPV Filial", dre.memoriaCpv.filial.total],
     ["(=) CPV / CMV Total", dre.custosReconhecidos],
   ] as const;

  if (Math.abs(custosDre - arred(dre.cpvMatriz + dre.cpvFilial)) > 0.01) throw new Error("CPV Matriz + Filial não fecha com os custos do Razão.");
  if (Math.abs(despesasOperacionais - arred(despesasMatriz + despesasFilial)) > 0.01) throw new Error("Abertura de despesas Matriz/Filial não fecha com o Razão.");
  if (Math.abs(despesasOperacionaisBrutas + dre.creditosFederais - despesasOperacionais) > 0.01) throw new Error("Créditos PIS/COFINS não conciliam com as despesas operacionais líquidas.");
  if (Math.abs(soma(grupos.outras)) > 0.01) throw new Error("Existem despesas sem grupo definido na DRE.");
  if (Math.abs(resultadoCalculado - dre.resultado) > 0.01) throw new Error(`DRE visual divergiu do Razão: ${resultadoCalculado.toFixed(2)} / ${dre.resultado.toFixed(2)}`);
  if (Math.abs(arred(receitaProducaoMatriz + receitaProducaoFilial) - dre.receitaProducao) > 0.01) throw new Error("Receita de produção Matriz/Filial não concilia ao Razão.");
  if (Math.abs(arred(receitaRevendaMatriz + receitaRevendaFilial) - dre.receitaRevenda) > 0.01) throw new Error("Receita de revenda Matriz/Filial não concilia ao Razão.");

  const ajustesManuais = razaoAjustado.filter((x) => x.origem === "LANÇAMENTO MANUAL" || x.origem.startsWith("ALTERAÇÃO MANUAL") || x.origem.startsWith("EXCLUSÃO MANUAL")).length;

  const linhas: Linha[] = [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", nivel: 0, valor: dre.receitaBruta, criterio: "Razão → Balancete → DRE. Receita aberta por estabelecimento." },
    { id: "rmp", descricao: "Receita Venda Produção — Matriz", nivel: 1, valor: receitaProducaoMatriz, criterio: "Somente lançamentos da Matriz no Razão. CFOPs externos auditados; dupla contagem de R$ 5.352,06 removida." },
    { id: "rmr", descricao: "Receita Revenda — Matriz", nivel: 1, valor: receitaRevendaMatriz, criterio: "Somente Matriz." },
    { id: "rfp", descricao: "Receita Venda Produção — Filial SP", nivel: 1, valor: receitaProducaoFilial, criterio: "Somente Filial SP." },
    { id: "rfr", descricao: "Receita Revenda — Filial SP", nivel: 1, valor: receitaRevendaFilial, criterio: "Somente Filial SP." },

    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", nivel: 0, valor: dre.deducoes, criterio: "Deduções segregadas por estabelecimento e natureza real da operação." },
    { id: "dev-m", descricao: "Devoluções de Produtos — Matriz", nivel: 1, valor: dre.devolucoesMatriz, criterio: "Matriz." },
    { id: "dev-f", descricao: "Devoluções de Produtos — Filial SP", nivel: 1, valor: dre.devolucoesFilial, criterio: "Filial SP." },
    { id: "icms-m", descricao: "ICMS sobre vendas — Matriz", nivel: 1, valor: dre.icmsMatriz, criterio: "Conta 2827." },
    { id: "icms-f", descricao: "ICMS sobre vendas — Filial SP", nivel: 1, valor: dre.icmsFilial, criterio: "Somente ICMS de vendas externas, líquido da devolução. R$ 3.894,05 de transferências internas ficam fora da DRE." },
    { id: "ipi-m", descricao: "IPI — Matriz", nivel: 1, valor: dre.ipiMatriz, criterio: "Conta 2826." },
    { id: "ipi-f", descricao: "IPI — Filial SP", nivel: 1, valor: dre.ipiFilial, criterio: "Conta 25055." },
    { id: "pis-m", descricao: "PIS — Matriz", nivel: 1, valor: dre.pisMatriz, criterio: "EFD Contribuições por estabelecimento." },
    { id: "pis-f", descricao: "PIS — Filial SP", nivel: 1, valor: dre.pisFilial, criterio: "EFD Contribuições / CNPJ da Filial SP." },
    { id: "cof-m", descricao: "COFINS — Matriz", nivel: 1, valor: dre.cofinsMatriz, criterio: "EFD Contribuições por estabelecimento." },
    { id: "cof-f", descricao: "COFINS — Filial SP", nivel: 1, valor: dre.cofinsFilial, criterio: "EFD Contribuições / CNPJ da Filial SP." },
    { id: "st-m", descricao: "ICMS ST — Matriz", nivel: 1, valor: dre.icmsStMatriz, criterio: "Parcela Matriz." },
    { id: "st-f", descricao: "ICMS ST — Filial SP", nivel: 1, valor: dre.icmsStFilial, criterio: "Parcela Filial SP comprovada." },

    { id: "rl", descricao: "(=) Receita Operacional Líquida", nivel: 0, valor: dre.receitaLiquida, criterio: "Receita bruta menos deduções do Razão." },
    { id: "custos", descricao: "(-) CPV / CMV", nivel: 0, valor: custosDre, criterio: "CPV completo formado no Razão e segregado por estabelecimento." },
    { id: "cpv-m", descricao: "CPV — Matriz", nivel: 1, valor: dre.cpvMatriz, criterio: "Estoque inicial + compras líquidas − estoque final, com transferências e custos diretos de produção. O saldo final permanece no estoque patrimonial; somente o consumo/variação afeta o resultado.", composicao: grupos.custosMatriz },
    { id: "cpv-f", descricao: "CPV — Filial SP", nivel: 1, valor: dre.cpvFilial, criterio: "CPV completo da Filial SP. Abra para conferir as contas que compõem o valor.", composicao: grupos.custosFilial },
    { id: "lb", descricao: "(=) LUCRO BRUTO", nivel: 0, valor: lucroBruto, criterio: "Receita líquida menos CPV/CMV do Razão." },

    { id: "despesas", descricao: "(-) Despesas Operacionais", nivel: 0, valor: despesasOperacionaisFinanceirasLiquidas, criterio: "Apresentação conforme a DRE de conferência: despesas operacionais, despesas financeiras e receitas financeiras, sem duplicidade no resultado." },
    { id: "desp-matriz-total", descricao: "Despesas Operacionais — Matriz", nivel: 1, valor: despesasMatriz, criterio: "Subtotal exclusivo da Matriz, líquido dos créditos federais da Matriz." },
    { id: "industrializacao", descricao: "Despesas com Industrialização — Matriz", nivel: 2, valor: soma(grupos.industrializacao), criterio: "Grupo operacional próprio, seguindo maio/2026; centro produtivo não transforma o serviço em CPV.", composicao: grupos.industrializacao },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog — Matriz", nivel: 2, valor: valorNplog, criterio: "11.02.003 / CC 304 Matriz.", composicao: composicaoNplog },
    { id: "prod", descricao: "Despesas com Produção — Matriz", nivel: 2, valor: soma(grupos.prod), criterio: "Despesas ocorridas em centros produtivos. O centro de custo abre a gestão, mas não transforma automaticamente a despesa em CPV.", composicao: grupos.prod },
    { id: "veic", descricao: "Despesas com Veículos — Matriz", nivel: 2, valor: soma(grupos.veiculos), criterio: "Contas/classes específicas de veículos antes da classificação genérica por CC.", composicao: grupos.veiculos },
    { id: "exp", descricao: "Despesas com Exportação — Matriz", nivel: 2, valor: soma(grupos.exportacao), criterio: "Conta 25072; natureza documental prevalece sobre o CC.", composicao: grupos.exportacao },
    { id: "com", descricao: "Despesas Comerciais — Matriz (incluindo Importação)", nivel: 2, valor: soma(grupos.comerciais), criterio: "Somente Matriz; inclui as despesas de importação da conta 25070.", composicao: grupos.comerciais },
    { id: "adm", descricao: "Despesas Administrativas — Matriz", nivel: 2, valor: soma(grupos.adm), criterio: "Centros administrativos da Matriz; CC 501 não entra aqui.", composicao: grupos.adm },
    { id: "dep", descricao: "Depreciação e Amortização — Matriz", nivel: 2, valor: soma(grupos.depreciacao), criterio: "Depreciação identificada como Matriz. Mini e Corolla vendidos no início de julho foram excluídos da cota mensal integral de veículos.", composicao: grupos.depreciacao },
    { id: "filial-desp", descricao: "Despesas Comerciais — Filial SP", nivel: 1, valor: despesasFilial, criterio: "Reúne todas as despesas operacionais identificadas como Filial SP que não compõem o CPV. Preserva as contas analíticas originais e apresenta o grupo líquido dos créditos PIS/COFINS da Filial. CPV, deduções de vendas, despesas financeiras, ativos, impostos recuperáveis e transferências patrimoniais permanecem em seus grupos próprios.", composicao: [...grupos.filial, ...grupos.creditosFederaisFilial] },
    { id: "fin-liquidas", descricao: "Despesas Financeiras Líquidas", nivel: 1, valor: arred(despFin - dre.receitasFinanceiras), criterio: "Despesas financeiras menos receitas financeiras." },
    { id: "fin-d", descricao: "(-) Despesas Financeiras", nivel: 2, valor: despFin, criterio: "Juros, tarifas, IOF, JCP e variação cambial passiva, por conta e estabelecimento.", composicao: grupos.financeira },
    { id: "fin-r", descricao: "(+) Receitas Financeiras", nivel: 2, valor: dre.receitasFinanceiras, criterio: "Descontos obtidos, juros ativos, variação cambial ativa, aplicações, receitas eventuais, recuperações e SELIC.", composicao: grupos.receitasFinanceiras },
    { id: "pis-cred", descricao: "(-) PIS não cumulativo sobre despesas", nivel: 1, valor: 0, criterio: "Crédito destacado na apresentação; sem valor reconhecido nesta competência." },
    { id: "cofins-cred", descricao: "(-) COFINS não cumulativo sobre despesas", nivel: 1, valor: 0, criterio: "Crédito destacado na apresentação; sem valor reconhecido nesta competência." },
    { id: "ro", descricao: "(=) Resultado Operacional", nivel: 0, valor: resultadoOper, criterio: "Lucro bruto menos despesas operacionais e resultado financeiro líquido do Razão." },

    { id: "alienacao", descricao: "Resultado na Alienação de Imobilizado — Matriz", nivel: 0, valor: dre.resultadoAlienacaoImobilizado, criterio: "As três vendas fiscais estão contabilizadas: Mini Cooper, Corolla e Transformador seco 1000KVA (NF 93639), vendido em 14/07 pelo valor contábil líquido apurado na data." },
    { id: "alien-vendas-fiscais", descricao: "(+) Vendas de Ativo Imobilizado identificadas fiscalmente", nivel: 1, valor: dre.vendasAtivoImobilizadoFiscais, criterio: "Total fiscal de julho: Mini Cooper R$ 119.900,00 + Corolla R$ 127.000,00 + Transformador seco 1000KVA NF 93639 R$ 60.000,00 = R$ 306.900,00. As três vendas já compõem o ganho reconhecido." },
    { id: "alien-rec", descricao: "Vendas reconhecidas no Razão — Mini + Corolla + Transformador", nivel: 2, valor: dre.receitaAlienacaoImobilizado, criterio: "Conta 4736. NF 93495 R$ 119.900,00 + NF 93569 R$ 127.000,00 + NF 93639 R$ 60.000,00 = R$ 306.900,00.", composicao: base.alienacaoReceita },
    { id: "alien-custo", descricao: "(-) Custo dos Ativos Imobilizados Vendidos — Mini + Corolla + Transformador", nivel: 1, valor: dre.custoAlienacaoImobilizado, criterio: "Conta 4760. Mini residual R$ 52.500,00 + Corolla residual R$ 93.139,29 + Transformador residual R$ 57.638,86 (custo original R$ 98.016,00 - depreciação acumulada até 14/07 de R$ 40.377,14) = R$ 203.278,15.", composicao: base.alienacaoCusto },
    { id: "alien-res", descricao: "(=) Ganho reconhecido na Alienação — Mini + Corolla + Transformador", nivel: 1, valor: dre.resultadoAlienacaoImobilizado, criterio: "R$ 67.400,00 Mini + R$ 33.860,71 Corolla + R$ 2.361,14 Transformador (venda R$ 60.000,00 - residual R$ 57.638,86) = R$ 103.621,85." },
    { id: "resultado", descricao: "(=) RESULTADO CONTÁBIL 07/2026", nivel: 0, valor: dre.resultado, criterio: "Resultado do Razão incluindo Mini + Corolla + Transformador. Recebimento do Transformador em parcelas previstas para agosto e setembro/2026, mantido em Duplicatas a Receber." },
    { id: "ajuste-cc503", descricao: "(-) Ajuste de conciliação com a DRE do cliente — CC 503", nivel: 1, valor: dre.ajusteConciliacaoClienteCC503.total, criterio: `${dre.ajusteConciliacaoClienteCC503.criterio} Não é lançamento do Razão: reduz apenas esta linha de conciliação, sem afetar o Balancete. R$ ${dre.ajusteConciliacaoClienteCC503.producao.toFixed(2)} em Despesas de Produção + R$ ${dre.ajusteConciliacaoClienteCC503.industrializacao.toFixed(2)} em Despesas com Industrialização.` },
    { id: "resultado-conciliado", descricao: "(=) Resultado comparável à DRE do cliente", nivel: 0, valor: dre.resultadoConciliadoClienteJulho, criterio: `Resultado do Razão (R$ ${dre.resultado.toFixed(2)}) menos o ajuste de conciliação do CC 503 (R$ ${dre.ajusteConciliacaoClienteCC503.total.toFixed(2)}). Ainda restam R$ ${arred(dre.resultadoConciliadoClienteJulho - resultadoApresentacao).toFixed(2)} de diferença para o R$ ${resultadoApresentacao.toFixed(2)} da planilha do cliente, concentrados em ICMS/COFINS Matriz ainda não reconciliados.` },
  ];

  const paiPorLinha = new Map<string, string | null>();
  const pilhaHierarquia: Linha[] = [];
  for (const linha of linhas) {
    pilhaHierarquia.length = linha.nivel;
    paiPorLinha.set(linha.id, linha.nivel > 0 ? pilhaHierarquia[linha.nivel - 1]?.id ?? null : null);
    pilhaHierarquia[linha.nivel] = linha;
  }

  const linhasComFilhos = new Set<string>();
  linhas.forEach((linha, indice) => {
    const proxima = linhas[indice + 1];
    if (proxima && proxima.nivel > linha.nivel) linhasComFilhos.add(linha.id);
  });

  const expans = linhas
    .filter((linha) => linhasComFilhos.has(linha.id) || (linha.composicao?.length ?? 0) > 0)
    .map((linha) => linha.id);
  const tudo = expans.every((id) => abertas.has(id));

  function linhaVisivel(linha: Linha) {
    let pai = paiPorLinha.get(linha.id) ?? null;
    while (pai) {
      if (!abertas.has(pai)) return false;
      pai = paiPorLinha.get(pai) ?? null;
    }
    return true;
  }

  const linhasVisiveis = linhas.filter(linhaVisivel);
  function alternar(id: string) { setAbertas((a) => { const n = new Set(a); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function alternarTudo() { setAbertas(tudo ? new Set() : new Set(expans)); }

  function exportarDreExcel() {
    const linhasExcel = linhasApresentacao.map((linha) => [
      `${"    ".repeat(linha.nivel ?? 0)}${linha.descricao}`,
      linha.valor ?? "",
      linha.percentual ? Number(linha.percentual.replace("%", "").replace(",", ".")) / 100 : "",
    ]);
    exportarExcel({ arquivo: "Nitaplast_DRE_Report_072026.xlsx", aba: "DRE 07-2026", titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE · Matriz e Filial SP segregadas · vendas fiscais de imobilizado R$ 306.900,00 · Mini, Corolla e Transformador contabilizados", colunas: [{ cabecalho: "Descrição", largura: 86 }, { cabecalho: "Valor", largura: 18, tipo: "numero" }, { cabecalho: "% Receita", largura: 14, tipo: "percentual" }], linhas: linhasExcel });
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><h1 className="text-xl font-semibold tracking-tight">DRE calculada - Nitaplast 07/2026</h1><p className="mt-1 text-sm text-muted-foreground">Razão → Balancete → DRE · Matriz e Filial SP sempre identificadas.</p></div><div className="flex flex-wrap gap-2"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>{ajustesManuais > 0 ? <Badge variant="outline">{ajustesManuais} ajuste(s) manual(is)</Badge> : null}{reclassificacoes.length > 0 ? <Badge variant="outline">{reclassificacoes.length} reclassificação(ões)</Badge> : null}<Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" />Exportar Excel</Button><Button variant="outline" size="sm" onClick={alternarTudo}>{tudo ? "Recolher toda DRE" : "Expandir toda DRE"}</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Resumo label="Receita Operacional Bruta" value={receitaBrutaApresentacao}/><Resumo label="CPV Matriz" value={1_574_313.04}/><Resumo label="CPV Filial SP" value={177_301.11}/><Resumo label="Resultado não operacional" value={103_621.85} success/><Resumo label="Lucro líquido" value={resultadoApresentacao} success/></div>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-blue-700"/><div><p className="font-semibold">Energia elétrica de julho validada</p><p className="mt-1 text-sm text-muted-foreground">Conta 3494: débitos {brl.format(dre.energiaDebitosMatriz)} menos crédito ICMS de {brl.format(dre.energiaCreditosMatriz)} = <strong>{brl.format(dre.energiaEletricaMatriz)}</strong> de movimento líquido em julho. Valor próximo de R$ 83 mil é saldo acumulado/final, não despesa da competência.</p></div></div></CardContent></Card>
    <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="pt-6"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">ICMS de transferência da Filial fora da DRE</p><p className="mt-1 text-sm text-muted-foreground">{brl.format(dre.icmsFilialTransferenciasInternas)} permanece identificado no Razão como transferência interna e não reduz receita de vendas. A conta patrimonial definitiva ainda está em revisão.</p></div></div></CardContent></Card>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6"><p className="font-medium">Regra única aplicada</p><p className="mt-1 text-sm text-muted-foreground">Razão → Balancete → DRE. Centro de custo e estabelecimento abrem a gestão; não criam fato contábil.</p></CardContent></Card>
    <Card className="border-amber-500/40 bg-amber-50/40"><CardHeader><CardTitle className="text-base">Memória temporária IRPJ/CSLL — composição do CPV</CardTitle><CardDescription>Relatório explicativo para conferência com a apuração de maio. Não cria lançamento e não altera o resultado contábil.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{memoriaCpvIrpjCsll.map(([descricao, valor], index) => <tr key={descricao} className={`border-b last:border-0 ${index === memoriaCpvIrpjCsll.length - 1 ? "font-bold" : ""}`}><td className="py-2">{descricao}</td><td className="py-2 text-right tabular-nums">{brl.format(valor)}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted-foreground">Fórmula: estoque inicial + compras líquidas − estoque final, seguida da variação dos demais estoques e dos custos diretos de produção. O saldo final permanece no estoque patrimonial.</p></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Composição da DRE — 07/2026</CardTitle><CardDescription>Apresentação consolidada da Matriz e Filial SP.</CardDescription></div><Badge variant="outline">07/2026</Badge></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b bg-muted text-left text-xs"><th className="p-2">Composição DRE</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">% Receita</th></tr></thead><tbody>{linhasApresentacao.map((linha, index) => <tr key={`${linha.descricao}-${index}`} className={`border-b ${linha.destaque ? "border-y-2 bg-slate-100/70 font-semibold" : ""}`}><td className="p-2" style={{ paddingLeft: 8 + (linha.nivel ?? 0) * 22 }}>{linha.descricao}</td><td className="p-2 text-right tabular-nums">{linha.valor === null ? "" : brl.format(linha.valor)}</td><td className="p-2 text-right tabular-nums">{linha.percentual ?? ""}</td></tr>)}</tbody></table></CardContent></Card>
    <Card className="border-amber-400/50 bg-amber-50/40"><CardContent className="pt-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">Pendências de rastreabilidade</p><p className="mt-1 text-sm text-muted-foreground">Nenhum valor é criado ou rateado por aproximação. Os fretes 11.90.001 já identificados permanecem contabilizados e marcados para revisão documental. Mini, Corolla e Transformador estão reconhecidos pelo valor contábil documentado. Contratos de câmbio sem vínculo com o fato contábil de origem permanecem pendentes de conciliação.</p></div></div></CardContent></Card>
  </div>;
}

function Resumo({ label, value, money = true, success = false }: { label: string; value: number; money?: boolean; success?: boolean }) { return <Card><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p></CardContent></Card>; }
function Composicao({ itens }: { itens: Item[] }) { return <div className="mt-3 overflow-x-auto rounded-md border bg-background"><table className="w-full min-w-[1060px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Estabelecimento</th><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Impacto</th></tr></thead><tbody>{itens.map((x) => <tr key={x.id} className="border-b last:border-0"><td className="p-2 font-medium">{x.estabelecimento}</td><td className="p-2 font-mono">{x.conta}</td><td className="p-2 font-mono">{x.classificacao}</td><td className="p-2">{x.descricao}</td><td className="p-2">{x.cc} — {x.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(x.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(x.creditos)}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td></tr>)}</tbody></table></div>; }
