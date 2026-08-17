import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { lancamentosIntegrados } from "@/data/nitaplast-razao-integrado";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/relatorios/razao")({ component: RazaoReportPage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function chaveData(data: string) {
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return data;
}

function RazaoReportPage() {
  useNitaplastJunho();

  const contasComMovimento = useMemo(() => {
    const codigos = new Set<string>();
    for (const linha of lancamentosIntegrados) {
      codigos.add(linha.debitoCodigo);
      codigos.add(linha.creditoCodigo);
    }
    return saldosImplantacao
      .filter((conta) => codigos.has(conta.conta))
      .sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR", { numeric: true }) || a.conta.localeCompare(b.conta));
  }, []);

  const [contaSelecionada, setContaSelecionada] = useState(contasComMovimento[0]?.conta ?? "");
  const conta = saldosImplantacao.find((item) => item.conta === contaSelecionada);

  const linhas = useMemo(() => {
    if (!contaSelecionada) return [];
    let saldo = conta ? (conta.natureza === "C" ? -Math.abs(conta.saldo) : Math.abs(conta.saldo)) : 0;
    return [...lancamentosIntegrados]
      .filter((linha) => linha.debitoCodigo === contaSelecionada || linha.creditoCodigo === contaSelecionada)
      .sort((a, b) => chaveData(a.data).localeCompare(chaveData(b.data)) || a.id.localeCompare(b.id))
      .map((linha) => {
        const debito = linha.debitoCodigo === contaSelecionada ? linha.valor : 0;
        const credito = linha.creditoCodigo === contaSelecionada ? linha.valor : 0;
        saldo += debito - credito;
        return { ...linha, debito, credito, saldo };
      });
  }, [conta, contaSelecionada]);

  const saldoAnterior = conta ? (conta.natureza === "C" ? -Math.abs(conta.saldo) : Math.abs(conta.saldo)) : 0;
  const debitos = linhas.reduce((total, linha) => total + linha.debito, 0);
  const creditos = linhas.reduce((total, linha) => total + linha.credito, 0);
  const saldoFinal = saldoAnterior + debitos - creditos;

  return (
    <PageShell>
      <PageHeader
        titulo="Razão Report — Nitaplast"
        descricao="Razão analítico da competência 06/2026. O saldo final desta tela é o mesmo usado pelo Balancete."
        acoes={<Badge variant="outline">06/2026</Badge>}
      />

      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(320px,1fr)_repeat(4,minmax(150px,auto))] lg:items-end">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Conta contábil
              <select value={contaSelecionada} onChange={(e) => setContaSelecionada(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm text-foreground">
                {contasComMovimento.map((item) => <option key={item.conta} value={item.conta}>{item.conta} · {item.classificacao} · {item.descricao}</option>)}
              </select>
            </label>
            <Metric label="Saldo anterior" value={saldoAnterior} />
            <Metric label="Débitos" value={debitos} />
            <Metric label="Créditos" value={creditos} />
            <Metric label="Saldo final" value={saldoFinal} strong />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1300px] text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Data</th><th className="p-2">Lançamento</th><th className="p-2">Contrapartida</th><th className="p-2">Histórico</th><th className="p-2">Documento</th><th className="p-2">CC</th><th className="p-2 text-right">Débito</th><th className="p-2 text-right">Crédito</th><th className="p-2 text-right">Saldo</th>
              </tr></thead>
              <tbody>{linhas.map((linha) => {
                const contrapartida = linha.debitoCodigo === contaSelecionada ? linha.credito : linha.debito;
                return <tr key={linha.id} className="border-b last:border-0">
                  <td className="p-2 whitespace-nowrap">{linha.data}</td>
                  <td className="p-2 font-mono text-xs">{linha.id}</td>
                  <td className="p-2">{contrapartida}</td>
                  <td className="p-2">{linha.historico}</td>
                  <td className="p-2 font-mono text-xs">{linha.documento || "—"}</td>
                  <td className="p-2">{linha.cc && linha.cc !== "0" ? linha.cc : "—"}</td>
                  <td className="p-2 text-right tabular-nums">{linha.debito ? brl.format(linha.debito) : "—"}</td>
                  <td className="p-2 text-right tabular-nums">{linha.credito ? brl.format(linha.credito) : "—"}</td>
                  <td className="p-2 text-right font-medium tabular-nums">{brl.format(linha.saldo)}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className="rounded-md border px-3 py-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-1 text-sm tabular-nums ${strong ? "font-bold" : "font-medium"}`}>{brl.format(value)}</p></div>;
}
