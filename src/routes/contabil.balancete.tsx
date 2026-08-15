import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Search, TriangleAlert } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { balanceteProvisorio } from "@/data/nitaplast-junho";
import { resumoImplantacao, saldosImplantacao } from "@/data/nitaplast-implantacao";

export const Route = createFileRoute("/contabil/balancete")({ component: BalancetePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const grupos = ["Todos", "Ativo", "Passivo e patrimônio líquido", "Receitas acumuladas", "Custos e despesas acumulados", "Contas compensatórias"] as const;

function BalancetePage() {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<(typeof grupos)[number]>("Todos");

  const contas = useMemo(() => {
    const q = busca.toLocaleLowerCase("pt-BR").trim();
    return saldosImplantacao.filter((linha) => {
      const correspondeGrupo = grupo === "Todos" || linha.grupo === grupo;
      const correspondeBusca = !q || [linha.conta, linha.classificacao, linha.descricao].join(" ").toLocaleLowerCase("pt-BR").includes(q);
      return correspondeGrupo && correspondeBusca;
    });
  }, [busca, grupo]);

  const diferenca = resumoImplantacao.totalDebitosComCompensatorias - resumoImplantacao.totalCreditosComCompensatorias;

  return (
    <PageShell>
      <PageHeader
        titulo="Balancete e implantação — Nitaplast"
        descricao="Implantação analítica conta a conta em 31/05/2026, seguida do movimento provisório de junho."
        acoes={<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">338 contas implantadas</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ativo em 31/05" value={resumoImplantacao.ativo} />
        <Metric label="Passivo + PL em 31/05" value={resumoImplantacao.passivoPatrimonioLiquido} />
        <Metric label="Resultado acumulado JAN-MAI" value={resumoImplantacao.receitasAcumuladas - resumoImplantacao.custosDespesasAcumulados} success />
        <Metric label="Compensatórias por lado" value={resumoImplantacao.contasCompensatorias / 2} />
      </div>

      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-medium">Implantação equilibrada conta a conta</p>
            <p className="text-sm text-muted-foreground">
              Débitos {brl.format(resumoImplantacao.totalDebitosComCompensatorias)} • Créditos {brl.format(resumoImplantacao.totalCreditosComCompensatorias)} • Diferença {brl.format(diferenca)}.
              As contas compensatórias foram mantidas em grupo separado.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Saldo de implantação em 31/05/2026</CardTitle>
              <CardDescription>
                Somente contas analíticas com saldo anterior diferente de zero. Os totais sintéticos são formados automaticamente por estas contas.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar código, classificação ou conta" className="pl-9" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {grupos.map((item) => (
              <button
                key={item}
                onClick={() => setGrupo(item)}
                className={`rounded-md border px-3 py-1.5 text-xs ${grupo === item ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <p className="mb-3 text-xs text-muted-foreground">{contas.length} de {saldosImplantacao.length} contas exibidas.</p>
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Conta</th>
                <th className="p-2">Classificação</th>
                <th className="p-2">Descrição</th>
                <th className="p-2">Grupo</th>
                <th className="p-2 text-right">Débito</th>
                <th className="p-2 text-right">Crédito</th>
                <th className="p-2 text-center">Natureza</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((linha) => (
                <tr key={`${linha.conta}-${linha.classificacao}`} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs">{linha.conta}</td>
                  <td className="p-2 font-mono text-xs">{linha.classificacao}</td>
                  <td className="p-2">{linha.descricao}</td>
                  <td className="p-2 text-xs text-muted-foreground">{linha.grupo}</td>
                  <td className="p-2 text-right tabular-nums">{linha.natureza === "D" ? brl.format(Math.abs(linha.saldo)) : "—"}</td>
                  <td className="p-2 text-right tabular-nums">{linha.natureza === "C" ? brl.format(Math.abs(linha.saldo)) : "—"}</td>
                  <td className="p-2 text-center"><Badge variant="outline">{linha.natureza}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimento provisório de junho</CardTitle>
          <CardDescription>
            Esta parte ainda será distribuída nas mesmas contas analíticas após a classificação completa do Razão.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Conta/grupo</th>
                <th className="p-2">Descrição</th>
                <th className="p-2 text-right">Saldo anterior</th>
                <th className="p-2 text-right">Débito</th>
                <th className="p-2 text-right">Crédito</th>
                <th className="p-2 text-right">Saldo atual</th>
                <th className="p-2 text-center">N</th>
              </tr>
            </thead>
            <tbody>
              {balanceteProvisorio.slice(4).map((linha) => (
                <tr key={linha.conta} className="border-b last:border-0">
                  <td className="p-2 font-mono">{linha.conta}</td>
                  <td className="p-2">{linha.descricao}</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(linha.anterior)}</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(linha.debito)}</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(linha.credito)}</td>
                  <td className="p-2 text-right font-medium tabular-nums">{brl.format(linha.atual)}</td>
                  <td className="p-2 text-center">{linha.natureza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 pt-6">
          <TriangleAlert className="size-4 shrink-0 text-amber-700" />
          <p className="text-sm text-muted-foreground">
            A implantação de 31/05 está analítica e equilibrada. O movimento de junho permanece provisório até a distribuição completa das despesas, fornecedores, clientes e centros de custo.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p>
      </CardContent>
    </Card>
  );
}
