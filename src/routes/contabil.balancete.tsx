import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { PageShell } from "@/components/page-header";
import { BalanceteJulhoAjustavel } from "@/components/nitaplast/contabil-julho-ajustavel";
import { Route as BalanceteJunhoPreservadoRoute } from "@/components/nitaplast/balancete-junho-preservado";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const BalanceteJunhoPreservado = BalanceteJunhoPreservadoRoute.options.component as ComponentType;

function BalancetePage() {
  const { competencia } = useErp();

  if (competencia.id === "2026-07") {
    return (
      <PageShell>
        <BalanceteJulhoAjustavel />
      </PageShell>
    );
  }

  return <BalanceteJunhoPreservado />;
}
