import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-header";
import { LalurJulho } from "@/components/nitaplast/lalur-julho";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/lalur")({
  head: () => ({
    meta: [
      { title: "LALUR" },
      {
        name: "description",
        content: "Apuração de IRPJ/CSLL pelo Lucro Real mensal, com adições/exclusões e geração de lançamento.",
      },
    ],
  }),
  component: LalurPage,
});

function LalurPage() {
  const { competencia } = useErp();

  // LalurJulho só sabe calcular 07/2026. O fallback genérico de PageShell trata
  // 06/2026 como competência "carregada" (Balancete/Razão/DRE têm dado real ali),
  // então esta rota precisa do próprio guard para não herdar o número de julho.
  if (competencia.id !== "2026-07") {
    return (
      <PageShell>
        <PageHeader
          titulo={`LALUR — ${competencia.label}`}
          descricao="O cálculo do LALUR está implantado apenas para a competência 07/2026 da Nitaplast."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <LalurJulho />
    </PageShell>
  );
}
