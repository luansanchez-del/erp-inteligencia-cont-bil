import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosIntegrados as lancamentosJunho } from "./nitaplast-razao-integrado";

/**
 * Saldos de abertura de 07/2026 calculados a partir do saldo de 31/05 + Razão de 06/2026.
 * REGRA: isto é somente referência de cálculo. Não gera lançamento de abertura no Razão.
 */
const movimentosJunho = new Map<string, { debitos: number; creditos: number }>();
for (const lancamento of lancamentosJunho) {
  const d = movimentosJunho.get(lancamento.debitoCodigo) ?? { debitos: 0, creditos: 0 };
  d.debitos += lancamento.valor;
  movimentosJunho.set(lancamento.debitoCodigo, d);

  const c = movimentosJunho.get(lancamento.creditoCodigo) ?? { debitos: 0, creditos: 0 };
  c.creditos += lancamento.valor;
  movimentosJunho.set(lancamento.creditoCodigo, c);
}

export const saldosAberturaJulho = saldosImplantacao.map((conta) => {
  const movimento = movimentosJunho.get(conta.conta) ?? { debitos: 0, creditos: 0 };
  const saldoBase = conta.natureza === "C" ? -Math.abs(conta.saldo) : Math.abs(conta.saldo);
  const saldo30Junho = Math.round((saldoBase + movimento.debitos - movimento.creditos) * 100) / 100;
  return {
    conta: conta.conta,
    classificacao: conta.classificacao,
    descricao: conta.descricao,
    grupo: conta.grupo,
    natureza: conta.natureza,
    saldo30Junho,
  };
});

export const saldoAberturaJulhoPorConta = new Map(
  saldosAberturaJulho.map((conta) => [conta.conta, conta.saldo30Junho]),
);

export const descricaoContaJulho = new Map(
  saldosImplantacao.map((conta) => [conta.conta, conta.descricao]),
);
