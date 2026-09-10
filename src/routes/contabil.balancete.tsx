import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-header";
import { BalanceteDominioCompetencia } from "@/components/nitaplast/balancete-dominio-competencia";
import { useErp } from "@/context/erp-context";
import { BalanceteMaioDominio } from "@/components/nitaplast/balancete-maio-dominio";
import { BalanceteCompetenciaAberta } from "@/components/competencia-aberta";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { temMotorDedicado } from "@/lib/competencia";
import { BalanceteAgostoCompleto } from "@/components/nitaplast/contabil-agosto-completo";
import { BalanceteJulhoAjustavel } from "@/components/nitaplast/contabil-julho-ajustavel";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

function BalancetePage() {
  const { empresa, competencia } = useErp();

  if (competencia.id === "2026-05") {
    return <PageShell><BalanceteMaioDominio /></PageShell>;
  }

  if (competencia.id === "2026-07") {
    return <PageShell><BalanceteJulhoAjustavel /></PageShell>;
  }
  if (competencia.id === "2026-08") return <PageShell><BalanceteAgostoCompleto /></PageShell>;

  if (!temMotorDedicado(competencia.id)) {
    return <PageShell><BalanceteAbertoWrapper empresaId={empresa.id} competencia={competencia} /></PageShell>;
  }

  return <PageShell><BalanceteDominioCompetencia competencia="2026-06" /></PageShell>;
}

function BalanceteAbertoWrapper({ empresaId, competencia }: { empresaId: string; competencia: ReturnType<typeof useErp>["competencia"] }) {
  const { lancamentos } = useLancamentosCompetencia(empresaId, competencia.id);
  return <BalanceteCompetenciaAberta lancamentos={lancamentos} competencia={competencia} />;
}
