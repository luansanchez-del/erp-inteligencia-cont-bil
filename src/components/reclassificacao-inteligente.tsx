import { useMemo, useState } from "react";
import { ArrowRightLeft, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-integrado";
import { useReclassificacoesInteligentes, type LadoReclassificacao } from "@/hooks/use-reclassificacoes-inteligentes";

const centros = [
  ["0", "SEM CENTRO DE CUSTO"],
  ["102", "PRODUÇÃO"],
  ["201", "VENDAS"],
  ["203", "FATURAMENTO"],
  ["206", "EXPORTAÇÃO"],
  ["210", "MARKETING"],
  ["301", "RECEPÇÃO"],
  ["302", "FINANCEIRO"],
  ["304", "ADM GERAL"],
  ["502", "COMERCIAL SP"],
  ["902", "DESPESAS FINANCEIRAS"],
] as const;

export function ReclassificacaoInteligente({
  lancamento,
  onRegistrar,
  onRemover,
}: {
  lancamento: LancamentoIntegrado;
  onRegistrar: (item: {
    lancamentoId: string;
    lado: LadoReclassificacao;
    contaOrigem: string;
    contaDestino: string;
    ccDestino: string;
    centroCustoDestino: string;
    motivo: string;
  }) => void;
  onRemover?: (id: string) => void;
}) {
  const { remover } = useReclassificacoesInteligentes("2026-06");
  const [aberto, setAberto] = useState(false);
  const [lado, setLado] = useState<LadoReclassificacao>("debito");
  const [contaDestino, setContaDestino] = useState("");
  const [ccDestino, setCcDestino] = useState(lancamento.cc || "0");
  const [motivo, setMotivo] = useState("");

  const contas = useMemo(
    () => [...saldosImplantacao].sort((a, b) => a.classificacao.localeCompare(b.classificacao, "pt-BR", { numeric: true })),
    [],
  );

  const contaOrigem = lado === "debito" ? lancamento.debitoCodigo : lancamento.creditoCodigo;
  const contaOrigemNome = lado === "debito" ? lancamento.debito : lancamento.credito;
  const centro = centros.find(([codigo]) => codigo === ccDestino)?.[1] ?? lancamento.centroCusto;
  const podeSalvar = Boolean(contaDestino && contaDestino !== contaOrigem && motivo.trim());

  function salvar() {
    if (!podeSalvar) return;
    onRegistrar({
      lancamentoId: lancamento.id,
      lado,
      contaOrigem,
      contaDestino,
      ccDestino,
      centroCustoDestino: centro,
      motivo: motivo.trim(),
    });
    setAberto(false);
    setContaDestino("");
    setMotivo("");
  }

  if (lancamento.origem === "RECLASSIFICAÇÃO INTELIGENTE") {
    const id = lancamento.id.replace(/^RCL-/, "");
    const desfazer = onRemover ?? remover;
    return (
      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-rose-700" title="Desfazer reclassificação" onClick={() => desfazer(id)}>
        <RotateCcw className="size-4" />
        <span className="hidden xl:inline">Desfazer</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2"
        title="Reclassificação inteligente"
        onClick={() => setAberto(true)}
      >
        <ArrowRightLeft className="size-4" />
        <span className="hidden xl:inline">Reclassificar</span>
      </Button>

      {aberto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <p className="font-semibold">Reclassificação inteligente</p>
                <p className="mt-1 text-xs text-muted-foreground">O lançamento original será preservado. O sistema criará um lançamento de ajuste rastreável.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAberto(false)}><X className="size-4" /></Button>
            </div>

            <div className="grid gap-4 p-4">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p><strong>Lançamento:</strong> {lancamento.id}</p>
                <p><strong>Débito:</strong> {lancamento.debito}</p>
                <p><strong>Crédito:</strong> {lancamento.credito}</p>
                <p><strong>Valor:</strong> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lancamento.valor)}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-medium">Lado a reclassificar
                  <select value={lado} onChange={(e) => { setLado(e.target.value as LadoReclassificacao); setContaDestino(""); }} className="h-9 rounded-md border bg-background px-3 text-sm">
                    <option value="debito">Conta de débito</option>
                    <option value="credito">Conta de crédito</option>
                  </select>
                </label>
                <div className="rounded-md border bg-muted/20 p-2 text-xs">
                  <p className="text-muted-foreground">Conta atual</p>
                  <p className="mt-1 font-medium">{contaOrigemNome}</p>
                </div>
              </div>

              <label className="grid gap-1 text-xs font-medium">Nova conta contábil
                <select value={contaDestino} onChange={(e) => setContaDestino(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">Selecione a conta correta…</option>
                  {contas.filter((conta) => conta.conta !== contaOrigem).map((conta) => (
                    <option key={`${conta.conta}-${conta.classificacao}`} value={conta.conta}>{conta.conta} · {conta.classificacao} · {conta.descricao}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium">Centro de custo do ajuste
                <select value={ccDestino} onChange={(e) => setCcDestino(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
                  {centros.map(([codigo, nome]) => <option key={codigo} value={codigo}>{codigo} · {nome}</option>)}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium">Motivo / evidência da reclassificação
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Ex.: natureza financeira; conforme razão anterior e plano de contas." className="rounded-md border bg-background p-3 text-sm" />
              </label>

              <div className="rounded-md border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
                {lado === "debito"
                  ? `Será gerado: D nova conta / C ${contaOrigem}.`
                  : `Será gerado: D ${contaOrigem} / C nova conta.`}
                {" "}O original permanece intacto para auditoria.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button disabled={!podeSalvar} onClick={salvar}><ArrowRightLeft className="mr-2 size-4" />Contabilizar reclassificação</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
