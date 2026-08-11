import { createFileRoute } from "@tanstack/react-router";
import { ModuloFuturo } from "@/components/modulo-futuro";

export const Route = createFileRoute("/obrigacoes")({
  head: () => ({
    meta: [
      { title: "Obrigações Acessórias — ERP Contábil" },
      { name: "description", content: "Calendário e controle de entregas obrigatórias — previsto para etapa futura." },
      { property: "og:title", content: "Obrigações Acessórias — ERP Contábil" },
      { property: "og:description", content: "Calendário e controle de entregas obrigatórias — previsto para etapa futura." },
    ],
  }),
  component: () => (
    <ModuloFuturo
      titulo="Obrigações Acessórias"
      descricao="Calendário e controle de entregas obrigatórias — previsto para etapa futura."
      previsto={["Calendário de entregas", "Controle por empresa", "Status e comprovantes", "Alertas de prazo"]}
    />
  ),
});
