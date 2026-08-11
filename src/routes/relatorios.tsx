import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — ERP Contábil" },
      { name: "description", content: "Catálogo de relatórios contábeis disponíveis no sistema." },
      { property: "og:title", content: "Relatórios — ERP Contábil" },
      { property: "og:description", content: "Razão, Diário, Balancete, DRE e Balanço Patrimonial." },
    ],
  }),
  component: RelatoriosPage,
});

const relatorios = [
  { nome: "Razão", to: "/contabil/razao", desc: "Movimento analítico por conta contábil." },
  { nome: "Diário", to: "/contabil/diario", desc: "Lançamentos em ordem cronológica." },
  { nome: "Balancete", to: "/contabil/balancete", desc: "Saldos anterior, movimento e atual." },
  { nome: "DRE", to: "/contabil/dre", desc: "Demonstração do resultado do exercício." },
  {
    nome: "Balanço Patrimonial",
    to: "/contabil/balanco-patrimonial",
    desc: "Posição patrimonial da competência.",
  },
];

function RelatoriosPage() {
  return (
    <PageShell>
      <PageHeader
        titulo="Relatórios"
        descricao="Catálogo central. Cada relatório abre a tela do módulo Contábil correspondente."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {relatorios.map((r) => (
          <Link key={r.to} to={r.to}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="min-w-0 flex-1 truncate">{r.nome}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{r.desc}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Emissão pendente do motor contábil.
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
