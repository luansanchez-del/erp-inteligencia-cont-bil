import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contabil/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos — ERP Contábil" },
      { name: "description", content: "Escrituração contábil da competência. Sem validação de partidas nesta etapa." },
      { property: "og:title", content: "Lançamentos — ERP Contábil" },
      { property: "og:description", content: "Escrituração contábil da competência. Sem validação de partidas nesta etapa." },
    ],
  }),
  component: Lancamentos,
});

type Registro = Record<string, string>;

const colunas: Column<Registro>[] = [
  { key: "numero", header: "Número", className: "font-mono w-28", render: (r) => r["numero"] ?? "", valor: (r) => r["numero"] ?? "" },
  { key: "data", header: "Data", className: "w-28", render: (r) => r["data"] ?? "", valor: (r) => r["data"] ?? "" },
  { key: "debito", header: "Conta débito", render: (r) => r["debito"] ?? "", valor: (r) => r["debito"] ?? "" },
  { key: "credito", header: "Conta crédito", render: (r) => r["credito"] ?? "", valor: (r) => r["credito"] ?? "" },
  { key: "historico", header: "Histórico", render: (r) => r["historico"] ?? "", valor: (r) => r["historico"] ?? "" },
  { key: "valor", header: "Valor", className: "text-right font-mono w-32", render: (r) => r["valor"] ?? "", valor: (r) => r["valor"] ?? "" },
];

function Lancamentos() {
  return (
    <PageShell>
      <PageHeader
        titulo="Lançamentos"
        descricao="Escrituração contábil da competência. Sem validação de partidas nesta etapa."
        acoes={
          <Button size="sm" className="gap-2" disabled>
            <Plus className="size-4" /> Novo lançamento
          </Button>
        }
      />
      <DataTable
        colunas={colunas}
        dados={[]}
        chave={(r) => r["id"]!}
        placeholderBusca="Buscar por número, conta ou histórico…"
        vazio="Nenhum lançamento na competência selecionada."
      />
    </PageShell>
  );
}
