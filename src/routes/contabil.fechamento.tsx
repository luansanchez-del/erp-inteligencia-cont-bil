import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpenText, ChartNoAxesCombined, FileCheck2, Scale, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";\nimport { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/fechamento")({
  head: () => ({
    meta: [
      { title: "Fechamento Nitaplast 06/2026 — ERP Contábil" },
      {
        name: "description",
        content: "Central do fechamento contábil da Nitaplast para junho de 2026.",
      },
    ],
  }),
  component: FechamentoPage,
});

const acessos = [
  {
    titulo: "Fechamento assistido",
    descricao: "Cobertura documental, JCP, depreciação, estoque e pontos de revisão.",
    to: "/contabil/fechamento-assistido" as const,
    icon: FileCheck2,
    status: "Em revisão",
  },
  {
    titulo: "Razão de junho",
    descricao: "Partidas contábeis e 1.918 movimentos financeiros com histórico original.",
    to: "/contabil/razao" as const,
    icon: BookOpenText,
    status: "Provisório",
  },
  {
    titulo: "Balancete de junho",
    descricao: "Saldo de implantação de 31/05 acrescido dos movimentos reconstruídos.",
    to: "/contabil/balancete" as const,
    icon: Scale,
    status: "Provisório",
  },
  {
    titulo: "DRE completa",
    descricao: "Estrutura da planilha JUN 26 com abertura de receitas, impostos, CPV e despesas.",
    to: "/contabil/dre" as const,
    icon: ChartNoAxesCombined,
    status: "Conciliada",
  },
];

function FechamentoPage() {\n  useNitaplastJunho();
  return (
    <PageShell>
      <PageHeader
        titulo="Central de fechamento — Nitaplast"
        descricao="Competência 06/2026 • CNPJ 82.295.817/0001-07 • Questor 1184. Todos os relatórios provisórios estão integrados ao app."
        acoes={
          <Button asChild size="sm">
            <Link to="/contabil/fechamento-assistido">Continuar fechamento</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {acessos.map((item) => (
          <Card key={item.to} className="transition-colors hover:border-primary/40">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                    <CardDescription className="mt-1">{item.descricao}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to={item.to}>Abrir dentro do app</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 pt-6">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium">Ainda não importar no Questor</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A DRE já confere com a planilha enviada. Falta substituir a parcela agrupada de despesas
              pela composição analítica por conta e centro de custo antes do fechamento definitivo.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
