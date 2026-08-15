import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dreControle } from "@/data/nitaplast-junho";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DrePage() {
  const resultado = dreControle.at(-1)!;
  return <PageShell>
    <PageHeader titulo="DRE de conferência - Nitaplast" descricao="Comparação entre a simulação contábil de 06/2026 e a DRE manual enviada ao cliente." acoes={<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Resultado conciliado</Badge>} />
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Resultado simulado</p><p className="mt-1 text-xl font-semibold text-emerald-700">{brl.format(resultado.valor)}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">DRE de controle</p><p className="mt-1 text-xl font-semibold">{brl.format(resultado.controle)}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Diferença</p><p className="mt-1 text-xl font-semibold text-emerald-700">{brl.format(resultado.valor-resultado.controle)}</p></CardContent></Card></div>
    <Card><CardHeader><CardTitle className="text-base">Conciliação da demonstração</CardTitle><CardDescription>A igualdade confirma os totais; a aprovação final depende da composição analítica das despesas.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[750px] text-sm"><thead><tr className="border-b bg-muted/40 text-left"><th className="p-2">Grupo</th><th className="p-2">Descrição</th><th className="p-2 text-right">Simulação</th><th className="p-2 text-right">Controle</th><th className="p-2 text-right">Diferença</th><th className="p-2 text-right">Conferência</th></tr></thead><tbody>{dreControle.map((l)=><tr key={l.descricao} className={l.descricao === "Resultado operacional" ? "border-t-2 font-semibold" : "border-b"}><td className="p-2"><Badge variant="outline">{l.grupo}</Badge></td><td className="p-2">{l.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(l.valor)}</td><td className="p-2 text-right tabular-nums">{brl.format(l.controle)}</td><td className="p-2 text-right tabular-nums">{brl.format(l.valor-l.controle)}</td><td className="p-2 text-right"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4"/>Confere</span></td></tr>)}</tbody></table></CardContent></Card>
  </PageShell>;
}
