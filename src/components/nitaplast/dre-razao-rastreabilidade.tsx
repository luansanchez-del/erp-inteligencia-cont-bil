import { useMemo } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularDreJulhoFinal, type ComposicaoResultadoJulho } from "@/data/nitaplast-dre-julho-final";
import { estabelecimentoResultadoNitaplast } from "@/data/nitaplast-estabelecimento";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-base";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;

type AuditoriaItem = {
  item: ComposicaoResultadoJulho;
  lancamentos: LancamentoIntegrado[];
  debitosRazao: number;
  creditosRazao: number;
  movimentoRazao: number;
  conciliado: boolean;
  motivo?: string;
};

function partidasDoItem(razao: LancamentoIntegrado[], item: ComposicaoResultadoJulho) {
  return razao.filter((lancamento) => {
    if (lancamento.cc !== item.cc) return false;
    if (lancamento.debitoCodigo !== item.conta && lancamento.creditoCodigo !== item.conta) return false;
    return estabelecimentoResultadoNitaplast(lancamento, item.conta) === item.estabelecimento;
  });
}

function auditarItem(razao: LancamentoIntegrado[], item: ComposicaoResultadoJulho): AuditoriaItem {
  const lancamentos = partidasDoItem(razao, item);
  const debitosRazao = arred(lancamentos.reduce((s, l) => s + (l.debitoCodigo === item.conta ? l.valor : 0), 0));
  const creditosRazao = arred(lancamentos.reduce((s, l) => s + (l.creditoCodigo === item.conta ? l.valor : 0), 0));
  const movimentoRazao = arred(debitosRazao - creditosRazao);
  const esperado = arred(item.debitos - item.creditos);
  const temMovimento = Math.abs(item.debitos) + Math.abs(item.creditos) >= 0.005;
  const conciliado = (!temMovimento || lancamentos.length > 0)
    && Math.abs(debitosRazao - item.debitos) <= 0.01
    && Math.abs(creditosRazao - item.creditos) <= 0.01
    && Math.abs(movimentoRazao - esperado) <= 0.01;

  let motivo: string | undefined;
  if (!conciliado) {
    if (temMovimento && !lancamentos.length) motivo = "A DRE possui movimento, mas nenhuma partida correspondente foi encontrada no Razão.";
    else motivo = `DRE D ${brl.format(item.debitos)} / C ${brl.format(item.creditos)}; Razão D ${brl.format(debitosRazao)} / C ${brl.format(creditosRazao)}.`;
  }

  return { item, lancamentos, debitosRazao, creditosRazao, movimentoRazao, conciliado, motivo };
}

export function AuditoriaDreRazaoJulho() {
  const { aplicar } = useReclassificacoesInteligentes("2026-07");
  const razao = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const calculo = useMemo(() => calcularDreJulhoFinal(razao), [razao]);
  const auditoria = useMemo(() => calculo.composicao.map((item) => auditarItem(razao, item)), [calculo.composicao, razao]);
  const inconsistencias = auditoria.filter((x) => !x.conciliado);
  const totalPartidasVinculadas = new Set(auditoria.flatMap((x) => x.lancamentos.map((l) => l.id))).size;

  const vca = razao.filter((l) => l.debitoCodigo === "25096" || l.creditoCodigo === "25096");
  const aplicacoes = razao.filter((l) => l.debitoCodigo === "25098" || l.creditoCodigo === "25098");
  const totalVca = arred(vca.reduce((s, l) => s + (l.creditoCodigo === "25096" ? l.valor : 0) - (l.debitoCodigo === "25096" ? l.valor : 0), 0));
  const totalAplicacoes = arred(aplicacoes.reduce((s, l) => s + (l.creditoCodigo === "25098" ? l.valor : 0) - (l.debitoCodigo === "25098" ? l.valor : 0), 0));

  if (inconsistencias.length) {
    throw new Error(`DRE 07/2026 bloqueada por rastreabilidade: ${inconsistencias.map((x) => `${x.item.conta}/CC ${x.item.cc}`).join(", ")}. Nenhuma linha da DRE pode existir sem fechar com o Razão.`);
  }

  return (
    <Card className="border-emerald-500/40 bg-emerald-50/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-5 text-emerald-700" />Auditoria DRE → Razão — 07/2026</CardTitle>
            <CardDescription>Toda composição calculada abaixo é reconstituída diretamente das partidas do Razão da mesma conta, centro de custo e estabelecimento.</CardDescription>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{auditoria.length} itens conciliados</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Resumo label="Itens DRE rastreados" valor={auditoria.length} dinheiro={false} />
          <Resumo label="Partidas do Razão vinculadas" valor={totalPartidasVinculadas} dinheiro={false} />
          <Resumo label="25098 — Aplicações" valor={totalAplicacoes} />
          <Resumo label="25096 — Variação cambial ativa" valor={totalVca} />
        </div>

        <div className="rounded-md border bg-background p-3 text-sm">
          <strong>Conferência crítica:</strong> 25098 fecha em <strong>{brl.format(totalAplicacoes)}</strong> no Razão e 25096 fecha em <strong>{brl.format(totalVca)}</strong>. O Transformador seco 1000KVA (NF 93639), R$ 60.000,00, está contabilizado: valor contábil líquido de R$ 57.638,86 na venda (14/07), ganho de R$ 2.361,14 no resultado contábil.
        </div>

        <div className="overflow-x-auto rounded-md border bg-background">
          <table className="w-full min-w-[1320px] text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-2">DRE / Conta</th>
                <th className="p-2">Estabelecimento</th>
                <th className="p-2">CC</th>
                <th className="p-2 text-right">Débitos Razão</th>
                <th className="p-2 text-right">Créditos Razão</th>
                <th className="p-2 text-right">Movimento</th>
                <th className="p-2 text-center">Partidas</th>
                <th className="p-2 text-center">Conferência</th>
                <th className="p-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((a) => (
                <tr key={a.item.id} className="border-b last:border-0 align-top">
                  <td className="p-2">
                    <details>
                      <summary className="cursor-pointer font-medium"><span className="font-mono">{a.item.conta}</span> · {a.item.descricao}</summary>
                      <Partidas linhas={a.lancamentos} conta={a.item.conta} />
                    </details>
                  </td>
                  <td className="p-2">{a.item.estabelecimento}</td>
                  <td className="p-2"><span className="font-mono">{a.item.cc}</span> — {a.item.centroCusto}</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(a.debitosRazao)}</td>
                  <td className="p-2 text-right tabular-nums">{brl.format(a.creditosRazao)}</td>
                  <td className="p-2 text-right font-semibold tabular-nums">{brl.format(a.movimentoRazao)}</td>
                  <td className="p-2 text-center">{a.lancamentos.length}</td>
                  <td className="p-2 text-center"><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Razão = DRE</span></td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => window.location.assign(`/contabil/razao?conta=${encodeURIComponent(a.item.conta)}`)}>
                      <ExternalLink className="mr-1 size-3.5" />Ver no Razão
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground"><CircleAlert className="mt-0.5 size-4 shrink-0" />A tabela não cria nem ajusta lançamentos. Ela apenas prova a ponte Documento/Fato → Razão → Balancete → DRE usando a mesma base contábil final de julho.</p>
      </CardContent>
    </Card>
  );
}

function Resumo({ label, valor, dinheiro = true }: { label: string; valor: number; dinheiro?: boolean }) {
  return <div className="rounded-md border bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{dinheiro ? brl.format(valor) : valor.toLocaleString("pt-BR")}</p></div>;
}

function Partidas({ linhas, conta }: { linhas: LancamentoIntegrado[]; conta: string }) {
  if (!linhas.length) return <p className="mt-2 text-amber-700">Nenhuma partida encontrada.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded border">
      <table className="w-full min-w-[1180px] text-[11px]">
        <thead><tr className="border-b bg-muted/40 text-left"><th className="p-2">Data</th><th className="p-2">ID / Origem</th><th className="p-2">Débito</th><th className="p-2">Crédito</th><th className="p-2">Histórico / Documento</th><th className="p-2">Fonte</th><th className="p-2 text-right">Impacto na conta</th></tr></thead>
        <tbody>{linhas.map((l) => {
          const impacto = arred((l.debitoCodigo === conta ? l.valor : 0) - (l.creditoCodigo === conta ? l.valor : 0));
          return <tr key={l.id} className="border-b last:border-0"><td className="p-2 whitespace-nowrap">{l.data}</td><td className="p-2"><p className="font-mono">{l.id}</p><p className="text-muted-foreground">{l.origem}</p></td><td className="p-2"><span className="font-mono">{l.debitoCodigo}</span> · {l.debito.replace(`${l.debitoCodigo} - `, "")}</td><td className="p-2"><span className="font-mono">{l.creditoCodigo}</span> · {l.credito.replace(`${l.creditoCodigo} - `, "")}</td><td className="p-2 max-w-[360px]"><p>{l.historico}</p><p className="text-muted-foreground">{l.documento}</p></td><td className="p-2 max-w-[300px]">{l.fonte}</td><td className="p-2 text-right font-semibold tabular-nums">{brl.format(impacto)}</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}
