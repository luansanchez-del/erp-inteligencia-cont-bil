import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosIntegrados as lancamentosJunho } from "./nitaplast-razao-integrado";
import { estoqueFinalMatrizJunhoPorConta } from "./nitaplast-fechamento-estoque-matriz-junho";

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

// O congelamento de junho remove o lançamento inteiro de fechamento de estoque físico
// (por tocar a conta 25944), inclusive a perna que ajustaria a conta patrimonial de
// estoque — então o saldo dessas 5 contas nunca chega ao inventário físico oficial de
// 30/06/2026 (REGISTRO INVENTARIO ESTOQUE OFICIAL.pdf). Aqui o saldo de fechamento de
// junho é forçado para o valor do inventário físico, para que a abertura de julho (e o
// próprio saldo de junho) parta do número real, não do saldo de maio arrastado.
const estoqueFinalMatrizJunho = estoqueFinalMatrizJunhoPorConta as Record<string, number>;

export const saldosAberturaJulho = saldosImplantacao.map((conta) => {
  const alvoInventarioJunho = estoqueFinalMatrizJunho[conta.conta];
  if (alvoInventarioJunho !== undefined) {
    return {
      conta: conta.conta,
      classificacao: conta.classificacao,
      descricao: conta.descricao,
      grupo: conta.grupo,
      natureza: conta.natureza,
      saldo30Junho: alvoInventarioJunho,
    };
  }
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
