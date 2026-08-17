import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/diario")({ component: DiarioPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function chaveData(data: string) { const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return br ? `${br[3]}-${br[2]}-${br[1]}` : data; }

function DiarioPage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return [...lancamentosIntegrados]
      .sort((a, b) => chaveData(a.data).localeCompare(chaveData(b.data)) || a.id.localeCompare(b.id))
      .filter((linha) => !q || [linha.data, linha.id, linha.debito, linha.credito, linha.historico, linha.documento, linha.origem, linha.fonte].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);

  return <PageShell>
    <PageHeader
      titulo="Diário Contábil — Nitaplast"
      descricao="Espelho cronológico das partidas que alimentam o Razão e o Balancete."
      acoes={<Button asChild size="sm" variant="outline"><Link to="/relatorios/diario">Abrir Diário Report <ExternalLink className="ml-2 size-4" /></Link></Button>}
    />
    <Card><CardContent className="pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm"><strong>{linhas.length}</strong> partidas · competência 06/2026</p><div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar lançamento, conta, fonte ou documento" className="pl-9" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1600px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Data</th><th className="p-2">ID</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2">CC</th><th className="p-2 text-right">Valor</th><th className="p-2">Origem</th><th className="p-2">Rastreio</th><th className="p-2">Status</th></tr></thead><tbody>{linhas.map((linha) => <tr key={linha.id} className="border-b last:border-0"><td className="p-2">{linha.data}</td><td className="p-2 font-mono text-xs">{linha.id}</td><td className="p-2">{linha.debito}</td><td className="p-2">{linha.credito}</td><td className="p-2">{linha.historico}</td><td className="p-2 font-mono text-xs">{linha.documento || "—"}</td><td className="p-2">{linha.cc && linha.cc !== "0" ? `${linha.cc} - ${linha.centroCusto}` : "—"}</td><td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="p-2"><Badge variant="outline">{linha.origem}</Badge></td><td className="p-2 text-xs" title={linha.fonte}>{linha.rastreio}</td><td className="p-2">{linha.status}</td></tr>)}</tbody></table></div>
    </CardContent></Card>
  </PageShell>;
}
