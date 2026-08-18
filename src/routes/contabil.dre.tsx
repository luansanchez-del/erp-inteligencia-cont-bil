import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { PageShell } from "@/components/page-header";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";
import { Route as DreJunhoPreservadaRoute } from "@/components/nitaplast/dre-junho-preservada";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const DreJunhoPreservada = DreJunhoPreservadaRoute.options.component as ComponentType;

function DrePage() {
  const { competencia } = useErp();

  if (competencia.id === "2026-07") {
    return (
      <PageShell>
        <DreJulhoCompleta />
      </PageShell>
    );
  }

  return <DreJunhoPreservada />;
}
