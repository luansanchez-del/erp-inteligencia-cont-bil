import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const VALOR_IMPORTACOES_NACIONALIZADAS = 1092407.58;
const SALDO_INICIAL_IMPORTACOES = 188960.55;
const SALDO_FINAL_ESPERADO = 453244.95;
const arred = (valor: number) => Math.round(valor * 100) / 100;

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * Fechamento das importações de junho/2026.
 *
 * REGRA CONTÁBIL VALIDADA:
 * - o valor principal é reconhecido pelo valor INTEGRAL das importações nacionalizadas;
 * - nunca se lança apenas a diferença necessária para zerar a conta 25116;
 * - os impostos/custos de importação já registrados continuam compondo a conta;
 * - a baixa fiscal CFOP 3101 de R$ 1.092.407,58 permanece no Razão;
 * - como a liquidação cambial ocorreu posteriormente, em 30/06 a contrapartida fica
 *   em obrigação a pagar, sem movimentar banco de julho dentro de junho.
 *
 * IMPORTANTE PARA APLICAÇÃO:
 * divergência de conciliação nunca lança exceção em import-time. A tela deve abrir
 * normalmente e apresentar o problema como validação/bloqueio contábil.
 */
const obrigacaoCambialJunho: LancamentoIntegrado = {
  id: "IMP-CAMBIO-062026",
  data: "30/06/2026",
  origem: "FECHAMENTO IMPORTAÇÕES 06/2026",
  debitoCodigo: "25116",
  debito: nomeConta("25116"),
  creditoCodigo: "1734",
  credito: nomeConta("1734"),
  historico: "Reconhecimento integral da obrigação cambial das importações nacionalizadas em junho/2026",
  documento: "CAMBIO-062026",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor: VALOR_IMPORTACOES_NACIONALIZADAS,
  status: "validado",
  observacao: "Valor integral reconhecido em junho. Não utilizar R$ 639.162,63 como ajuste para zerar a conta. A liquidação financeira ocorre posteriormente.",
  rastreio: "documento",
  fonte: "Registro de apuração ICMS + notas de entrada CFOP 3101 de junho/2026; total documentado R$ 1.092.407,58",
};

function movimentoConta(lancamentos: LancamentoIntegrado[], codigo: string) {
  return arred(lancamentos.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

export type ValidacaoImportacoesJunho = {
  baixaFiscalCalculada: number;
  baixaFiscalEsperada: number;
  saldoFinalCalculado: number;
  saldoFinalEsperado: number;
  baixaFiscalOk: boolean;
  saldoFinalOk: boolean;
  bloqueado: boolean;
  mensagens: string[];
};

export function validarFechamentoImportacoesJunho(lancamentos: LancamentoIntegrado[]): ValidacaoImportacoesJunho {
  const baixaFiscalCalculada = arred(lancamentos
    .filter((linha) => linha.creditoCodigo === "25116" && linha.debitoCodigo === "3093")
    .reduce((total, linha) => total + linha.valor, 0));
  const saldoFinalCalculado = arred(SALDO_INICIAL_IMPORTACOES + movimentoConta(lancamentos, "25116"));
  const baixaFiscalOk = Math.abs(baixaFiscalCalculada - VALOR_IMPORTACOES_NACIONALIZADAS) <= 0.01;
  const saldoFinalOk = Math.abs(saldoFinalCalculado - SALDO_FINAL_ESPERADO) <= 0.01;
  const mensagens: string[] = [];

  if (!baixaFiscalOk) {
    mensagens.push(`Baixa fiscal CFOP 3101: calculado R$ ${baixaFiscalCalculada.toFixed(2)} / esperado R$ ${VALOR_IMPORTACOES_NACIONALIZADAS.toFixed(2)}.`);
  }
  if (!saldoFinalOk) {
    mensagens.push(`Saldo final da 25116: calculado R$ ${saldoFinalCalculado.toFixed(2)} / esperado R$ ${SALDO_FINAL_ESPERADO.toFixed(2)}.`);
  }

  return {
    baixaFiscalCalculada,
    baixaFiscalEsperada: VALOR_IMPORTACOES_NACIONALIZADAS,
    saldoFinalCalculado,
    saldoFinalEsperado: SALDO_FINAL_ESPERADO,
    baixaFiscalOk,
    saldoFinalOk,
    bloqueado: !baixaFiscalOk || !saldoFinalOk,
    mensagens,
  };
}

export function aplicarFechamentoImportacoesJunho(
  lancamentos: LancamentoIntegrado[],
): LancamentoIntegrado[] {
  const semDuplicidade = lancamentos.filter((linha) => linha.id !== obrigacaoCambialJunho.id);
  return [...semDuplicidade, obrigacaoCambialJunho];
}

export const fechamentoImportacoesJunho = {
  saldoInicial: SALDO_INICIAL_IMPORTACOES,
  obrigacaoCambialIntegral: VALOR_IMPORTACOES_NACIONALIZADAS,
  baixaFiscalCfop3101: VALOR_IMPORTACOES_NACIONALIZADAS,
  saldoFinalEsperado: SALDO_FINAL_ESPERADO,
} as const;
