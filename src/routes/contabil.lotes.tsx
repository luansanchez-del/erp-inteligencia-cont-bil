import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/lotes")({
  head: () => ({
    meta: [
      { title: "Lotes" },
      { name: "description", content: "Agrupamento de lançamentos por origem, com controle de efetivação." },
      { property: "og:title", content: "Lotes — ERP Contábil" },
      { property: "og:description", content: "Agrupamento de lançamentos por origem, com controle de efetivação." },
    ],
  }),
  component: Lotes,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "numero", header: "Lote", className: "font-mono w-24", render: (r) => r["numero"] ?? "", valor: (r) => r["numero"] ?? "" },
  { key: "origem", header: "Origem", className: "w-32", render: (r) => r["origem"] ?? "", valor: (r) => r["origem"] ?? "" },
  { key: "quantidade", header: "Lançamentos", className: "w-28 font-mono", render: (r) => r["quantidade"] ?? "", valor: (r) => r["quantidade"] ?? "" },
  { key: "valor", header: "Valor total", className: "text-right font-mono w-32", render: (r) => r["valor"] ?? "", valor: (r) => r["valor"] ?? "" },
  { key: "status", header: "Situação", className: "w-28", render: (r) => r["status"] ?? "", valor: (r) => r["status"] ?? "" },
];

function Lotes() {
  return (
    <PageShell>
      <PageHeader
        titulo="Lotes"
        descricao="Agrupamento de lançamentos por origem, com controle de efetivação."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Novo lote
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r["id"]!}
        placeholderBusca="Buscar lote…"
        vazio="Nenhum lote na competência selecionada."
      />
    </PageShell>
  );
}
