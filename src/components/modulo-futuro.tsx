import { Construction } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModuloFuturo({
  titulo,
  descricao,
  previsto,
}: {
  titulo: string;
  descricao: string;
  previsto: string[];
}) {
  return (
    <PageShell>
      <PageHeader titulo={titulo} descricao={descricao} />
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Construction className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Módulo previsto — ainda não implementado</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {previsto.map((item) => (
              <li key={item} className="rounded-md border border-dashed px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}
