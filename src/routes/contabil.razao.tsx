import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosJunho, totalCreditos, totalDebitos } from "@/data/nitaplast-junho";
import { movimentosFinanceiros } from "@/data/nitaplast-movimento-financeiro";

export const Route = createFileRoute("/contabil/razao")({ component: RazaoPage });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function RazaoPage() {
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"contabil" | "financeiro">("contabil");
  const dados = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR");
    return lancamentosJunho.filter((l) => [l.id, l.origem, l.debito, l.credito, l.historico].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);
  const pendentes = lancamentosJunho.filter((l) => l.status === "revisar").length;
  const financeiros = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR");
    return movimentosFinanceiros.filter((l) => [l.banco, l.codigo, l.historico, l.classificacao].join(" ").toLocaleLowerCase("pt-BR").includes(q)).slice(0, 200);
  }, [busca]);
  return <PageShell>
    <PageHeader titulo="Razão provisório - Nitaplast" descricao="Movimento reconstruído de 06/2026 antes da importação no Questor." acoes={<Badge variant="outline">Simulação contábil</Badge>} />
    <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total de débitos</p><p className="mt-1 text-lg font-semibold tabular-nums">{brl.format(totalDebitos)}</p></CardContent></Card>
      <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total de créditos</p><p className="mt-1 text-lg font-semibold tabular-nums">{brl.format(totalCreditos)}</p></CardContent></Card>
      <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Partidas pendentes de composição</p><p className="mt-1 text-lg font-semibold text-amber-700">{pendentes}</p></CardContent></Card>
    </div>
    <Card>
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">Razão e evidência financeira</CardTitle><div className="mt-3 flex gap-2"><button className={`rounded-md border px-3 py-1.5 text-xs ${modo === "contabil" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={()=>setModo("contabil")}>Razão contábil</button><button className={`rounded-md border px-3 py-1.5 text-xs ${modo === "financeiro" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={()=>setModo("financeiro")}>Movimento financeiro original</button></div></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conta, banco ou histórico" className="pl-9"/></div></div></CardHeader>
      <CardContent className="overflow-x-auto">{modo === "contabil" ? <table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Lcto.</th><th className="p-2">Data</th><th className="p-2">Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">Status</th></tr></thead><tbody>{dados.map((l)=><tr key={l.id} className="border-b last:border-0"><td className="p-2 font-mono text-xs">{l.id}</td><td className="p-2">{l.data}</td><td className="p-2"><Badge variant="outline">{l.origem}</Badge></td><td className="p-2">{l.debito}</td><td className="p-2">{l.credito}</td><td className="p-2 text-muted-foreground">{l.historico}</td><td className="p-2 text-right tabular-nums">{brl.format(l.valor)}</td><td className="p-2 text-right">{l.status === "validado" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Validado</span> : <span className="inline-flex items-center gap-1 text-amber-700"><TriangleAlert className="size-4"/>Revisar</span>}</td></tr>)}</tbody></table> : <><p className="mb-3 text-xs text-muted-foreground">Exibindo até 200 resultados por busca, de {movimentosFinanceiros.length} movimentos importados.</p><table className="w-full min-w-[1100px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">Banco</th><th className="p-2">Código</th><th className="p-2">Histórico original do sistema</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2">Classificação proposta</th></tr></thead><tbody>{financeiros.map((l)=><tr key={l.id} className="border-b last:border-0"><td className="p-2">{l.data}</td><td className="p-2 text-xs">{l.banco}</td><td className="p-2 font-mono">{l.codigo}</td><td className="p-2">{l.historico}</td><td className="p-2 text-right tabular-nums">{l.tipo === "debito" ? brl.format(l.valor) : "-"}</td><td className="p-2 text-right tabular-nums">{l.tipo === "credito" ? brl.format(l.valor) : "-"}</td><td className="p-2 text-muted-foreground">{l.classificacao}</td></tr>)}</tbody></table></>}</CardContent>
    </Card>
  </PageShell>;
}
