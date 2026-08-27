import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { empresas, grupos } from "@/data/mock";
import type { GrupoEmpresa } from "@/types/erp";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos de Empresas" },
      { name: "description", content: "Agrupamento de empresas para gestão contábil consolidada." },
      { property: "og:title", content: "Grupos de Empresas — ERP Contábil" },
      { property: "og:description", content: "Agrupamento de empresas do ERP Contábil." },
    ],
  }),
  component: GruposPage,
});

function GruposPage() {
  const colunas: Column<GrupoEmpresa>[] = [
    {
      key: "nome",
      header: "Grupo",
      render: (g) => <span className="font-medium">{g.nome}</span>,
      valor: (g) => g.nome,
    },
    { key: "resp", header: "Responsável", render: (g) => g.responsavel, valor: (g) => g.responsavel },
    {
      key: "qtd",
      header: "Empresas",
      className: "w-24 font-mono",
      render: (g) => g.empresasIds.length,
      valor: (g) => String(g.empresasIds.length),
    },
    {
      key: "empresas",
      header: "Vinculadas",
      render: (g) =>
        g.empresasIds
          .map((id) => empresas.find((e) => e.id === id)?.nomeFantasia)
          .filter(Boolean)
          .join(", "),
      valor: (g) => g.empresasIds.join(" "),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Grupos de Empresas"
        descricao="Estrutura de agrupamento para visões consolidadas e permissões por carteira."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Novo grupo
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={grupos}
        chave={(g) => g.id}
        placeholderBusca="Buscar grupo…"
      />
    </PageShell>
  );
}
