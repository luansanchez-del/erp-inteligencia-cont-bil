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
import { receitaFiscalJulho } from "@/data/nitaplast-fechamento-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;
type Item = ComposicaoResultadoJulho;
type Linha = { id: string; descricao: string; nivel: number; valor: number; criterio: string; composicao?: Item[] };

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10057", "10060", "19999", "20002"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210", "502"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306", "501"]);
const contasCreditoFederal = new Set(["25946", "25947"]);
function soma(a: Item[]) { return arred(a.reduce((s, x) => s + x.valor, 0)); }

function itemZero(conta: string, classificacao: string, descricao: string, cc: string, centroCusto: string): Item {
  return { id: `DRE-JUL-ZERO-${conta}`, conta, classificacao, descricao, cc, centroCusto, valor: 0, status: "validado", fonte: "Razão 07/2026 — sem movimento", debitos: 0, creditos: 0 };
}

function garantirConta(itens: Item[], conta: string, fallback: Item) {
  return itens.some((x) => x.conta === conta) ? itens : [...itens, fallback];
}

export function DreJulhoCompleta() {
  const { aplicar, reclassificacoes } = useReclassificacoesInteligentes("2026-07");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razaoAjustado), [razaoAjustado]);
  const dre = calculo.dre;
  const composicao = calculo.composicao;
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "despesas", "fin-d", "fin-r"]));

  function mov(c: string) {
    return arred(razaoAjustado.reduce((s, x) => s + (x.debitoCodigo === c ? x.valor : 0) - (x.creditoCodigo === c ? x.valor : 0), 0));
  }

  const baseGrupos = useMemo(() => ({
    custos: composicao.filter(ehCustoDreJulho),
    financeira: composicao.filter(ehDespesaFinanceiraDreJulho),
    receitasFinanceiras: composicao.filter(ehReceitaFinanceiraDreJulho),
    despesas: composicao.filter(ehDespesaOperacionalDreJulho),
  }), [composicao]);

  const lancamentosNplog = useMemo(() => razaoAjustado.filter((x) => x.documento?.startsWith("11.02.003")), [razaoAjustado]);
  const nplogDebitos = arred(lancamentosNplog.reduce((s, x) => s + (x.debitoCodigo === "25938" ? x.valor : 0), 0));
  const nplogCreditos = arred(lancamentosNplog.reduce((s, x) => s + (x.creditoCodigo === "25938" ? x.valor : 0), 0));
  const valorNplog = arred(nplogDebitos - nplogCreditos);
  const composicaoNplog = useMemo<Item[]>(() => {
    if (Math.abs(valorNplog) < 0.005) return [];
    const ref = lancamentosNplog[0];
    return [{ id: "DRE-JUL-NPLOG", conta: "25938", classificacao: "5.3.01.003.031", descricao: "Serviços de Transporte e Logística — NPLog", cc: ref?.cc ?? "304", centroCusto: ref?.centroCusto ?? "ADM GERAL", valor: valorNplog, status: lancamentosNplog.some((x) => x.status === "revisar") ? "revisar" : "validado", fonte: ref?.fonte ?? "ENTRADAS POR CENTRO DE CUSTO 07/2026", debitos: nplogDebitos, creditos: nplogCreditos }];
  }, [lancamentosNplog, nplogCreditos, nplogDebitos, valorNplog]);

  const despesasSemNplog = useMemo<Item[]>(() => baseGrupos.despesas.map((x) => {
    if (x.conta !== "25938" || x.cc !== "304" || Math.abs(valorNplog) < 0.005) return x;
    const debitos = arred(x.debitos - nplogDebitos);
    const creditos = arred(x.creditos - nplogCreditos);
    return { ...x, debitos, creditos, valor: arred(debitos - creditos) };
  }).filter((x) => Math.abs(x.valor) >= 0.005), [baseGrupos.despesas, nplogCreditos, nplogDebitos, valorNplog]);

  const grupos = useMemo(() => {
    const industrializacao = despesasSemNplog.filter((x) => x.conta === "25937");
    const depreciacao = despesasSemNplog.filter((x) => x.classificacao.startsWith("5.7.01.011"));
    const creditosFederais = despesasSemNplog.filter((x) => contasCreditoFederal.has(x.conta));
    const classificaveis = despesasSemNplog.filter((x) => x.conta !== "25937" && !x.classificacao.startsWith("5.7.01.011") && !contasCreditoFederal.has(x.conta));
    const ehComercial = (x: Item) => ccCom.has(x.cc) || (x.conta === "4253" && x.cc === "109");
    const comerciais = classificaveis.filter(ehComercial);
    const adm = classificaveis.filter((x) => ccAdm.has(x.cc));
    const prod = classificaveis.filter((x) => ccProd.has(x.cc) && !ehComercial(x));
    const outras = classificaveis.filter((x) => !prod.includes(x) && !comerciais.includes(x) && !adm.includes(x));
    const financeira = garantirConta(baseGrupos.financeira, "25109", itemZero("25109", "5.8.01.006", "Variações Cambiais Passivas", "902", "DESPESAS FINANCEIRAS"));
    const receitasFinanceiras = garantirConta(baseGrupos.receitasFinanceiras, "25096", itemZero("25096", "5.7.12.001.006", "Variações Cambiais Ativas", "901", "RECEITAS FINANCEIRAS"));
    return { custos: baseGrupos.custos, industrializacao, depreciacao, creditosFederais, classificaveis, prod, comerciais, adm, outras, financeira, receitasFinanceiras };
  }, [baseGrupos, despesasSemNplog]);

  const custosDre = soma(grupos.custos);
  const despesasOperacionais = arred(soma(grupos.classificaveis) + soma(grupos.industrializacao) + soma(grupos.depreciacao) + soma(grupos.creditosFederais) + valorNplog);
  const despFin = soma(baseGrupos.financeira);
  const lucroBruto = arred(dre.receitaLiquida - custosDre);
  const resultadoOper = arred(lucroBruto - despesasOperacionais);
  const resultadoCalculado = arred(resultadoOper - despFin + dre.receitasFinanceiras);
  if (Math.abs(resultadoCalculado - dre.resultado) > 0.01) throw new Error(`DRE visual divergiu do Razão: ${resultadoCalculado.toFixed(2)} / ${dre.resultado.toFixed(2)}`);

  const ajustesManuais = razaoAjustado.filter((x) => x.origem === "LANÇAMENTO MANUAL" || x.origem.startsWith("ALTERAÇÃO MANUAL") || x.origem.startsWith("EXCLUSÃO MANUAL")).length;
  const despesasComAbertura = [...grupos.classificaveis, ...grupos.industrializacao, ...grupos.depreciacao, ...grupos.creditosFederais, ...composicaoNplog];

  const linhas: Linha[] = [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", nivel: 0, valor: dre.receitaBruta, criterio: "Receita formada exclusivamente pelas saídas fiscais e demais fatos de receita contabilizados no Razão." },
    { id: "rmp", descricao: "Receita Venda Produção Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.producao, criterio: "Saídas fiscais externas da matriz." },
    { id: "rmr", descricao: "Receita Revenda Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.revenda, criterio: "Saídas fiscais de revenda da matriz." },
    { id: "rfp", descricao: "Receita Venda Produção Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.producaoOperacaoTriangular, criterio: "Operação triangular/produção da filial." },
    { id: "rfr", descricao: "Receita Revenda Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.revenda, criterio: "Saídas fiscais da filial." },
    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", nivel: 0, valor: dre.deducoes, criterio: "Movimento líquido das contas de devoluções e tributos incidentes nas vendas no Razão." },
    { id: "dev", descricao: "Devoluções de Produtos", nivel: 1, valor: dre.devolucoes, criterio: "Matriz + filial." },
    { id: "icms-m", descricao: "ICMS Matriz", nivel: 1, valor: Math.max(0, mov("2827")), criterio: "Somente ICMS das vendas externas." },
    { id: "icms-f", descricao: "ICMS s/ vendas Filial", nivel: 1, valor: Math.max(0, mov("25054")), criterio: "Débito da filial líquido dos créditos/estornos da mesma conta." },
    { id: "ipi-m", descricao: "IPI Matriz", nivel: 1, valor: Math.max(0, mov("2826")), criterio: "IPI das saídas da matriz." },
    { id: "ipi-f", descricao: "IPI Filial", nivel: 1, valor: Math.max(0, mov("25055")), criterio: "IPI da filial líquido do crédito de devolução." },
    { id: "pis", descricao: "PIS", nivel: 1, valor: dre.pis, criterio: "PIS sobre vendas no Razão." },
    { id: "cof", descricao: "COFINS", nivel: 1, valor: dre.cofins, criterio: "COFINS sobre vendas no Razão." },
    { id: "st", descricao: "ICMS ST", nivel: 1, valor: dre.icmsSt, criterio: "Apuração ICMS-ST de julho." },
    { id: "rl", descricao: "(=) Receita Operacional Líquida", nivel: 0, valor: dre.receitaLiquida, criterio: "Receita bruta menos deduções formadas no Razão." },
    { id: "custos", descricao: "(-) Custos / CPV / CMV", nivel: 0, valor: custosDre, criterio: "Somente CPV/CMV e contas efetivas de compras/fretes de matéria-prima. Industrialização é apresentada separadamente em Despesas Operacionais.", composicao: grupos.custos },
    { id: "lb", descricao: "(=) LUCRO BRUTO", nivel: 0, valor: lucroBruto, criterio: "Receita líquida menos custos identificados pela natureza documental." },
    { id: "despesas", descricao: "(-) Despesas Operacionais", nivel: 0, valor: despesasOperacionais, criterio: "Despesas derivadas do Razão, abertas por natureza e centro de custo.", composicao: despesasComAbertura },
    { id: "industr", descricao: "Despesas com Industrialização", nivel: 1, valor: soma(grupos.industrializacao), criterio: "Conta 25937 / industrialização onerosa. Retornos e remessas sem valor comercial não entram.", composicao: grupos.industrializacao },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog", nivel: 1, valor: valorNplog, criterio: "11.02.003 / CC 304, separada da conta 25938 administrativa sem duplicidade.", composicao: composicaoNplog },
    { id: "prod", descricao: "Despesas Produção", nivel: 1, valor: soma(grupos.prod), criterio: "Centros produtivos, respeitando natureza documental.", composicao: grupos.prod },
    { id: "com", descricao: "Despesas Comerciais", nivel: 1, valor: soma(grupos.comerciais), criterio: "Centros comerciais e fretes de venda/filial identificados pela natureza.", composicao: grupos.comerciais },
    { id: "adm", descricao: "Despesas Administrativas", nivel: 1, valor: soma(grupos.adm), criterio: "Centros 301 a 306 e 501 Administrativo SP; NPLog permanece em linha própria.", composicao: grupos.adm },
    { id: "dep", descricao: "Depreciação e Amortização", nivel: 1, valor: soma(grupos.depreciacao), criterio: "Apresentada separadamente enquanto a distribuição por CC não tiver evidência segura.", composicao: grupos.depreciacao },
    { id: "cred-fed", descricao: "(-) Créditos PIS/COFINS sobre Custos e Despesas", nivel: 1, valor: soma(grupos.creditosFederais), criterio: "Contas redutoras 25946/25947; mesmo crédito fiscal da apuração, sem rateio de CC por aproximação.", composicao: grupos.creditosFederais },
    { id: "outras", descricao: "Outras Despesas Operacionais", nivel: 1, valor: soma(grupos.outras), criterio: "Somente despesas realmente fora das naturezas/centros já classificados.", composicao: grupos.outras },
    { id: "ro", descricao: "(=) Resultado Operacional", nivel: 0, valor: resultadoOper, criterio: "Lucro bruto menos despesas operacionais do Razão." },
    { id: "fin-d", descricao: "(-) Despesas Financeiras", nivel: 0, valor: despFin, criterio: "Abertura por conta do Razão: juros, tarifas, IOF, descontos, JCP, variação cambial passiva e demais 5.8.", composicao: grupos.financeira },
    { id: "fin-r", descricao: "(+) Receitas Financeiras", nivel: 0, valor: dre.receitasFinanceiras, criterio: "Abertura por conta do Razão: descontos obtidos, juros ativos, variação cambial ativa, aplicações, receitas eventuais, recuperações e SELIC.", composicao: grupos.receitasFinanceiras },
    { id: "resultado", descricao: "(=) RESULTADO CONTÁBIL 07/2026", nivel: 0, valor: dre.resultado, criterio: "Resultado calculado exclusivamente pelo Razão final de julho." },
  ];

  const expans = linhas.filter((x) => x.nivel === 0 || (x.composicao?.length ?? 0) > 0).map((x) => x.id);
  const tudo = expans.every((x) => abertas.has(x));
  function alternar(id: string) { setAbertas((a) => { const n = new Set(a); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function alternarTudo() { setAbertas(tudo ? new Set() : new Set(expans)); }

  function exportarDreExcel() {
    const percentual = (valor: number) => dre.receitaBruta ? valor / dre.receitaBruta : 0;
    const linhasExcel = linhas.flatMap((linha) => [
      [`${linha.nivel === 1 ? "    " : ""}${linha.descricao}`, linha.valor, percentual(linha.valor)],
      ...(linha.composicao ?? []).map((item) => [`        ${item.conta} · ${item.descricao} — ${item.cc} ${item.centroCusto}`, item.valor, percentual(item.valor)]),
    ]);
    exportarExcel({
      arquivo: "Nitaplast_DRE_Report_072026.xlsx", aba: "DRE 07-2026",
      titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO",
      subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE",
      colunas: [{ cabecalho: "Descrição", largura: 72 }, { cabecalho: "Valor", largura: 18, tipo: "numero" }, { cabecalho: "% Receita", largura: 14, tipo: "percentual" }],
      linhas: linhasExcel,
    });
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div><h1 className="text-xl font-semibold tracking-tight">DRE calculada - Nitaplast 07/2026</h1><p className="mt-1 text-sm text-muted-foreground">Razão → Balancete → DRE. Nenhuma linha gerencial cria fato contábil.</p></div>
      <div className="flex flex-wrap gap-2"><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>{ajustesManuais > 0 ? <Badge variant="outline">{ajustesManuais} ajuste(s) manual(is)</Badge> : null}{reclassificacoes.length > 0 ? <Badge variant="outline">{reclassificacoes.length} reclassificação(ões)</Badge> : null}<Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" />Exportar Excel</Button><Button variant="outline" size="sm" onClick={alternarTudo}>{tudo ? "Recolher toda DRE" : "Expandir toda DRE"}</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Resumo label="Receita Operacional Bruta" value={dre.receitaBruta}/><Resumo label="Deduções da Receita Bruta" value={dre.deducoes}/><Resumo label="Resultado Contábil" value={dre.resultado} success={dre.resultado >= 0}/><Resumo label="Partidas no Razão" value={razaoAjustado.length} money={false}/></div>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6"><p className="font-medium">Regra única aplicada à DRE inteira</p><p className="mt-1 text-sm text-muted-foreground">Documentos → Lançamentos → Razão → Balancete → DRE. Centro de custo abre a gestão; não define sozinho a natureza do fato.</p></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">DRE 07/2026 — detalhamento completo</CardTitle><CardDescription>Abra as linhas para conferir conta, centro de custo, débito, crédito e impacto.</CardDescription></div><Badge variant="outline">07/2026 · FECHADO COM PENDÊNCIAS</Badge></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead><tr className="border-b bg-muted text-left text-xs"><th className="p-2">Linha da DRE</th><th className="p-2 text-right">DRE Calculada 07/2026</th><th className="p-2 text-center">Status</th></tr></thead><tbody>{linhas.map((x) => { const exp = x.nivel === 0 || (x.composicao?.length ?? 0) > 0; const aberta = abertas.has(x.id); const destaque = ["rl", "lb", "ro", "resultado"].includes(x.id); return [<tr key={x.id} className={`border-b ${x.nivel === 0 ? "bg-slate-100/70 font-semibold" : ""} ${destaque ? "border-y-2" : ""}`}><td className="p-2" style={{ paddingLeft: 8 + x.nivel * 22 }}>{exp ? <button className="inline-flex items-center gap-1.5 hover:text-primary" onClick={() => alternar(x.id)}>{aberta ? <ChevronDown className="size-4"/> : <ChevronRight className="size-4"/>}{x.descricao}</button> : <span className="pl-[22px]">{x.descricao}</span>}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td><td className="p-2 text-center"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Calculado</span></td></tr>, exp && aberta ? <tr key={`${x.id}-d`} className="border-b bg-slate-50/70"><td colSpan={3} className="p-4 pl-8"><p className="text-xs text-muted-foreground"><strong className="text-foreground">Critério:</strong> {x.criterio}</p>{x.composicao?.length ? <Composicao itens={x.composicao}/> : null}</td></tr> : null]; })}</tbody></table></CardContent></Card>
    <Card className="border-amber-400/50 bg-amber-50/40"><CardContent className="pt-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">Pendências não bloqueantes</p><p className="mt-1 text-sm text-muted-foreground">Contratos de câmbio sem vínculo documental suficiente permanecem fora do resultado. Variação cambial ativa/passiva só aparece quando houver movimento no Razão; ausência é exibida como zero na abertura.</p></div></div></CardContent></Card>
  </div>;
}

function Resumo({ label, value, money = true, success = false }: { label: string; value: number; money?: boolean; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p></CardContent></Card>;
}

function Composicao({ itens }: { itens: Item[] }) {
  return <div className="mt-3 overflow-x-auto rounded-md border bg-background"><table className="w-full min-w-[950px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Impacto</th></tr></thead><tbody>{itens.map((x) => <tr key={x.id} className="border-b last:border-0"><td className="p-2 font-mono">{x.conta}</td><td className="p-2 font-mono">{x.classificacao}</td><td className="p-2">{x.descricao}</td><td className="p-2">{x.cc} — {x.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(x.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(x.creditos)}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td></tr>)}</tbody></table></div>;
}
