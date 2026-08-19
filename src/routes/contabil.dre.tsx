import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { PageShell } from "@/components/page-header";
import { AuditoriaDreRazaoJulho } from "@/components/nitaplast/dre-razao-rastreabilidade";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";
import { DreJulhoDiagnostico } from "@/components/nitaplast/dre-julho-diagnostico";
import { DreSafeBoundary } from "@/components/nitaplast/dre-safe-boundary";
import { Route as DreJunhoPreservadaRoute } from "@/components/nitaplast/dre-junho-preservada";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const DreJunhoPreservada = DreJunhoPreservadaRoute.options.component as ComponentType;

function DrePage() {
  const { competencia } = useErp();

  if (competencia.id === "2026-07") {
    return (
      <PageShell>
        <DreSafeBoundary titulo="Auditoria DRE → Razão">
          <AuditoriaDreRazaoJulho />
        </DreSafeBoundary>
        <DreSafeBoundary titulo="Diagnóstico da DRE">
          <DreJulhoDiagnostico />
        </DreSafeBoundary>
        <DreSafeBoundary titulo="DRE calculada 07/2026">
          <DreJulhoCompleta />
        </DreSafeBoundary>
      </PageShell>
    );
  }

  return <DreJunhoPreservada />;
}
