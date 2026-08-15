import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosJunho, totalCreditos, totalDebitos } from "@/data/nitaplast-junho";
import { resumoImplantacao, saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
const grupos = ["Todos", "Ativo", "Passivo e patrimônio líquido", "Receitas acumuladas", "Custos e despesas acumulados", "Contas compensatórias"] as const;

function codigoInicial(texto: string) {
  return texto.match(/^\s*(\d+)\s+-/)?.[1] ?? null;
}

function BalancetePage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<(typeof grupos)[number]>("Todos");
  const [somenteMovimento, setSomenteMovimento] = useState(false);
  const [pagina, setPagina] = useState(1);

  const movimentosPorConta = useMemo(() => {
    const mapa = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();
    for (const linha of lancamentosJunho) {
      const debito = codigoInicial(linha.debito);
      const credito = codigoInicial(linha.credito);
      if (debito) {
        const atual = mapa.get(debito) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
        atual.debitos += linha.valor;
        atual.lancamentos += 1;
        mapa.set(debito, atual);
      }
      if (credito) {
        const atual = mapa.get(credito) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
        atual.creditos += linha.valor;
        atual.lancamentos += 1;
        mapa.set(credito, atual);
      }
    }
    return mapa;
  }, []);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return saldosImplantacao
      .map((linha) => {
        const movimento = movimentosPorConta.get(linha.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
        const saldoAnteriorAssinado = linha.natureza === "D" ? Math.abs(linha.saldo) : -Math.abs(linha.saldo);
        const saldoAtualAssinado = saldoAnteriorAssinado + movimento.debitos - movimento.creditos;
        return {
          ...linha,
          ...movimento,
          saldoAnteriorDebito: saldoAnteriorAssinado >= 0 ? saldoAnteriorAssinado : 0,
          saldoAnteriorCredito: saldoAnteriorAssinado < 0 ? Math.abs(saldoAnteriorAssinado) : 0,
          saldoAtualDebito: saldoAtualAssinado >= 0 ? saldoAtualAssinado : 0,
          saldoAtualCredito: saldoAtualAssinado < 0 ? Math.abs(saldoAtualAssinado) : 0,
          naturezaAtual: saldoAtualAssinado >= 0 ? "D" as const : "C" as const,
        };
      })
      .filter((linha) => {
        const correspondeGrupo = grupo === "Todos" || linha.grupo === grupo;
        const correspondeBusca = !q || [linha.conta, linha.classificacao, linha.descricao, linha.grupo].join(" ").toLocaleLowerCase("pt-BR").includes(q);
        const correspondeMovimento = !somenteMovimento || linha.lancamentos > 0;
        return correspondeGrupo && correspondeBusca && correspondeMovimento;
      });
  }, [busca, grupo, movimentosPorConta, somenteMovimento]);

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;
  const codigosPlano = useMemo(() => new Set(saldosImplantacao.map((linha) => linha.conta)), []);
  const lancamentosSemVinculo = lancamentosJunho.filter((linha) => {
    const debito = codigoInicial(linha.debito);
    const credito = codigoInicial(linha.credito);
    return !debito || !credito || !codigosPlano.has(debito) || !codigosPlano.has(credito);
  });
  const totalSemVinculo = lancamentosSemVinculo.reduce((total, linha) => total + linha.valor, 0);
  const diferenca = totalDebitos - totalCreditos;

  return (
    <PageShell>
      <PageHeader
        titulo="Balancete completo — Nitaplast"
        descricao="Conta a conta: saldo de implantação em 31/05, débitos e créditos de junho e saldo final provisório."
        acoes={<Badge variant="outline">Matriz • 06/2026</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Ativo em 31/05" value={resumoImplantacao.ativo} />
        <Metric label="Passivo + PL em 31/05" value={resumoImplantacao.passivoPatrimonioLiquido} />
        <Metric label="Resultado JAN-MAI" value={resumoImplantacao.receitasAcumuladas - resumoImplantacao.custosDespesasAcumulados} success />
        <Metric label="Débitos de junho" value={totalDebitos} />
        <Metric label="Créditos de junho" value={totalCreditos} />
      </div>

      <Card className={Math.abs(diferenca) < 0.01 ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40"}>
        <CardContent className="flex items-start gap-3 pt-6">
          {Math.abs(diferenca) < 0.01 ? <CheckCircle2 className="size-5 shrink-0 text-emerald-700" /> : <TriangleAlert className="size-5 shrink-0 text-destructive" />}
          <div><p className="font-medium">Partidas de junho matematicamente equilibradas</p><p className="text-sm text-muted-foreground">Débitos {brl.format(totalDebitos)} • Créditos {brl.format(totalCreditos)} • Diferença {brl.format(diferenca)}.</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle className="text-base">Estrutura analítica do Balancete</CardTitle><CardDescription>Os totais sintéticos são formados pelas 338 contas analíticas. Contas sem código vinculado permanecem fora do saldo final até a classificação.</CardDescription></div>
            <div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar código, classificação ou descrição" className="pl-9" /></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {grupos.map((item) => <button key={item} onClick={() => { setGrupo(item); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${grupo === item ? "bg-primary text-primary-foreground" : "bg-background"}`}>{item}</button>)}
            <button onClick={() => { setSomenteMovimento((valor) => !valor); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${somenteMovimento ? "bg-amber-100 text-amber-900" : "bg-background"}`}>Somente contas com movimento</button>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <p className="mb-3 text-xs text-muted-foreground">{linhas.length} de {saldosImplantacao.length} contas exibidas.</p>
          <table className="w-full min-w-[1450px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th>
                <th className="p-2 text-right">Anterior D</th><th className="p-2 text-right">Anterior C</th>
                <th className="p-2 text-right">Débitos 06</th><th className="p-2 text-right">Créditos 06</th>
                <th className="p-2 text-right">Atual D</th><th className="p-2 text-right">Atual C</th><th className="p-2 text-center">Natureza</th><th className="p-2 text-center">Lctos.</th>
              </tr>
            </thead>
            <tbody>
              {linhas.slice(inicio, fim).map((linha) => (
                <tr key={`${linha.conta}-${linha.classificacao}`} className="border-b last:border-0">
                  <td className="p-2 font-mono">{linha.conta}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2">{linha.descricao}</td><td className="p-2 text-xs text-muted-foreground">{linha.grupo}</td>
                  <Money value={linha.saldoAnteriorDebito} /><Money value={linha.saldoAnteriorCredito} /><Money value={linha.debitos} highlight /><Money value={linha.creditos} highlight />
                  <Money value={linha.saldoAtualDebito} strong /><Money value={linha.saldoAtualCredito} strong />
                  <td className="p-2 text-center"><Badge variant="outline">{linha.naturezaAtual}</Badge></td><td className="p-2 text-center">{linha.lancamentos || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>

        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">Exibindo {linhas.length ? inicio + 1 : 0}–{Math.min(fim, linhas.length)} de {linhas.length} contas.</p>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button><span className="text-xs">Página {paginaAtual} de {totalPaginas}</span><Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button></div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 pt-6">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div><p className="font-medium">Movimento ainda fora das contas analíticas</p><p className="mt-1 text-sm text-muted-foreground">{lancamentosSemVinculo.length} partidas, somando {brl.format(totalSemVinculo)}, ainda usam descrições ou contas provisórias sem correspondência completa com os códigos da implantação. Elas estão no Razão para classificação e não foram escondidas.</p></div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Money({ value, strong = false, highlight = false }: { value: number; strong?: boolean; highlight?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""} ${highlight && value ? "bg-primary/5" : ""}`}>{value ? brl.format(value) : "—"}</td>;
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}
