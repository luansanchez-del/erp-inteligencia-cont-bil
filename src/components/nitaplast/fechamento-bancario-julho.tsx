import type { ReactNode } from "react";
import { BrainCircuit, CheckCircle2, ShieldAlert, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resumoBancoJulho } from "@/data/nitaplast-inteligencia-bancaria-julho";

export function FechamentoBancarioJulho() {
  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4" /> Conciliação bancária documental</CardTitle>
            <CardDescription>Extratos já recebidos e processados pelo motor de identificação. Banco não é fonte pendente.</CardDescription>
          </div>
          <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">fontes recebidas</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<WalletCards className="size-4" />} label="Movimentos lidos" value={resumoBancoJulho.movimentosExtrato} detail={`${resumoBancoJulho.fontesRecebidas} fontes bancárias`} />
          <Metric icon={<CheckCircle2 className="size-4" />} label="Conciliados na origem" value={resumoBancoJulho.conciliadosNaOrigem} detail="Já conciliados na base entregue" />
          <Metric icon={<BrainCircuit className="size-4" />} label="Identificados pelo motor" value={resumoBancoJulho.identificados} detail="Sem transformar identificação em lançamento automático" />
          <Metric icon={<ShieldAlert className="size-4" />} label="Revisão bancária real" value={resumoBancoJulho.revisar} detail="1 débito Itaú de R$ 25 mil sem contrapartida segura" warning />
        </div>
        <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>{resumoBancoJulho.resultadoFinanceiroManual} movimentos de juros/rendimentos estão identificados e permanecem manuais, conforme regra do fechamento.</span>
          <a href="/contabil/conciliacao" className="shrink-0 font-medium text-primary hover:underline">Abrir conciliação detalhada</a>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, detail, warning = false }: { icon: ReactNode; label: string; value: number; detail: string; warning?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${warning ? "border-amber-300 bg-amber-50/50" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
