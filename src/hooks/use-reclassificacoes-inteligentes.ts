import { useCallback, useEffect, useMemo, useState } from "react";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-integrado";
import { gerarLancamentosAjustesPersistidos } from "@/hooks/use-ajustes-lancamentos";

export type LadoReclassificacao = "debito" | "credito";

export type ReclassificacaoInteligente = {
  id: string;
  competencia: string;
  lancamentoId: string;
  lado: LadoReclassificacao;
  contaOrigem: string;
  contaDestino: string;
  ccDestino: string;
  centroCustoDestino: string;
  motivo: string;
  criadoEm: string;
};

const STORAGE_KEY = "erp-reclassificacoes-inteligentes-v1";
const EVENTO = "erp-reclassificacoes-atualizadas";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

function carregar(): ReclassificacaoInteligente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistir(itens: ReclassificacaoInteligente[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  window.dispatchEvent(new Event(EVENTO));
}

export function removerReclassificacaoPersistida(id: string) {
  const proxima = carregar().filter((item) => item.id !== id);
  persistir(proxima);
  return proxima;
}

export function gerarLancamentosReclassificacao(
  base: LancamentoIntegrado[],
  reclassificacoes: ReclassificacaoInteligente[],
  competencia = "2026-06",
): LancamentoIntegrado[] {
  const porId = new Map(base.map((linha) => [linha.id, linha]));

  const reclassificados = reclassificacoes.flatMap((item) => {
    const original = porId.get(item.lancamentoId);
    if (!original || original.origem === "RECLASSIFICAÇÃO INTELIGENTE") return [];

    const contaOrigem = item.lado === "debito" ? original.debitoCodigo : original.creditoCodigo;
    if (contaOrigem !== item.contaOrigem || item.contaDestino === contaOrigem) return [];

    const debitoCodigo = item.lado === "debito" ? item.contaDestino : contaOrigem;
    const creditoCodigo = item.lado === "debito" ? contaOrigem : item.contaDestino;

    return [{
      id: `RCL-${item.id}`,
      data: original.data,
      origem: "RECLASSIFICAÇÃO INTELIGENTE",
      debitoCodigo,
      debito: nomeConta(debitoCodigo),
      creditoCodigo,
      credito: nomeConta(creditoCodigo),
      historico: `RECLASSIFICAÇÃO: ${original.historico}`,
      documento: `RCL ${original.documento || original.id}`,
      cc: item.ccDestino || original.cc,
      centroCusto: item.centroCustoDestino || original.centroCusto,
      valor: original.valor,
      status: "validado",
      observacao: `${item.motivo}. Lançamento original preservado: ${original.id}.`,
      rastreio: "derivado",
      fonte: `Reclassificação inteligente vinculada ao lançamento ${original.id}. Fonte original: ${original.fonte}`,
    } satisfies LancamentoIntegrado];
  });

  const baseComReclassificacoes = [...base, ...reclassificados];
  const ajustesManuais = gerarLancamentosAjustesPersistidos(baseComReclassificacoes, competencia);
  return [...reclassificados, ...ajustesManuais];
}

export function aplicarReclassificacoes(
  base: LancamentoIntegrado[],
  reclassificacoes: ReclassificacaoInteligente[],
  competencia = "2026-06",
) {
  return [...base, ...gerarLancamentosReclassificacao(base, reclassificacoes, competencia)];
}

export function useReclassificacoesInteligentes(competencia = "2026-06") {
  const [todas, setTodas] = useState<ReclassificacaoInteligente[]>(() => carregar());

  useEffect(() => {
    const atualizar = () => setTodas(carregar());
    window.addEventListener("storage", atualizar);
    window.addEventListener(EVENTO, atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener(EVENTO, atualizar);
    };
  }, []);

  const reclassificacoes = useMemo(
    () => todas.filter((item) => item.competencia === competencia),
    [competencia, todas],
  );

  const registrar = useCallback((item: Omit<ReclassificacaoInteligente, "id" | "criadoEm" | "competencia">) => {
    const nova: ReclassificacaoInteligente = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      criadoEm: new Date().toISOString(),
      competencia,
    };
    const proxima = [...carregar(), nova];
    persistir(proxima);
    setTodas(proxima);
    return nova;
  }, [competencia]);

  const remover = useCallback((id: string) => {
    const proxima = removerReclassificacaoPersistida(id);
    setTodas(proxima);
  }, []);

  const aplicar = useCallback(
    (base: LancamentoIntegrado[]) => aplicarReclassificacoes(base, reclassificacoes, competencia),
    [competencia, reclassificacoes],
  );

  return { reclassificacoes, registrar, remover, aplicar };
}
