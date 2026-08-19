import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";

export const Route = createFileRoute("/contabil/razao-aplicacoes")({
  component: RazaoAplicacoesPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const contaReceitaAplicacoes = "25098";

function RazaoAplicacoesPage() {
  const linhas = lancamentosIntegradosJulhoFinal.filter(
    (linha) => linha.debitoCodigo === contaReceitaAplicacoes || linha.creditoCodigo === contaReceitaAplicacoes,
  );

  const debitos = linhas.reduce(
    (total, linha) => total + (linha.debitoCodigo === contaReceitaAplicacoes ? linha.valor : 0),
    0,
  );
  const creditos = linhas.reduce(
    (total, linha) => total + (linha.creditoCodigo === contaReceitaAplicacoes ? linha.valor : 0),
    0,
  );
  const movimento = debitos - creditos;

  return (
    <PageShell>
      <div className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Razão — Receitas de Aplicações Financeiras</h1>
              <Badge variant="outline">Conta 25098</Badge>
              <Badge variant="outline">07/2026</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Evidência visual da receita financeira que alimenta o Balancete e a DRE de julho.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.assign("/contabil/razao?conta=25098")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Abrir Razão completo filtrado
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Resumo label="Conta contábil" texto="25098" />
          <Resumo label="Partidas localizadas" texto={String(linhas.length)} />
          <Resumo label="Créditos em julho" texto={brl.format(creditos)} />
          <Resumo label="Movimento líquido" texto={brl.format(movimento)} />
        </div>

        <Card className="border-emerald-500/40 bg-emerald-50/40">
          <CardContent className="pt-5 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-800">Rastreabilidade visível: Razão → Balancete → DRE</p>
                <p className="mt-1 text-muted-foreground">
                  Estes valores não são criados na DRE. Todas as receitas de aplicações abaixo existem como partidas da conta 25098 no Razão de 07/2026.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição da conta 25098 — Rendimentos de Aplicações</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs">
                  <th className="p-2">Data</th>
                  <th className="p-2">Origem</th>
                  <th className="p-2">Débito</th>
                  <th className="p-2">Crédito</th>
                  <th className="p-2">Histórico</th>
                  <th className="p-2">Documento / Fonte</th>
                  <th className="p-2">Centro de custo</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.id} className="border-b align-top last:border-0">
                    <td className="p-2 whitespace-nowrap">{linha.data}</td>
                    <td className="p-2">
                      <p className="font-medium">{linha.origem}</p>
                      <p className="font-mono text-xs text-muted-foreground">{linha.id}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-mono">{linha.debitoCodigo}</p>
                      <p className="text-xs text-muted-foreground">{linha.debito.replace(`${linha.debitoCodigo} - `, "")}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-mono font-semibold">{linha.creditoCodigo}</p>
                      <p className="text-xs text-muted-foreground">{linha.credito.replace(`${linha.creditoCodigo} - `, "")}</p>
                    </td>
                    <td className="p-2 max-w-[360px]">{linha.historico}</td>
                    <td className="p-2 max-w-[420px]">
                      <p>{linha.documento}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{linha.fonte}</p>
                    </td>
                    <td className="p-2">
                      <p className="font-mono">{linha.cc}</p>
                      <p className="text-xs text-muted-foreground">{linha.centroCusto}</p>
                    </td>
                    <td className="p-2 text-right font-semibold tabular-nums">{brl.format(linha.valor)}</td>
                    <td className="p-2">
                      <Badge variant="outline">{linha.status === "validado" ? "Validado" : "Revisar"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/40 font-semibold">
                  <td className="p-2" colSpan={7}>Total de créditos na conta 25098 em 07/2026</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(creditos)}</td>
                  <td className="p-2">{linhas.length} partidas</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Resumo({ label, texto }: { label: string; texto: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{texto}</p>
      </CardContent>
    </Card>
  );
}
