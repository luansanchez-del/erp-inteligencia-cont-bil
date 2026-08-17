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
type FiltroStatus = "todos" | "alerta" | "pendente";

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
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return loteContabilJunho.filter((linha) => {
      if (filtroStatus !== "todos" && linha.status !== filtroStatus) return false;
      if (!q) return true;
      return [linha.seq, linha.data, linha.debito, linha.credito, linha.ccDebito, linha.ccCredito, linha.documento, linha.historico, linha.lancamentoId, linha.origem]
        .join(" ").toLocaleLowerCase("pt-BR").includes(q);
    });
  }, [busca, filtroStatus]);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Partidas do Razão" value={resumoLoteContabilJunho.totalPartidas} />
        <Metric label="Prontas" value={resumoLoteContabilJunho.prontas} />
        <Metric label="Alertas exportáveis" value={resumoLoteContabilJunho.alertas} warning={resumoLoteContabilJunho.alertas > 0} />
        <Metric label="Pendências bloqueantes" value={resumoLoteContabilJunho.pendentes} danger={resumoLoteContabilJunho.pendentes > 0} />
        <Metric label="Valor das partidas" value={resumoLoteContabilJunho.valorTotal} money />
        <Metric label="Valor bloqueado" value={resumoLoteContabilJunho.valorPendente} money danger={resumoLoteContabilJunho.valorPendente > 0} />
      </div>

      {resumoLoteContabilJunho.podeFinalizar ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="pt-5 text-sm">
            <strong>Lote apto para exportação.</strong> Alertas, inclusive movimentos na conta transitória 4859, serão exportados normalmente e permanecem identificados para reclassificação posterior.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="flex gap-3 pt-5 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" />
            <div><strong>Exportação bloqueada.</strong> Existem erros estruturais reais: conta inexistente, dado obrigatório inválido ou conta de resultado sem destino na DRE. Alertas de revisão e uso da 4859 não bloqueiam.</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button size="sm" variant={filtroStatus === "todos" ? "default" : "outline"} onClick={() => setFiltroStatus("todos")}>Todos</Button>
              <Button size="sm" variant={filtroStatus === "alerta" ? "default" : "outline"} onClick={() => setFiltroStatus("alerta")}>Alertas</Button>
              <Button size="sm" variant={filtroStatus === "pendente" ? "default" : "outline"} onClick={() => setFiltroStatus("pendente")}>Bloqueantes</Button>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conta, documento ou histórico" className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">SEQ</th><th className="p-2">Data</th><th className="p-2">Débito</th><th className="p-2">CC Débito</th><th className="p-2">Crédito</th><th className="p-2">CC Crédito</th><th className="p-2">N. Docto</th><th className="p-2 text-right">Valor</th><th className="p-2">Histórico</th><th className="p-2">Origem Razão</th><th className="p-2">Status</th>
              </tr></thead>
              <tbody>{linhas.map((linha) => <tr key={linha.lancamentoId} className="border-b last:border-0">
                <td className="p-2 font-mono">{linha.seq}</td>
                <td className="p-2">{linha.data}</td>
                <td className="p-2 font-mono">{linha.debito}</td>
                <td className="p-2 font-mono">{linha.ccDebito || "—"}</td>
                <td className="p-2 font-mono">{linha.credito}</td>
                <td className="p-2 font-mono">{linha.ccCredito || "—"}</td>
                <td className="p-2 font-mono text-xs">{linha.documento || "—"}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
                <td className="max-w-[420px] p-2">{linha.historico}</td>
                <td className="p-2"><div className="font-mono text-xs">{linha.lancamentoId}</div><div className="text-[11px] text-muted-foreground">{linha.origem}</div></td>
                <td className="p-2">
                  {linha.status === "pronto" ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Pronto</Badge>
                  ) : linha.status === "alerta" ? (
                    <div><Badge variant="outline" className="border-amber-400 text-amber-800">Alerta · exportável</Badge><div className="mt-1 max-w-[300px] text-[11px] text-amber-800">{linha.alertas.join(" · ")}</div></div>
                  ) : (
                    <div><Badge variant="outline" className="border-red-400 text-red-800">Bloqueante</Badge><div className="mt-1 max-w-[300px] text-[11px] text-red-800">{linha.pendencias.join(" · ")}</div></div>
                  )}
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, money = false, warning = false, danger = false }: { label: string; value: number; money?: boolean; warning?: boolean; danger?: boolean }) {
  const display = money ? brl.format(value) : String(value);
  const border = danger ? "border-red-500/40" : warning ? "border-amber-500/40" : "";
  const text = danger ? "text-red-700" : warning ? "text-amber-700" : "";
  return <Card className={border}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${text}`}>{display}</p></CardContent></Card>;
}
