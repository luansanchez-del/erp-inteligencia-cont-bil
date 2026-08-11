import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/plano-de-contas")({
  head: () => ({
    meta: [
      { title: "Plano de Contas — ERP Contábil" },
      { name: "description", content: "Estrutura hierárquica de contas contábeis da empresa selecionada." },
      { property: "og:title", content: "Plano de Contas — ERP Contábil" },
      { property: "og:description", content: "Estrutura hierárquica de contas contábeis da empresa selecionada." },
    ],
  }),
  component: PlanoDeContas,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "codigo", header: "Código", className: "font-mono w-40", render: (r) => r.codigo ?? "", valor: (r) => r.codigo ?? "" },
  { key: "descricao", header: "Descrição", render: (r) => r.descricao ?? "", valor: (r) => r.descricao ?? "" },
  { key: "natureza", header: "Natureza", className: "w-32", render: (r) => r.natureza ?? "", valor: (r) => r.natureza ?? "" },
  { key: "tipo", header: "Tipo", className: "w-28", render: (r) => r.tipo ?? "", valor: (r) => r.tipo ?? "" },
];

function PlanoDeContas() {
  return (
    <PageShell>
      <PageHeader
        titulo="Plano de Contas"
        descricao="Estrutura hierárquica de contas contábeis da empresa selecionada."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Nova conta
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r.id!}
        placeholderBusca="Buscar por código ou descrição…"
        vazio="Nenhuma conta cadastrada."
      />
    </PageShell>
  );
}
