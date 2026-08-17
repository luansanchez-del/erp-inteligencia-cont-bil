import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpenText, ChartNoAxesCombined, FileCheck2, ListChecks, Scale, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  gerarCsvLoteContabilJunho,
  resumoLoteContabilJunho,
} from "@/data/nitaplast-lote-final-junho";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/fechamento")({ component: FechamentoPage });

const acessos = [
  { titulo: "Fechamento assistido", descricao: "Cobertura documental e pontos internos de revisão.", to: "/contabil/fechamento-assistido" as const, icon: FileCheck2 },
  { titulo: "Razão", descricao: "Origem contábil de todos os movimentos da competência.", to: "/contabil/razao" as const, icon: BookOpenText },
  { titulo: "Balancete", descricao: "Saldos calculados diretamente a partir do Razão.", to: "/contabil/balancete" as const, icon: Scale },
  { titulo: "DRE de Validação", descricao: "Compara o fechamento calculado com a DRE manual enviada.", to: "/contabil/dre" as const, icon: ChartNoAxesCombined },
  { titulo: "Lançamentos finais", descricao: "Mapeamento Razão → layout de importação com centro de custo.", to: "/contabil/lancamentos" as const, icon: ListChecks },
];

function baixarCsvFinal() {
  const conteudo = gerarCsvLoteContabilJunho();
  const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Nitaplast_062026_Lancamentos_CC_FINAL.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function FechamentoPage() {
  useNitaplastJunho();
  const podeFinalizar = resumoLoteContabilJunho.podeFinalizar;

  return (
    <PageShell>
      <PageHeader
        titulo="Central de Fechamento Contábil"
        descricao="Empresa selecionada: Nitaplast · competência 06/2026. Fluxo obrigatório: Razão → Balancete → DRE/Reports → lote final."
        acoes={<Button size="sm" onClick={baixarCsvFinal} disabled={!podeFinalizar}>Finalizar e gerar lote</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Partidas do Razão" value={resumoLoteContabilJunho.totalPartidas} />
        <Metric label="Mapeadas para importação" value={resumoLoteContabilJunho.prontas} />
        <Metric label="Pendentes de mapeamento" value={resumoLoteContabilJunho.pendentes} warning={!podeFinalizar} />
        <Card className={podeFinalizar ? "border-emerald-500/40" : "border-amber-500/40"}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Situação da finalização</p><p className={`mt-1 text-lg font-semibold ${podeFinalizar ? "text-emerald-700" : "text-amber-700"}`}>{podeFinalizar ? "Liberada" : "Bloqueada"}</p></CardContent></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {acessos.map((item) => (
          <Card key={item.to} className="transition-colors hover:border-primary/40">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><item.icon className="size-5" /></span>
                <div><CardTitle className="text-base">{item.titulo}</CardTitle><CardDescription className="mt-1">{item.descricao}</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent><Button asChild variant="outline" className="w-full"><Link to={item.to}>Abrir</Link></Button></CardContent>
          </Card>
        ))}
      </div>

      {podeFinalizar ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="pt-6 text-sm"><strong>Competência apta para geração do lote.</strong> O CSV final seguirá o layout SEQ, DATA, DÉBITO, CC DÉBITO, CRÉDITO, CC CRÉDITO, N. DOCTO, VALOR e HISTÓRICO.</CardContent></Card>
      ) : (
        <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex gap-3 pt-6"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="font-medium">Finalização bloqueada por partidas sem mapeamento completo</p><p className="mt-1 text-sm text-muted-foreground">Não é um alerta para o cliente. É uma trava interna do fechamento. Abra “Lançamentos finais” para ver exatamente quais partidas ainda não conseguem virar uma linha válida de importação.</p></div></CardContent></Card>
      )}
    </PageShell>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <Card className={warning ? "border-amber-500/40" : ""}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-amber-700" : ""}`}>{value}</p></CardContent></Card>;
}
