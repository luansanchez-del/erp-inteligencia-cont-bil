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
  type ComposicaoResultadoJulho,
} from "@/data/nitaplast-dre-julho-final";
import { receitaFiscalJulho } from "@/data/nitaplast-fechamento-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { exportarExcel } from "@/lib/exportar-excel";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;
type Item = ComposicaoResultadoJulho;
type Linha = {
  id: string;
  descricao: string;
  nivel: number;
  valor: number;
  criterio: string;
  composicao?: Item[];
  status?: "calculado" | "pendente";
};

const ccProd = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10032", "10058", "19999"]);
const ccCom = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210", "502"]);
const ccAdm = new Set(["301", "302", "303", "304", "305", "306"]);
function soma(a: Item[]) { return arred(a.reduce((s, x) => s + x.valor, 0)); }

export function DreJulhoCompleta() {
  const { aplicar, reclassificacoes } = useReclassificacoesInteligentes("2026-07");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razaoAjustado), [razaoAjustado]);
  const dre = calculo.dre;
  const composicao = calculo.composicao;
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "despesas"]));

  function mov(c: string) {
    return arred(razaoAjustado.reduce((s, x) => s + (x.debitoCodigo === c ? x.valor : 0) - (x.creditoCodigo === c ? x.valor : 0), 0));
  }

  const baseGrupos = useMemo(() => ({
    custos: composicao.filter(ehCustoDreJulho),
    financeira: composicao.filter(ehDespesaFinanceiraDreJulho),
    despesas: composicao.filter(ehDespesaOperacionalDreJulho),
  }), [composicao]);

  /*
   * NPLog usa a mesma conta contábil 25938 de outros serviços de terceiros do CC 304.
   * Para a apresentação gerencial, separamos somente os documentos 11.02.003 da NPLog
   * e preservamos o restante de 25938/304 dentro de Despesas Administrativas.
   * Nenhuma partida é criada ou alterada por esta abertura.
   */
  const lancamentosNplog = useMemo(
    () => razaoAjustado.filter((x) => x.documento?.startsWith("11.02.003")),
    [razaoAjustado],
  );
  const nplogDebitos = arred(lancamentosNplog.reduce((s, x) => s + (x.debitoCodigo === "25938" ? x.valor : 0), 0));
  const nplogCreditos = arred(lancamentosNplog.reduce((s, x) => s + (x.creditoCodigo === "25938" ? x.valor : 0), 0));
  const valorNplog = arred(nplogDebitos - nplogCreditos);

  const composicaoNplog = useMemo<Item[]>(() => {
    if (Math.abs(valorNplog) < 0.005) return [];
    const referencia = lancamentosNplog[0];
    const status: Item["status"] = lancamentosNplog.some((x) => x.status === "revisar") ? "revisar" : "validado";
    return [{
      id: "DRE-JUL-NPLOG",
      conta: "25938",
      classificacao: "5.3.01.003.031",
      descricao: "Serviços de Transporte e Logística — NPLog",
      cc: referencia?.cc ?? "304",
      centroCusto: referencia?.centroCusto ?? "ADM GERAL",
      valor: valorNplog,
      status,
      fonte: referencia?.fonte ?? "ENTRADAS POR CENTRO DE CUSTO 07/2026",
      debitos: nplogDebitos,
      creditos: nplogCreditos,
    }];
  }, [lancamentosNplog, nplogCreditos, nplogDebitos, valorNplog]);

  const despesasSemNplog = useMemo<Item[]>(() => baseGrupos.despesas
    .map((x) => {
      if (x.conta !== "25938" || x.cc !== "304" || Math.abs(valorNplog) < 0.005) return x;
      const debitos = arred(x.debitos - nplogDebitos);
      const creditos = arred(x.creditos - nplogCreditos);
      return { ...x, debitos, creditos, valor: arred(debitos - creditos) };
    })
    .filter((x) => Math.abs(x.valor) >= 0.005), [baseGrupos.despesas, nplogCreditos, nplogDebitos, valorNplog]);

  const grupos = useMemo(() => {
    const prod = despesasSemNplog.filter((x) => ccProd.has(x.cc));
    const comerciais = despesasSemNplog.filter((x) => ccCom.has(x.cc));
    const adm = despesasSemNplog.filter((x) => ccAdm.has(x.cc));
    const outras = despesasSemNplog.filter((x) => !ccProd.has(x.cc) && !ccCom.has(x.cc) && !ccAdm.has(x.cc));
    return { custos: baseGrupos.custos, financeira: baseGrupos.financeira, despesas: despesasSemNplog, prod, comerciais, adm, outras };
  }, [baseGrupos.custos, baseGrupos.financeira, despesasSemNplog]);

  const custosDre = soma(grupos.custos);
  const despesasComNplog = [...grupos.despesas, ...composicaoNplog];
  const lucroBruto = arred(dre.receitaLiquida - custosDre);
  const despOper = soma(despesasComNplog);
  const despFin = soma(grupos.financeira);
  const resultadoOper = arred(lucroBruto - despOper);
  const ajustesManuais = razaoAjustado.filter((x) => x.origem === "LANÇAMENTO MANUAL" || x.origem.startsWith("ALTERAÇÃO MANUAL") || x.origem.startsWith("EXCLUSÃO MANUAL")).length;

  const linhas: Linha[] = [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", nivel: 0, valor: dre.receitaBruta, criterio: "Receita formada exclusivamente pelas saídas fiscais e demais fatos de receita contabilizados no Razão." },
    { id: "rmp", descricao: "Receita Venda Produção Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.producao, criterio: "Saídas fiscais externas da matriz." },
    { id: "rmr", descricao: "Receita Revenda Matriz", nivel: 1, valor: receitaFiscalJulho.matriz.revenda, criterio: "Saídas fiscais de revenda da matriz." },
    { id: "rfp", descricao: "Receita Venda Produção Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.producaoOperacaoTriangular, criterio: "Operação triangular/produção da filial." },
    { id: "rfr", descricao: "Receita Revenda Filial", nivel: 1, valor: receitaFiscalJulho.filialSp.revenda, criterio: "Saídas fiscais da filial." },
    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", nivel: 0, valor: dre.deducoes, criterio: "Movimento líquido das contas de devoluções e tributos incidentes nas vendas no Razão." },
    { id: "dev", descricao: "Devoluções de Produtos", nivel: 1, valor: dre.devolucoes, criterio: "Matriz + filial." },
    { id: "icms-m", descricao: "ICMS Matriz", nivel: 1, valor: Math.max(0, mov("2827")), criterio: "Somente ICMS das vendas externas; transferências Matriz → Filial ficam patrimoniais." },
    { id: "icms-f", descricao: "ICMS s/ vendas Filial", nivel: 1, valor: Math.max(0, mov("25054")), criterio: "Débito da filial líquido dos créditos/estornos que movimentam a mesma conta de resultado." },
    { id: "ipi-m", descricao: "IPI Matriz", nivel: 1, valor: Math.max(0, mov("2826")), criterio: "IPI das saídas da matriz conforme apuração oficial." },
    { id: "ipi-f", descricao: "IPI Filial", nivel: 1, valor: Math.max(0, mov("25055")), criterio: "IPI da filial líquido do crédito de devolução." },
    { id: "pis", descricao: "PIS", nivel: 1, valor: dre.pis, criterio: "Movimento líquido da conta de PIS sobre vendas." },
    { id: "cof", descricao: "COFINS", nivel: 1, valor: dre.cofins, criterio: "Movimento líquido da conta de COFINS sobre vendas." },
    { id: "st", descricao: "ICMS ST", nivel: 1, valor: dre.icmsSt, criterio: "Apuração ICMS-ST de julho." },
    { id: "rl", descricao: "(=) Receita Operacional Líquida", nivel: 0, valor: dre.receitaLiquida, criterio: "Receita bruta menos deduções formadas no Razão." },
    { id: "custos", descricao: "(-) Custos / CPV / CMV", nivel: 0, valor: custosDre, criterio: "Somente contas de custo efetivo: CPV/CMV, compras/fretes de matéria-prima e industrialização. Contas 5.3 de serviços e despesas não são mais classificadas como custo apenas pelo prefixo do plano.", composicao: grupos.custos },
    { id: "lb", descricao: "(=) LUCRO BRUTO", nivel: 0, valor: lucroBruto, criterio: "Receita líquida menos os custos efetivamente identificados pela natureza contábil/documental." },
    { id: "despesas", descricao: "(-) Despesas Operacionais", nivel: 0, valor: despOper, criterio: "Despesas operacionais líquidas contabilizadas por documento e centro de custo, incluindo as contas 5.3 que têm natureza de despesa, folha, provisões reais, depreciação e NPLog.", composicao: despesasComNplog },
    { id: "nplog", descricao: "Despesa com Serviço - NPLog", nivel: 1, valor: valorNplog, criterio: "Gerencial 11.02.003 — Serviços de Transporte e Logística, CC 304 ADM GERAL. Separação gerencial dentro da conta 25938, sem criar ou alterar lançamento no Razão.", composicao: composicaoNplog },
    { id: "prod", descricao: "Despesas Produção", nivel: 1, valor: soma(grupos.prod), criterio: "Despesas operacionais dos centros produtivos que não compõem CPV/CMV.", composicao: grupos.prod },
    { id: "com", descricao: "Despesas Comerciais", nivel: 1, valor: soma(grupos.comerciais), criterio: "Despesas operacionais dos centros comerciais, inclusive filial SP.", composicao: grupos.comerciais },
    { id: "adm", descricao: "Despesas Administrativas", nivel: 1, valor: soma(grupos.adm), criterio: "Centros 301 a 306. Inclui serviços administrativos da conta 25938/5.3; NPLog permanece em linha própria.", composicao: grupos.adm },
    { id: "outras", descricao: "Outras Despesas Operacionais", nivel: 1, valor: soma(grupos.outras), criterio: "Despesas operacionais fora dos centros produtivos, comerciais e administrativos definidos.", composicao: grupos.outras },
    { id: "ro", descricao: "(=) Resultado Operacional", nivel: 0, valor: resultadoOper, criterio: "Lucro bruto menos despesas operacionais contabilizadas. A classificação gerencial por centro de custo não cria fatos contábeis." },
    { id: "fin-d", descricao: "(-) Despesas Financeiras", nivel: 0, valor: despFin, criterio: "Tarifas, IOF, JCP, variação cambial passiva e demais despesas financeiras efetivamente contabilizadas.", composicao: grupos.financeira },
    { id: "fin-r", descricao: "(+) Receitas Financeiras", nivel: 0, valor: dre.receitasFinanceiras, criterio: "Rendimentos, juros ativos e variações cambiais ativas efetivamente contabilizados no Razão." },
    { id: "resultado", descricao: "(=) RESULTADO CONTÁBIL 07/2026", nivel: 0, valor: dre.resultado, criterio: "Resultado calculado exclusivamente pelo Razão final de julho, já incluindo lançamentos/reclassificações manuais da competência." },
  ];

  const expans = linhas.filter((x) => x.nivel === 0 || (x.composicao?.length ?? 0) > 0).map((x) => x.id);
  const tudo = expans.every((x) => abertas.has(x));
  function alternar(id: string) { setAbertas((a) => { const n = new Set(a); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function alternarTudo() { setAbertas(tudo ? new Set() : new Set(expans)); }

  function exportarDreExcel() {
    const percentual = (valor: number) => dre.receitaBruta ? valor / dre.receitaBruta : 0;
    exportarExcel({
      arquivo: "Nitaplast_DRE_Report_072026.xlsx",
      aba: "DRE 07-2026",
      titulo: "NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO",
      subtitulo: "Período 01/07/2026 a 31/07/2026 · Razão → Balancete → DRE",
      colunas: [
        { cabecalho: "Descrição", largura: 62 },
        { cabecalho: "Valor", largura: 18, tipo: "numero" },
        { cabecalho: "% Receita", largura: 14, tipo: "percentual" },
      ],
      linhas: linhas.map((linha) => [
        `${linha.nivel === 1 ? "    " : ""}${linha.descricao}`,
        linha.valor,
        percentual(linha.valor),
      ]),
    });
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">DRE calculada - Nitaplast 07/2026</h1>
        <p className="mt-1 text-sm text-muted-foreground">A DRE nasce do Razão/Balancete. Lançamentos contábeis e reclassificações manuais de julho recalculam esta demonstração automaticamente.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>
        {ajustesManuais > 0 ? <Badge variant="outline">{ajustesManuais} ajuste(s) manual(is)</Badge> : null}
        {reclassificacoes.length > 0 ? <Badge variant="outline">{reclassificacoes.length} reclassificação(ões)</Badge> : null}
        <Button variant="outline" size="sm" className="gap-2" onClick={exportarDreExcel}><FileSpreadsheet className="size-4" />Exportar Excel</Button>
        <Button variant="outline" size="sm" onClick={alternarTudo}>{tudo ? "Recolher toda DRE" : "Expandir toda DRE"}</Button>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Resumo label="Receita Operacional Bruta" value={dre.receitaBruta}/><Resumo label="Deduções da Receita Bruta" value={dre.deducoes}/><Resumo label="Resultado Contábil" value={dre.resultado} success={dre.resultado >= 0}/><Resumo label="Partidas no Razão" value={razaoAjustado.length} money={false}/></div>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6"><p className="font-medium">Regra única aplicada à DRE inteira</p><p className="mt-1 text-sm text-muted-foreground">Documentos → Lançamentos → Razão → Balancete → DRE. O saldo de 30/06 é referência de cálculo, nunca lançamento de abertura. Custos são classificados pela natureza do fato; despesas operacionais são abertas por centro de custo.</p></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">DRE 07/2026 — detalhamento completo</CardTitle><CardDescription>Abra as linhas para conferir o critério e a composição contábil por conta e centro de custo.</CardDescription></div><Badge variant="outline">07/2026 · FECHADO COM PENDÊNCIAS</Badge></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead><tr className="border-b bg-muted text-left text-xs"><th className="p-2">Linha da DRE</th><th className="p-2 text-right">DRE Calculada 07/2026</th><th className="p-2 text-center">Status</th></tr></thead><tbody>{linhas.map((x) => { const exp = x.nivel === 0 || (x.composicao?.length ?? 0) > 0; const aberta = abertas.has(x.id); const destaque = ["rl", "lb", "ro", "resultado"].includes(x.id); return [<tr key={x.id} className={`border-b ${x.nivel === 0 ? "bg-slate-100/70 font-semibold" : ""} ${destaque ? "border-y-2" : ""}`}><td className="p-2" style={{ paddingLeft: 8 + x.nivel * 22 }}>{exp ? <button className="inline-flex items-center gap-1.5 hover:text-primary" onClick={() => alternar(x.id)}>{aberta ? <ChevronDown className="size-4"/> : <ChevronRight className="size-4"/>}{x.descricao}</button> : <span className="pl-[22px]">{x.descricao}</span>}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td><td className="p-2 text-center"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Calculado</span></td></tr>, exp && aberta ? <tr key={`${x.id}-d`} className="border-b bg-slate-50/70"><td colSpan={3} className="p-4 pl-8"><p className="text-xs text-muted-foreground"><strong className="text-foreground">Critério:</strong> {x.criterio}</p>{x.composicao?.length ? <Composicao itens={x.composicao}/> : null}</td></tr> : null]; })}</tbody></table></CardContent></Card>
    <Card className="border-amber-400/50 bg-amber-50/40"><CardContent className="pt-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="font-semibold">Pendências não bloqueantes</p><p className="mt-1 text-sm text-muted-foreground">Folha, provisões reais, depreciação, JCP e as variações cambiais já comprovadas estão contabilizados. Permanecem em conciliação somente fatos sem evidência suficiente, inclusive contratos de câmbio ainda sem amarração do valor contábil de origem e valores mantidos na Conta Transitória.</p></div></div></CardContent></Card>
  </div>;
}

function Resumo({ label, value, money = true, success = false }: { label: string; value: number; money?: boolean; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{money ? brl.format(value) : value.toLocaleString("pt-BR")}</p></CardContent></Card>;
}

function Composicao({ itens }: { itens: Item[] }) {
  return <div className="mt-3 overflow-x-auto rounded-md border bg-background"><table className="w-full min-w-[950px] text-xs"><thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Impacto</th></tr></thead><tbody>{itens.map((x) => <tr key={x.id} className="border-b last:border-0"><td className="p-2 font-mono">{x.conta}</td><td className="p-2 font-mono">{x.classificacao}</td><td className="p-2">{x.descricao}</td><td className="p-2">{x.cc} — {x.centroCusto}</td><td className="p-2 text-right tabular-nums">{brl.format(x.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(x.creditos)}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(x.valor)}</td></tr>)}</tbody></table></div>;
}