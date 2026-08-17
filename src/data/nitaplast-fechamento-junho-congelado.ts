import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const arred = (valor: number) => Math.round(valor * 100) / 100;

/**
 * SNAPSHOT CONTÁBIL DE 06/2026.
 *
 * Junho permanece congelado. O CPV apresentado no Razão/DRE é composto
 * somente pelas duas contas de custo já contabilizadas:
 * - 25944 CPV Matriz: R$ 1.157.810,94
 * - 25945 CPV Filial: R$   113.234,66
 * - Total CPV/CMV:    R$ 1.271.045,60
 *
 * Não criar linha, ajuste ou desconto adicional de R$ 82.536,10. Esse efeito
 * já está refletido no valor da conta 25944 e não pode ser considerado de novo.
 */
export const CPV_MATRIZ_FECHADO_JUNHO = 1157810.94;
export const CPV_FILIAL_FECHADO_JUNHO = 113234.66;
export const CPV_TOTAL_FECHADO_JUNHO = 1271045.60;

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
    observacao: "CPV Matriz fechado em R$ 1.157.810,94. Não aplicar ajuste adicional de R$ 82.536,10; esse efeito já consta no valor da conta 25944.",
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
    observacao: "CPV Filial fechado em R$ 113.234,66.",
    rastreio: "documento",
    fonte: "Fechamento contábil validado 06/2026 / inventário e lote contábil final",
  },
];

export function aplicarSnapshotFechamentoJunho(lancamentos: LancamentoIntegrado[]): LancamentoIntegrado[] {
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
  if (Math.abs(cpvMatriz - CPV_MATRIZ_FECHADO_JUNHO) > 0.01) mensagens.push(`CPV Matriz 06/2026 alterado: R$ ${cpvMatriz.toFixed(2)} / fechado R$ ${CPV_MATRIZ_FECHADO_JUNHO.toFixed(2)}.`);
  if (Math.abs(cpvFilial - CPV_FILIAL_FECHADO_JUNHO) > 0.01) mensagens.push(`CPV Filial 06/2026 alterado: R$ ${cpvFilial.toFixed(2)} / fechado R$ ${CPV_FILIAL_FECHADO_JUNHO.toFixed(2)}.`);
  if (Math.abs(cpvTotal - CPV_TOTAL_FECHADO_JUNHO) > 0.01) mensagens.push(`CPV Total 06/2026 alterado: R$ ${cpvTotal.toFixed(2)} / fechado R$ ${CPV_TOTAL_FECHADO_JUNHO.toFixed(2)}.`);
  return { cpvMatriz, cpvFilial, cpvTotal, bloqueado: mensagens.length > 0, mensagens } as const;
}
