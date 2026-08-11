import { createFileRoute } from "@tanstack/react-router";
import { ModuloFuturo } from "@/components/modulo-futuro";

export const Route = createFileRoute("/fiscal")({
  head: () => ({
    meta: [
      { title: "Fiscal — ERP Contábil" },
      { name: "description", content: "Apuração fiscal e escrituração de documentos — previsto para etapa futura." },
      { property: "og:title", content: "Fiscal — ERP Contábil" },
      { property: "og:description", content: "Apuração fiscal e escrituração de documentos — previsto para etapa futura." },
    ],
  }),
  component: () => (
    <ModuloFuturo
      titulo="Fiscal"
      descricao="Apuração fiscal e escrituração de documentos — previsto para etapa futura."
      previsto={["Entradas e saídas", "Apuração de impostos", "Livros fiscais", "Retenções"]}
    />
  ),
});
