import { createFileRoute } from "@tanstack/react-router";
import { ModuloFuturo } from "@/components/modulo-futuro";

export const Route = createFileRoute("/ecd-ecf")({
  head: () => ({
    meta: [
      { title: "ECD / ECF — ERP Contábil" },
      { name: "description", content: "Geração e validação dos arquivos digitais do SPED contábil e fiscal — previsto para etapa futura." },
      { property: "og:title", content: "ECD / ECF — ERP Contábil" },
      { property: "og:description", content: "Geração e validação dos arquivos digitais do SPED contábil e fiscal — previsto para etapa futura." },
    ],
  }),
  component: () => (
    <ModuloFuturo
      titulo="ECD / ECF"
      descricao="Geração e validação dos arquivos digitais do SPED contábil e fiscal — previsto para etapa futura."
      previsto={["Blocos da ECD", "Blocos da ECF", "Validação de layout", "Assinatura e transmissão"]}
    />
  ),
});
