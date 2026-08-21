import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-header";
import { BalanceteDominioCompetencia } from "@/components/nitaplast/balancete-dominio-competencia";
import { useErp } from "@/context/erp-context";
import { BalanceteMaioDominio } from "@/components/nitaplast/balancete-maio-dominio";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

function BalancetePage() {
  const { competencia } = useErp();

  if (competencia.id === "2026-05") {
    return <PageShell><BalanceteMaioDominio /></PageShell>;
  }

  if (competencia.id === "2026-07") {
    return (
      <PageShell>
        <BalanceteDominioCompetencia competencia="2026-07" />
      </PageShell>
    );
  }

  return <PageShell><BalanceteDominioCompetencia competencia="2026-06" /></PageShell>;
}
