import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { integracoes } from "@/data/mock";

export const Route = createFileRoute("/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — ERP Contábil" },
      {
        name: "description",
        content: "Catálogo de conectores previstos, incluindo o conector Questor.",
      },
      { property: "og:title", content: "Integrações — ERP Contábil" },
      { property: "og:description", content: "Conectores previstos para o ERP Contábil." },
    ],
  }),
  component: IntegracoesPage,
});

const statusLabel = {
  nao_conectado: "Não conectado",
  conectado: "Conectado",
  planejado: "Planejado",
} as const;

function IntegracoesPage() {
  return (
    <PageShell>
      <PageHeader
        titulo="Integrações"
        descricao="Conectores externos. Nenhuma comunicação real é feita nesta etapa."
        acoes={<Badge variant="outline">Somente interface</Badge>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {integracoes.map((i) => (
          <Card key={i.id}>
            <CardHeader>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plug className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{i.nome}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">{i.descricao}</CardDescription>
                </div>
                <Badge variant={i.status === "nao_conectado" ? "secondary" : "outline"}>
                  {statusLabel[i.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" disabled>
                Configurar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
