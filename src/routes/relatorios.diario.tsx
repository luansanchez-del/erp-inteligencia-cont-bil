import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";
import { usePrintMode } from "@/hooks/use-print-mode";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

export const Route = createFileRoute("/relatorios/diario")({ component: DiarioReportPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const POR_PAGINA = 100;

function chaveData(data: string) {
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return data;
}

function DiarioReportPage() {
  useNitaplastJunho();
  const { aplicar } = useReclassificacoesInteligentes("2026-06");
  const { printing, printAll } = usePrintMode();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const lancamentosComAjustes = useMemo(() => aplicar(lancamentosIntegrados), [aplicar]);

  const linhas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return [...lancamentosComAjustes]
      .sort((a, b) => chaveData(a.data).localeCompare(chaveData(b.data)) || a.id.localeCompare(b.id))
      .filter((linha) => !q || [linha.data, linha.id, linha.debito, linha.credito, linha.historico, linha.documento, linha.centroCusto]
        .join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }, [busca, lancamentosComAjustes]);

  const total = linhas.reduce((soma, linha) => soma + linha.valor, 0);
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA;
  const linhasVisiveis = printing ? linhas : linhas.slice(inicio, fim);

  return (
    <PageShell>
      <PageHeader
        titulo="Diário Report — Nitaplast"
        descricao="Livro Diário da competência 06/2026."
        acoes={<div className="flex items-center gap-2"><Badge variant="outline">06/2026</Badge><Button variant="outline" size="sm" className="gap-2" onClick={printAll}><Printer className="size-4" />Imprimir / PDF</Button></div>}
      />

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="pt-5 print:px-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-sm font-medium">{linhas.length} partidas</p>
              <p className="text-xs text-muted-foreground">Total dos débitos = total dos créditos = {brl.format(total)}</p>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar conta, histórico ou documento" className="pl-9" />
            </div>
          </div>

          <div className="hidden border-b-2 border-black pb-3 text-center print:block">
            <h1 className="text-base font-bold uppercase">NITAPLAST IND E COM DE PLÁSTICOS INDUSTRIAIS LTDA</h1>
            <p className="text-xs">CNPJ 82.295.817/0001-07</p>
            <h2 className="mt-2 text-sm font-semibold uppercase">Livro Diário</h2>
            <p className="text-xs">Período: 01/06/2026 a 30/06/2026</p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[1350px] text-sm print:min-w-0 print:text-[9px]">
              <thead><tr className="border-b bg-muted/40 text-left text-xs print:bg-white print:text-[8px]">
                <th className="p-2">Data</th><th className="p-2">Lançamento</th><th className="p-2">Conta Débito</th><th className="p-2">Conta Crédito</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2">Centro de Custo</th><th className="p-2 text-right">Valor</th>
              </tr></thead>
              <tbody>{linhasVisiveis.map((linha) => <tr key={linha.id} className="border-b last:border-0">
                <td className="p-2 whitespace-nowrap">{linha.data}</td>
                <td className="p-2 font-mono text-xs">{linha.id}</td>
                <td className="p-2">{linha.debito}</td>
                <td className="p-2">{linha.credito}</td>
                <td className="p-2">{linha.historico}</td>
                <td className="p-2 font-mono text-xs">{linha.documento || "—"}</td>
                <td className="p-2">{linha.cc && linha.cc !== "0" ? `${linha.cc} - ${linha.centroCusto}` : "—"}</td>
                <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
              </tr>)}</tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-4 print:hidden">
            <p className="text-xs text-muted-foreground">Exibindo {linhas.length ? inicio + 1 : 0}-{Math.min(fim, linhas.length)} de {linhas.length} partidas.</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina((valor) => Math.max(1, valor - 1))}>Anterior</Button>
              <span className="text-xs">Página {paginaAtual} de {totalPaginas}</span>
              <Button variant="outline" size="sm" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}>Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
