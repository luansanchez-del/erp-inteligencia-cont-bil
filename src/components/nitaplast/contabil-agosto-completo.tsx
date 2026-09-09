import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { estruturaBalanceteNitaplast } from "@/data/nitaplast-balancete-estrutura";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { saldoAberturaAgostoPorConta } from "@/data/nitaplast-saldos-agosto";
import { estabelecimentoLancamentoNitaplast } from "@/data/nitaplast-estabelecimento";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;
const info = new Map(saldosImplantacao.map((x) => [x.conta, x]));
const analiticas = estruturaBalanceteNitaplast.filter((x) => x.tipo === "A");
const contasEstrutura = new Set(analiticas.map((x) => x.conta));

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
function Metric({ label, valor }: { label: string; valor: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{brl.format(valor)}</p>
      </CardContent>
    </Card>
  );
}

function calcular(lancamentos: ReturnType<typeof useBase>["lancamentos"]) {
  const mov = new Map<string, { d: number; c: number; n: number }>();
  for (const l of lancamentos) {
    const d = mov.get(l.debitoCodigo) ?? { d: 0, c: 0, n: 0 };
    d.d += l.valor;
    d.n++;
    mov.set(l.debitoCodigo, d);
    const c = mov.get(l.creditoCodigo) ?? { d: 0, c: 0, n: 0 };
    c.c += l.valor;
    c.n++;
    mov.set(l.creditoCodigo, c);
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
  const estrutura = [...estruturaBalanceteNitaplast, ...extras];
  const valores = new Map(
    [...analiticas, ...extras].map((a) => {
      const m = mov.get(a.conta) ?? { d: 0, c: 0, n: 0 };
      const sa = saldoAberturaAgostoPorConta.get(a.conta) ?? 0;
      return [
        a.conta,
        {
          sa,
          d: arred(m.d),
          c: arred(m.c),
          mov: arred(m.d - m.c),
          sf: arred(sa + m.d - m.c),
          n: m.n,
        },
      ] as const;
    }),
  );
  return estrutura.map((x) => {
    if (x.tipo === "A") return { ...x, ...valores.get(x.conta)! };
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
    };
  });
}

export function BalanceteAgostoCompleto() {
  const { lancamentos } = useBase();
  const linhas = useMemo(() => calcular(lancamentos), [lancamentos]);
  const [busca, setBusca] = useState("");
  const q = busca.toLowerCase();
  const vis = linhas.filter(
    (x) =>
      Math.abs(x.sa) + Math.abs(x.d) + Math.abs(x.c) + Math.abs(x.sf) > 0.004 &&
      (!q || `${x.conta} ${x.classificacao} ${x.descricao}`.toLowerCase().includes(q)),
  );
  const total = arred(lancamentos.reduce((s, x) => s + x.valor, 0));
  return (
    <div className="grid gap-5">
      <Header
        titulo="Balancete consolidado - Nitaplast"
        descricao="Razão → Balancete → DRE. Saldos anteriores de 07/2026 e movimento contábil de 08/2026."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Débitos 08" valor={total} />
        <Metric label="Créditos 08" valor={total} />
        <Metric label="Diferença contábil" valor={0} />
        <Metric
          label="Saldo analítico assinado"
          valor={arred(linhas.filter((x) => x.tipo === "A").reduce((s, x) => s + x.sf, 0))}
        />
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between gap-3">
            <CardTitle>Balancete 08/2026 · {linhas.length} linhas</CardTitle>
            <div className="flex gap-2">
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar conta"
              />
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 size-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="p-2 text-left">Conta</th>
                <th> S/A </th>
                <th className="text-left">Classificação</th>
                <th className="text-left">Descrição</th>
                <th>Saldo anterior</th>
                <th>Débito</th>
                <th>Crédito</th>
                <th>Movimento</th>
                <th>Saldo atual</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {vis.map((x) => (
                <tr
                  key={`${x.tipo}-${x.conta}`}
                  className={`border-b ${x.tipo === "S" ? "bg-muted/30 font-semibold" : ""}`}
                >
                  <td className="p-2 font-mono">{x.conta}</td>
                  <td className="text-center">{x.tipo}</td>
                  <td className="font-mono">{x.classificacao}</td>
                  <td>{x.descricao}</td>
                  {[x.sa, x.d, x.c, x.mov, x.sf].map((v, i) => (
                    <td key={i} className="p-2 text-right tabular-nums">
                      {brl.format(arred(v))}
                    </td>
                  ))}
                  <td>
                    {x.tipo === "A" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/contabil/razao" search={{ conta: x.conta } as never}>
                          Abrir Razão
                        </Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export function DreAgostoPadrao() {
  const { lancamentos } = useBase();
  const [abertas, setAbertas] = useState(
    new Set(["receita", "deducoes", "custos", "despesas", "financeiro"]),
  );
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
  type Linha = { id: string; descricao: string; valor: number; nivel: 0 | 1; pai?: string };
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
    ...detalhes("desp", "despesas", operacionais),
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
  const pais = new Set(["receita", "deducoes", "custos", "despesas", "financeiro"]);
  const alternar = (id: string) =>
    setAbertas((a) => {
      const n = new Set(a);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  return (
    <div className="grid gap-5">
      <Header
        titulo="DRE detalhada - Nitaplast 08/2026"
        descricao="Razão → Balancete → DRE. Mesmo formato contábil da competência anterior."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Receita bruta" valor={receitaBruta} />
        <Metric label="Receita líquida" valor={receitaLiquida} />
        <Metric label="CPV / CMV" valor={cpv} />
        <Metric label="Despesas operacionais" valor={despesas} />
        <Metric label="Resultado" valor={resultado} />
      </div>
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
                .filter((l) => !l.pai || abertas.has(l.pai))
                .map((l) => (
                  <tr key={l.id} className={`border-b ${l.nivel === 0 ? "font-semibold" : ""}`}>
                    <td className={`p-2 ${l.nivel === 1 ? "pl-10" : ""}`}>
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
    </div>
  );
}
