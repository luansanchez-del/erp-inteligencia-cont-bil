import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/conciliacao")({
  head: () => ({
    meta: [
      { title: "Conciliação — ERP Contábil" },
      { name: "description", content: "Confronto entre movimento contábil e origem externa. Sem cruzamento automático." },
      { property: "og:title", content: "Conciliação — ERP Contábil" },
      { property: "og:description", content: "Confronto entre movimento contábil e origem externa. Sem cruzamento automático." },
    ],
  }),
  component: Conciliacao,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "data", header: "Data", className: "w-28", render: (r) => r.data ?? "", valor: (r) => r.data ?? "" },
  { key: "conta", header: "Conta", render: (r) => r.conta ?? "", valor: (r) => r.conta ?? "" },
  { key: "descricao", header: "Descrição", render: (r) => r.descricao ?? "", valor: (r) => r.descricao ?? "" },
  { key: "valor", header: "Valor", className: "text-right font-mono w-32", render: (r) => r.valor ?? "", valor: (r) => r.valor ?? "" },
  { key: "status", header: "Situação", className: "w-32", render: (r) => r.status ?? "", valor: (r) => r.status ?? "" },
];

function Conciliacao() {
  return (
    <PageShell>
      <PageHeader
        titulo="Conciliação"
        descricao="Confronto entre movimento contábil e origem externa. Sem cruzamento automático."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Importar base
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r.id!}
        placeholderBusca="Buscar item…"
        vazio="Nenhum item para conciliar."
      />
    </PageShell>
  );
}
