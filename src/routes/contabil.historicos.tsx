import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/historicos")({
  head: () => ({
    meta: [
      { title: "Históricos Contábeis — ERP Contábil" },
      { name: "description", content: "Histórico padrão utilizado na escrituração de lançamentos." },
      { property: "og:title", content: "Históricos Contábeis — ERP Contábil" },
      { property: "og:description", content: "Histórico padrão utilizado na escrituração de lançamentos." },
    ],
  }),
  component: Historicos,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "codigo", header: "Código", className: "font-mono w-24", render: (r) => r["codigo"] ?? "", valor: (r) => r["codigo"] ?? "" },
  { key: "descricao", header: "Descrição", render: (r) => r["descricao"] ?? "", valor: (r) => r["descricao"] ?? "" },
  { key: "complemento", header: "Complemento livre", className: "w-40", render: (r) => r["complemento"] ?? "", valor: (r) => r["complemento"] ?? "" },
];

function Historicos() {
  return (
    <PageShell>
      <PageHeader
        titulo="Históricos Contábeis"
        descricao="Histórico padrão utilizado na escrituração de lançamentos."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Novo histórico
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r["id"]!}
        placeholderBusca="Buscar histórico…"
        vazio="Nenhum histórico cadastrado."
      />
    </PageShell>
  );
}
