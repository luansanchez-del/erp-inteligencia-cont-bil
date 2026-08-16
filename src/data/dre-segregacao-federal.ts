export type ValorTributoGerencial = {
  debito: number;
  credito: number;
  liquido: number;
};

export type ConciliacaoTributoGerencial = {
  tributo: "PIS" | "COFINS";
  consolidadoFiscal: ValorTributoGerencial;
  matrizGerencial: ValorTributoGerencial;
  filialGerencial: ValorTributoGerencial;
  diferencaDebito: number;
  diferencaCredito: number;
  diferencaLiquida: number;
  confere: boolean;
  regra: string;
};

const arred = (valor: number) => Math.round(valor * 100) / 100;

function normalizar(debito: number, credito: number): ValorTributoGerencial {
  const d = arred(debito);
  const c = arred(credito);
  return { debito: d, credito: c, liquido: arred(d - c) };
}

/**
 * Regra permanente da DRE gerencial:
 * - PIS/COFINS continuam com UMA apuração fiscal consolidada por empresa;
 * - a abertura Matriz x Filial é GERENCIAL e nasce do documento/nota a nota;
 * - a soma das parcelas gerenciais precisa reconciliar com a apuração consolidada;
 * - nenhuma diferença é empurrada para uma filial para "bater" a DRE.
 *
 * Quando apenas a filial está identificada nota a nota, a matriz é obtida como
 * residual de conciliação do consolidado fiscal. Isso NÃO cria uma segunda
 * apuração fiscal e NÃO gera lançamento contábil adicional.
 */
export function conciliarTributoGerencial(params: {
  tributo: "PIS" | "COFINS";
  consolidadoDebito: number;
  consolidadoCredito: number;
  filialDebitoNotaANota: number;
  filialCreditoNotaANota: number;
  tolerancia?: number;
}): ConciliacaoTributoGerencial {
  const tolerancia = params.tolerancia ?? 0.01;
  const consolidadoFiscal = normalizar(params.consolidadoDebito, params.consolidadoCredito);
  const filialGerencial = normalizar(params.filialDebitoNotaANota, params.filialCreditoNotaANota);
  const matrizGerencial = normalizar(
    consolidadoFiscal.debito - filialGerencial.debito,
    consolidadoFiscal.credito - filialGerencial.credito,
  );

  const diferencaDebito = arred(
    matrizGerencial.debito + filialGerencial.debito - consolidadoFiscal.debito,
  );
  const diferencaCredito = arred(
    matrizGerencial.credito + filialGerencial.credito - consolidadoFiscal.credito,
  );
  const diferencaLiquida = arred(
    matrizGerencial.liquido + filialGerencial.liquido - consolidadoFiscal.liquido,
  );

  return {
    tributo: params.tributo,
    consolidadoFiscal,
    matrizGerencial,
    filialGerencial,
    diferencaDebito,
    diferencaCredito,
    diferencaLiquida,
    confere:
      Math.abs(diferencaDebito) <= tolerancia
      && Math.abs(diferencaCredito) <= tolerancia
      && Math.abs(diferencaLiquida) <= tolerancia,
    regra: "Apuração fiscal consolidada; segregação Matriz x Filial pelo nota a nota; soma gerencial obrigatoriamente conciliada ao consolidado.",
  };
}
