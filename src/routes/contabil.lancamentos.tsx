import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  gerarCsvLoteContabilJunho,
  loteContabilJunho,
  resumoLoteContabilJunho,
} from "@/data/nitaplast-lote-final-junho";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/lancamentos")({ component: Lancamentos });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function baixarCsv() {
  const conteudo = gerarCsvLoteContabilJunho();
  const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Nitaplast_062026_Lancamentos_CC.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Lancamentos() {
  useNitaplastJunho();
  const [busca, setBusca] = useState("");
  const [somentePendentes, setSomentePendentes] = useState(false);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return loteContabilJunho.filter((linha) => {
      if (somentePendentes && linha.status !== "pendente") return false;
      if (!q) return true;
      return [linha.seq, linha.data, linha.debito, linha.credito, linha.ccDebito, linha.ccCredito, linha.documento, linha.historico, linha.lancamentoId, linha.origem]
        .join(" ").toLocaleLowerCase("pt-BR").includes(q);
    });
  }, [busca, somentePendentes]);

  return (
    <PageShell>
      <PageHeader
        titulo="Lançamentos finais — Nitaplast"
        descricao="Cada partida do Razão é transformada no layout contábil de importação. Competência 06/2026."
        acoes={
          <Button size="sm" className="gap-2" onClick={baixarCsv} disabled={!resumoLoteContabilJunho.podeFinalizar}>
            <Download className="size-4" /> Gerar CSV final
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Partidas do Razão" value={resumoLoteContabilJunho.totalPartidas} />
        <Metric label="Prontas para importar" value={resumoLoteContabilJunho.prontas} />
        <Metric label="Pendentes" value={resumoLoteContabilJunho.pendentes} warning={resumoLoteContabilJunho.pendentes > 0} />
        <Metric label="Valor das partidas" value={resumoLoteContabilJunho.valorTotal} money />
        <Metric label="Valor pendente" value={resumoLoteContabilJunho.valorPendente} money warning={resumoLoteContabilJunho.valorPendente > 0} />
      </div>

      {resumoLoteContabilJunho.podeFinalizar ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="pt-5 text-sm"><strong>Lote apto para finalização.</strong> Todas as partidas possuem contas válidas, histórico, valor e status de validação.</CardContent></Card>
      ) : (
        <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex gap-3 pt-5 text-sm"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><strong>Finalização bloqueada.</strong> Resolva as partidas pendentes abaixo. O sistema não gera o CSV final enquanto existir lançamento sem conta válida, em revisão ou sem lastro suficiente.</div></CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button size="sm" variant={!somentePendentes ? "default" : "outline"} onClick={() => setSomentePendentes(false)}>Todos</Button>
              <Button size="sm" variant={somentePendentes ? "default" : "outline"} onClick={() => setSomentePendentes(true)}>Pendentes</Button>
            </div>
            <div className="relative w-full sm:w-96"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conta, documento ou histórico" className="pl-9" /></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">SEQ</th><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">CC Débito</th><th className="p-2">Crédito</th><th className="p-2">CC Crédito</th><th className="p-2">N. Docto</th><th className="p-2 text-right">Valor</th><th className="p-2">Histórico</th><th className="p-2">Origem Razão</th><th className="p-2">Status</th>
              </tr></thead>
              <tbody>{linhas.map((linha) => <tr key={linha.lancamentoId} className="border-b last:border-0">
                <td className="p-2 font-mono">{linha.seq}</td><td className="p-2">{linha.data}</td><td className="p-2 font-mono">{linha.debito}</td><td className="p-2 font-mono">{linha.ccDebito || "—"}</td><td className="p-2 font-mono">{linha.credito}</td><td className="p-2 font-mono">{linha.ccCredito || "—"}</td><td className="p-2 font-mono text-xs">{linha.documento || "—"}</td><td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td><td className="max-w-[420px] p-2">{linha.historico}</td><td className="p-2"><div className="font-mono text-xs">{linha.lancamentoId}</div><div className="text-[11px] text-muted-foreground">{linha.origem}</div></td><td className="p-2">{linha.status === "pronto" ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Pronto</Badge> : <div><Badge variant="outline" className="border-amber-400 text-amber-800">Pendente</Badge><div className="mt-1 max-w-[300px] text-[11px] text-amber-800">{linha.pendencias.join(" · ")}</div></div>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, money = false, warning = false }: { label: string; value: number; money?: boolean; warning?: boolean }) {
  const display = money ? brl.format(value) : String(value);
  return <Card className={warning ? "border-amber-500/40" : ""}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-amber-700" : ""}`}>{display}</p></CardContent></Card>;
}
