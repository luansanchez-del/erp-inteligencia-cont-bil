import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/contabil/encerramento")({
  head: () => ({
    meta: [
      { title: "Encerramento — ERP Contábil" },
      {
        name: "description",
        content: "Encerramento do exercício contábil: apuração, transferência e abertura seguinte.",
      },
      { property: "og:title", content: "Encerramento — ERP Contábil" },
      { property: "og:description", content: "Encerramento do exercício contábil." },
    ],
  }),
  component: EncerramentoPage,
});

const etapas = [
  { nome: "Apuração do resultado", desc: "Zeramento das contas de resultado do exercício." },
  { nome: "Transferência para patrimônio", desc: "Destino do lucro ou prejuízo apurado." },
  { nome: "Bloqueio do exercício", desc: "Competências do exercício ficam somente leitura." },
  { nome: "Abertura do exercício seguinte", desc: "Geração dos saldos iniciais." },
];

function EncerramentoPage() {
  return (
    <PageShell>
      <PageHeader
        titulo="Encerramento"
        descricao="Rotina anual de encerramento do exercício. Nenhum cálculo é executado nesta etapa."
        acoes={
          <Button size="sm" disabled>
            Encerrar exercício
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {etapas.map((e) => (
          <Card key={e.nome}>
            <CardHeader>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{e.nome}</CardTitle>
                  <CardDescription>{e.desc}</CardDescription>
                </div>
                <Badge variant="outline">Previsto</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Regra contábil será definida na etapa do motor.
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
