import { AlertTriangle, CheckCircle2, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cambioFermaq92249,
  cambioJhs93077,
  cambioJhs93556,
  contratosCambioJulhoPendentes,
  variacaoCambialAtivaValidada,
  variacaoCambialPassivaValidada,
} from "@/data/nitaplast-financeiro-julho";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const arred = (valor: number) => Math.round(valor * 100) / 100;

const composicao = [
  { id: "JUL-CAMBIO-JHS-93556-VCA", natureza: "Ativa", conta: "25096", data: "27/07/2026", contraparte: "JHS International", documento: "NF 93556 · INV JXGX20260328624 · contrato 617226937", base: cambioJhs93556.valorContabilObrigacao, liquidacao: cambioJhs93556.valorLiquidado, formula: "Obrigação contábil − valor liquidado", valor: cambioJhs93556.variacaoAtiva },
  { id: "JUL-CAMBIO-FERMAQ-92249-VCP", natureza: "Passiva", conta: "25109", data: "27/07/2026", contraparte: "Fermaq", documento: "DP 92249/003 · contrato 617257802", base: cambioFermaq92249.valorContabilDireito, liquidacao: cambioFermaq92249.valorRecebido, formula: "Valor recebido − direito contábil", valor: cambioFermaq92249.variacaoPassiva },
  { id: "JUL-CAMBIO-JHS-16094-VCP", natureza: "Passiva", conta: "25109", data: "03/07/2026", contraparte: "JHS International", documento: "NF 93077 · OC 16094 · INV JXGX20260326616 · contrato 610005759", base: cambioJhs93077.valorContabilObrigacao, liquidacao: cambioJhs93077.valorLiquidado, formula: "Valor liquidado − obrigação contábil", valor: cambioJhs93077.variacaoPassiva },
] as const;

const totalRazao = (conta: string) => arred(lancamentosIntegradosJulhoFinal.reduce((total, lancamento) => {
  const debito = lancamento.debitoCodigo === conta ? lancamento.valor : 0;
  const credito = lancamento.creditoCodigo === conta ? lancamento.valor : 0;
  return total + (conta === "25096" ? credito - debito : debito - credito);
}, 0));

const totalAtivaRazao = totalRazao("25096");
const totalPassivaRazao = totalRazao("25109");
if (Math.abs(totalAtivaRazao - variacaoCambialAtivaValidada) > 0.01) throw new Error("Composição da variação cambial ativa não fecha com o Razão.");
if (Math.abs(totalPassivaRazao - variacaoCambialPassivaValidada) > 0.01) throw new Error("Composição da variação cambial passiva não fecha com o Razão.");

export function ComposicaoVariacaoCambialJulho() {
  return <Card className="border-sky-500/40">
    <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><Coins className="size-5"/> Composição da variação cambial — 07/2026</CardTitle><CardDescription>Somente diferenças realizadas e amarradas ao título, contrato e liquidação. Os totais fecham com o Razão e a DRE.</CardDescription></div><Badge variant="outline" className="border-emerald-600 text-emerald-800"><CheckCircle2 className="mr-1 size-3.5"/> Conciliado</Badge></div></CardHeader>
    <CardContent className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3"><Resumo label="Ativa · conta 25096" valor={totalAtivaRazao} detalhe="2 lançamentos a crédito"/><Resumo label="Passiva · conta 25109" valor={totalPassivaRazao} detalhe="1 lançamento a débito"/><Resumo label="Efeito líquido favorável" valor={arred(totalAtivaRazao-totalPassivaRazao)} detalhe="Ativa menos passiva"/></div>
      <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[1050px] text-sm">
        <thead className="bg-muted/50 text-left text-xs"><tr><th className="p-3">Natureza / conta</th><th className="p-3">Data</th><th className="p-3">Contraparte e documento</th><th className="p-3 text-right">Valor contábil</th><th className="p-3 text-right">Liquidação</th><th className="p-3">Cálculo</th><th className="p-3 text-right">Variação</th></tr></thead>
        <tbody>{composicao.map(item=><tr key={item.id} className="border-t align-top"><td className="p-3"><Badge variant="outline">{item.natureza}</Badge><div className="mt-1 font-mono text-xs">{item.conta}</div></td><td className="p-3 whitespace-nowrap">{item.data}</td><td className="p-3"><div className="font-medium">{item.contraparte}</div><div className="mt-1 text-xs text-muted-foreground">{item.documento}</div></td><td className="p-3 text-right tabular-nums">{brl.format(item.base)}</td><td className="p-3 text-right tabular-nums">{brl.format(item.liquidacao)}</td><td className="p-3 text-xs text-muted-foreground">{item.formula}</td><td className="p-3 text-right font-semibold tabular-nums">{brl.format(item.valor)}</td></tr>)}</tbody>
        <tfoot className="border-t-2 font-semibold"><tr><td className="p-3" colSpan={6}>Total variação cambial ativa — Razão 25096</td><td className="p-3 text-right tabular-nums">{brl.format(totalAtivaRazao)}</td></tr><tr><td className="p-3" colSpan={6}>Total variação cambial passiva — Razão 25109</td><td className="p-3 text-right tabular-nums">{brl.format(totalPassivaRazao)}</td></tr></tfoot>
      </table></div>
      <div className="rounded-md border border-amber-400/60 bg-amber-50/50 p-4"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700"/><div><p className="font-medium">Contratos fora da composição — aguardando documento de origem</p><p className="mt-1 text-xs text-muted-foreground">Não entram no Razão, na DRE nem nos totais acima até que o título contábil seja identificado.</p></div></div>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[850px] text-xs"><thead><tr className="border-b text-left"><th className="py-2 pr-3">Contrato</th><th className="py-2 pr-3">Data</th><th className="py-2 pr-3">Beneficiário</th><th className="py-2 pr-3 text-right">USD</th><th className="py-2 pr-3 text-right">Liquidação BRL</th><th className="py-2">Motivo</th></tr></thead><tbody>{contratosCambioJulhoPendentes.map(item=><tr key={item.contrato} className="border-b last:border-0 align-top"><td className="py-2 pr-3 font-mono">{item.contrato}</td><td className="py-2 pr-3 whitespace-nowrap">{item.data}</td><td className="py-2 pr-3">{item.beneficiario}</td><td className="py-2 pr-3 text-right tabular-nums">{usd.format(item.usd)}</td><td className="py-2 pr-3 text-right tabular-nums">{brl.format(item.brl)}</td><td className="py-2 text-muted-foreground">{item.motivo}</td></tr>)}</tbody></table></div>
      </div>
    </CardContent>
  </Card>;
}

function Resumo({label,valor,detalhe}:{label:string;valor:number;detalhe:string}) { return <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{brl.format(valor)}</p><p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p></div>; }
