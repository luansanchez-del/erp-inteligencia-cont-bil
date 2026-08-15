import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosIntegrados, totalCreditosIntegrados, totalDebitosIntegrados } from "@/data/nitaplast-razao-integrado";
import { resumoImplantacao, saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;
const grupos = ["Todos", "Ativo", "Passivo e patrimônio líquido", "Receitas acumuladas", "Custos e despesas acumulados", "Contas compensatórias"] as const;

function BalancetePage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<(typeof grupos)[number]>("Todos");
  const [somenteMovimento, setSomenteMovimento] = useState(false);
  const [pagina, setPagina] = useState(1);

  const movimentos = useMemo(() => {
    const mapa = new Map<string, { debitos: number; creditos: number; lancamentos: number }>();
    for (const linha of lancamentosIntegrados) {
      const debito = mapa.get(linha.debitoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      debito.debitos += linha.valor; debito.lancamentos += 1; mapa.set(linha.debitoCodigo, debito);
      const credito = mapa.get(linha.creditoCodigo) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      credito.creditos += linha.valor; credito.lancamentos += 1; mapa.set(linha.creditoCodigo, credito);
    }
    return mapa;
  }, []);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return saldosImplantacao.map((linha) => {
      const movimento = movimentos.get(linha.conta) ?? { debitos: 0, creditos: 0, lancamentos: 0 };
      const anteriorAssinado = linha.natureza === "C" ? -Math.abs(linha.saldo) : Math.abs(linha.saldo);
      const atualAssinado = anteriorAssinado + movimento.debitos - movimento.creditos;
      return { ...linha, ...movimento, anteriorD: anteriorAssinado > 0 ? anteriorAssinado : 0, anteriorC: anteriorAssinado < 0 ? Math.abs(anteriorAssinado) : 0, atualD: atualAssinado > 0 ? atualAssinado : 0, atualC: atualAssinado < 0 ? Math.abs(atualAssinado) : 0, naturezaAtual: atualAssinado < 0 ? "C" : "D" };
    }).filter((linha) => {
      const noGrupo = grupo === "Todos" || linha.grupo === grupo;
      const naBusca = !q || [linha.conta, linha.classificacao, linha.descricao, linha.grupo].join(" ").toLocaleLowerCase("pt-BR").includes(q);
      return noGrupo && naBusca && (!somenteMovimento || linha.lancamentos > 0);
    });
  }, [busca, grupo, movimentos, somenteMovimento]);

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;

  function abrirRazao(conta: string) { window.location.assign(`/contabil/razao?conta=${encodeURIComponent(conta)}`); }

  return <PageShell>
    <PageHeader titulo="Balancete completo - Nitaplast" descricao="Plano completo do balancete, saldo em 31/05, movimento integrado de junho e acesso direto ao Razão." acoes={<Badge variant="outline">Matriz - 06/2026</Badge>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Ativo em 31/05" value={resumoImplantacao.ativo} /><Metric label="Passivo + PL em 31/05" value={resumoImplantacao.passivoPatrimonioLiquido} /><Metric label="Contas analíticas" value={saldosImplantacao.length} /><Metric label="Débitos integrados 06" value={totalDebitosIntegrados} /><Metric label="Créditos integrados 06" value={totalCreditosIntegrados} /></div>
    <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="flex items-start gap-3 pt-6"><CheckCircle2 className="size-5 shrink-0 text-emerald-700" /><div><p className="font-medium">Partidas integradas matematicamente equilibradas</p><p className="text-sm text-muted-foreground">Débitos {brl.format(totalDebitosIntegrados)} - Créditos {brl.format(totalCreditosIntegrados)}. A conta 11 recebe o movimento do Itaú de junho.</p></div></CardContent></Card>
    <Card>
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Estrutura analítica do Balancete</CardTitle><CardDescription>Inclui contas com saldo zero. Clique em Abrir Razão para ver a composição do movimento.</CardDescription></div><div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(1); }} placeholder="Buscar código, classificação ou descrição" className="pl-9" /></div></div><div className="flex flex-wrap gap-2 pt-2">{grupos.map((item) => <button key={item} onClick={() => { setGrupo(item); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${grupo === item ? "bg-primary text-primary-foreground" : "bg-background"}`}>{item}</button>)}<button onClick={() => { setSomenteMovimento((valor) => !valor); setPagina(1); }} className={`rounded-md border px-3 py-1.5 text-xs ${somenteMovimento ? "bg-amber-100 text-amber-900" : "bg-background"}`}>Somente contas com movimento</button></div></CardHeader>
      <CardContent className="overflow-x-auto"><p className="mb-3 text-xs text-muted-foreground">{linhas.length} de {saldosImplantacao.length} contas exibidas.</p><table className="w-full min-w-[1500px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th><th className="p-2 text-right">Anterior D</th><th className="p-2 text-right">Anterior C</th><th className="p-2 text-right">Débitos 06</th><th className="p-2 text-right">Créditos 06</th><th className="p-2 text-right">Atual D</th><th className="p-2 text-right">Atual C</th><th className="p-2 text-center">Lctos.</th><th className="p-2 text-right">Detalhe</th></tr></thead><tbody>{linhas.slice(inicio, fim).map((linha) => <tr key={`${linha.conta}-${linha.classificacao}`} className="border-b last:border-0"><td className="p-2 font-mono">{linha.conta}</td><td className="p-2 font-mono text-xs">{linha.classificacao}</td><td className="p-2">{linha.descricao}</td><td className="p-2 text-xs text-muted-foreground">{linha.grupo}</td><Money value={linha.anteriorD} /><Money value={linha.anteriorC} /><Money value={linha.debitos} highlight /><Money value={linha.creditos} highlight /><Money value={linha.atualD} strong /><Money value={linha.atualC} strong /><td className="p-2 text-center">{linha.lancamentos || "-"}</td><td className="p-2 text-right"><Button variant="outline" size="sm" onClick={() => abrirRazao(linha.conta)}>Abrir Razão</Button></td></tr>)}</tbody></table></CardContent>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">Exibindo {linhas.length ? inicio + 1 : 0}-{Math.min(fim, linhas.length)} de {linhas.length} contas.</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button><span className="text-xs">Página {paginaAtual} de {totalPaginas}</span><Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button></div></CardContent>
    </Card>
  </PageShell>;
}

function Money({ value, strong = false, highlight = false }: { value: number; strong?: boolean; highlight?: boolean }) { return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""} ${highlight && value ? "bg-primary/5" : ""}`}>{value ? brl.format(value) : "-"}</td>; }
function Metric({ label, value }: { label: string; value: number }) { const display = Number.isInteger(value) && value < 10000 ? String(value) : brl.format(value); return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{display}</p></CardContent></Card>; }
