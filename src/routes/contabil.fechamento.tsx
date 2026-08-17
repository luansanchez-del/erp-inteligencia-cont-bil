import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpenText, ChartNoAxesCombined, FileCheck2, ListChecks, Scale, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { gerarCsvLoteContabilJunho, montarLoteContabilJunho } from "@/data/nitaplast-lote-final-junho";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

export const Route = createFileRoute("/contabil/fechamento")({ component: FechamentoPage });

const acessos = [
  { titulo: "Fechamento assistido", descricao: "Cobertura documental e pontos internos de revisão.", to: "/contabil/fechamento-assistido" as const, icon: FileCheck2 },
  { titulo: "Razão", descricao: "Origem contábil de todos os movimentos da competência.", to: "/contabil/razao" as const, icon: BookOpenText },
  { titulo: "Balancete", descricao: "Saldos calculados diretamente a partir do Razão.", to: "/contabil/balancete" as const, icon: Scale },
  { titulo: "DRE Oficial", descricao: "Demonstração oficial calculada pelo mesmo Razão e Balancete.", to: "/relatorios/dre" as const, icon: ChartNoAxesCombined },
  { titulo: "Lançamentos finais", descricao: "Espelho do Razão no layout de importação com centro de custo.", to: "/contabil/lancamentos" as const, icon: ListChecks },
];

function FechamentoPage() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);
  const lote = useMemo(() => montarLoteContabilJunho(razaoAjustado), [razaoAjustado]);
  const resumo = lote.resumo;
  const podeFinalizar = resumo.podeFinalizar;

  function baixarCsvFinal() {
    const conteudo = gerarCsvLoteContabilJunho(lote.prontas);
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

  return (
    <PageShell>
      <PageHeader
        titulo="Central de Fechamento Contábil"
        descricao="Nitaplast · 06/2026 · Razão → Balancete → DRE Oficial → lote final. O lote usa exatamente o mesmo Razão ajustado das demonstrações."
        acoes={<Button size="sm" onClick={baixarCsvFinal} disabled={!podeFinalizar}>Finalizar e gerar lote</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Partidas do Razão" value={resumo.totalPartidas} />
        <Metric label="Prontas" value={resumo.prontas} />
        <Metric label="Alertas exportáveis" value={resumo.alertas} />
        <Metric label="Bloqueantes" value={resumo.pendentes} warning={!podeFinalizar} />
        <Card className={podeFinalizar ? "border-emerald-500/40" : "border-red-500/40"}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Situação da finalização</p><p className={`mt-1 text-lg font-semibold ${podeFinalizar ? "text-emerald-700" : "text-red-700"}`}>{podeFinalizar ? "Liberada" : "Bloqueada"}</p></CardContent></Card>
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
        <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="pt-6 text-sm"><strong>Competência apta para geração do lote.</strong> Alertas e movimentos na conta 4859 permanecem exportáveis. O CSV final é montado pelo mesmo Razão ajustado que alimenta o Balancete e a DRE Oficial.</CardContent></Card>
      ) : (
        <Card className="border-red-500/40 bg-red-500/5"><CardContent className="flex gap-3 pt-6"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-700" /><div><p className="font-medium">Finalização bloqueada por erro estrutural real</p><p className="mt-1 text-sm text-muted-foreground">Abra “Lançamentos finais” para ver as partidas bloqueantes. Conta transitória 4859 e status de revisão não bloqueiam a exportação.</p></div></CardContent></Card>
      )}
    </PageShell>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <Card className={warning ? "border-red-500/40" : ""}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-semibold tabular-nums ${warning ? "text-red-700" : ""}`}>{value}</p></CardContent></Card>;
}
