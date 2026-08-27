import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { BrainCircuit, CheckCircle2, FileCheck2, ShieldAlert, WalletCards } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { useErp } from "@/context/erp-context";
import {
  gruposBancoJulho,
  resumoBancoJulho,
  type GrupoBancoJulho,
  type StatusGrupoBanco,
} from "@/data/nitaplast-inteligencia-bancaria-julho-ajustada";

export const Route = createFileRoute("/contabil/conciliacao")({
  head: () => ({
    meta: [
      { title: "Conciliação" },
      { name: "description", content: "Conciliação bancária documental por competência." },
      { property: "og:title", content: "Conciliação — ERP Contábil" },
      { property: "og:description", content: "Conciliação bancária documental por competência." },
    ],
  }),
  component: Conciliacao,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const colunas: Column<GrupoBancoJulho>[] = [
  {
    key: "banco",
    header: "Banco / conta",
    className: "min-w-[170px]",
    render: (r) => <div><p className="font-medium">{r.banco}</p><p className="text-xs text-muted-foreground">{r.bancoCodigo}{r.contaContabil ? ` · contábil ${r.contaContabil}` : ""}</p></div>,
    valor: (r) => `${r.banco} ${r.bancoCodigo} ${r.contaContabil}`,
  },
  {
    key: "evento",
    header: "Identificação do extrato",
    className: "min-w-[260px]",
    render: (r) => <div><p className="font-medium">{r.evento}</p>{r.gerencial ? <p className="text-xs text-muted-foreground">{r.gerencial} · {r.descricaoGerencial}</p> : <p className="text-xs text-amber-700">Sem gerencial seguro</p>}</div>,
    valor: (r) => `${r.evento} ${r.gerencial} ${r.descricaoGerencial}`,
  },
  { key: "movimentos", header: "Mov.", className: "text-right w-20", render: (r) => <span className="tabular-nums">{r.movimentos}</span>, valor: (r) => String(r.movimentos) },
  { key: "valor", header: "Valor", className: "text-right min-w-[130px] font-mono", render: (r) => brl.format(r.valor), valor: (r) => String(r.valor) },
  {
    key: "acao",
    header: "Tratamento",
    className: "min-w-[170px]",
    render: (r) => <span className="text-sm">{r.acaoLabel}</span>,
    valor: (r) => r.acaoLabel,
  },
  {
    key: "evidencia",
    header: "Contraparte / documentos",
    className: "min-w-[300px]",
    render: (r) => (
      <div className="max-w-[420px]">
        <p className="text-xs">{r.exemplos || "—"}</p>
        {r.documentos ? <p className="mt-1 text-[11px] text-muted-foreground">Docs.: {r.documentos}</p> : null}
      </div>
    ),
    valor: (r) => `${r.exemplos} ${r.documentos}`,
  },
  {
    key: "confianca",
    header: "Confiança",
    className: "text-right w-24",
    render: (r) => <span className="tabular-nums">{r.confianca}%</span>,
    valor: (r) => String(r.confianca),
  },
  {
    key: "status",
    header: "Status",
    className: "w-36",
    render: (r) => <StatusBadge status={r.status} />,
    valor: (r) => r.status,
  },
];

function Conciliacao() {
  const { competencia } = useErp();
  const [status, setStatus] = useState<"todos" | StatusGrupoBanco>("todos");

  const dados = useMemo(
    () => status === "todos" ? gruposBancoJulho : gruposBancoJulho.filter((grupo) => grupo.status === status),
    [status],
  );

  if (competencia.id !== "2026-07") {
    return (
      <PageShell>
        <PageHeader
          titulo={`Conciliação — ${competencia.label}`}
          descricao="A inteligência bancária detalhada está carregada para 07/2026. Nenhum movimento de julho é reaproveitado em outra competência."
        />
        <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          Não há base de conciliação bancária específica carregada para {competencia.label} nesta tela.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        titulo="Conciliação bancária — 07/2026"
        descricao="Motor documental aplicado aos extratos já recebidos: histórico, documento, contraparte, conta gerencial, valor e recorrência. Identificar não significa lançar automaticamente no Razão."
        acoes={<Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Em fechamento</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ResumoCard icone={<WalletCards className="size-4" />} label="Movimentos lidos" valor={resumoBancoJulho.movimentosExtrato.toLocaleString("pt-BR")} detalhe="Camada bancária de julho" />
        <ResumoCard icone={<CheckCircle2 className="size-4" />} label="Conciliados na origem" valor={resumoBancoJulho.conciliadosNaOrigem.toLocaleString("pt-BR")} detalhe="Já marcados na base recebida" />
        <ResumoCard icone={<BrainCircuit className="size-4" />} label="Identificados pelo motor" valor={resumoBancoJulho.identificados.toLocaleString("pt-BR")} detalhe="Contrapartida/tratamento reconhecidos" />
        <ResumoCard icone={<FileCheck2 className="size-4" />} label="Financeiro manual" valor={resumoBancoJulho.resultadoFinanceiroManual.toLocaleString("pt-BR")} detalhe="Juros/rendimentos mantidos fora" />
        <ResumoCard icone={<ShieldAlert className="size-4" />} label="Revisão real" valor={resumoBancoJulho.revisar.toLocaleString("pt-BR")} detalhe="Sem evidência suficiente" destaque={resumoBancoJulho.revisar > 0} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <BrainCircuit className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Motor de documentos ativo na conciliação</p>
              <p className="mt-1 max-w-4xl text-xs leading-relaxed text-muted-foreground">
                Foram preservadas as informações do arquivo bancário e dos extratos: banco, histórico, documento, fornecedor/cliente quando informado, gerencial, centro de custo e valor. Pagamento não vira despesa e recebimento não vira receita por presunção: primeiro é tratado como baixa, transferência, adiantamento ou outro fato sustentado pela evidência.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">{resumoBancoJulho.fontesRecebidas} fontes bancárias recebidas/lidas</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-conciliacao" className="text-xs font-medium text-muted-foreground">Exibir</label>
        <select
          id="status-conciliacao"
          value={status}
          onChange={(event) => setStatus(event.target.value as "todos" | StatusGrupoBanco)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="todos">Todos os grupos ({gruposBancoJulho.length})</option>
          <option value="identificado">Identificados</option>
          <option value="manual">Financeiro manual</option>
          <option value="revisar">Revisar</option>
        </select>
      </div>

      <DataTable
        colunas={colunas}
        dados={dados}
        chave={(r) => r.id}
        placeholderBusca="Buscar banco, histórico, fornecedor, cliente ou documento…"
        vazio="Nenhum grupo bancário para este filtro."
      />

      <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-4 text-xs text-emerald-950">
        <p className="font-semibold">Movimento de R$ 25.000,00 identificado</p>
        <p className="mt-1">O débito do Itaú antes mantido como conciliação pendente foi identificado como <strong>Adiantamento de Lucros — MVS</strong>. A movimentação financeira mantém as transferências e estornos como evidência; a classificação é patrimonial e não afeta a DRE.</p>
      </div>
    </PageShell>
  );
}

function ResumoCard({ icone, label, valor, detalhe, destaque = false }: { icone: ReactNode; label: string; valor: string; detalhe: string; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${destaque ? "border-amber-300 bg-amber-50/60" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icone}<span>{label}</span></div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusGrupoBanco }) {
  if (status === "identificado") return <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">identificado</Badge>;
  if (status === "manual") return <Badge variant="outline">manual depois</Badge>;
  return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">revisar</Badge>;
}
