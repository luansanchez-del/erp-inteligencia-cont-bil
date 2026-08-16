export type ValorTributoGerencial = {
  debitoSobreVendas: number;
  reversaoDre: number;
  liquidoDre: number;
};

export type ConciliacaoTributoGerencial = {
  tributo: "PIS" | "COFINS";
  consolidadoGerencial: ValorTributoGerencial;
  matrizGerencial: ValorTributoGerencial;
  filialGerencial: ValorTributoGerencial;
  diferencaDebito: number;
  diferencaReversao: number;
  diferencaLiquida: number;
  confere: boolean;
  regra: string;
};

const arred = (valor: number) => Math.round(valor * 100) / 100;

function normalizar(debitoSobreVendas: number, reversaoDre: number): ValorTributoGerencial {
  const debito = arred(debitoSobreVendas);
  const reversao = arred(reversaoDre);
  return {
    debitoSobreVendas: debito,
    reversaoDre: reversao,
    liquidoDre: arred(debito - reversao),
  };
}

/**
 * Regra permanente da DRE gerencial:
 * - PIS/COFINS possuem UMA apuração fiscal consolidada por empresa;
 * - a abertura Matriz x Filial da DRE nasce do documento/nota a nota;
 * - o débito sobre vendas segregado deve reconciliar com o débito consolidado;
 * - reversões de DRE (ex.: imposto de devoluções) são segregadas pela origem;
 * - CRÉDITOS FISCAIS DE AQUISIÇÃO não entram nesta conta: permanecem no ativo
 *   recuperável/compensação e são conciliados separadamente na apuração fiscal;
 * - nenhuma diferença é empurrada para uma filial para "bater" a DRE enviada.
 *
 * Quando apenas a filial está identificada nota a nota, a matriz é obtida como
 * residual de conciliação do débito consolidado. Isso NÃO cria uma segunda
 * apuração fiscal e NÃO gera lançamento contábil adicional.
 */
export function conciliarTributoGerencial(params: {
  tributo: "PIS" | "COFINS";
  consolidadoDebitoSobreVendas: number;
  consolidadoReversaoDre: number;
  filialDebitoNotaANota: number;
  filialReversaoNotaANota: number;
  tolerancia?: number;
}): ConciliacaoTributoGerencial {
  const tolerancia = params.tolerancia ?? 0.01;
  const consolidadoGerencial = normalizar(
    params.consolidadoDebitoSobreVendas,
    params.consolidadoReversaoDre,
  );
  const filialGerencial = normalizar(
    params.filialDebitoNotaANota,
    params.filialReversaoNotaANota,
  );
  const matrizGerencial = normalizar(
    consolidadoGerencial.debitoSobreVendas - filialGerencial.debitoSobreVendas,
    consolidadoGerencial.reversaoDre - filialGerencial.reversaoDre,
  );

  const diferencaDebito = arred(
    matrizGerencial.debitoSobreVendas
      + filialGerencial.debitoSobreVendas
      - consolidadoGerencial.debitoSobreVendas,
  );
  const diferencaReversao = arred(
    matrizGerencial.reversaoDre
      + filialGerencial.reversaoDre
      - consolidadoGerencial.reversaoDre,
  );
  const diferencaLiquida = arred(
    matrizGerencial.liquidoDre
      + filialGerencial.liquidoDre
      - consolidadoGerencial.liquidoDre,
  );

  return {
    tributo: params.tributo,
    consolidadoGerencial,
    matrizGerencial,
    filialGerencial,
    diferencaDebito,
    diferencaReversao,
    diferencaLiquida,
    confere:
      Math.abs(diferencaDebito) <= tolerancia
      && Math.abs(diferencaReversao) <= tolerancia
      && Math.abs(diferencaLiquida) <= tolerancia,
    regra: "Apuração fiscal consolidada; segregação gerencial Matriz x Filial pelo nota a nota; créditos de aquisição ficam fora da dedução sobre vendas.",
  };
}
