import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";
import { FileDown, Printer } from "lucide-react";

// Casca padrão de relatório contábil: cabeçalho, parâmetros e área de resultado.
// Sem cálculo nesta etapa.
export function RelatorioShell({
  titulo,
  descricao,
  parametros,
  colunas,
}: {
  titulo: string;
  descricao: string;
  parametros: string[];
  colunas: string[];
}) {
  const { empresa, competencia } = useErp();

  return (
    <PageShell>
      <PageHeader
        titulo={titulo}
        descricao={descricao}
        acoes={
          <>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Printer className="size-4" /> Imprimir
            </Button>
            <Button size="sm" className="gap-2" disabled>
              <FileDown className="size-4" /> Exportar
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">{empresa.nomeFantasia}</Badge>
          <Badge variant="secondary">Competência {competencia.label}</Badge>
          {parametros.map((p) => (
            <Badge key={p} variant="outline">
              {p}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  {colunas.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={colunas.length}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    O cálculo será gerado pelo motor contábil em etapa posterior.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
