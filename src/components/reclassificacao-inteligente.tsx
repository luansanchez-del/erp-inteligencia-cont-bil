import { useState } from "react";
import { ArrowRightLeft, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContaCombobox } from "@/components/conta-combobox";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-integrado";
import { useAjustesLancamentos, type DadosLancamentoManual } from "@/hooks/use-ajustes-lancamentos";
import { removerReclassificacaoPersistida, type LadoReclassificacao } from "@/hooks/use-reclassificacoes-inteligentes";

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
  ["901", "RECEITAS FINANCEIRAS"],
  ["902", "DESPESAS FINANCEIRAS"],
] as const;

function parseValor(valor: string) {
  const texto = valor.trim();
  if (!texto) return Number.NaN;
  return Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
}

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
  const competencia = lancamento.data.endsWith("/07/2026") ? "2026-07" : "2026-06";
  const { registrarNovo } = useAjustesLancamentos(competencia);

  const [aberto, setAberto] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const [lado, setLado] = useState<LadoReclassificacao>("debito");
  const [contaDestino, setContaDestino] = useState("");
  const [ccDestino, setCcDestino] = useState(lancamento.cc || "0");
  const [motivo, setMotivo] = useState("");
  const [erroNovo, setErroNovo] = useState<string | null>(null);
  const [novo, setNovo] = useState({
    data: lancamento.data,
    debitoCodigo: "",
    creditoCodigo: "",
    historico: "",
    documento: "",
    cc: lancamento.cc || "0",
    centroCusto: lancamento.centroCusto || "SEM CENTRO DE CUSTO",
    valor: "",
    motivo: "",
  });

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

  function abrirNovoLancamento() {
    setErroNovo(null);
    setNovo({
      data: lancamento.data,
      debitoCodigo: "",
      creditoCodigo: "",
      historico: "",
      documento: lancamento.documento || "",
      cc: lancamento.cc || "0",
      centroCusto: lancamento.centroCusto || "SEM CENTRO DE CUSTO",
      valor: "",
      motivo: "",
    });
    setNovoAberto(true);
  }

  function salvarNovoLancamento() {
    try {
      const dados: DadosLancamentoManual = {
        data: novo.data.trim(),
        debitoCodigo: novo.debitoCodigo.trim(),
        creditoCodigo: novo.creditoCodigo.trim(),
        historico: novo.historico.trim(),
        documento: novo.documento.trim(),
        cc: novo.cc.trim() || "0",
        centroCusto: novo.centroCusto.trim() || "SEM CENTRO DE CUSTO",
        valor: parseValor(novo.valor),
      };
      registrarNovo(dados, novo.motivo.trim() || "Lançamento contábil efetuado pelo usuário");
      setNovoAberto(false);
      setErroNovo(null);
    } catch (erro) {
      setErroNovo(erro instanceof Error ? erro.message : "Não foi possível efetuar o lançamento contábil.");
    }
  }

  if (lancamento.origem === "RECLASSIFICAÇÃO INTELIGENTE") {
    const id = lancamento.id.replace(/^RCL-/, "");
    const desfazer = onRemover ?? removerReclassificacaoPersistida;
    return (
      <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-rose-700" title="Desfazer reclassificação" onClick={() => desfazer(id)}>
        <RotateCcw className="size-4" />
        <span className="hidden xl:inline">Desfazer</span>
      </Button>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1">
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2"
          title="Efetuar lançamento contábil"
          onClick={abrirNovoLancamento}
        >
          <Plus className="size-4" />
          <span className="hidden xl:inline">Lançamento contábil</span>
        </Button>
      </div>

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
                <ContaCombobox value={contaDestino} onChange={setContaDestino} excluir={contaOrigem} placeholder="Selecione a conta correta…" />
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

      {novoAberto ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <p className="font-semibold">Efetuar lançamento contábil</p>
                <p className="mt-1 text-xs text-muted-foreground">Cria uma nova partida real e auditável. Não é reclassificação e não altera o lançamento original.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNovoAberto(false)}><X className="size-4" /></Button>
            </div>

            <div className="grid gap-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1 text-xs font-medium">Data
                  <input value={novo.data} onChange={(e) => setNovo((x) => ({ ...x, data: e.target.value }))} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="DD/MM/AAAA" />
                </label>
                <label className="grid gap-1 text-xs font-medium">Valor
                  <input value={novo.valor} onChange={(e) => setNovo((x) => ({ ...x, valor: e.target.value }))} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="0,00" />
                </label>
                <label className="grid gap-1 text-xs font-medium">Centro de custo
                  <select value={novo.cc} onChange={(e) => {
                    const codigo = e.target.value;
                    const nome = centros.find(([c]) => c === codigo)?.[1] ?? novo.centroCusto;
                    setNovo((x) => ({ ...x, cc: codigo, centroCusto: nome }));
                  }} className="h-9 rounded-md border bg-background px-3 text-sm">
                    {centros.map(([codigo, nome]) => <option key={codigo} value={codigo}>{codigo} · {nome}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium">Documento
                  <input value={novo.documento} onChange={(e) => setNovo((x) => ({ ...x, documento: e.target.value }))} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Documento/evidência" />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-medium">Conta débito
                  <ContaCombobox value={novo.debitoCodigo} onChange={(codigo) => setNovo((x) => ({ ...x, debitoCodigo: codigo }))} />
                </label>
                <label className="grid gap-1 text-xs font-medium">Conta crédito
                  <ContaCombobox value={novo.creditoCodigo} onChange={(codigo) => setNovo((x) => ({ ...x, creditoCodigo: codigo }))} />
                </label>
              </div>

              <label className="grid gap-1 text-xs font-medium">Histórico contábil
                <textarea value={novo.historico} onChange={(e) => setNovo((x) => ({ ...x, historico: e.target.value }))} rows={3} placeholder="Descrição humana do fato contábil" className="rounded-md border bg-background p-3 text-sm" />
              </label>

              <label className="grid gap-1 text-xs font-medium">Motivo / evidência da ação
                <textarea value={novo.motivo} onChange={(e) => setNovo((x) => ({ ...x, motivo: e.target.value }))} rows={2} placeholder="Por que este lançamento está sendo efetuado?" className="rounded-md border bg-background p-3 text-sm" />
              </label>

              {erroNovo ? <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800">{erroNovo}</div> : null}

              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                O lançamento criado entra como fato contábil manual auditável. Ele deve repercutir no mesmo Razão usado pelo Balancete e pela DRE da competência.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" onClick={() => setNovoAberto(false)}>Cancelar</Button>
              <Button onClick={salvarNovoLancamento}><Plus className="mr-2 size-4" />Efetuar lançamento contábil</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}