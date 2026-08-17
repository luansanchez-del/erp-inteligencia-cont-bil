import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * SNAPSHOT CONTÁBIL DE 06/2026.
 *
 * Junho já foi fechado e validado. A regra de cálculo/reconstrução dinâmica de
 * CPV/estoque passa a valer para 07/2026 em diante e NÃO pode reabrir junho.
 *
 * Fechamento validado de junho:
 * - CPV Matriz líquido: R$ 1.075.274,84
 * - Ajuste estoque MP:   R$    82.536,10 (crédito no CPV)
 * - CPV Matriz bruto antes do ajuste: R$ 1.157.810,94
 * - CPV Filial:          R$   113.234,66
 * - CPV Total líquido:   R$ 1.188.509,50
 *
 * O ajuste de R$ 82.536,10 precisa permanecer VISÍVEL no Razão como
 * D 25135 Estoque de Matéria-Prima / C 25944 CPV Matriz.
 * Como o snapshot anterior mostrava somente o CPV líquido, o débito bruto do
 * CPV Matriz é recomposto por CPV líquido + ajuste, preservando exatamente o
 * mesmo resultado final de junho e tornando a trilha contábil explícita.
 */
export const CPV_MATRIZ_FECHADO_JUNHO = 1075274.84;
export const AJUSTE_ESTOQUE_MP_JUNHO = 82536.10;
export const CPV_MATRIZ_BRUTO_ANTES_AJUSTE_JUNHO = arred(
  CPV_MATRIZ_FECHADO_JUNHO + AJUSTE_ESTOQUE_MP_JUNHO,
);
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
    historico: "CPV Matriz bruto antes do ajuste de estoque - fechamento contábil junho/2026",
    documento: "FECHAMENTO 06/2026 - CPV MATRIZ",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: CPV_MATRIZ_BRUTO_ANTES_AJUSTE_JUNHO,
    status: "validado",
    observacao: "CPV Matriz bruto recomposto em R$ 1.157.810,94 para permitir a exibição separada do crédito de R$ 82.536,10 do ajuste de estoque. O CPV líquido permanece R$ 1.075.274,84.",
    rastreio: "documento",
    fonte: "Fechamento contábil validado 06/2026 / inventário e lote contábil final",
  },
  {
    id: "AJ-EST-RESULT-062026",
    data: "30/06/2026",
    origem: "AJUSTE OPERACIONAL FECHAMENTO 06/2026",
    debitoCodigo: "25135",
    debito: "25135 - Estoque Final Matéria Prima",
    creditoCodigo: "25944",
    credito: "25944 - Custos de produtos vendidos",
    historico: "Ajuste de estoque de matéria-prima incorporado ao resultado final de junho/2026",
    documento: "AJUSTE ESTOQUE 06/2026 - 82.536,10",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: AJUSTE_ESTOQUE_MP_JUNHO,
    status: "validado",
    observacao: "D Estoque de Matéria-Prima (25135) / C CPV Matriz (25944). O ajuste fica explícito no Razão; CPV Matriz líquido após este crédito = R$ 1.075.274,84. Não repetir em 07/2026.",
    rastreio: "documento",
    fonte: "REGISTRO INVENTARIO ESTOQUE OFICIAL.pdf + fechamento contábil validado 06/2026",
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
  // Remove movimentos reconstruídos das contas de CPV e reaplica a composição
  // congelada, agora com o ajuste de estoque de R$ 82.536,10 explicitamente
  // visível no Razão. Todas as demais receitas, despesas, tributos, bancos,
  // estoques, importações e financeiro permanecem intactos.
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
  const ajusteEstoquePresente = base.some(
    (linha) => linha.id === "AJ-EST-RESULT-062026"
      && linha.debitoCodigo === "25135"
      && linha.creditoCodigo === "25944"
      && Math.abs(linha.valor - AJUSTE_ESTOQUE_MP_JUNHO) <= 0.01,
  );
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
  if (!ajusteEstoquePresente) {
    mensagens.push("Ajuste de estoque de R$ 82.536,10 não está visível no Razão de junho.");
  }

  return {
    cpvMatriz,
    cpvFilial,
    cpvTotal,
    ajusteEstoquePresente,
    bloqueado: mensagens.length > 0,
    mensagens,
  } as const;
}
