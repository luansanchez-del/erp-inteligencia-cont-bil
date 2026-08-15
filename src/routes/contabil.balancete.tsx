import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { balanceteProvisorio, totalCreditos, totalDebitos } from "@/data/nitaplast-junho";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function BalancetePage() {
  const diferenca = totalDebitos - totalCreditos;
  return <PageShell>
    <PageHeader titulo="Balancete provisório - Nitaplast" descricao="Saldo de implantação em 31/05/2026 acrescido do movimento reconstruído de junho." acoes={<Badge variant="outline">Antes do Questor</Badge>} />
    <Card className={Math.abs(diferenca) < 0.01 ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40"}><CardContent className="flex items-start gap-3 pt-6">{Math.abs(diferenca) < 0.01 ? <CheckCircle2 className="size-5 text-emerald-700"/> : <TriangleAlert className="size-5 text-destructive"/>}<div><p className="font-medium">Partidas matematicamente equilibradas</p><p className="text-sm text-muted-foreground">Débitos {brl.format(totalDebitos)} • Créditos {brl.format(totalCreditos)} • Diferença {brl.format(diferenca)}</p></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Saldos e movimento</CardTitle><CardDescription>Visão consolidada provisória; abra o Razão para conferir as partidas analíticas.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b bg-muted/40 text-left"><th className="p-2">Conta</th><th className="p-2">Descrição</th><th className="p-2 text-right">Saldo anterior</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2 text-right">Saldo atual</th><th className="p-2 text-center">N</th></tr></thead><tbody>{balanceteProvisorio.map((l)=><tr key={l.conta} className="border-b last:border-0"><td className="p-2 font-mono">{l.conta}</td><td className="p-2">{l.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(l.anterior)}</td><td className="p-2 text-right tabular-nums">{brl.format(l.debito)}</td><td className="p-2 text-right tabular-nums">{brl.format(l.credito)}</td><td className="p-2 text-right font-medium tabular-nums">{brl.format(l.atual)}</td><td className="p-2 text-center">{l.natureza}</td></tr>)}</tbody></table></CardContent></Card>
    <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex gap-3 pt-6"><TriangleAlert className="size-4 shrink-0 text-amber-700"/><p className="text-sm text-muted-foreground">Equilíbrio matemático não significa fechamento aprovado. Despesas agrupadas ainda precisam ser distribuídas nas contas e centros de custo encontrados no razão anterior.</p></CardContent></Card>
  </PageShell>;
}
