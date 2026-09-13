import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useErp } from "@/context/erp-context";
import { AnaliseHorizontalVerticalAgosto } from "@/components/nitaplast/contabil-agosto-completo";

export const Route = createFileRoute("/relatorios/analise-horizontal-vertical")({
  head: () => ({
    meta: [
      { title: "Análise Horizontal e Vertical — Nitaplast" },
      {
        name: "description",
        content: "Análise vertical e horizontal da DRE, comparando a competência atual com o mês anterior.",
      },
    ],
  }),
  component: AnaliseHorizontalVerticalRoteador,
});

function AnaliseHorizontalVerticalRoteador() {
  const { competencia } = useErp();
  if (competencia.id === "2026-08") {
    return (
      <PageShell>
        <AnaliseHorizontalVerticalAgosto />
      </PageShell>
    );
  }
  return (
    <PageShell>
      <PageHeader
        titulo="Análise Horizontal e Vertical"
        descricao={`Competência ${competencia.label} · esta análise hoje só existe para 08/2026, comparada contra 07/2026.`}
      />
      <Card className="border-amber-500/40 bg-amber-50/40">
        <CardContent className="flex gap-3 pt-6">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium">Esta análise ainda não existe para {competencia.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A comparação depende de uma DRE fechada de referência no mês anterior, hoje disponível
              apenas para 08/2026. Selecione essa competência para ver a análise.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
