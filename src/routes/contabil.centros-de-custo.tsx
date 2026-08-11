import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/centros-de-custo")({
  head: () => ({
    meta: [
      { title: "Centros de Custo — ERP Contábil" },
      { name: "description", content: "Estrutura de centros de custo usada em rateios e relatórios gerenciais." },
      { property: "og:title", content: "Centros de Custo — ERP Contábil" },
      { property: "og:description", content: "Estrutura de centros de custo usada em rateios e relatórios gerenciais." },
    ],
  }),
  component: CentrosDeCusto,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "codigo", header: "Código", className: "font-mono w-32", render: (r) => r.codigo ?? "", valor: (r) => r.codigo ?? "" },
  { key: "descricao", header: "Descrição", render: (r) => r.descricao ?? "", valor: (r) => r.descricao ?? "" },
  { key: "situacao", header: "Situação", className: "w-28", render: (r) => r.situacao ?? "", valor: (r) => r.situacao ?? "" },
];

function CentrosDeCusto() {
  return (
    <PageShell>
      <PageHeader
        titulo="Centros de Custo"
        descricao="Estrutura de centros de custo usada em rateios e relatórios gerenciais."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Novo centro
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r.id!}
        placeholderBusca="Buscar centro de custo…"
        vazio="Nenhum centro de custo cadastrado."
      />
    </PageShell>
  );
}
