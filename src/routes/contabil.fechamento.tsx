import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";

export const Route = createFileRoute("/contabil/fechamento")({
  head: () => ({
    meta: [
      { title: "Fechamento — ERP Contábil" },
      {
        name: "description",
        content: "Fluxo de fechamento mensal da competência contábil, em etapas controladas.",
      },
      { property: "og:title", content: "Fechamento — ERP Contábil" },
      { property: "og:description", content: "Etapas de fechamento da competência contábil." },
    ],
  }),
  component: FechamentoPage,
});

const etapas = [
  { nome: "Validação de lançamentos", desc: "Partidas balanceadas, contas válidas e lotes efetivados." },
  { nome: "Conciliação concluída", desc: "Itens pendentes tratados ou justificados." },
  { nome: "Apuração do período", desc: "Transferência de resultado e ajustes do mês." },
  { nome: "Revisão e bloqueio", desc: "Competência bloqueada para novos lançamentos." },
];

function FechamentoPage() {
  const { competencia } = useErp();

  return (
    <PageShell>
      <PageHeader
        titulo="Fechamento"
        descricao={`Etapas previstas para encerrar a competência ${competencia.label}. Nenhuma execução real nesta etapa.`}
        acoes={
          <Button size="sm" disabled>
            Iniciar fechamento
          </Button>
        }
      />

      <div className="grid gap-3">
        {etapas.map((e, i) => (
          <Card key={e.nome}>
            <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm">
                {i + 1}
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{e.nome}</CardTitle>
                <CardDescription>{e.desc}</CardDescription>
              </div>
              <Badge variant="outline">Pendente</Badge>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de fechamentos</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum fechamento registrado.
        </CardContent>
      </Card>
    </PageShell>
  );
}
