import { lancamentosIntegradosJulhoFinal } from "./nitaplast-razao-julho-final-v2";
import { saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";

/** Saldo final de julho transportado para agosto; é referência, não lançamento. */
export const saldoAberturaAgostoPorConta = (() => {
  const saldos = new Map(saldoAberturaJulhoPorConta);
  for (const linha of lancamentosIntegradosJulhoFinal) {
    saldos.set(linha.debitoCodigo, (saldos.get(linha.debitoCodigo) ?? 0) + linha.valor);
    saldos.set(linha.creditoCodigo, (saldos.get(linha.creditoCodigo) ?? 0) - linha.valor);
  }
  return new Map([...saldos].map(([conta, saldo]) => [conta, Math.round(saldo * 100) / 100]));
})();

