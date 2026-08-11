import { createFileRoute } from "@tanstack/react-router";
import { RelatorioShell } from "@/components/relatorio-shell";

export const Route = createFileRoute("/contabil/diario")({
  head: () => ({
    meta: [
      { title: "Diário — ERP Contábil" },
      { name: "description", content: "Lançamentos em ordem cronológica com termo de abertura e encerramento." },
      { property: "og:title", content: "Diário — ERP Contábil" },
      { property: "og:description", content: "Lançamentos em ordem cronológica com termo de abertura e encerramento." },
    ],
  }),
  component: () => (
    <RelatorioShell
      titulo="Diário"
      descricao="Lançamentos em ordem cronológica com termo de abertura e encerramento."
      parametros={["Ordenação: data", "Numeração contínua"]}
      colunas={["Data", "Lote", "Conta débito", "Conta crédito", "Histórico", "Valor"]}
    />
  ),
});
