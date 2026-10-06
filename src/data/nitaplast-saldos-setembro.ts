import { lancamentosIntegradosAgosto } from "./nitaplast-razao-agosto";
import { saldoAberturaAgostoPorConta } from "./nitaplast-saldos-agosto";

/**
 * Saldo final de agosto/2026 transportado para setembro: abertura de agosto mais todo o
 * movimento do Razão de agosto (competência fechada em 06/10/2026). É referência de
 * abertura por conta, não lançamento.
 */
export const saldoAberturaSetembroPorConta = (() => {
  const saldos = new Map(saldoAberturaAgostoPorConta);
  for (const linha of lancamentosIntegradosAgosto) {
    saldos.set(linha.debitoCodigo, (saldos.get(linha.debitoCodigo) ?? 0) + linha.valor);
    saldos.set(linha.creditoCodigo, (saldos.get(linha.creditoCodigo) ?? 0) - linha.valor);
  }
  return new Map([...saldos].map(([conta, saldo]) => [conta, Math.round(saldo * 100) / 100]));
})();
