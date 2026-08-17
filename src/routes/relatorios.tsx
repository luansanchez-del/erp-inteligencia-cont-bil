import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — ERP Contábil" },
      { name: "description", content: "Relatórios contábeis limpos para emissão e apresentação." },
      { property: "og:title", content: "Relatórios — ERP Contábil" },
      { property: "og:description", content: "DRE Report, Razão Report, Diário e demais demonstrações." },
    ],
  }),
  component: RelatoriosPage,
});

const relatorios = [
  { nome: "DRE Report", to: "/relatorios/dre", desc: "DRE limpa gerada pelo Razão e Balancete, sem comparação manual.", status: "Ativo" },
  { nome: "Razão Report", to: "/relatorios/razao", desc: "Razão analítico por conta com saldo anterior, movimento e saldo final.", status: "Ativo" },
  { nome: "Diário Report", to: "/relatorios/diario", desc: "Partidas contábeis em ordem cronológica, originadas do mesmo Razão.", status: "Ativo" },
  { nome: "Balancete", to: "/contabil/balancete", desc: "Balancete consolidado da competência, alimentado pelo Razão.", status: "Operacional" },
  { nome: "DRE de Validação", to: "/contabil/dre", desc: "Uso interno: compara DRE manual/enviada com a DRE calculada.", status: "Interno" },
  { nome: "Balanço Patrimonial", to: "/contabil/balanco-patrimonial", desc: "Posição patrimonial da competência.", status: "Em evolução" },
] as const;

function RelatoriosPage() {
  return (
    <PageShell>
      <PageHeader
        titulo="Relatórios"
        descricao="Relatórios para apresentação ficam separados das telas internas de validação e auditoria."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {relatorios.map((r) => (
          <Link key={r.to} to={r.to}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span>{r.nome}</span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription className="mt-1">{r.desc}</CardDescription>
                  </div>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Competência selecionada: Nitaplast · 06/2026
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
