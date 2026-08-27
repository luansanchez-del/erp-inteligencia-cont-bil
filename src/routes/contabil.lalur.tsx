import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-header";
import { LalurJulho } from "@/components/nitaplast/lalur-julho";

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
  return (
    <PageShell>
      <LalurJulho />
    </PageShell>
  );
}
