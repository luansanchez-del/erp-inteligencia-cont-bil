import { createFileRoute } from "@tanstack/react-router";
import { FechamentoNitaplastJulho } from "@/components/nitaplast/fechamento-julho";
import { FechamentoManualJunho } from "@/components/nitaplast/fechamento-manual-junho";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/fechamento-assistido")({
  head: () => ({ meta: [{ title: "Fechamento Assistido — Nitaplast" }, { name: "description", content: "Fechamento contábil assistido da Nitaplast por competência." }] }),
  component: FechamentoAssistidoPage,
});

function FechamentoAssistidoPage() {
  const { competencia } = useErp();
  useNitaplastJunho();

  if (competencia.id === "2026-07") {
    return <PageShell><PageHeader titulo="Fechamento Assistido - Nitaplast" descricao="Competência 07/2026 • fechamento pela cadeia documentos → Razão → Balancete → DRE." acoes={<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Em fechamento</Badge>}/><FechamentoNitaplastJulho /></PageShell>;
  }

  return <PageShell><PageHeader titulo="Fechamento Assistido - Nitaplast" descricao="Competência 06/2026 • composição integral do arquivo manual, separada da contabilização oficial." acoes={<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Em revisão contábil</Badge>}/><FechamentoManualJunho /></PageShell>;
}
