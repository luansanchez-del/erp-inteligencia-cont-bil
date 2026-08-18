import { useCallback, useEffect, useMemo, useState } from "react";
import { saldosImplantacao } from "@/data/nitaplast-implantacao";
import type { LancamentoIntegrado } from "@/data/nitaplast-razao-base";

export type AcaoAjusteLancamento = "novo" | "editar" | "excluir";

export type DadosLancamentoManual = {
  data: string;
  debitoCodigo: string;
  creditoCodigo: string;
  historico: string;
  documento: string;
  cc: string;
  centroCusto: string;
  valor: number;
};

export type AjusteLancamentoAuditavel = {
  id: string;
  competencia: string;
  acao: AcaoAjusteLancamento;
  lancamentoAlvoId: string | null;
  dados: DadosLancamentoManual | null;
  motivo: string;
  criadoEm: string;
};

const STORAGE_KEY = "erp-ajustes-lancamentos-v1";
const EVENTO = "erp-ajustes-lancamentos-atualizados";
// Compatibilidade: as telas atuais recalculam o Razão quando este evento dispara.
const EVENTO_RAZAO = "erp-reclassificacoes-atualizadas";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

function carregarTodos(): AjusteLancamentoAuditavel[] {
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

function persistir(itens: AjusteLancamentoAuditavel[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  window.dispatchEvent(new Event(EVENTO));
  window.dispatchEvent(new Event(EVENTO_RAZAO));
}

function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validarDados(dados: DadosLancamentoManual) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dados.data)) throw new Error("Data inválida. Use DD/MM/AAAA.");
  if (!descricaoPorConta.has(dados.debitoCodigo)) throw new Error(`Conta débito ${dados.debitoCodigo} não existe no plano.`);
  if (!descricaoPorConta.has(dados.creditoCodigo)) throw new Error(`Conta crédito ${dados.creditoCodigo} não existe no plano.`);
  if (dados.debitoCodigo === dados.creditoCodigo) throw new Error("Débito e crédito não podem usar a mesma conta.");
  if (!Number.isFinite(dados.valor) || dados.valor <= 0) throw new Error("O valor precisa ser maior que zero.");
  if (!dados.historico.trim()) throw new Error("Informe o histórico do lançamento.");
}

function criarLancamentoManual(ajuste: AjusteLancamentoAuditavel): LancamentoIntegrado | null {
  if (!ajuste.dados) return null;
  validarDados(ajuste.dados);
  const dados = ajuste.dados;
  return {
    id: `MAN-${ajuste.id}`,
    data: dados.data,
    origem: "LANÇAMENTO MANUAL",
    debitoCodigo: dados.debitoCodigo,
    debito: nomeConta(dados.debitoCodigo),
    creditoCodigo: dados.creditoCodigo,
    credito: nomeConta(dados.creditoCodigo),
    historico: dados.historico,
    documento: dados.documento || `MAN ${ajuste.id}`,
    cc: dados.cc || "0",
    centroCusto: dados.centroCusto || "SEM CENTRO DE CUSTO",
    valor: Math.round(dados.valor * 100) / 100,
    status: "validado",
    observacao: `Lançamento criado manualmente. Motivo: ${ajuste.motivo}. Auditoria: ${ajuste.id}.`,
    rastreio: "derivado",
    fonte: `Ação manual do usuário em ${ajuste.criadoEm}`,
  };
}

function criarEstorno(original: LancamentoIntegrado, ajuste: AjusteLancamentoAuditavel, prefixo: string): LancamentoIntegrado {
  return {
    id: `${prefixo}-${ajuste.id}-EST`,
    data: ajuste.dados?.data || original.data,
    origem: ajuste.acao === "excluir" ? "EXCLUSÃO MANUAL · ESTORNO" : "ALTERAÇÃO MANUAL · ESTORNO",
    debitoCodigo: original.creditoCodigo,
    debito: original.credito,
    creditoCodigo: original.debitoCodigo,
    credito: original.debito,
    historico: `${ajuste.acao === "excluir" ? "EXCLUSÃO" : "ALTERAÇÃO"}: estorno de ${original.historico}`,
    documento: ajuste.dados?.documento || original.documento || ajuste.id,
    cc: original.cc,
    centroCusto: original.centroCusto,
    valor: original.valor,
    status: "validado",
    observacao: `${ajuste.motivo}. Lançamento original preservado para auditoria: ${original.id}.`,
    rastreio: "derivado",
    fonte: `Ajuste manual ${ajuste.id}; origem preservada: ${original.fonte}`,
  };
}

function criarSubstituto(original: LancamentoIntegrado, ajuste: AjusteLancamentoAuditavel): LancamentoIntegrado | null {
  if (!ajuste.dados) return null;
  validarDados(ajuste.dados);
  const dados = ajuste.dados;
  return {
    id: `ALT-${ajuste.id}-NOVO`,
    data: dados.data,
    origem: "ALTERAÇÃO MANUAL",
    debitoCodigo: dados.debitoCodigo,
    debito: nomeConta(dados.debitoCodigo),
    creditoCodigo: dados.creditoCodigo,
    credito: nomeConta(dados.creditoCodigo),
    historico: dados.historico,
    documento: dados.documento || original.documento,
    cc: dados.cc || original.cc,
    centroCusto: dados.centroCusto || original.centroCusto,
    valor: Math.round(dados.valor * 100) / 100,
    status: "validado",
    observacao: `${ajuste.motivo}. Substitui contabilmente ${original.id}; original e estorno permanecem rastreáveis.`,
    rastreio: "derivado",
    fonte: `Alteração manual ${ajuste.id}; referência original: ${original.id} / ${original.fonte}`,
  };
}

/**
 * Gera somente os fatos contábeis adicionais decorrentes das ações do usuário.
 * Editar/excluir não apaga a origem: gera estorno explícito e, na edição, a nova partida.
 * Assim Razão, Balancete e DRE continuam conciliáveis e auditáveis.
 */
export function gerarLancamentosAjustes(
  base: LancamentoIntegrado[],
  ajustes: AjusteLancamentoAuditavel[],
): LancamentoIntegrado[] {
  const corrente: LancamentoIntegrado[] = [...base];
  const gerados: LancamentoIntegrado[] = [];

  for (const ajuste of [...ajustes].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))) {
    if (ajuste.acao === "novo") {
      const novo = criarLancamentoManual(ajuste);
      if (novo) {
        gerados.push(novo);
        corrente.push(novo);
      }
      continue;
    }

    const original = corrente.find((linha) => linha.id === ajuste.lancamentoAlvoId);
    if (!original) continue;

    if (ajuste.acao === "excluir") {
      const estorno = criarEstorno(original, ajuste, "EXC");
      gerados.push(estorno);
      corrente.push(estorno);
      continue;
    }

    const estorno = criarEstorno(original, ajuste, "ALT");
    const substituto = criarSubstituto(original, ajuste);
    gerados.push(estorno);
    corrente.push(estorno);
    if (substituto) {
      gerados.push(substituto);
      corrente.push(substituto);
    }
  }

  return gerados;
}

export function gerarLancamentosAjustesPersistidos(base: LancamentoIntegrado[], competencia = "2026-06") {
  const ajustes = carregarTodos().filter((item) => item.competencia === competencia);
  return gerarLancamentosAjustes(base, ajustes);
}

export function useAjustesLancamentos(competencia = "2026-06") {
  const [todos, setTodos] = useState<AjusteLancamentoAuditavel[]>(() => carregarTodos());

  useEffect(() => {
    const atualizar = () => setTodos(carregarTodos());
    window.addEventListener("storage", atualizar);
    window.addEventListener(EVENTO, atualizar);
    return () => {
      window.removeEventListener("storage", atualizar);
      window.removeEventListener(EVENTO, atualizar);
    };
  }, []);

  const ajustes = useMemo(
    () => todos.filter((item) => item.competencia === competencia),
    [competencia, todos],
  );

  const registrar = useCallback((entrada: Omit<AjusteLancamentoAuditavel, "id" | "competencia" | "criadoEm">) => {
    const novo: AjusteLancamentoAuditavel = {
      ...entrada,
      id: novoId(),
      competencia,
      criadoEm: new Date().toISOString(),
    };
    const proxima = [...carregarTodos(), novo];
    persistir(proxima);
    setTodos(proxima);
    return novo;
  }, [competencia]);

  const registrarNovo = useCallback((dados: DadosLancamentoManual, motivo: string) => {
    validarDados(dados);
    return registrar({ acao: "novo", lancamentoAlvoId: null, dados, motivo: motivo.trim() || "Lançamento manual" });
  }, [registrar]);

  const registrarEdicao = useCallback((lancamentoAlvoId: string, dados: DadosLancamentoManual, motivo: string) => {
    validarDados(dados);
    return registrar({ acao: "editar", lancamentoAlvoId, dados, motivo: motivo.trim() || "Alteração manual" });
  }, [registrar]);

  const registrarExclusao = useCallback((lancamentoAlvoId: string, motivo: string) => {
    return registrar({ acao: "excluir", lancamentoAlvoId, dados: null, motivo: motivo.trim() || "Exclusão manual" });
  }, [registrar]);

  return { ajustes, registrarNovo, registrarEdicao, registrarExclusao };
}
