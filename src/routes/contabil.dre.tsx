import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-header";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

function DrePage() {
  return (
    <PageShell>
      <DreJulhoCompleta />
    </PageShell>
  );
}
