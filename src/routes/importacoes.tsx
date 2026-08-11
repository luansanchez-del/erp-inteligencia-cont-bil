import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FormatoImportacao } from "@/types/erp";

export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [
      { title: "Importações — ERP Contábil" },
      {
        name: "description",
        content: "Interface conceitual de importação de arquivos contábeis e bancários.",
      },
      { property: "og:title", content: "Importações — ERP Contábil" },
      { property: "og:description", content: "Formatos previstos: TXT, CSV, XLSX, OFX, PDF, XML e API." },
    ],
  }),
  component: ImportacoesPage,
});

const formatos: { formato: FormatoImportacao; uso: string }[] = [
  { formato: "TXT", uso: "Layouts posicionais de sistemas legados" },
  { formato: "CSV", uso: "Planilhas de lançamentos e cadastros" },
  { formato: "XLSX", uso: "Planilhas estruturadas com múltiplas abas" },
  { formato: "OFX", uso: "Extratos bancários para conciliação" },
  { formato: "PDF", uso: "Documentos para leitura assistida" },
  { formato: "XML", uso: "Documentos fiscais eletrônicos" },
  { formato: "API", uso: "Recebimento contínuo via integração" },
];

function ImportacoesPage() {
  return (
    <PageShell>
      <PageHeader
        titulo="Importações"
        descricao="Estrutura prevista para entrada de dados. Nenhum processamento está ativo nesta etapa."
        acoes={<Badge variant="outline">Conceitual</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova importação</CardTitle>
          <CardDescription>
            A área de upload será habilitada quando o motor de importação existir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-12 text-center">
            <UploadCloud className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou selecione o formato desejado.
            </p>
            <Button size="sm" disabled>
              Selecionar arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {formatos.map((f) => (
          <Card key={f.formato}>
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm">{f.formato}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-muted-foreground">{f.uso}</p>
              <Badge variant="outline">Previsto</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de importações</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma importação registrada.
        </CardContent>
      </Card>
    </PageShell>
  );
}
