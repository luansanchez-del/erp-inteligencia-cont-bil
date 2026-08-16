import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ExternalLink } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cadastroFiscalNitaplast, dreCompletaJunho } from "@/data/nitaplast-dre-completa";
import {
  comparacaoDreBalancete,
  contasResultadoPorGrupo,
  diferencaAbsolutaDre,
  resultadoLiquidoBalancete,
  resumoDreBalancete,
  type GrupoDreBalancete,
} from "@/data/nitaplast-dre-balancete";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const tolerancia = 0.01;

function DrePage() {
  useNitaplastJunho();
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos"]));
  const lucroControle = dreCompletaJunho.find((linha) => linha.id === "lucro-liq")?.valor ?? 0;

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });
  }

  return (
    <PageShell>
      <PageHeader
        titulo="DRE contábil — Nitaplast 06/2026"
        descricao="A DRE é apurada pelo movimento das contas de resultado que formam o balancete. A DRE enviada ao cliente permanece somente como controle para localizar diferenças."
        acoes={<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Fonte: Balancete 06/2026</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Receita pelo balancete" value={resumoDreBalancete.receitaBruta} />
        <Metric label="Resultado pelo balancete" value={resultadoLiquidoBalancete} success={resultadoLiquidoBalancete >= 0} />
        <Metric label="Resultado do controle" value={lucroControle} success={lucroControle >= 0} />
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Diferença absoluta mapeada</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${diferencaAbsolutaDre <= tolerancia ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(diferencaAbsolutaDre)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="font-medium">Regime tributário confirmado</p>
            <p className="text-sm text-muted-foreground">{cadastroFiscalNitaplast.regimeTributario} por {cadastroFiscalNitaplast.formaApuracaoIrpjCsll.toLocaleLowerCase("pt-BR")}.</p>
          </div>
          <Badge variant="outline">Confirmado pelo cliente</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Apurado no balancete x controle esperado</CardTitle>
              <CardDescription>
                Nenhum valor é forçado para fechar com o controle. A coluna “Balancete” nasce exclusivamente dos lançamentos do razão; a diferença mostra onde o fechamento ainda precisa ser explicado.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/contabil/balancete">Abrir Balancete <ExternalLink className="ml-2 size-4" /></Link></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Linha da DRE</th>
                <th className="p-2 text-right">Balancete</th>
                <th className="p-2 text-right">Controle esperado</th>
                <th className="p-2 text-right">Diferença</th>
                <th className="p-2 text-center">Situação</th>
              </tr>
            </thead>
            <tbody>
              {comparacaoDreBalancete.map((linha) => {
                const grupo = linha.id === "resultado" ? undefined : linha.id as GrupoDreBalancete;
                const contas = grupo ? contasResultadoPorGrupo[grupo] : [];
                const podeAbrir = contas.length > 0;
                const aberta = abertas.has(linha.id);
                const ok = Math.abs(linha.diferenca) <= tolerancia;
                return [
                  <tr key={linha.id} className={linha.id === "resultado" ? "border-y-2 bg-primary/5 font-semibold" : "border-b"}>
                    <td className="p-2">
                      <button type="button" className={`inline-flex items-center gap-1.5 text-left ${podeAbrir ? "cursor-pointer hover:text-primary" : "cursor-default"}`} onClick={() => podeAbrir && alternar(linha.id)}>
                        {podeAbrir ? (aberta ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />) : <span className="inline-block w-4" />}
                        {linha.descricao}
                      </button>
                    </td>
                    <Money value={linha.apuradoBalancete} strong={linha.id === "resultado"} />
                    <Money value={linha.controleEsperado} />
                    <td className={`p-2 text-right font-medium tabular-nums ${ok ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(linha.diferenca)}</td>
                    <td className="p-2 text-center">{ok
                      ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Confere</span>
                      : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Investigar</span>}
                    </td>
                  </tr>,
                  podeAbrir && aberta ? <tr key={`${linha.id}-contas`} className="border-b bg-slate-50/70"><td colSpan={5} className="p-3 pl-8"><TabelaContas grupo={grupo!} /></td></tr> : null,
                ];
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {resumoDreBalancete.contasSemVinculo > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CircleAlert className="size-5 text-amber-700" />Contas de resultado ainda sem vínculo na estrutura da DRE</CardTitle>
            <CardDescription>
              São contas 4.x/5.x movimentadas no balancete que não foram silenciosamente descartadas. Elas permanecem expostas até definirmos a linha correta da DRE.
            </CardDescription>
          </CardHeader>
          <CardContent><TabelaContas grupo="sem-vinculo" /></CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="flex items-center gap-2 pt-6 text-sm"><CheckCircle2 className="size-5 text-emerald-700" />Todas as contas de resultado movimentadas possuem grupo na DRE calculada.</CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DRE enviada ao cliente — referência de controle</CardTitle>
          <CardDescription>Esta tabela não gera lançamentos e não substitui o balancete. Serve apenas como referência para explicar as diferenças acima.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Linha</th><th className="p-2">Origem do controle</th><th className="p-2 text-right">Valor</th></tr></thead>
            <tbody>{dreCompletaJunho.map((linha) => <tr key={linha.id} className={linha.tipo === "resultado" ? "border-y bg-muted/20 font-semibold" : "border-b"}>
              <td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 22 }}>{linha.descricao}</td>
              <td className="p-2 text-xs text-muted-foreground">{linha.origem}</td>
              <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
            </tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function TabelaContas({ grupo }: { grupo: GrupoDreBalancete }) {
  const contas = contasResultadoPorGrupo[grupo];
  return <div className="overflow-x-auto rounded-md border bg-background">
    <table className="w-full min-w-[900px] text-xs">
      <thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2 text-right">Débitos</th><th className="p-2 text-right">Créditos</th><th className="p-2 text-right">Efeito no resultado</th></tr></thead>
      <tbody>{contas.map((conta) => <tr key={conta.codigo} className="border-b last:border-0"><td className="p-2 font-mono font-medium">{conta.codigo}</td><td className="p-2 font-mono">{conta.classificacao}</td><td className="p-2">{conta.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(conta.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(conta.creditos)}</td><td className={`p-2 text-right font-medium tabular-nums ${conta.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{brl.format(conta.resultado)}</td></tr>)}</tbody>
    </table>
  </div>;
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{brl.format(value)}</td>;
}
