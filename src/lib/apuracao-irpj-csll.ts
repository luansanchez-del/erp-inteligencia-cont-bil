const arred = (v: number) => Math.round(v * 100) / 100;

export type ApuracaoIrpjCsllEstimativaInput = {
  receitaBrutaAtividade: number;
  percentualPresuncaoIrpj: number;
  percentualPresuncaoCsll: number;
  outrasReceitasTributaveis: number;
  limiteAdicionalMensal?: number;
  aliquotaIrpj?: number;
  aliquotaAdicionalIrpj?: number;
  aliquotaCsll?: number;
  retencoesIrpjCompensaveis?: number;
  retencoesCsllCompensaveis?: number;
};

export type ApuracaoIrpjCsllEstimativaResultado = {
  baseIrpj: number;
  irpjNormal: number;
  baseExcedenteAdicional: number;
  irpjAdicional: number;
  irpjDevido: number;
  retencoesIrpjCompensaveis: number;
  irpjAPagar: number;
  baseCsll: number;
  csllDevida: number;
  retencoesCsllCompensaveis: number;
  csllAPagar: number;
};

/**
 * Lucro Real por estimativa mensal (art. 30 e seguintes da Lei 9.430/1996): a base é a
 * receita bruta da atividade multiplicada pelo percentual de presunção, somada às demais
 * receitas e ganhos tributados integralmente (100%) — receitas financeiras, ganho de
 * capital na venda de imobilizado etc. O adicional de IRPJ incide sobre o que exceder
 * R$ 20.000,00 na apuração mensal. Sujeita a ajuste anual pelo Lucro Real (LALUR).
 */
export function calcularIrpjCsllEstimativaMensal(input: ApuracaoIrpjCsllEstimativaInput): ApuracaoIrpjCsllEstimativaResultado {
  const limiteAdicionalMensal = input.limiteAdicionalMensal ?? 20_000;
  const aliquotaIrpj = input.aliquotaIrpj ?? 0.15;
  const aliquotaAdicionalIrpj = input.aliquotaAdicionalIrpj ?? 0.10;
  const aliquotaCsll = input.aliquotaCsll ?? 0.09;
  const retencoesIrpjCompensaveis = input.retencoesIrpjCompensaveis ?? 0;
  const retencoesCsllCompensaveis = input.retencoesCsllCompensaveis ?? 0;

  const baseIrpj = arred(input.receitaBrutaAtividade * input.percentualPresuncaoIrpj + input.outrasReceitasTributaveis);
  const irpjNormal = arred(baseIrpj * aliquotaIrpj);
  const baseExcedenteAdicional = arred(Math.max(0, baseIrpj - limiteAdicionalMensal));
  const irpjAdicional = arred(baseExcedenteAdicional * aliquotaAdicionalIrpj);
  const irpjDevido = arred(irpjNormal + irpjAdicional);
  const irpjAPagar = arred(Math.max(0, irpjDevido - retencoesIrpjCompensaveis));

  const baseCsll = arred(input.receitaBrutaAtividade * input.percentualPresuncaoCsll + input.outrasReceitasTributaveis);
  const csllDevida = arred(baseCsll * aliquotaCsll);
  const csllAPagar = arred(Math.max(0, csllDevida - retencoesCsllCompensaveis));

  return {
    baseIrpj, irpjNormal, baseExcedenteAdicional, irpjAdicional, irpjDevido, retencoesIrpjCompensaveis, irpjAPagar,
    baseCsll, csllDevida, retencoesCsllCompensaveis, csllAPagar,
  };
}
