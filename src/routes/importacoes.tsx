import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud, Check } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { cn } from "@/lib/utils";
import type { FormatoImportacao, ImportacaoJob } from "@/types/erp";

export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [
      { title: "Importações — ERP Contábil" },
      {
        name: "description",
        content: "Interface conceitual de importação de arquivos contábeis e bancários.",
      },
      { property: "og:title", content: "Importações — ERP Contábil" },
      {
        property: "og:description",
        content: "Formatos previstos: TXT, CSV, XLSX, OFX, PDF, XML e API.",
      },
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

const colunasHistorico: Column<ImportacaoJob>[] = [
  { key: "criadoEm", header: "Data", render: (r) => r.criadoEm, valor: (r) => r.criadoEm },
  { key: "arquivo", header: "Arquivo", render: (r) => r.arquivo, valor: (r) => r.arquivo },
  { key: "formato", header: "Formato", render: (r) => r.formato, valor: (r) => r.formato },
  { key: "status", header: "Status", render: (r) => r.status, valor: (r) => r.status },
];

function ImportacoesPage() {
  const [selecionado, setSelecionado] = useState<FormatoImportacao | null>(null);

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
            {selecionado
              ? `Formato ${selecionado} selecionado. O upload será habilitado quando o motor de importação existir.`
              : "Selecione um formato abaixo. A área de upload será habilitada quando o motor de importação existir."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center">
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
        {formatos.map((f) => {
          const ativo = selecionado === f.formato;
          return (
            <button
              key={f.formato}
              type="button"
              aria-pressed={ativo}
              onClick={() => setSelecionado(ativo ? null : f.formato)}
              className={cn(
                "rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent",
                ativo && "border-primary ring-1 ring-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{f.formato}</span>
                {ativo && <Check className="size-4 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.uso}</p>
              <Badge variant="outline" className="mt-3">
                Previsto
              </Badge>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de importações</CardTitle>
          <CardDescription>
            Registro das execuções assim que o motor de importação entrar em operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<ImportacaoJob>
            colunas={colunasHistorico}
            dados={[]}
            chave={(r) => r.id}
            placeholderBusca="Buscar por arquivo ou formato…"
            vazio="Nenhuma importação registrada."
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
