import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cadastroFiscalNitaplast,
  dreCompletaJunho,
  idsDespesasOperacionais,
  receitaBrutaJunho,
} from "@/data/nitaplast-dre-completa";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DrePage() {
  const resultadoOperacional = dreCompletaJunho.find((linha) => linha.id === "resultado-op")!.valor;
  const lucroLiquido = dreCompletaJunho.find((linha) => linha.id === "lucro-liq")!.valor;
  const pendentes = dreCompletaJunho.filter((linha) => linha.composicaoPendente).length;
  const despesas = dreCompletaJunho.filter((linha) => idsDespesasOperacionais.includes(linha.id as (typeof idsDespesasOperacionais)[number]));

  return (
    <PageShell>
      <PageHeader
        titulo="DRE completa — Nitaplast"
        descricao="Estrutura integral da aba JUN 26, com matriz, filial, CPV/CMV, despesas, créditos e resultado não operacional."
        acoes={<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Totais conciliados</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Receita operacional bruta" value={receitaBrutaJunho} />
        <Metric label="Resultado operacional" value={resultadoOperacional} success />
        <Metric label="Lucro líquido" value={lucroLiquido} success />
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Grupos aguardando conta analítica</p><p className="mt-1 text-xl font-semibold text-amber-700">{pendentes}</p></CardContent></Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div><p className="font-medium">Regime tributário confirmado</p><p className="text-sm text-muted-foreground">{cadastroFiscalNitaplast.regimeTributario} por {cadastroFiscalNitaplast.formaApuracaoIrpjCsll.toLocaleLowerCase("pt-BR")}.</p></div>
          <Badge variant="outline">Confirmado pelo cliente</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle className="text-base">Composição completa da DRE</CardTitle><CardDescription>As linhas reproduzem a planilha enviada. “Abrir por conta” indica que o total confere, mas a composição analítica ainda será distribuída no Razão.</CardDescription></div>
            <Button asChild variant="outline" size="sm"><Link to="/contabil/razao">Abrir Razão <ExternalLink className="ml-2 size-4" /></Link></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Estrutura / conta DRE</th><th className="p-2">Origem e composição</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">% receita</th><th className="p-2 text-right">Situação</th></tr></thead>
            <tbody>{dreCompletaJunho.map((linha) => <tr key={linha.id} className={linha.tipo === "resultado" ? "border-y-2 bg-primary/5 font-semibold" : linha.nivel === 0 ? "border-t bg-muted/20 font-medium" : "border-b"}><td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 24 }}>{linha.descricao}</td><td className="p-2 text-xs text-muted-foreground">{linha.origem}</td><td className={`p-2 text-right tabular-nums ${linha.valor < 0 ? "text-emerald-700" : ""}`}>{brl.format(linha.valor)}</td><td className="p-2 text-right tabular-nums text-muted-foreground">{`${((Math.abs(linha.valor) / receitaBrutaJunho) * 100).toFixed(2).replace(".", ",")}%`}</td><td className="p-2 text-right">{linha.composicaoPendente ? <span className="inline-flex items-center gap-1 text-amber-700"><TriangleAlert className="size-4" /> Abrir por conta</span> : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" /> Conciliado</span>}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Abertura das despesas operacionais</CardTitle><CardDescription>Grupos que formam R$ 1.256.946,43 antes dos créditos de PIS e COFINS.</CardDescription></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">{despesas.map((linha) => <div key={linha.id} className="flex items-center justify-between gap-4 rounded-md border p-3"><div><p className="text-sm font-medium">{linha.descricao}</p><p className="text-xs text-muted-foreground">{linha.composicaoPendente ? "Detalhamento por conta e centro de custo em validação no Razão" : linha.origem}</p></div><p className="shrink-0 font-mono text-sm font-semibold">{brl.format(linha.valor)}</p></div>)}</CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="flex gap-3 pt-6"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><p className="font-medium">Pendência de composição, não de total</p><p className="mt-1 text-sm text-muted-foreground">Os totais da DRE conferem. Para gerar o relatório definitivo e importar no Questor, os grupos sinalizados precisam ser distribuídos entre contas e centros de custo, sem duplicar despesas reconhecidas pelas notas.</p><p className="mt-2 text-sm text-muted-foreground">Observação da planilha: provisão/baixa do estoque de 12/2025 de R$ 770.000,00 ainda não realizada.</p></div></CardContent></Card>
    </PageShell>
  );
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}
