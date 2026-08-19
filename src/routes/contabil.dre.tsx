import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentType } from "react";
import { PageShell } from "@/components/page-header";
import { DreSafeBoundary } from "@/components/nitaplast/dre-safe-boundary";
import { Route as DreJunhoPreservadaRoute } from "@/components/nitaplast/dre-junho-preservada";
import { Card, CardContent } from "@/components/ui/card";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const DreJunhoPreservada = DreJunhoPreservadaRoute.options.component as ComponentType;

// Julho é carregado por bloco. Se uma validação lançar erro durante a própria
// importação do módulo, o erro cai no boundary daquela seção e não derruba a rota.
const AuditoriaDreRazaoJulho = lazy(() =>
  import("@/components/nitaplast/dre-razao-rastreabilidade").then((modulo) => ({
    default: modulo.AuditoriaDreRazaoJulho,
  })),
);
const DreJulhoDiagnostico = lazy(() =>
  import("@/components/nitaplast/dre-julho-diagnostico").then((modulo) => ({
    default: modulo.DreJulhoDiagnostico,
  })),
);
const DreJulhoCompleta = lazy(() =>
  import("@/components/nitaplast/dre-julho-completa").then((modulo) => ({
    default: modulo.DreJulhoCompleta,
  })),
);

function CarregandoDre({ titulo }: { titulo: string }) {
  return (
    <Card>
      <CardContent className="pt-5 text-sm text-muted-foreground">
        Carregando {titulo}…
      </CardContent>
    </Card>
  );
}

function DrePage() {
  const { competencia } = useErp();

  if (competencia.id === "2026-07") {
    return (
      <PageShell>
        <DreSafeBoundary titulo="Auditoria DRE → Razão">
          <Suspense fallback={<CarregandoDre titulo="auditoria DRE → Razão" />}>
            <AuditoriaDreRazaoJulho />
          </Suspense>
        </DreSafeBoundary>

        <DreSafeBoundary titulo="Diagnóstico da DRE">
          <Suspense fallback={<CarregandoDre titulo="diagnóstico da DRE" />}>
            <DreJulhoDiagnostico />
          </Suspense>
        </DreSafeBoundary>

        <DreSafeBoundary titulo="DRE calculada 07/2026">
          <Suspense fallback={<CarregandoDre titulo="DRE calculada 07/2026" />}>
            <DreJulhoCompleta />
          </Suspense>
        </DreSafeBoundary>
      </PageShell>
    );
  }

  return <DreJunhoPreservada />;
}
