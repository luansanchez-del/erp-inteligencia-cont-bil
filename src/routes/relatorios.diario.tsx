import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/relatorios/diario")({ component: DiarioReportPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function chaveData(data: string) {
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return data;
}

function DiarioReportPage() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return [...lancamentosIntegrados]
      .sort((a, b) => chaveData(a.data).localeCompare(chaveData(b.data)) || a.id.localeCompare(b.id))
      .filter((linha) => !q || [linha.data, linha.id, linha.debito, linha.credito, linha.historico, linha.documento, linha.centroCusto]
        .join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca]);

  const total = linhas.reduce((soma, linha) => soma + linha.valor, 0);

  return (
    <PageShell>
      <PageHeader
        titulo="Diário Report — Nitaplast"
        descricao="Livro Diário da competência 06/2026, gerado pelas mesmas partidas que alimentam Razão e Balancete."
        acoes={<Badge variant="outline">06/2026</Badge>}
      />

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{linhas.length} partidas</p>
              <p className="text-xs text-muted-foreground">Total dos débitos = total dos créditos = {brl.format(total)}</p>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conta, histórico ou documento" className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Data</th><th className="p-2">Lançamento</th><th className="p-2">Conta Débito</th><th className="p-2">Conta Crédito</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2">Centro de Custo</th><th className="p-2 text-right">Valor</th>
              </tr></thead>
              <tbody>{linhas.map((linha) => <tr key={linha.id} className="border-b last:border-0">
                <td className="p-2 whitespace-nowrap">{linha.data}</td>
                <td className="p-2 font-mono text-xs">{linha.id}</td>
                <td className="p-2">{linha.debito}</td>
                <td className="p-2">{linha.credito}</td>
                <td className="p-2">{linha.historico}</td>
                <td className="p-2 font-mono text-xs">{linha.documento || "—"}</td>
                <td className="p-2">{linha.cc && linha.cc !== "0" ? `${linha.cc} - ${linha.centroCusto}` : "—"}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
