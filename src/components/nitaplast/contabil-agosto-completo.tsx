import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, CircleAlert, Download, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { BalancetePrintSummary } from "@/components/balancete-print-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { estruturaBalanceteNitaplast, type LinhaEstruturaBalancete } from "@/data/nitaplast-balancete-estrutura";
import { contasPosImplantacao } from "@/data/nitaplast-balancete-julho-engine";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { saldoAberturaAgostoPorConta } from "@/data/nitaplast-saldos-agosto";
import {
  escopoContaBalanceteNitaplast,
  estabelecimentoLancamentoNitaplast,
  type EscopoContaNitaplast,
  type EstabelecimentoNitaplast,
} from "@/data/nitaplast-estabelecimento";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { saldoAnteriorResultadoJulho2026 } from "@/data/nitaplast-resultado-transportado";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import {
  estoqueFinalMatrizAgostoTotal,
  resumoCpvDepreciacaoAgosto,
} from "@/data/nitaplast-cpv-depreciacao-agosto";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;
const info = new Map(saldosImplantacao.map((x) => [x.conta, x]));
const contasEstruturaBase = new Set(estruturaBalanceteNitaplast.map((x) => x.conta));
// Contas que nasceram depois da implantação de 31/05 (mesma lista usada no motor de
// julho): sem isso, movimentos legítimos e documentados caem na conta de encaixe
// "9.9.99 - Conta não encontrada no plano" em vez da classificação real.
const estruturaBalanceteCompleta: LinhaEstruturaBalancete[] = [
  ...estruturaBalanceteNitaplast,
  ...contasPosImplantacao
    .filter(([conta]) => !contasEstruturaBase.has(conta))
    .map(([conta, classificacao, descricao]) => ({
      conta,
      tipo: "A" as const,
      classificacao,
      descricao,
      nivel: classificacao.split(".").length,
    })),
];
const analiticas = estruturaBalanceteCompleta.filter((x) => x.tipo === "A");
const contasEstrutura = new Set(analiticas.map((x) => x.conta));
function grupoClassificacaoAgosto(classificacao: string): string {
  if (classificacao.startsWith("1")) return "Ativo";
  if (classificacao.startsWith("2")) return "Passivo e patrimônio líquido";
  if (classificacao.startsWith("4")) return "Receitas acumuladas";
  if (classificacao.startsWith("5")) return "Custos e despesas acumulados";
  return "Outros";
}
function combinarEscoposAgosto(escopos: Iterable<EscopoContaNitaplast>): EscopoContaNitaplast {
  let matriz = false;
  let filial = false;
  for (const e of escopos) {
    if (e === "Matriz") matriz = true;
    else if (e === "Filial SP") filial = true;
    else { matriz = true; filial = true; }
  }
  if (matriz && filial) return "Matriz + Filial SP";
  if (filial) return "Filial SP";
  return "Matriz";
}

function useBase() {
  return useLancamentosCompetencia("nitaplast-matriz", "2026-08");
}
function Header({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>
      <Badge variant="outline">Matriz + Filial SP · 08/2026</Badge>
    </div>
  );
}
function Metric({ label, valor, money = true }: { label: string; valor: number; money?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{money ? brl.format(valor) : valor.toLocaleString("pt-BR")}</p>
      </CardContent>
    </Card>
  );
}

function calcular(lancamentos: ReturnType<typeof useBase>["lancamentos"]) {
  const mov = new Map<string, { d: number; c: number; n: number }>();
  const estabs = new Map<string, Set<EstabelecimentoNitaplast>>();
  const addEst = (conta: string, e: EstabelecimentoNitaplast) => {
    const s = estabs.get(conta) ?? new Set<EstabelecimentoNitaplast>();
    s.add(e);
    estabs.set(conta, s);
  };
  for (const l of lancamentos) {
    const e = estabelecimentoLancamentoNitaplast(l);
    const d = mov.get(l.debitoCodigo) ?? { d: 0, c: 0, n: 0 };
    d.d += l.valor;
    d.n++;
    mov.set(l.debitoCodigo, d);
    addEst(l.debitoCodigo, e);
    const c = mov.get(l.creditoCodigo) ?? { d: 0, c: 0, n: 0 };
    c.c += l.valor;
    c.n++;
    mov.set(l.creditoCodigo, c);
    addEst(l.creditoCodigo, e);
  }
  const extras = [...mov.keys()]
    .filter((c) => !contasEstrutura.has(c))
    .map((c) => ({
      conta: c,
      tipo: "A" as const,
      classificacao: info.get(c)?.classificacao ?? "9.9.99",
      descricao: info.get(c)?.descricao ?? "Conta não encontrada no plano",
      nivel: 9,
    }));
  const estrutura = [...estruturaBalanceteCompleta, ...extras];
  const valores = new Map(
    [...analiticas, ...extras].map((a) => {
      const m = mov.get(a.conta) ?? { d: 0, c: 0, n: 0 };
      const sa = saldoAberturaAgostoPorConta.get(a.conta) ?? 0;
      const estabelecimento = escopoContaBalanceteNitaplast(a.conta, a.descricao, estabs.get(a.conta) ?? []);
      return [
        a.conta,
        {
          sa,
          d: arred(m.d),
          c: arred(m.c),
          mov: arred(m.d - m.c),
          sf: arred(sa + m.d - m.c),
          n: m.n,
          estabelecimento,
        },
      ] as const;
    }),
  );
  return estrutura.map((x) => {
    const grupo = grupoClassificacaoAgosto(x.classificacao);
    if (x.tipo === "A") return { ...x, grupo, ...valores.get(x.conta)! };
    const filhas = [...valores]
      .filter(([conta]) => {
        const a = [...analiticas, ...extras].find((y) => y.conta === conta);
        return (
          a &&
          (a.classificacao === x.classificacao || a.classificacao.startsWith(`${x.classificacao}.`))
        );
      })
      .map(([, v]) => v);
    return {
      ...x,
      grupo,
      ...filhas.reduce(
        (t, v) => ({
          sa: t.sa + v.sa,
          d: t.d + v.d,
          c: t.c + v.c,
          mov: t.mov + v.mov,
          sf: t.sf + v.sf,
          n: t.n + v.n,
        }),
        { sa: 0, d: 0, c: 0, mov: 0, sf: 0, n: 0 },
      ),
      estabelecimento: combinarEscoposAgosto(filhas.map((v) => v.estabelecimento)),
    };
  });
}

function LinhaBalanceteAgosto({ linha }: { linha: ReturnType<typeof calcular>[number] }) {
  return (
    <tr className={`border-b ${linha.tipo === "S" ? "bg-muted/40 font-semibold" : ""}`}>
      <td className="p-2 font-mono">{linha.conta}</td>
      <td className="p-2">{linha.tipo}</td>
      <td className="p-2 font-mono text-xs">{linha.classificacao}</td>
      <td className="p-2">{linha.descricao}</td>
      <td className="p-2 font-medium">{linha.estabelecimento}</td>
      <Money valor={linha.sa} />
      <Money valor={linha.d} />
      <Money valor={linha.c} />
      <Money valor={linha.mov} />
      <Money valor={linha.sf} strong />
      <td className="p-2">
        {linha.tipo === "A" ? (
          <Button size="sm" variant="outline" onClick={() => window.location.assign(`/contabil/razao?conta=${encodeURIComponent(linha.conta)}`)}>Abrir Razão</Button>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function Money({ valor, strong = false }: { valor: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{valor < 0 ? `(${brl.format(Math.abs(valor))})` : brl.format(valor)}</td>;
}

type CelulaCsvAgosto = string | number;
function exportarCsvAgosto(nome: string, linhas: CelulaCsvAgosto[][], sep = ";") {
  const celula = (valor: CelulaCsvAgosto) =>
    typeof valor === "number" ? valor.toFixed(2).replace(".", ",") : `"${String(valor).replaceAll('"', '""')}"`;
  const texto = linhas.map((linha) => linha.map(celula).join(sep)).join("\n");
  const blob = new Blob(["﻿", texto], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function BalanceteAgostoCompleto() {
  const { lancamentos } = useBase();
  const linhas = useMemo(() => calcular(lancamentos), [lancamentos]);
  const revisao = useMemo(() => lancamentos.filter((l) => l.status === "revisar").length, [lancamentos]);
  // Agosto ainda não tem o mecanismo de reclassificação inteligente de julho; o
  // slot fica na mesma posição do layout, mas sempre zerado até existir essa opção.
  const reclassificacoes = 0;
  const conferencia = useMemo(() => {
    const analiticasCalculadas = linhas.filter((x) => x.tipo === "A");
    const totalDebitos = arred(lancamentos.reduce((s, x) => s + x.valor, 0));
    const somaMovimentosAnaliticos = arred(analiticasCalculadas.reduce((s, x) => s + x.mov, 0));
    const somaSaldoAtualAnalitico = arred(analiticasCalculadas.reduce((s, x) => s + x.sf, 0));
    const contasRazaoSemEstrutura = analiticasCalculadas.filter((x) => x.classificacao === "9.9.99").map((x) => x.conta);
    return {
      totalDebitos,
      totalCreditos: totalDebitos,
      diferencaDebitosCreditos: 0,
      somaMovimentosAnaliticos,
      somaSaldoAtualAnalitico,
      contasRazaoSemEstrutura,
    };
  }, [lancamentos, linhas]);
  const fechado = Math.abs(conferencia.diferencaDebitosCreditos) < 0.01 && Math.abs(conferencia.somaMovimentosAnaliticos) < 0.01 && Math.abs(conferencia.somaSaldoAtualAnalitico) < 0.01 && conferencia.contasRazaoSemEstrutura.length === 0;
  // O resultado do mês precisa vir do mesmo motor do DRE (calcularResultadoAgosto),
  // não da soma genérica das linhas do Balancete — senão o Resumo diverge do DRE
  // Oficial. O saldo anterior encadeia com o resultado do exercício transportado
  // de julho (mesma cadeia maio → junho → julho de nitaplast-resultado-transportado.ts).
  const { resultado: resultadoAgosto } = useMemo(() => calcularResultadoAgosto(lancamentos), [lancamentos]);
  const controleJulhoResultado = useReclassificacoesInteligentes("2026-07");
  const resultadoJulho = useMemo(
    () => calcularDreJulhoFinal(controleJulhoResultado.aplicar(lancamentosIntegradosJulhoFinal)).dre.resultado,
    [controleJulhoResultado.aplicar],
  );
  // dre.resultado é positivo quando há lucro; o Resumo guarda resultado credor
  // como valor negativo (mesma convenção usada no encadeamento maio→junho→julho
  // de nitaplast-resultado-transportado.ts), por isso subtrai em vez de somar.
  const saldoAnteriorResultadoAgosto = arred(saldoAnteriorResultadoJulho2026 - resultadoJulho);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [soMovimento, setSoMovimento] = useState(false);
  const [zeradas, setZeradas] = useState(false);
  const [estab, setEstab] = useState("todos");
  const filtradas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    return linhas.filter((x) => {
      const zero = Math.abs(x.sa) < 0.005 && Math.abs(x.d) < 0.005 && Math.abs(x.c) < 0.005 && Math.abs(x.sf) < 0.005;
      if (!zeradas && zero) return false;
      if (soMovimento && x.n === 0) return false;
      if (grupo !== "todos" && x.grupo !== grupo) return false;
      if (estab !== "todos" && x.estabelecimento !== estab) return false;
      if (q && !`${x.conta} ${x.classificacao} ${x.descricao} ${x.estabelecimento}`.toLocaleLowerCase("pt-BR").includes(q)) return false;
      return true;
    });
  }, [linhas, busca, grupo, soMovimento, zeradas, estab]);
  const linhasResumo = useMemo(
    () => linhas.map((x) => ({ tipo: x.tipo, conta: x.conta, classificacao: x.classificacao, descricao: x.descricao, saldoAnterior: x.sa, debitos: x.d, creditos: x.c, saldoAtual: x.sf })),
    [linhas],
  );
  const csv = () => {
    const analiticasCsv = filtradas.filter((x) => x.tipo === "A");
    const total = (campo: "sa" | "d" | "c" | "sf") => arred(analiticasCsv.reduce((s, x) => s + x[campo], 0));
    exportarCsvAgosto("Balancete_Nitaplast_08-2026.csv", [
      ["Conta", "S/A", "Classificação", "Descrição", "Estabelecimento", "Saldo anterior", "Débito", "Crédito", "Movimento", "Saldo atual"],
      ...filtradas.map((x) => [x.conta, x.tipo, x.classificacao, x.descricao, x.estabelecimento, x.sa, x.d, x.c, x.mov, x.sf]),
      ["", "", "", "TOTAL DAS CONTAS ANALÍTICAS", "", total("sa"), total("d"), total("c"), "", total("sf")],
    ]);
  };
  return (
    <div className="grid gap-5">
      <PageHeader
        titulo="Balancete consolidado - Nitaplast"
        descricao="Razão → Balancete → DRE. A DRE de 08/2026 lê o movimento mensal deste Balancete."
        acoes={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={csv}><Download className="size-4" />Exportar CSV</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="size-4" />Imprimir / PDF</Button><Badge variant="outline">Matriz + Filial SP · 08/2026</Badge></div>}
      />
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm">
          <div><strong>Resumo do Balancete.</strong> Saldo anterior transportado de 07/2026 e movimentos mensais originados no Razão.</div>
          <Badge variant="outline">{linhas.length} linhas · {linhas.filter((x) => x.tipo === "A").length} analíticas</Badge>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Partidas do Razão" valor={lancamentos.length} money={false} />
        <Metric label="Débitos 08" valor={conferencia.totalDebitos} />
        <Metric label="Créditos 08" valor={conferencia.totalCreditos} />
        <Metric label="Diferença contábil" valor={conferencia.diferencaDebitosCreditos} />
        <Metric label="Em revisão" valor={revisao} money={false} />
        <Metric label="Reclassificações" valor={reclassificacoes} money={false} />
      </div>
      <Card className={fechado ? "border-emerald-500/40 bg-emerald-50/40" : "border-amber-500/50 bg-amber-50/40"}>
        <CardContent className="pt-5 text-sm">
          <strong>Conferência contábil: {fechado ? "FECHADO" : "REVISAR"}.</strong> Débitos − Créditos: <strong>{brl.format(conferencia.diferencaDebitosCreditos)}</strong> · soma do movimento das contas analíticas: <strong>{brl.format(conferencia.somaMovimentosAnaliticos)}</strong> · soma assinada do saldo final analítico: <strong>{brl.format(conferencia.somaSaldoAtualAnalitico)}</strong>. Para conferir se o Balancete zera, some somente as linhas <strong>A (analíticas)</strong> com seus sinais; não some linhas sintéticas + analíticas, pois isso duplica os mesmos saldos.
          {conferencia.contasRazaoSemEstrutura.length > 0 ? <span className="mt-2 block font-semibold text-amber-800">Contas do Razão ausentes na estrutura do Balancete: {conferencia.contasRazaoSemEstrutura.join(", ")}</span> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Balancete 08/2026</CardTitle>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar conta, estabelecimento ou descrição" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button size="sm" variant={grupo === "todos" ? "default" : "outline"} onClick={() => setGrupo("todos")}>Todos</Button>
            <Button size="sm" variant={grupo === "Ativo" ? "default" : "outline"} onClick={() => setGrupo("Ativo")}>Ativo</Button>
            <Button size="sm" variant={grupo === "Passivo e patrimônio líquido" ? "default" : "outline"} onClick={() => setGrupo("Passivo e patrimônio líquido")}>Passivo e PL</Button>
            <Button size="sm" variant={grupo === "Receitas acumuladas" ? "default" : "outline"} onClick={() => setGrupo("Receitas acumuladas")}>Receitas</Button>
            <Button size="sm" variant={grupo === "Custos e despesas acumulados" ? "default" : "outline"} onClick={() => setGrupo("Custos e despesas acumulados")}>Custos e despesas</Button>
            <Button size="sm" variant={soMovimento ? "default" : "outline"} onClick={() => setSoMovimento((v) => !v)}>Somente com movimento</Button>
            <Button size="sm" variant={zeradas ? "default" : "outline"} onClick={() => setZeradas((v) => !v)}>Exibir zeradas</Button>
            <select value={estab} onChange={(event) => setEstab(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="todos">Todos os estabelecimentos</option>
              <option value="Matriz">Matriz</option>
              <option value="Filial SP">Filial SP</option>
              <option value="Matriz + Filial SP">Matriz + Filial SP</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-sm">
              <thead>
                <tr className="border-b bg-muted text-left text-xs">
                  <th className="p-2">Conta</th><th className="p-2">S/A</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Estabelecimento</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2 text-right">Movimento</th><th className="p-2 text-right">Saldo atual</th><th className="p-2">Detalhe</th>
                </tr>
              </thead>
              <tbody>{filtradas.map((linha) => <LinhaBalanceteAgosto key={`${linha.tipo}-${linha.conta}-${linha.classificacao}`} linha={linha} />)}</tbody>
            </table>
          </div>
          <BalancetePrintSummary linhas={linhasResumo} resultadoContabil={{ saldoAnterior: saldoAnteriorResultadoAgosto, movimentoMes: arred(-resultadoAgosto) }} />
        </CardContent>
      </Card>
    </div>
  );
}

type TotaisAnaliseDre = {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  cpv: number;
  lucroBruto: number;
  despesas: number;
  resultadoFinanceiro: number;
  resultadoOperacional: number;
  naoOperacional: number;
  resultado: number;
};

function AnaliseVerticalDre({ agosto }: { agosto: TotaisAnaliseDre }) {
  const controleJulho = useReclassificacoesInteligentes("2026-07");
  const julho = useMemo(
    () => calcularDreJulhoFinal(controleJulho.aplicar(lancamentosIntegradosJulhoFinal)).dre,
    [controleJulho.aplicar],
  );
  const baseJulho: TotaisAnaliseDre = {
    receitaBruta: julho.receitaBruta,
    deducoes: julho.deducoes,
    receitaLiquida: julho.receitaLiquida,
    cpv: julho.custosReconhecidos,
    lucroBruto: arred(julho.receitaLiquida - julho.custosReconhecidos),
    despesas: julho.despesasOperacionais,
    resultadoFinanceiro: arred(julho.receitasFinanceiras - julho.despesasFinanceiras),
    resultadoOperacional: arred(
      julho.receitaLiquida -
        julho.custosReconhecidos -
        julho.despesasOperacionais -
        julho.despesasFinanceiras +
        julho.receitasFinanceiras,
    ),
    naoOperacional: julho.resultadoAlienacaoImobilizado,
    resultado: julho.resultado,
  };
  const definicoes: [keyof TotaisAnaliseDre, string][] = [
    ["receitaBruta", "(+) Receita Operacional Bruta"],
    ["deducoes", "(-) Deduções da Receita Bruta"],
    ["receitaLiquida", "(=) Receita Operacional Líquida"],
    ["cpv", "(-) CPV / CMV Total"],
    ["lucroBruto", "(=) Lucro Bruto"],
    ["despesas", "(-) Despesas Operacionais"],
    ["resultadoFinanceiro", "Resultado Financeiro Líquido"],
    ["resultadoOperacional", "(=) Resultado Operacional"],
    ["naoOperacional", "Resultado não operacional"],
    ["resultado", "(=) Lucro / Prejuízo Líquido"],
  ];
  const linhas = definicoes.map(([chave, descricao]) => {
    const valorJulho = baseJulho[chave];
    const valorAgosto = agosto[chave];
    const avJulho = baseJulho.receitaBruta ? (valorJulho / baseJulho.receitaBruta) * 100 : 0;
    const avAgosto = agosto.receitaBruta ? (valorAgosto / agosto.receitaBruta) * 100 : 0;
    const diferenca = arred(valorAgosto - valorJulho);
    const variacao = Math.abs(valorJulho) > 0.004 ? (diferenca / Math.abs(valorJulho)) * 100 : null;
    const pontosPercentuais = avAgosto - avJulho;
    const revisar =
      Math.abs(pontosPercentuais) >= 5 ||
      (variacao !== null && Math.abs(variacao) >= 30 && Math.abs(diferenca) >= 10_000);
    return {
      chave,
      descricao,
      valorJulho,
      valorAgosto,
      avJulho,
      avAgosto,
      diferenca,
      variacao,
      pontosPercentuais,
      revisar,
    };
  });
  const percentual = (valor: number) =>
    `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  return (
    <Card className="border-blue-500/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              Análise vertical e horizontal — 07/2026 × 08/2026
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mesmas linhas da DRE oficial. AV = participação sobre a receita bruta; variação p.p.
              mostra a mudança de peso entre os meses.
            </p>
          </div>
          <Badge variant="outline">
            {linhas.filter((linha) => linha.revisar).length} linhas para revisão
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[1260px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs">
              <th className="p-2 text-left">Composição DRE</th>
              <th className="p-2 text-right">07/2026</th>
              <th className="p-2 text-right">AV 07</th>
              <th className="p-2 text-right">08/2026</th>
              <th className="p-2 text-right">AV 08</th>
              <th className="p-2 text-right">Diferença R$</th>
              <th className="p-2 text-right">Variação %</th>
              <th className="p-2 text-right">Variação p.p.</th>
              <th className="p-2">Conferência</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.chave} className={`border-b ${linha.revisar ? "bg-amber-50/50" : ""}`}>
                <td className="p-2 font-medium">{linha.descricao}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valorJulho)}</td>
                <td className="p-2 text-right tabular-nums">{percentual(linha.avJulho)}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valorAgosto)}</td>
                <td className="p-2 text-right tabular-nums">{percentual(linha.avAgosto)}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.diferenca)}</td>
                <td className="p-2 text-right tabular-nums">
                  {linha.variacao === null ? "—" : percentual(linha.variacao)}
                </td>
                <td className="p-2 text-right tabular-nums">{`${linha.pontosPercentuais >= 0 ? "+" : ""}${percentual(linha.pontosPercentuais)}`}</td>
                <td className="p-2">
                  {linha.revisar ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-800">
                      Revisar composição
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Sem desvio relevante</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 rounded-md border border-amber-400/50 bg-amber-50/40 p-3 text-sm">
          <strong>Critério de alerta:</strong> mudança de pelo menos 5 pontos percentuais ou
          variação mínima de 30% e R$ 10 mil. O alerta direciona a conferência do Razão; não cria
          lançamento automático.
        </div>
      </CardContent>
    </Card>
  );
}

function Tabela({ linhas }: { linhas: ReturnType<typeof useBase>["lancamentos"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1600px] text-xs">
        <thead>
          <tr className="border-b bg-muted text-left">
            <th>Data</th>
            <th>Estabelecimento</th>
            <th>ID/Origem</th>
            <th>Débito</th>
            <th>Crédito</th>
            <th>Histórico/Documento</th>
            <th>CC</th>
            <th className="text-right">Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((x) => (
            <tr key={x.id} className="border-b">
              <td className="p-2">{x.data}</td>
              <td>{estabelecimentoLancamentoNitaplast(x as never)}</td>
              <td>
                <b className="font-mono">{x.id}</b>
                <br />
                {x.origem}
              </td>
              <td>
                {x.debitoCodigo} - {info.get(x.debitoCodigo)?.descricao}
              </td>
              <td>
                {x.creditoCodigo} - {info.get(x.creditoCodigo)?.descricao}
              </td>
              <td>
                {x.historico}
                <br />
                <span className="text-muted-foreground">{x.documento}</span>
              </td>
              <td>
                {x.cc} - {x.centroCusto}
              </td>
              <td className="text-right">{brl.format(x.valor)}</td>
              <td>{x.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Livro({ tipo }: { tipo: "Razão" | "Diário" | "Lançamentos" }) {
  const { lancamentos } = useBase();
  const [busca, setBusca] = useState("");
  const conta =
    tipo === "Razão" && typeof window !== "undefined"
      ? (new URLSearchParams(location.search).get("conta") ?? "")
      : "";
  const q = busca.toLowerCase();
  const linhas = lancamentos
    .filter(
      (x) =>
        (!conta || x.debitoCodigo === conta || x.creditoCodigo === conta) &&
        (!q || JSON.stringify(x).toLowerCase().includes(q)),
    )
    .sort((a, b) => a.data.localeCompare(b.data));
  return (
    <div className="grid gap-5">
      <Header
        titulo={`${tipo} contábil - Nitaplast 08/2026`}
        descricao="Mesma base contábil utilizada pelo Balancete e pela DRE detalhada."
      />
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4" />
            <Input
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conta, documento, histórico ou centro de custo"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabela linhas={linhas} />
        </CardContent>
      </Card>
    </div>
  );
}
export const RazaoAgostoCompleto = () => <Livro tipo="Razão" />;
export const DiarioAgostoCompleto = () => <Livro tipo="Diário" />;
export const LancamentosAgostoCompleto = () => <Livro tipo="Lançamentos" />;

export function DreAgostoCompleta() {
  const { lancamentos } = useBase();
  const grupos = useMemo(() => {
    const m = new Map<string, { descricao: string; valor: number; tipo: "R" | "D" }>();
    for (const l of lancamentos) {
      for (const [conta, sinal] of [
        [l.creditoCodigo, 1],
        [l.debitoCodigo, -1],
      ] as const) {
        const i = info.get(conta);
        if (i?.grupo === "Receitas acumuladas") {
          const a = m.get(conta) ?? { descricao: i.descricao, valor: 0, tipo: "R" };
          a.valor += sinal * l.valor;
          m.set(conta, a);
        }
        if (i?.grupo === "Custos e despesas acumulados") {
          const a = m.get(conta) ?? { descricao: i.descricao, valor: 0, tipo: "D" };
          a.valor -= sinal * l.valor;
          m.set(conta, a);
        }
      }
    }
    return [...m].filter(([, x]) => Math.abs(x.valor) > 0.004);
  }, [lancamentos]);
  const receitas = arred(
    grupos.filter(([, x]) => x.tipo === "R").reduce((s, [, x]) => s + x.valor, 0),
  );
  const despesas = arred(
    grupos.filter(([, x]) => x.tipo === "D").reduce((s, [, x]) => s + x.valor, 0),
  );
  return (
    <div className="grid gap-5">
      <Header
        titulo="DRE detalhada - Nitaplast 08/2026"
        descricao="DRE derivada do movimento analítico do mesmo Razão que forma o Balancete."
      />
      <Card>
        <CardContent className="pt-5">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b font-semibold">
                <td className="p-2">RECEITAS</td>
                <td className="text-right">{brl.format(receitas)}</td>
              </tr>
              {grupos
                .filter(([, x]) => x.tipo === "R")
                .map(([c, x]) => (
                  <tr key={c} className="border-b">
                    <td className="p-2 pl-6">
                      {c} - {x.descricao}
                    </td>
                    <td className="text-right">{brl.format(x.valor)}</td>
                  </tr>
                ))}
              <tr className="border-b font-semibold">
                <td className="p-2">CUSTOS E DESPESAS</td>
                <td className="text-right">{brl.format(despesas)}</td>
              </tr>
              {grupos
                .filter(([, x]) => x.tipo === "D")
                .map(([c, x]) => (
                  <tr key={c} className="border-b">
                    <td className="p-2 pl-6">
                      {c} - {x.descricao}
                    </td>
                    <td className="text-right">{brl.format(x.valor)}</td>
                  </tr>
                ))}
              <tr className="text-base font-bold">
                <td className="p-3">RESULTADO PARCIAL</td>
                <td className="text-right">{brl.format(receitas - despesas)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

const contasDeducoesAgosto = new Set([
  "25943",
  "2826",
  "2827",
  "2829",
  "2830",
  "2832",
  "25054",
  "25055",
]);
const contasReceitasFinanceirasAgosto = new Set([
  "4927",
  "25095",
  "25096",
  "25097",
  "25098",
  "25099",
  "25100",
  "25101",
]);

// Compartilhado entre o DRE e o Resumo do Balancete: os dois precisam do mesmo
// resultado do mês de agosto, calculado uma única vez a partir do Razão.
function calcularResultadoAgosto(lancamentos: ReturnType<typeof useBase>["lancamentos"]) {
  const mov = (conta: string) =>
    arred(
      lancamentos.reduce(
        (s, l) =>
          s + (l.debitoCodigo === conta ? l.valor : 0) - (l.creditoCodigo === conta ? l.valor : 0),
        0,
      ),
    );
  const credito = (conta: string) => arred(-mov(conta));
  const contasResultado = [
    ...new Set(lancamentos.flatMap((l) => [l.debitoCodigo, l.creditoCodigo])),
  ].filter((c) => info.get(c)?.grupo === "Custos e despesas acumulados");
  const custos = contasResultado.filter(
    (c) =>
      (info.get(c)?.classificacao ?? "").startsWith("5.1") ||
      ["25944", "25945", "3093"].includes(c),
  );
  const financeiras = contasResultado.filter((c) =>
    (info.get(c)?.classificacao ?? "").startsWith("5.8"),
  );
  const operacionais = contasResultado.filter(
    (c) =>
      !custos.includes(c) &&
      !financeiras.includes(c) &&
      !contasDeducoesAgosto.has(c) &&
      !contasReceitasFinanceirasAgosto.has(c) &&
      !["4736", "4760"].includes(c),
  );
  const soma = (contas: string[]) => arred(contas.reduce((s, c) => s + mov(c), 0));
  const receitaProducao = credito("2606"),
    receitaRevenda = credito("2655"),
    receitaBruta = arred(receitaProducao + receitaRevenda);
  const deducoes = arred([...contasDeducoesAgosto].reduce((s, c) => s + Math.max(0, mov(c)), 0));
  const receitaLiquida = arred(receitaBruta - deducoes),
    cpv = soma(custos),
    despesas = soma(operacionais),
    despesasFinanceiras = soma(financeiras);
  const receitasFinanceiras = arred(
    [...contasReceitasFinanceirasAgosto].reduce((s, c) => s + Math.max(0, credito(c)), 0),
  );
  const lucroBruto = arred(receitaLiquida - cpv),
    resultadoOperacional = arred(lucroBruto - despesas - despesasFinanceiras + receitasFinanceiras);
  const naoOperacional = arred(Math.max(0, credito("4736")) - Math.max(0, mov("4760"))),
    resultado = arred(resultadoOperacional + naoOperacional);
  return {
    mov, credito, custos, operacionais, financeiras,
    receitaProducao, receitaRevenda, receitaBruta, deducoes, receitaLiquida,
    cpv, despesas, despesasFinanceiras, receitasFinanceiras,
    lucroBruto, resultadoOperacional, naoOperacional, resultado,
  };
}

// Mesmo conceito das categorias de despesas operacionais já usadas em julho e no
// DRE Report (categoriasDespesas de relatorios.dre.tsx): algumas contas saem por
// natureza (industrialização, depreciação, veículos, comércio exterior), o resto
// é agrupado pelo centro de custo real do lançamento de agosto.
const ccAdministrativasAgosto = new Set(["301", "302", "303", "304", "305", "306"]);
const ccComerciaisAgosto = new Set(["201", "203", "204", "205", "210"]);
const ccProducaoAgosto = new Set(["101", "102", "103", "104", "106", "107", "108", "110", "111", "10014", "10032", "19999"]);
const ccFilialAgosto = new Set(["501", "502", "503", "504", "505"]);
type ItemDespesaAgosto = { conta: string; descricao: string; classificacao: string; valor: number };
const categoriasDespesasAgostoDefs: [string, string][] = [
  ["industrializacao", "Despesas com Industrialização"],
  ["depreciacao", "Despesas com Imobilizado"],
  ["veiculos", "Despesas com Veículos"],
  ["comex", "Despesas com Comércio Exterior"],
  ["administrativas", "Despesas Administrativas"],
  ["comerciais", "Despesas Comerciais"],
  ["producao", "Despesas Produção"],
  ["filial", "Despesas Comercial SP"],
  ["outras", "Outras despesas operacionais sem classificação gerencial"],
];
function categorizarDespesasAgosto(lancamentos: ReturnType<typeof useBase>["lancamentos"], operacionais: string[]) {
  const operacionaisSet = new Set(operacionais);
  const porCategoria = new Map<string, Map<string, ItemDespesaAgosto>>();
  const somar = (categoria: string, conta: string, delta: number) => {
    const contas = porCategoria.get(categoria) ?? new Map<string, ItemDespesaAgosto>();
    const atual = contas.get(conta) ?? { conta, descricao: info.get(conta)?.descricao ?? "Conta não encontrada no plano", classificacao: info.get(conta)?.classificacao ?? "9.9.99", valor: 0 };
    atual.valor = arred(atual.valor + delta);
    contas.set(conta, atual);
    porCategoria.set(categoria, contas);
  };
  const categoriaDaConta = (conta: string, cc: string): string => {
    const classificacao = info.get(conta)?.classificacao ?? "";
    if (conta === "25937") return "industrializacao";
    if (classificacao.startsWith("5.7.01.011")) return "depreciacao";
    if (classificacao.startsWith("5.7.01.015") || classificacao.startsWith("5.7.05")) return "veiculos";
    if (conta === "25070") return "comex";
    if (ccFilialAgosto.has(cc)) return "filial";
    if (ccAdministrativasAgosto.has(cc)) return "administrativas";
    if (ccComerciaisAgosto.has(cc)) return "comerciais";
    if (ccProducaoAgosto.has(cc)) return "producao";
    return "outras";
  };
  for (const l of lancamentos) {
    if (operacionaisSet.has(l.debitoCodigo)) somar(categoriaDaConta(l.debitoCodigo, l.cc), l.debitoCodigo, l.valor);
    if (operacionaisSet.has(l.creditoCodigo)) somar(categoriaDaConta(l.creditoCodigo, l.cc), l.creditoCodigo, -l.valor);
  }
  const total = (categoria: string) => arred([...(porCategoria.get(categoria)?.values() ?? [])].reduce((s, x) => s + x.valor, 0));
  const itens = (categoria: string) => [...(porCategoria.get(categoria)?.values() ?? [])].filter((x) => Math.abs(x.valor) > 0.004);
  return { total, itens };
}

export function DreAgostoPadrao() {
  const { lancamentos } = useBase();
  const [abertas, setAbertas] = useState(
    new Set(["receita", "deducoes", "custos", "despesas", "financeiro"]),
  );
  const {
    mov, credito, custos, operacionais, financeiras,
    receitaProducao, receitaRevenda, receitaBruta, deducoes, receitaLiquida,
    cpv, despesas, despesasFinanceiras, receitasFinanceiras,
    lucroBruto, resultadoOperacional, naoOperacional, resultado,
  } = calcularResultadoAgosto(lancamentos);
  const impactoCustoPorEstabelecimento = (estabelecimento: "Matriz" | "Filial SP") =>
    arred(
      lancamentos.reduce((total, lancamento) => {
        if (estabelecimentoLancamentoNitaplast(lancamento) !== estabelecimento) return total;
        return (
          total +
          (custos.includes(lancamento.debitoCodigo) ? lancamento.valor : 0) -
          (custos.includes(lancamento.creditoCodigo) ? lancamento.valor : 0)
        );
      }, 0),
    );
  const cpvMatriz = impactoCustoPorEstabelecimento("Matriz");
  const cpvFilial = impactoCustoPorEstabelecimento("Filial SP");
  const contasEstoqueMatriz = ["25133", "25134", "25135", "25136", "25137"];
  const estoqueInicialMatriz = arred(
    contasEstoqueMatriz.reduce(
      (total, conta) => total + (saldoAberturaAgostoPorConta.get(conta) ?? 0),
      0,
    ),
  );
  const cpvBaseEstoque = arred(
    estoqueInicialMatriz +
      resumoCpvDepreciacaoAgosto.comprasBrutasCpv -
      estoqueFinalMatrizAgostoTotal,
  );
  const demaisCustosDocumentados = arred(cpvMatriz - cpvBaseEstoque);
  const memoriaCpvAgosto: [string, number][] = [
    ["Estoque inicial — Matriz", estoqueInicialMatriz],
    ["(+) Compras documentadas que compõem o custo", resumoCpvDepreciacaoAgosto.comprasBrutasCpv],
    ["(-) Estoque final — Matriz", -estoqueFinalMatrizAgostoTotal],
    ["(+) Demais movimentos documentados de custo no Razão", demaisCustosDocumentados],
    ["(=) CPV Matriz", cpvMatriz],
    ["(=) CPV Filial SP", cpvFilial],
    ["(=) CPV / CMV Total", cpv],
  ];
  type Linha = { id: string; descricao: string; valor: number; nivel: 0 | 1 | 2; pai?: string };
  const detalhes = (prefixo: string, pai: string, contas: string[]): Linha[] =>
    contas
      .filter((c) => Math.abs(mov(c)) > 0.004)
      .map((c) => ({
        id: `${prefixo}-${c}`,
        descricao: `${c} - ${info.get(c)?.descricao ?? "Conta não encontrada no plano"}`,
        valor: Math.abs(mov(c)),
        nivel: 1,
        pai,
      }));
  const categoriasDespesas = categorizarDespesasAgosto(lancamentos, operacionais);
  const totalCategorizado = arred(categoriasDespesasAgostoDefs.reduce((s, [id]) => s + categoriasDespesas.total(id), 0));
  if (Math.abs(totalCategorizado - despesas) > 0.01) {
    throw new Error(`Categorização das despesas operacionais de agosto não fecha com o Razão: ${totalCategorizado.toFixed(2)} / ${despesas.toFixed(2)}.`);
  }
  const linhasCategoriasDespesas: Linha[] = categoriasDespesasAgostoDefs.flatMap(([id, descricao]) => {
    const valorCategoria = categoriasDespesas.total(id);
    if (Math.abs(valorCategoria) < 0.005) return [];
    return [
      { id: `desp-cat-${id}`, descricao, valor: valorCategoria, nivel: 1 as const, pai: "despesas" },
      ...categoriasDespesas.itens(id).map((item) => ({
        id: `desp-cat-${id}-${item.conta}`,
        descricao: `${item.conta} - ${item.descricao}`,
        valor: item.valor,
        nivel: 2 as const,
        pai: `desp-cat-${id}`,
      })),
    ];
  });
  const linhas: Linha[] = [
    { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: receitaBruta, nivel: 0 },
    {
      id: "receita-prod",
      descricao: "Receita Venda Produção",
      valor: receitaProducao,
      nivel: 1,
      pai: "receita",
    },
    {
      id: "receita-rev",
      descricao: "Receita Revenda",
      valor: receitaRevenda,
      nivel: 1,
      pai: "receita",
    },
    { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: deducoes, nivel: 0 },
    ...detalhes("ded", "deducoes", [...contasDeducoesAgosto]),
    {
      id: "receita-liquida",
      descricao: "(=) Receita Operacional Líquida",
      valor: receitaLiquida,
      nivel: 0,
    },
    { id: "custos", descricao: "(-) CPV / CMV", valor: cpv, nivel: 0 },
    ...detalhes("cpv", "custos", custos),
    { id: "lucro-bruto", descricao: "(=) Lucro Bruto", valor: lucroBruto, nivel: 0 },
    { id: "despesas", descricao: "(-) Despesas Operacionais", valor: despesas, nivel: 0 },
    ...linhasCategoriasDespesas,
    {
      id: "financeiro",
      descricao: "Resultado Financeiro",
      valor: arred(receitasFinanceiras - despesasFinanceiras),
      nivel: 0,
    },
    {
      id: "fin-d",
      descricao: "Despesas Financeiras",
      valor: despesasFinanceiras,
      nivel: 1,
      pai: "financeiro",
    },
    {
      id: "fin-r",
      descricao: "(-) Receitas Financeiras",
      valor: receitasFinanceiras,
      nivel: 1,
      pai: "financeiro",
    },
    {
      id: "operacional",
      descricao: "(=) Resultado Operacional",
      valor: resultadoOperacional,
      nivel: 0,
    },
    {
      id: "nao-operacional",
      descricao: "Resultado não operacional",
      valor: naoOperacional,
      nivel: 0,
    },
    { id: "resultado", descricao: "(=) Lucro / Prejuízo Líquido", valor: resultado, nivel: 0 },
  ];
  const pais = new Set([
    "receita", "deducoes", "custos", "despesas", "financeiro",
    ...categoriasDespesasAgostoDefs.map(([id]) => `desp-cat-${id}`),
  ]);
  const paiPorId = new Map(linhas.map((l) => [l.id, l.pai]));
  function linhaVisivel(l: Linha) {
    let pai = l.pai;
    while (pai) {
      if (!abertas.has(pai)) return false;
      pai = paiPorId.get(pai);
    }
    return true;
  }
  const alternar = (id: string) =>
    setAbertas((a) => {
      const n = new Set(a);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  return (
    <div className="grid gap-5">
      <Header
        titulo="DRE calculada - Nitaplast 08/2026"
        descricao="Razão → Balancete → DRE · Matriz e Filial SP sempre identificadas."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Receita Operacional Bruta" valor={receitaBruta} />
        <Metric label="CPV Matriz" valor={cpvMatriz} />
        <Metric label="CPV Filial SP" valor={cpvFilial} />
        <Metric label="Resultado não operacional" valor={naoOperacional} />
        <Metric label="Lucro / Prejuízo líquido" valor={resultado} />
      </div>
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 size-5 text-blue-700" />
            <div>
              <p className="font-semibold">Regra única aplicada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Documentos e evidências → lançamentos → Razão → Balancete → DRE. Centro de custo e
                estabelecimento abrem a gestão; não criam fato contábil.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="composicao" className="grid gap-3">
        <TabsList className="w-fit">
          <TabsTrigger value="composicao">Composição da DRE</TabsTrigger>
          <TabsTrigger value="analise">Análise vertical e horizontal</TabsTrigger>
        </TabsList>
        <TabsContent value="composicao">
          <div className="grid gap-5">
            <Card className="border-amber-500/40 bg-amber-50/40">
              <CardHeader>
                <CardTitle className="text-base">
                  Memória temporária IRPJ/CSLL — composição do CPV
                </CardTitle>
                <CardDescription>
                  Relatório explicativo para conferência. Não cria lançamento e não altera o
                  resultado contábil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {memoriaCpvAgosto.map(([descricao, valor], index) => (
                        <tr
                          key={descricao}
                          className={`border-b last:border-0 ${index === memoriaCpvAgosto.length - 1 ? "font-bold" : ""}`}
                        >
                          <td className="py-2">{descricao}</td>
                          <td className="py-2 text-right tabular-nums">{brl.format(valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Fórmula: estoque inicial + compras − estoque final + demais custos documentados. O
                  saldo final permanece no estoque patrimonial. A composição da Filial é exibida
                  somente pelos movimentos efetivamente presentes no Razão.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Demonstração do Resultado do Exercício — 08/2026
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="p-2 text-left">Descrição</th>
                      <th className="p-2 text-right">Valor</th>
                      <th className="p-2 text-right">% Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas
                      .filter(linhaVisivel)
                      .map((l) => (
                        <tr
                          key={l.id}
                          className={`border-b ${l.nivel === 0 ? "font-semibold" : ""}`}
                        >
                          <td className={`p-2 ${l.nivel === 1 ? "pl-10" : l.nivel === 2 ? "pl-16 text-muted-foreground" : ""}`}>
                            {pais.has(l.id) ? (
                              <button className="mr-2 inline-flex" onClick={() => alternar(l.id)}>
                                {abertas.has(l.id) ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </button>
                            ) : null}
                            {l.descricao}
                          </td>
                          <td className="p-2 text-right tabular-nums">{brl.format(l.valor)}</td>
                          <td className="p-2 text-right tabular-nums">
                            {receitaBruta
                              ? `${((l.valor / receitaBruta) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                              : "0,00%"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card className="border-amber-400/50 bg-amber-50/40">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 size-5 text-amber-700" />
                  <div>
                    <p className="font-semibold">Pendências de rastreabilidade</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhum valor é criado ou rateado por aproximação. Greencred permanece em
                      revisão de lançamento; contratos de câmbio sem vínculo definitivo e a
                      composição de estoque da Filial permanecem pendentes de conciliação
                      documental.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analise">
          <AnaliseVerticalDre
            agosto={{
              receitaBruta,
              deducoes,
              receitaLiquida,
              cpv,
              lucroBruto,
              despesas,
              resultadoFinanceiro: arred(receitasFinanceiras - despesasFinanceiras),
              resultadoOperacional,
              naoOperacional,
              resultado,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
