import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/rateios")({
  head: () => ({
    meta: [
      { title: "Rateios" },
      { name: "description", content: "Regras de distribuição de valores entre centros de custo." },
      { property: "og:title", content: "Rateios — ERP Contábil" },
      { property: "og:description", content: "Regras de distribuição de valores entre centros de custo." },
    ],
  }),
  component: Rateios,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "codigo", header: "Código", className: "font-mono w-24", render: (r) => r["codigo"] ?? "", valor: (r) => r["codigo"] ?? "" },
  { key: "descricao", header: "Descrição", render: (r) => r["descricao"] ?? "", valor: (r) => r["descricao"] ?? "" },
  { key: "criterio", header: "Critério", className: "w-32", render: (r) => r["criterio"] ?? "", valor: (r) => r["criterio"] ?? "" },
  { key: "linhas", header: "Linhas", className: "w-24 font-mono", render: (r) => r["linhas"] ?? "", valor: (r) => r["linhas"] ?? "" },
];

function Rateios() {
  return (
    <PageShell>
      <PageHeader
        titulo="Rateios"
        descricao="Regras de distribuição de valores entre centros de custo."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Nova regra
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r["id"]!}
        placeholderBusca="Buscar regra de rateio…"
        vazio="Nenhuma regra de rateio cadastrada."
      />
    </PageShell>
  );
}
