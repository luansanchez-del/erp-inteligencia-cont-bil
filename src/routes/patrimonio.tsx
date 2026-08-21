import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, CheckCircle2, CircleAlert, Landmark } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useErp } from "@/context/erp-context";
import { posicoesImobilizadoJulho, resumoFechamentoJulhoFinal } from "@/data/nitaplast-razao-julho-final";
import { totalMensalReferenciaDepreciacaoJunho } from "@/data/nitaplast-imobilizado";
import { inventarioImobilizadoImplantacaoMaio, resumoInventarioImobilizadoImplantacaoMaio } from "@/data/nitaplast-imobilizado";

export const Route = createFileRoute("/patrimonio")({
  head: () => ({
    meta: [
      { title: "Imobilizado — ERP Contábil" },
      { name: "description", content: "Controle do imobilizado e cálculo contábil de depreciação." },
      { property: "og:title", content: "Imobilizado — ERP Contábil" },
      { property: "og:description", content: "Controle do imobilizado e cálculo contábil de depreciação." },
    ],
  }),
  component: ImobilizadoPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ImobilizadoPage() {
  const { competencia } = useErp();
  const [calculado, setCalculado] = useState(false);

  if (competencia.id !== "2026-07") {
    return (
      <PageShell>
        <PageHeader titulo={`Imobilizado — ${competencia.label}`} descricao="O módulo está ativo. A memória de depreciação automatizada implantada neste fechamento está vinculada à competência 07/2026 da Nitaplast." />
        <Card className="border-amber-400/50 bg-amber-50/40">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Selecione <strong className="text-foreground">07/2026</strong> no topo para consultar os saldos do imobilizado, calcular a depreciação e abrir os lançamentos integrados ao Razão.
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Imobilizado — Nitaplast 07/2026"
        descricao="Saldos do imobilizado vindos do Balancete de 30/06 e movimentos da competência. O cálculo de julho não presume taxa nem vida útil."
        acoes={
          <Button onClick={() => setCalculado(true)}>
            <Calculator className="mr-2 size-4" />
            {calculado ? "Recalcular depreciação 07/2026" : "Calcular depreciação 07/2026"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Imobilizado bruto" value={posicoesImobilizadoJulho.totalBruto} />
        <Metric label="Depreciação acumulada" value={posicoesImobilizadoJulho.totalDepreciacaoAcumulada} />
        <Metric label="Saldo residual" value={posicoesImobilizadoJulho.totalResidual} />
        <Metric label="Depreciação 07/2026" value={posicoesImobilizadoJulho.totalDepreciacaoCalculada} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle className="text-base">Inventário de implantação — Domínio 31/05/2026</CardTitle><CardDescription>Contas contábeis e bens/centros de custo preservados do balancete anterior. Esta abertura não constitui lançamento de junho.</CardDescription></div>
            <Badge variant="outline">{resumoInventarioImobilizadoImplantacaoMaio.itens} fichas · {brl.format(resumoInventarioImobilizadoImplantacaoMaio.total)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Bem / centro de custo</th><th className="p-2">CC</th><th className="p-2">Conta do ativo</th><th className="p-2">Descrição contábil</th><th className="p-2">Dep. acumulada</th><th className="p-2">Despesa depreciação</th><th className="p-2 text-right">Saldo implantado</th><th className="p-2">Origem</th></tr></thead>
            <tbody>{inventarioImobilizadoImplantacaoMaio.map((item)=><tr key={item.id} className="border-b align-top"><td className="p-2 font-medium">{item.bem}</td><td className="p-2 font-mono">{item.cc}</td><td className="p-2 font-mono">{item.contaAtivo}</td><td className="p-2">{item.descricaoContaAtivo}</td><td className="p-2 font-mono">{item.contaDepreciacaoAcumulada??"A revisar"}</td><td className="p-2 font-mono">{item.contaDespesaDepreciacao??"A revisar"}</td><Money value={item.saldoImplantacao} strong/><td className="p-2 text-xs text-muted-foreground">Domínio · 31/05/2026</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 size-5 shrink-0 text-blue-700" />
            <div>
              <p className="font-medium">Critério de cálculo sem estimativa</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A base mensal automática é somente a depreciação efetivamente contabilizada em 06/2026, total de {brl.format(totalMensalReferenciaDepreciacaoJunho)}. Para cada grupo, julho usa o menor valor entre a recorrência mensal histórica e o saldo residual disponível. O cálculo nunca ultrapassa o custo bruto do ativo.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Grupos da filial e ativos sem parâmetro histórico seguro continuam visíveis, porém sem depreciação automática até existir regra documental própria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Cálculo por grupo contábil</CardTitle>
              <CardDescription>Base bruta, depreciação acumulada, residual e valor mensal calculado.</CardDescription>
            </div>
            <Badge variant="outline">{posicoesImobilizadoJulho.gruposCalculaveis} grupos com regra automática</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Grupo</th><th className="p-2">Contas do ativo</th><th className="p-2">Dep. acumulada</th><th className="p-2 text-right">Bruto</th><th className="p-2 text-right">Dep. acumulada</th><th className="p-2 text-right">Residual</th><th className="p-2 text-right">Base mensal</th><th className="p-2 text-right">Depreciação 07</th><th className="p-2 text-center">Status</th></tr></thead>
            <tbody>
              {posicoesImobilizadoJulho.grupos.map((grupo) => (
                <tr key={grupo.id} className="border-b align-top">
                  <td className="p-2"><p className="font-medium">{grupo.nome}</p>{grupo.observacao ? <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">{grupo.observacao}</p> : null}</td>
                  <td className="p-2 font-mono text-xs">{grupo.contasAtivo.join(", ")}</td>
                  <td className="p-2 font-mono text-xs">{grupo.contaDepreciacaoAcumulada ?? "—"}</td>
                  <Money value={grupo.bruto} />
                  <Money value={grupo.depreciacaoAcumulada} />
                  <Money value={grupo.residual} strong />
                  <Money value={grupo.mensalReferencia} />
                  <Money value={grupo.depreciacaoCalculada} strong />
                  <td className="p-2 text-center"><Status status={grupo.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {calculado ? (
        <Card className="border-emerald-500/40 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-emerald-700" /> Depreciação calculada e integrada ao Razão</CardTitle>
            <CardDescription>As mesmas partidas abaixo alimentam Razão, Diário, Balancete e DRE de 07/2026.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Histórico</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2 text-right">Valor</th><th className="p-2">Documento</th></tr></thead><tbody>{posicoesImobilizadoJulho.lancamentos.map((l) => <tr key={l.id} className="border-b"><td className="p-2">{l.historico}</td><td className="p-2 font-mono text-xs">{l.debitoCodigo}</td><td className="p-2 font-mono text-xs">{l.creditoCodigo}</td><Money value={l.valor} strong /><td className="p-2">{l.documento}</td></tr>)}</tbody></table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm">
              <span>Total calculado em 07/2026</span>
              <span className="font-semibold tabular-nums">{brl.format(resumoFechamentoJulhoFinal.depreciacaoJulho)}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle className="text-base">Contas analíticas do imobilizado</CardTitle><CardDescription>Ativos patrimoniais carregados da estrutura real da Nitaplast.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Conta</th><th className="p-2">Descrição</th><th className="p-2">Grupo</th><th className="p-2 text-right">Saldo</th><th className="p-2">Regra</th></tr></thead><tbody>{posicoesImobilizadoJulho.contas.map((conta) => <tr key={`${conta.grupoId}-${conta.conta}`} className="border-b"><td className="p-2 font-mono">{conta.conta}</td><td className="p-2">{conta.descricao}</td><td className="p-2">{conta.grupo}</td><Money value={conta.saldo} strong /><td className="p-2 text-xs text-muted-foreground">{conta.statusGrupo}</td></tr>)}</tbody></table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{brl.format(value)}</p></CardContent></Card>;
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{brl.format(value)}</td>;
}

function Status({ status }: { status: string }) {
  if (status === "calculavel") return <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Calculável</span>;
  if (status === "depreciado") return <Badge variant="outline">Integralmente depreciado</Badge>;
  if (status === "nao_depreciavel") return <Badge variant="outline">Não depreciável</Badge>;
  return <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Sem regra automática</span>;
}
