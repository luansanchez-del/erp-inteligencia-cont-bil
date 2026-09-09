import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { saldoAberturaAgostoPorConta } from "./nitaplast-saldos-agosto";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const saldoCredor = (codigo: string) => Math.max(0, -(saldoAberturaAgostoPorConta.get(codigo) ?? 0));
const saldoDevedor = (codigo: string) => Math.max(0, saldoAberturaAgostoPorConta.get(codigo) ?? 0);

/**
 * Memória do JCP de agosto pela mesma regra documental adotada em julho.
 * A reserva de capital genérica 25239 permanece fora até haver comprovação
 * jurídica de que é elegível ao cálculo.
 */
const capitalSocialIntegralizado = saldoCredor("2348");
const reservasLucros = saldoCredor("25240");
const lucrosAcumuladosAnteriores = saldoCredor("2515");
const ajusteExercicioAnterior = saldoDevedor("5747");
const distribuicaoLucros = saldoDevedor("25241");
const redutorasPatrimonio = arred(ajusteExercicioAnterior + distribuicaoLucros);
const lucrosEReservasLiquidos = arred(reservasLucros + lucrosAcumuladosAnteriores - redutorasPatrimonio);
const baseJcpAgosto = arred(capitalSocialIntegralizado + lucrosEReservasLiquidos);

// TJLP mensal adotada no fechamento de julho; confirmar a taxa oficial de 08/2026.
export const taxaTjlpAgosto = 0.007617;
const jcpPelaTjlpAgosto = arred(baseJcpAgosto * taxaTjlpAgosto);
const limiteLucrosEReservasAgosto = arred(lucrosEReservasLiquidos * 0.5);
export const jcpBrutoAgosto = arred(Math.min(jcpPelaTjlpAgosto, limiteLucrosEReservasAgosto));
export const irrfPotencialJcpAgosto = arred(jcpBrutoAgosto * 0.175);

export const resumoJcpAgosto = {
  competencia: "08/2026",
  dataBase: "31/08/2026",
  capitalSocialIntegralizado,
  reservasLucros,
  lucrosAcumuladosAnteriores,
  ajusteExercicioAnterior,
  distribuicaoLucros,
  redutorasPatrimonio,
  lucrosEReservasLiquidos,
  baseJcpAgosto,
  taxaTjlpAgosto,
  jcpPelaTjlpAgosto,
  limiteLucrosEReservasAgosto,
  jcpBrutoAgosto,
  irrfPotencialJcpAgosto,
  irrfReconhecidoAgora: 0,
  status: "revisar" as const,
  observacao: "Cálculo preparado com a taxa mensal adotada em julho; validar a TJLP oficial de agosto antes do fechamento definitivo. IRRF permanece informativo, sem partida automática.",
} as const;

export const lancamentosJcpAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-JCP-01",
    data: "31/08/2026",
    origem: "CÁLCULO JCP 08/2026",
    debitoCodigo: "25107",
    debito: nome("25107"),
    creditoCodigo: "25253",
    credito: nome("25253"),
    historico: "Juros sobre capital próprio de agosto/2026 pela TJLP mensal",
    documento: "JCP 08/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: jcpBrutoAgosto,
    status: "revisar",
    observacao: resumoJcpAgosto.observacao,
    rastreio: "derivado",
    fonte: "Saldo patrimonial transportado em 31/07/2026 + memória de cálculo JCP 08/2026",
  },
];

if (jcpBrutoAgosto < 0) throw new Error("JCP de agosto não pode ser negativo");