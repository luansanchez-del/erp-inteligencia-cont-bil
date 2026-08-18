import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, FileSpreadsheet, ShieldAlert } from "lucide-react";
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
type Linha = { id: string; descricao: string; nivel: number; valor: number; criterio: string; composicao?: Item[] };
type Estab = "Matriz" | "Filial SP";

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999", "20002"]);
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
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "despesas", "fin-d", "fin-r"]));

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
    receitasFinanceiras: composicao.filter(ehReceitaFinanceiraDreJulho),
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
    const fechamentoEstoqueMatriz = custosMatriz.filter((x) => x.conta === "25944");
    const fechamentoEstoqueFilial = custosFilial.filter((x) => x.conta === "25945");
    const componentesCpvMatriz = custosMatriz.filter((x) => x.conta !== "25944");
    const componentesCpvFilial = custosFilial.filter((x) => x.conta !== "25945");

    const filial = despesasSemNplog.filter((x) => x.estabelecimento === "Filial SP");
    const matriz = despesasSemNplog.filter((x) => x.estabelecimento === "Matriz");
    const industrializacao = matriz.filter((x) => x.conta === "25937");
    const depreciacao = matriz.filter((x) => x.classificacao.startsWith("5.7.01.011"));
    const creditosFederais = matriz.filter((x) => contasCreditoFederal.has(x.conta));
    const importacao = matriz.filter((x) => x.conta === "25070");
    const exportacao = matriz.filter((x) => x.conta === "25072");
    const veiculos = matriz.filter((x) => x.classificacao.startsWith("5.7.05") || x.classificacao.startsWith("5.7.01.015"));
    const excluidas = new Set([...industrializacao, ...depreciacao, ...creditosFederais, ...importacao, ...exportacao, ...veiculos].map((x) => x.id));
    const classificaveis = matriz.filter((x) => !excluidas.has(x.id));
    const comerciais = classificaveis.filter((x) => ccCom.has(x.cc));
    const adm = classificaveis.filter((x) => ccAdm.has(x.cc));
    const prod = classificaveis.filter((x) => ccProd.has(x.cc) && !comerciais.includes(x));
    const outras = classificaveis.filter((x) => !prod.includes(x) && !comerciais.includes(x) && !adm.includes(x));

    const financeira = garantirConta(base.financeira, "25109", itemZero("25109", "5.8.01.006", "Variações Cambiais Passivas", "902", "DESPESAS FINANCEIRAS"));
    const receitasFinanceiras = garantirConta(base.receitasFinanceiras, "25096", itemZero("25096", "5.7.12.001.006", "Variações Cambiais Ativas", "901", "RECEITAS FINANCEIRAS"));
    return { custosMatriz, custosFilial, fechamentoEstoqueMatriz, fechamentoEstoqueFilial, componentesCpvMatriz, componentesCpvFilial, filial, matriz, industrializacao, depreciacao, creditosFederais, importacao, exportacao, veiculos, prod, comerciais, adm, outras, financeira, receitasFinanceiras };
  }, [base, despesasSemNplog]);

  const custosDre = soma(base.custos);
  const despesasOperacionais = arred(soma(despesasSemNplog) + valorNplog);
  const despesasMatriz = arred(soma(grupos.matriz) + valorNplog);
  const despesasFilial = soma(grupos.filial);
  const despFin = soma(base.financeira);
  const lucroBruto = arred(dre.receitaLiquida - custosDre);
  const resultadoOper = arred(lucroBruto - despesasOperacionais);
  const resultadoCalculado = arred(resultadoOper - despFin + dre.receitasFinanceiras);

  if (Math.abs(custosDre - arred(dre.cpvMatriz + dre.cpvFilial)) > 0.01) throw new Error("CPV Matriz + Filial não fecha com os custos do Razão.");
  if (Math.abs(despesasOperacionais - arred(despesasMatriz + despesasFilial)) > 0.01) throw new Error("Abertura de despesas Matriz/Filial não fecha com o Razão.");
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
    { id: "custos", descricao: "(-) CPV / CMV", nivel: 0, valor: custosDre, criterio: "CPV completo formado no Razão: compras + fretes válidos + fechamento/variação de estoque, segregado por estabelecimento." },
    { id: "cpv-m", descricao: "CPV — Matriz", nivel: 1, valor: dre.cpvMatriz, criterio: "CPV completo da Matriz; não é somente a conta 25944.", composicao: grupos.custosMatriz },
    { id: "cpv-m-fech", descricao: "Fechamento / Variação de estoque — Matriz (25944)", nivel: 2, valor: dre.fechamentoEstoqueMatriz, criterio: "Componente do CPV Matriz.", composicao: grupos.fechamentoEstoqueMatriz },
    { id: "cpv-m-comp", descricao: "Compras, fretes e demais componentes do CPV — Matriz", nivel: 2, valor: dre.outrosCustosMatriz, criterio: "Inclui 3093 e somente os fretes 3095 efetivamente suportados; itens 11.90.001 continuam marcados para revisão.", composicao: grupos.componentesCpvMatriz },
    { id: "cpv-f", descricao: "CPV — Filial SP", nivel: 1, valor: dre.cpvFilial, criterio: "CPV completo da Filial SP; não é somente a conta 25945.", composicao: grupos.custosFilial },
    { id: "cpv-f-fech", descricao: "Fechamento / Variação de estoque — Filial SP (25945)", nivel: 2, valor: dre.fechamentoEstoqueFilial, criterio: "Componente do CPV Filial.", composicao: grupos.fechamentoEstoqueFilial },
    { id: "cpv-f-comp", descricao: "Compras, fretes e demais componentes do CPV — Filial SP", nivel: 2, valor: dre.outrosCustosFilial, criterio: "Demais componentes do custo identificados como Filial SP.", composicao: grupos.componentesCpvFilial },
    { id: "lb", descricao: "(=) LUCRO BRUTO", nivel: 0, valor: lucroBruto, criterio: "Receita líquida menos CPV/CMV do Razão." },

    { id: "despesas", descricao: "(-) Despesas Operacionais", nivel: 0, valor: despesasOperacionais, criterio: "Subtotal consolidado; Matriz e Filial SP não se misturam nas composições." },
    { id: "desp-matriz-total", descricao: "Despesas Operacionais — Matriz", nivel: 1, valor: despesasMatriz, criterio: "Subtotal exclusivo da Matriz." },
    { id: "industr", descricao: "Despesas com Industrialização — Matriz", nivel: 2, valor: soma(grupos.industrializacao), criterio: "Conta 25937 da Matriz.", composicao: grupos.industrializacao },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog — Matriz", nivel: 2, valor: valorNplog, criterio: "11.02.003 / CC 304 Matriz.", composicao: composicaoNplog },
    { id: "prod", descricao: "Despesas Produção — Matriz", nivel: 2, valor: soma(grupos.prod), criterio: "Centros produtivos da Matriz.", composicao: grupos.prod },
    { id: "veic", descricao: "Despesas com Veículos — Matriz", nivel: 2, valor: soma(grupos.veiculos), criterio: "Contas/classes específicas de veículos antes da classificação genérica por CC.", composicao: grupos.veiculos },
    { id: "imp", descricao: "Despesas com Importação — Matriz", nivel: 2, valor: soma(grupos.importacao), criterio: "Conta 25070; natureza documental prevalece sobre o CC.", composicao: grupos.importacao },
    { id: "exp", descricao: "Despesas com Exportação — Matriz", nivel: 2, valor: soma(grupos.exportacao), criterio: "Conta 25072; natureza documental prevalece sobre o CC.", composicao: grupos.exportacao },
    { id: "com", descricao: "Despesas Comerciais — Matriz", nivel: 2, valor: soma(grupos.comerciais), criterio: "Somente Matriz.", composicao: grupos.comerciais },
    { id: "adm", descricao: "Despesas Administrativas — Matriz", nivel: 2, valor: soma(grupos.adm), criterio: "Centros administrativos da Matriz; CC 501 não entra aqui.", composicao: grupos.adm },
    { id: "dep", descricao: "Depreciação e Amortização — Matriz", nivel: 2, valor: soma(grupos.depreciacao), criterio: "Depreciação identificada como Matriz.", composicao: grupos.depreciacao },
    { id: "cred-fed", descricao: "(-) Créditos PIS/COFINS sobre Custos e Despesas — Matriz", nivel: 2, valor: soma(grupos.creditosFederais), criterio: "Contas 25946/25947. Parcela da Filial SP não é mais forçada para Matriz.", composicao: grupos.creditosFederais },
    { id: "outras", descricao: "Outras Despesas Operacionais — Matriz", nivel: 2, valor: soma(grupos.outras), criterio: "Somente o residual da Matriz após as classificações específicas.", composicao: grupos.outras },
    { id: "filial-desp", descricao: "Despesas Operacionais — Filial SP", nivel: 1, valor: despesasFilial, criterio: "Bloco exclusivo da Filial SP; não se repete na Matriz.", composicao: grupos.filial },
    { id: "ro", descricao: "(=) Resultado Operacional", nivel: 0, valor: resultadoOper, criterio: "Lucro bruto menos despesas operacionais do Razão." },

    { id: "fin-d", descricao: "(-) Despesas Financeiras", nivel: 0, valor: despFin, criterio: "Juros, tarifas, IOF, JCP e variação cambial passiva, por conta e estabelecimento.", composicao: grupos.financeira },
    { id: "fin-r", descricao: "(+) Receitas Financeiras", nivel: 0, valor: dre.receitasFinanceiras, criterio: "Descontos obtidos, juros ativos, variação cambial ativa, aplicações, receitas eventuais, recuperações e SELIC.", composicao: grupos.receitasFinanceiras },
    { id: "resultado", descricao: "(=) RESULTADO CONTÁBIL 07/2026 — ANTES DA BAIXA DOS ATIVOS VENDIDOS", nivel: 0, valor: dre.resultado, criterio: "Resultado do Razão atual. Não inclui ganho/perda dos 3 ativos vendidos porque custo original e depreciação acumulada ainda não foram identificados." },
  ];

  const expans = linhas.filter((x) => x.nivel === 0 || (x.composicao?.length ?? 0) > 0).map((x) => x.id);
  const tudo = expans.every((x) => abertas.has(x));
  function alternar(id: string) { setAbertas((a) => { const n = new Set(a); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function alternarTudo() { setAbertas(tudo ? new Set() : new Set(expans)); }

  function exportarDreExcel() {
    const percentual = (valor: number) => dre.receitaBruta ? valor / dre.receitaBruta : 0;
    // Exportação usa a fonte completa da DRE, nunca o estado aberto/recolhido da interface.
    const linhasExcel = linhas.flatMap((linha) => [
      [`${"    ".repeat(Math.max(0, linha.nivel))}${linha.descricao}`, linha.valor, percentual(linha.valor)],
      ...(linha.composicao ?? []).map((item) => [`            ${item.estabelecimento} · ${item.conta} · ${item.descricao} — ${item.cc} ${item.centroCusto}`, item.valor, percentual(item.valor)]),
    ]);
    exportarExcel({ arquivo: "Nitaplast_DRE_Report_072026.xlsx", aba: "DRE 07-2026", titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO", subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE · Matriz e Filial SP segregadas · alienação de imobilizado pendente de baixa", colunas: [{ cabecalho: "Descrição", largura: 86 }, { cabecalho: "Valor", largura: 18, tipo: "numero" }, { cabecalho: "% Receita", largura: 14, tipo: "percentual" }], linhas: linhasExcel });
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><h1 className="text-xl font-semibold tracking-tight">DRE calculada - Nitaplast 07/2026</h1><p className="mt-1 text-sm text-muted-foreground">Razão → Balancete → DRE · Matriz e Filial SP sempre identificadas.</p></div><div className="flex flex-wrap gap-2"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>{ajustesManuais > 0 ? <Badge variant="outline">{ajustesManuais} ajuste(s) manual(is)</Badge> : null}{reclassificacoes.length > 0 ? <Badge variant="outline">{reclassificacoes.length} reclassificação(ões)</Badge> : null}<Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" />Exportar Excel</Button><Button variant="outline" size="sm" onClick={alternarTudo}>{tudo ? "Recolher toda DRE" : "Expandir toda DRE"}</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Resumo label="Receita Operacional Bruta" value={dre.receitaBruta}/><Resumo label="CPV Matriz" value={dre.cpvMatriz}/><Resumo label="CPV Filial SP" value={dre.cpvFilial}/><Resumo label="Resultado antes baixa imobilizado" value={dre.resultado} success={dre.resultado >= 0}/></div>
    <Card className="border-red-500/40 bg-red-500/5"><CardContent className="pt-6"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 text-red-700"/><div><p className="font-semibold text-red-800">Fechamento bloqueado — alienação de imobilizado</p><p className="mt-1 text-sm text-muted-foreground">Existem 3 vendas válidas de ativo em julho, total de {brl.format(dre.vendasAtivoImobilizadoFiscais)}: NF 93495 R$ 119.900,00; NF 93569 R$ 127.000,00; NF 93639 R$ 60.000,00. Falta identificar custo original e depreciação acumulada para contabilizar a baixa e o ganho/perda real. NF 93567, R$ 127.000,00, está cancelada e não entra.</p></div></div></CardContent></Card>
    <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="pt-6"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">ICMS de transferência da Filial fora da DRE</p><p className="mt-1 text-sm text-muted-foreground">{brl.format(dre.icmsFilialTransferenciasInternas)} permanece identificado no Razão como transferência interna e não reduz receita de vendas. A conta patrimonial definitiva ainda está em revisão.</p></div></div></CardContent></Card>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6"><p className="font-medium">Regra única aplicada</p><p className="mt-1 text-sm text-muted-foreground">Razão → Balancete → DRE. Centro de custo e estabelecimento abrem a gestão; não criam fato contábil.</p></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">DRE 07/2026 — detalhamento completo</CardTitle><CardDescription>Abra as linhas para conferir estabelecimento, conta, centro de custo, débito, crédito e impacto.</CardDescription></div><Badge variant="destructive">07/2026 · EM REVISÃO — BLOQUEIO IMOBILIZADO</Badge></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead><tr className="border-b bg-muted text-left text-xs"><th className="p-2">Linha da DRE</th><th className="p-2 text-right">DRE Calculada 07/2026</th><th className="p-2 text-center">Status</th></tr></thead><tbody>{linhas.map((x) => { const exp = x.nivel === 0 || (x.composicao?.length ?? 0) > 0; const aberta = abertas.has(x.id); const destaque = ["rl", "lb", "ro", "resultado"].includes(x.id); return [<tr key={x.id} className={`border-b ${x.nivel === 0 ? "bg-slate-100/70 font-semibold" : ""} ${destaque ? "border-y-2" : ""}`}><td className="p-2" style={{ paddingLeft: 8 + x.nivel * 22 }}>{exp ? <button className="inline-flex items-center gap-1.5 hover:text-primary" onClick={() => alternar(x.id)}>{aberta ? <ChevronDown className="size-4"/> : <ChevronRight className="size-4"/>}{x.descricao}</button> : <span className="pl-[22px]">{x.descricao}</span>}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td><td className="p-2 text-center"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Calculado</span></td></tr>, exp && aberta ? <tr key={`${x.id}-d`} className="border-b bg-slate-50/70"><td colSpan={3} className="p-4 pl-8"><p className="text-xs text-muted-foreground"><strong className="text-foreground">Critério:</strong> {x.criterio}</p>{x.composicao?.length ? <Composicao itens={x.composicao}/> : null}</td></tr> : null]; })}</tbody></table></CardContent></Card>
    <Card className="border-amber-400/50 bg-amber-50/40"><CardContent className="pt-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">Pendências de rastreabilidade</p><p className="mt-1 text-sm text-muted-foreground">Sem vínculo documental suficiente, nenhum valor é atribuído por aproximação. Itens de frete 11.90.001 e contratos de câmbio ainda não amarrados permanecem em revisão.</p></div></div></CardContent></Card>
  </div>;
}

function Resumo({ label, value, money = true, success = false }: { label: string; value: number; money?: boolean; success?: boolean }) { return <Card><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p></CardContent></Card>; }
function Composicao({ itens }: { itens: Item[] }) { return <div className="mt-3 overflow-x-auto rounded-md border bg-background"><table className="w-full min-w-[1060px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Estabelecimento</th><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Impacto</th></tr></thead><tbody>{itens.map((x) => <tr key={x.id} className="border-b last:border-0"><td className="p-2 font-medium">{x.estabelecimento}</td><td className="p-2 font-mono">{x.conta}</td><td className="p-2 font-mono">{x.classificacao}</td><td className="p-2">{x.descricao}</td><td className="p-2">{x.cc} — {x.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(x.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(x.creditos)}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td></tr>)}</tbody></table></div>; }
