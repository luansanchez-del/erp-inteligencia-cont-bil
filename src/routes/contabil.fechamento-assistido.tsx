import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  FileCheck2,
  Landmark,
  ReceiptText,
  Scale,
} from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/fechamento-assistido")({
  head: () => ({
    meta: [
      { title: "Nitaplast 06/2026 - Fechamento Assistido" },
      { name: "description", content: "Fechamento contábil da Nitaplast para junho de 2026." },
    ],
  }),
  component: FechamentoAssistidoPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const fontes = [
  ["Saldo de implantação", "Saldo anterior do balancete de junho usado como 31/05/2026", "validado"],
  ["Entradas e saídas", "Totais fiscais recebidos; notas por centro de custo ainda não carregadas no razão", "pendente"],
  ["Movimentação bancária", "Extrato completo de 01/06 a 30/06/2026", "validado"],
  ["Folha mensal", "Folha 06/2026 da matriz, 12 colaboradores", "validado"],
  ["Inventário", "Saldos informados; movimento de estoque de junho não lançado no razão", "pendente"],
  ["Despesas a apropriar", "Seguros, IPTU e IPVA (contas 25141/25142/25143) sem apropriação em junho", "pendente"],
  ["Cartões", "Despesas classificadas por conta e centro de custo", "em revisão"],
  ["Depreciação", "Cálculo conta a conta conforme padrão do razão de maio", "em revisão"],
  ["JCP", "Cálculo de junho mantido conforme maio", "validado"],
] as const;

const dre = [
  ["Receita operacional bruta", 3402624.71],
  ["(-) Deduções da receita", -811074.77],
  ["(-) Custo total", -1188509.5],
  ["Lucro bruto", 1403040.44],
  ["(-) Despesas operacionais líquidas", -1188001.43],
  ["Resultado operacional", 215039.01],
] as const;

const bancos = [
  ["Saldo inicial", 2554571.6],
  ["Entradas", 6394811.91],
  ["Saídas", 6137166.1],
  ["Saldo final", 2812217.41],
] as const;

const estoque = [
  ["Matéria-prima", 1422698.1],
  ["Produto acabado", 4351381.88],
  ["Produto intermediário", 165787.06],
  ["Refugo, retalho e lixo", 29965.54],
] as const;

const lancamentos = [
  { origem: "JCP", debito: "6181 - Juros sobre capital próprio", credito: "6180 - Marcos Victor Siedel - JCP", valor: 140469.22, status: "Validado" },
  { origem: "Depreciação", debito: "5193 - Depreciação de máquinas", credito: "612 - Máquinas e equipamentos", valor: 26745.98, status: "Revisar" },
  { origem: "Depreciação", debito: "5207 - Depreciação de instalações", credito: "620 - Instalações industriais", valor: 1916.57, status: "Revisar" },
  { origem: "Depreciação", debito: "5215 - Depreciação de móveis e utensílios", credito: "639 - Móveis e utensílios ADM", valor: 3110.24, status: "Revisar" },
  { origem: "Depreciação", debito: "5223 - Depreciação de informática", credito: "655 - Equipamentos de informática", valor: 2780.09, status: "Revisar" },
  { origem: "Depreciação", debito: "5231 - Depreciação de veículos", credito: "663 - Veículos", valor: 19762.52, status: "Revisar" },
  { origem: "Grupo", debito: "Despesa com serviços - NPLog", credito: "Fornecedor NPLog / partes relacionadas", valor: 115364.37, status: "Validado" },
] as const;

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === "success" ? "text-emerald-700" : ""}`}>{brl.format(value)}</p>
    </div>
  );
}

function FechamentoAssistidoPage() {
  useNitaplastJunho();
  const [somenteRevisao, setSomenteRevisao] = useState(false);
  const [revisados, setRevisados] = useState<string[]>([]);
  const lista = lancamentos.filter((l) => !somenteRevisao || (l.status === "Revisar" && !revisados.includes(`${l.origem}-${l.debito}`)));
  const validas = fontes.filter((f) => f[2] === "validado").length;

  return (
    <PageShell>
      <PageHeader
        titulo="Fechamento Assistido - Nitaplast"
        descricao="Competência 06/2026 • CNPJ 82.295.817/0001-07 • Questor 1184 • fechamento reconstruído por documentos, razão anterior e conciliação."
        acoes={<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Em revisão contábil</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Resultado operacional - DRE controle" value={215039.01} tone="success" />
        <Metric label="Estoque final em 30/06" value={5969832.58} />
        <Metric label="Saldo bancário final" value={2812217.41} />
        <Metric label="JCP de junho" value={140469.22} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="size-4" /> Cobertura documental</CardTitle>
              <CardDescription>Fontes efetivamente recebidas e vinculadas ao fechamento.</CardDescription>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{validas} de {fontes.length} validadas</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Progress value={(validas / fontes.length) * 100} />
          <div className="grid gap-2 md:grid-cols-2">
            {fontes.map(([nome, detalhe, status]) => (
              <div key={nome} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0"><p className="text-sm font-medium">{nome}</p><p className="text-xs text-muted-foreground">{detalhe}</p></div>
                <Badge variant={status === "validado" ? "default" : "outline"}>{status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="size-4" /> DRE de conferência</CardTitle><CardDescription>Meta oficial enviada ao cliente; cada linha será explicada por lançamentos.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {dre.map(([nome, valor]) => <div key={nome} className={`flex justify-between border-b py-2 text-sm last:border-0 ${nome === "Resultado operacional" ? "font-semibold text-emerald-700" : ""}`}><span>{nome}</span><span className="tabular-nums">{brl.format(valor)}</span></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="size-4" /> Conciliação bancária</CardTitle><CardDescription>Movimento completo dos bancos da competência.</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {bancos.map(([nome, valor]) => <div key={nome} className="flex justify-between border-b py-2 text-sm last:border-0"><span>{nome}</span><span className="tabular-nums">{brl.format(valor)}</span></div>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Boxes className="size-4" /> Inventário em 30/06/2026</CardTitle><CardDescription>Total validado de {brl.format(5969832.58)}.</CardDescription></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {estoque.map(([nome, valor]) => <div key={nome} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{nome}</p><p className="mt-1 font-semibold tabular-nums">{brl.format(valor)}</p></div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4" /> Lançamentos pontuais identificados</CardTitle><CardDescription>Conta a conta, sem ajuste genérico e sem duplicar pagamentos como despesa.</CardDescription></div>
            <Button size="sm" variant={somenteRevisao ? "default" : "outline"} onClick={() => setSomenteRevisao((v) => !v)}>{somenteRevisao ? "Exibir todos" : "Mostrar pendentes"}</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Origem</th><th className="py-2 pr-3">Débito</th><th className="py-2 pr-3">Crédito</th><th className="py-2 pr-3 text-right">Valor</th><th className="py-2 text-right">Situação</th></tr></thead>
            <tbody>{lista.map((l) => { const key = `${l.origem}-${l.debito}`; const ok = l.status === "Validado" || revisados.includes(key); return <tr key={key} className="border-b last:border-0"><td className="py-3 pr-3"><Badge variant="outline">{l.origem}</Badge></td><td className="py-3 pr-3">{l.debito}</td><td className="py-3 pr-3">{l.credito}</td><td className="py-3 pr-3 text-right tabular-nums">{brl.format(l.valor)}</td><td className="py-3 text-right">{ok ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" /> Validado</span> : <Button size="sm" variant="outline" onClick={() => setRevisados((r) => [...r, key])}>Validar</Button>}</td></tr>; })}</tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex gap-3 pt-6"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" /><div><p className="text-sm font-medium">Critério do fechamento</p><p className="text-xs text-muted-foreground">Fornecedores são reconstruídos pelo saldo de 31/05, notas da competência e baixas bancárias. NPLog/NPL permanecem em contas analíticas de partes relacionadas. Contas identificadas como filial SP não são misturadas à matriz.</p></div></CardContent>
      </Card>
    </PageShell>
  );
}
