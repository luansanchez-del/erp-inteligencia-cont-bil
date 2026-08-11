import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/competencias")({
  head: () => ({
    meta: [
      { title: "Competências — ERP Contábil" },
      { name: "description", content: "Períodos contábeis por empresa, com controle de abertura e fechamento." },
      { property: "og:title", content: "Competências — ERP Contábil" },
      { property: "og:description", content: "Períodos contábeis por empresa, com controle de abertura e fechamento." },
    ],
  }),
  component: Competencias,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "periodo", header: "Período", className: "font-mono w-28", render: (r) => r.periodo ?? "", valor: (r) => r.periodo ?? "" },
  { key: "empresa", header: "Empresa", render: (r) => r.empresa ?? "", valor: (r) => r.empresa ?? "" },
  { key: "status", header: "Situação", className: "w-32", render: (r) => r.status ?? "", valor: (r) => r.status ?? "" },
  { key: "fechadaEm", header: "Fechada em", className: "w-36", render: (r) => r.fechadaEm ?? "", valor: (r) => r.fechadaEm ?? "" },
];

function Competencias() {
  return (
    <PageShell>
      <PageHeader
        titulo="Competências"
        descricao="Períodos contábeis por empresa, com controle de abertura e fechamento."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Nova competência
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r.id!}
        placeholderBusca="Buscar competência…"
        vazio="Nenhuma competência cadastrada."
      />
    </PageShell>
  );
}
