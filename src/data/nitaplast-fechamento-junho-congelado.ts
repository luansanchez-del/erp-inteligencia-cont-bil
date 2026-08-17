import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * SNAPSHOT CONTÁBIL DE 06/2026.
 *
 * Junho já foi fechado e validado. A regra de cálculo/reconstrução dinâmica de
 * CPV/estoque passa a valer para 07/2026 em diante e NÃO pode reabrir junho.
 *
 * Fechamento validado de junho:
 * - CPV Matriz: R$ 1.075.274,84
 * - CPV Filial: R$   113.234,66
 * - CPV Total:  R$ 1.188.509,50
 *
 * Estes lançamentos substituem qualquer reconstrução posterior das contas de
 * resultado 25944/25945 dentro da competência 06/2026. Não são lançamentos
 * gerenciais criados pela DRE; representam o snapshot do fechamento contábil
 * de junho que já havia sido validado antes das rotinas de julho.
 */
export const CPV_MATRIZ_FECHADO_JUNHO = 1075274.84;
export const CPV_FILIAL_FECHADO_JUNHO = 113234.66;
export const CPV_TOTAL_FECHADO_JUNHO = 1188509.50;

const contasCpvJunho = new Set(["25944", "25945"]);

function tocaCpvJunho(linha: LancamentoIntegrado) {
  return contasCpvJunho.has(linha.debitoCodigo) || contasCpvJunho.has(linha.creditoCodigo);
}

const fechamentoCpvCongeladoJunho: LancamentoIntegrado[] = [
  {
    id: "CPV-FECHADO-M-062026",
    data: "30/06/2026",
    origem: "SNAPSHOT FECHAMENTO CONTÁBIL 06/2026",
    debitoCodigo: "25944",
    debito: "25944 - Custos de produtos vendidos",
    creditoCodigo: "510",
    credito: "510 - Produtos Acabados",
    historico: "CPV Matriz - fechamento contábil validado de junho/2026",
    documento: "FECHAMENTO 06/2026 - CPV MATRIZ",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: CPV_MATRIZ_FECHADO_JUNHO,
    status: "validado",
    observacao: "Snapshot do lançamento de CPV Matriz já validado no fechamento de 06/2026. Não recalcular por regras criadas para 07/2026.",
    rastreio: "documento",
    fonte: "Fechamento contábil validado 06/2026 / inventário e lote contábil final",
  },
  {
    id: "CPV-FECHADO-F-062026",
    data: "30/06/2026",
    origem: "SNAPSHOT FECHAMENTO CONTÁBIL 06/2026",
    debitoCodigo: "25945",
    debito: "25945 - Custos de Produtos Vendidos - Filial",
    creditoCodigo: "25043",
    credito: "25043 - Mercadorias Para Revenda Filial",
    historico: "CPV Filial - fechamento contábil validado de junho/2026",
    documento: "FECHAMENTO 06/2026 - CPV FILIAL",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: CPV_FILIAL_FECHADO_JUNHO,
    status: "validado",
    observacao: "Snapshot do lançamento de CPV Filial já validado no fechamento de 06/2026. Não recalcular por regras criadas para 07/2026.",
    rastreio: "documento",
    fonte: "Fechamento contábil validado 06/2026 / inventário e lote contábil final",
  },
];

export function aplicarSnapshotFechamentoJunho(
  lancamentos: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  // Remove somente movimentos das contas de CPV de junho que tenham sido
  // reconstruídos posteriormente. Todas as demais receitas, despesas, tributos,
  // bancos, estoques, importações e financeiro permanecem intactos.
  const baseSemCpvRecalculado = lancamentos.filter((linha) => !tocaCpvJunho(linha));
  return [...baseSemCpvRecalculado, ...fechamentoCpvCongeladoJunho];
}

function movimentoLiquido(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

export function validarSnapshotFechamentoJunho(base: LancamentoIntegrado[]) {
  const cpvMatriz = movimentoLiquido(base, "25944");
  const cpvFilial = movimentoLiquido(base, "25945");
  const cpvTotal = arred(cpvMatriz + cpvFilial);
  const mensagens: string[] = [];

  if (Math.abs(cpvMatriz - CPV_MATRIZ_FECHADO_JUNHO) > 0.01) {
    mensagens.push(`CPV Matriz 06/2026 alterado: R$ ${cpvMatriz.toFixed(2)} / fechado R$ ${CPV_MATRIZ_FECHADO_JUNHO.toFixed(2)}.`);
  }
  if (Math.abs(cpvFilial - CPV_FILIAL_FECHADO_JUNHO) > 0.01) {
    mensagens.push(`CPV Filial 06/2026 alterado: R$ ${cpvFilial.toFixed(2)} / fechado R$ ${CPV_FILIAL_FECHADO_JUNHO.toFixed(2)}.`);
  }
  if (Math.abs(cpvTotal - CPV_TOTAL_FECHADO_JUNHO) > 0.01) {
    mensagens.push(`CPV Total 06/2026 alterado: R$ ${cpvTotal.toFixed(2)} / fechado R$ ${CPV_TOTAL_FECHADO_JUNHO.toFixed(2)}.`);
  }

  return {
    cpvMatriz,
    cpvFilial,
    cpvTotal,
    bloqueado: mensagens.length > 0,
    mensagens,
  } as const;
}
