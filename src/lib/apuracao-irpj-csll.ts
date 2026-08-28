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

export type ApuracaoIrpjCsllLucroRealMensalInput = {
  lucroContabilDoMes: number;
  adicoesIrpj?: number;
  exclusoesIrpj?: number;
  adicoesCsll?: number;
  exclusoesCsll?: number;
  limiteAdicionalMensal?: number;
  aliquotaIrpj?: number;
  aliquotaAdicionalIrpj?: number;
  aliquotaCsll?: number;
  retencoesIrpjCompensaveis?: number;
  retencoesCsllCompensaveis?: number;
};

export type ApuracaoIrpjCsllLucroRealMensalResultado = {
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
 * Lucro Real apurado mensalmente pelo resultado contábil do próprio mês (antecipação de
 * DARF), ajustado pelas adições e exclusões do LALUR do mês — diferente do balanço de
 * suspensão/redução (que usa o acumulado desde janeiro) e da estimativa por presunção
 * (calcularIrpjCsllEstimativaMensal), que parte de percentual sobre a receita. Aqui a
 * base nasce do lucro contábil apurado na DRE do mês. Sujeita a ajuste anual pelo LALUR.
 */
export type ApuracaoIrpjCsllBalancoSuspensaoReducaoInput = {
  /** Lucro contábil acumulado desde janeiro até o mês da apuração, inclusive. */
  lucroContabilAcumulado: number;
  /** Número de meses acumulados desde janeiro até o mês da apuração, inclusive (ex.: julho = 7). */
  mesesAcumulados: number;
  adicoesAcumuladasIrpj?: number;
  exclusoesAcumuladasIrpj?: number;
  adicoesAcumuladasCsll?: number;
  exclusoesAcumuladasCsll?: number;
  /** Soma dos DARFs de estimativa de IRPJ já pagos nos meses anteriores do mesmo ano-calendário. */
  pagamentosEstimativaIrpjAnteriores?: number;
  /** Soma dos DARFs de estimativa de CSLL já pagos nos meses anteriores do mesmo ano-calendário. */
  pagamentosEstimativaCsllAnteriores?: number;
  /** IRRF sobre aplicações financeiras retido, acumulado desde janeiro até o mês da apuração. */
  irrfAcumuladoCompensavel?: number;
  /** CSLL retida na fonte, acumulada desde janeiro até o mês da apuração. */
  csllRetidaAcumuladaCompensavel?: number;
  /** Dedução de incentivo (ex.: PAT), já limitada ao teto legal. */
  deducaoIncentivoIrpj?: number;
  limiteAdicionalMensal?: number;
  aliquotaIrpj?: number;
  aliquotaAdicionalIrpj?: number;
  aliquotaCsll?: number;
};

export type ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado = {
  lucroRealAcumulado: number;
  baseIrpj: number;
  irpjNormal: number;
  baseExcedenteAdicional: number;
  irpjAdicional: number;
  irpjDevido: number;
  deducaoIncentivoIrpj: number;
  pagamentosEstimativaIrpjAnteriores: number;
  irrfAcumuladoCompensavel: number;
  irpjAPagar: number;
  baseCsll: number;
  csllDevida: number;
  pagamentosEstimativaCsllAnteriores: number;
  csllRetidaAcumuladaCompensavel: number;
  csllAPagar: number;
};

/**
 * Balanço de Suspensão/Redução (art. 35 da Lei 8.981/1995): apura o IRPJ/CSLL sobre o
 * Lucro Real acumulado desde janeiro até o mês corrente, com o adicional de IRPJ incidindo
 * sobre o que exceder R$ 20.000,00 × número de meses acumulados. O DARF do mês é o total
 * acumulado menos o que já foi pago nos DARFs de estimativa dos meses anteriores do mesmo
 * ano-calendário (e as retenções acumuladas) — diferente da estimativa mensal isolada
 * (calcularIrpjCsllLucroRealMensal), que não acumula nem abate pagamentos anteriores.
 */
export function calcularIrpjCsllBalancoSuspensaoReducao(
  input: ApuracaoIrpjCsllBalancoSuspensaoReducaoInput,
): ApuracaoIrpjCsllBalancoSuspensaoReducaoResultado {
  const limiteAdicionalMensal = input.limiteAdicionalMensal ?? 20_000;
  const aliquotaIrpj = input.aliquotaIrpj ?? 0.15;
  const aliquotaAdicionalIrpj = input.aliquotaAdicionalIrpj ?? 0.10;
  const aliquotaCsll = input.aliquotaCsll ?? 0.09;
  const deducaoIncentivoIrpj = input.deducaoIncentivoIrpj ?? 0;
  const pagamentosEstimativaIrpjAnteriores = input.pagamentosEstimativaIrpjAnteriores ?? 0;
  const pagamentosEstimativaCsllAnteriores = input.pagamentosEstimativaCsllAnteriores ?? 0;
  const irrfAcumuladoCompensavel = input.irrfAcumuladoCompensavel ?? 0;
  const csllRetidaAcumuladaCompensavel = input.csllRetidaAcumuladaCompensavel ?? 0;

  const lucroRealAcumulado = arred(
    input.lucroContabilAcumulado + (input.adicoesAcumuladasIrpj ?? 0) - (input.exclusoesAcumuladasIrpj ?? 0),
  );
  const baseIrpj = lucroRealAcumulado;
  const irpjNormal = arred(Math.max(0, baseIrpj) * aliquotaIrpj);
  const limiteAdicionalAcumulado = arred(limiteAdicionalMensal * input.mesesAcumulados);
  const baseExcedenteAdicional = arred(Math.max(0, baseIrpj - limiteAdicionalAcumulado));
  const irpjAdicional = arred(baseExcedenteAdicional * aliquotaAdicionalIrpj);
  const irpjDevido = arred(irpjNormal + irpjAdicional);
  const irpjAPagar = arred(
    Math.max(0, irpjDevido - deducaoIncentivoIrpj - pagamentosEstimativaIrpjAnteriores - irrfAcumuladoCompensavel),
  );

  const baseCsll = arred(
    input.lucroContabilAcumulado + (input.adicoesAcumuladasCsll ?? 0) - (input.exclusoesAcumuladasCsll ?? 0),
  );
  const csllDevida = arred(Math.max(0, baseCsll) * aliquotaCsll);
  const csllAPagar = arred(
    Math.max(0, csllDevida - pagamentosEstimativaCsllAnteriores - csllRetidaAcumuladaCompensavel),
  );

  return {
    lucroRealAcumulado, baseIrpj, irpjNormal, baseExcedenteAdicional, irpjAdicional, irpjDevido,
    deducaoIncentivoIrpj, pagamentosEstimativaIrpjAnteriores, irrfAcumuladoCompensavel, irpjAPagar,
    baseCsll, csllDevida, pagamentosEstimativaCsllAnteriores, csllRetidaAcumuladaCompensavel, csllAPagar,
  };
}

export function calcularIrpjCsllLucroRealMensal(input: ApuracaoIrpjCsllLucroRealMensalInput): ApuracaoIrpjCsllLucroRealMensalResultado {
  const limiteAdicionalMensal = input.limiteAdicionalMensal ?? 20_000;
  const aliquotaIrpj = input.aliquotaIrpj ?? 0.15;
  const aliquotaAdicionalIrpj = input.aliquotaAdicionalIrpj ?? 0.10;
  const aliquotaCsll = input.aliquotaCsll ?? 0.09;
  const retencoesIrpjCompensaveis = input.retencoesIrpjCompensaveis ?? 0;
  const retencoesCsllCompensaveis = input.retencoesCsllCompensaveis ?? 0;

  const baseIrpj = arred(input.lucroContabilDoMes + (input.adicoesIrpj ?? 0) - (input.exclusoesIrpj ?? 0));
  const irpjNormal = arred(Math.max(0, baseIrpj) * aliquotaIrpj);
  const baseExcedenteAdicional = arred(Math.max(0, baseIrpj - limiteAdicionalMensal));
  const irpjAdicional = arred(baseExcedenteAdicional * aliquotaAdicionalIrpj);
  const irpjDevido = arred(irpjNormal + irpjAdicional);
  const irpjAPagar = arred(Math.max(0, irpjDevido - retencoesIrpjCompensaveis));

  const baseCsll = arred(input.lucroContabilDoMes + (input.adicoesCsll ?? 0) - (input.exclusoesCsll ?? 0));
  const csllDevida = arred(Math.max(0, baseCsll) * aliquotaCsll);
  const csllAPagar = arred(Math.max(0, csllDevida - retencoesCsllCompensaveis));

  return {
    baseIrpj, irpjNormal, baseExcedenteAdicional, irpjAdicional, irpjDevido, retencoesIrpjCompensaveis, irpjAPagar,
    baseCsll, csllDevida, retencoesCsllCompensaveis, csllAPagar,
  };
}
