import { regrasImobilizadoNitaplast } from "./nitaplast-imobilizado-regras";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { saldoAberturaSetembroPorConta } from "./nitaplast-saldos-setembro";
import { jcpBrutoAgosto, taxaTjlpAgosto } from "./nitaplast-jcp-agosto";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const saldo31Agosto = (conta: string) => saldoAberturaSetembroPorConta.get(conta) ?? 0;

/** Mesma cota mensal de agosto (após as baixas de julho); o Jeep segue sem cota até ter ficha e data de uso. */
const mensalPorGrupo: Record<string, number> = { maquinas: 25_929.18, veiculos: 14_298.16 };

export const lancamentosDepreciacaoSetembro: LancamentoIntegrado[] = regrasImobilizadoNitaplast.flatMap((regra, indice) => {
  if (regra.naoDepreciavel || !regra.valorMensalReferencia || !regra.contaDespesa || !regra.contaDepreciacaoAcumulada) return [];
  const mensal = mensalPorGrupo[regra.id] ?? regra.valorMensalReferencia;
  const bruto = regra.contasAtivo.reduce((soma, conta) => soma + Math.max(0, saldo31Agosto(conta)), 0);
  const acumulada = Math.max(0, -saldo31Agosto(regra.contaDepreciacaoAcumulada));
  const residual = arred(Math.max(0, bruto - acumulada));
  const valor = arred(Math.min(mensal, residual));
  if (valor <= 0) return [];
  return [{
    id: `SET-DEP-${String(indice + 1).padStart(2, "0")}`,
    data: "30/09/2026",
    origem: "DEPRECIAÇÃO IMOBILIZADO 09/2026",
    debitoCodigo: regra.contaDespesa,
    debito: nome(regra.contaDespesa),
    creditoCodigo: regra.contaDepreciacaoAcumulada,
    credito: nome(regra.contaDepreciacaoAcumulada),
    historico: `Depreciação mensal — ${regra.nome}`,
    documento: "MEMÓRIA DE CÁLCULO DEP 09/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor,
    status: "validado",
    observacao: regra.id === "veiculos"
      ? "Mesma cota de agosto (sem Mini Cooper e Corolla). Jeep Commander adquirido em agosto ainda sem cota: falta ficha patrimonial e data disponível para uso."
      : "Mesma cota mensal de agosto, limitada ao saldo residual em 31/08/2026.",
    rastreio: "derivado",
    fonte: "Padrão de depreciação de agosto (nitaplast-cpv-depreciacao-agosto.ts) + posição contábil em 31/08/2026",
  }];
});

// JCP — mesma regra de julho/agosto, com o patrimônio líquido de 31/08/2026.
const saldoCredor = (codigo: string) => Math.max(0, -saldo31Agosto(codigo));
const saldoDevedor = (codigo: string) => Math.max(0, saldo31Agosto(codigo));
const capitalSocialIntegralizado = saldoCredor("2348");
const reservasLucros = saldoCredor("25240");
const lucrosAcumuladosAnteriores = saldoCredor("2515");
const ajusteExercicioAnterior = saldoDevedor("5747");
const distribuicaoLucros = saldoDevedor("25241");
const lucrosEReservasLiquidos = arred(reservasLucros + lucrosAcumuladosAnteriores - ajusteExercicioAnterior - distribuicaoLucros);
const baseJcpSetembro = arred(capitalSocialIntegralizado + lucrosEReservasLiquidos);
// TJLP do 3º trimestre/2026 — mesma taxa mensal de julho e agosto.
export const taxaTjlpSetembro = taxaTjlpAgosto;
const jcpPelaTjlp = arred(baseJcpSetembro * taxaTjlpSetembro);
const limiteLucrosEReservas = arred(lucrosEReservasLiquidos * 0.5);
export const jcpBrutoSetembro = arred(Math.min(jcpPelaTjlp, limiteLucrosEReservas));

export const resumoJcpSetembro = {
  competencia: "09/2026",
  dataBase: "31/08/2026",
  capitalSocialIntegralizado,
  reservasLucros,
  lucrosAcumuladosAnteriores,
  ajusteExercicioAnterior,
  distribuicaoLucros,
  lucrosEReservasLiquidos,
  baseJcpSetembro,
  taxaTjlpSetembro,
  jcpPelaTjlp,
  limiteLucrosEReservas,
  jcpBrutoSetembro,
  diferencaParaAgosto: arred(jcpBrutoSetembro - jcpBrutoAgosto),
  irrfPotencial: arred(jcpBrutoSetembro * 0.175),
} as const;

export const lancamentosJcpSetembro: LancamentoIntegrado[] = [{
  id: "SET-JCP-01",
  data: "30/09/2026",
  origem: "CÁLCULO JCP 09/2026",
  debitoCodigo: "25107",
  debito: nome("25107"),
  creditoCodigo: "25253",
  credito: nome("25253"),
  historico: "Juros sobre capital próprio de setembro/2026 pela TJLP mensal",
  documento: "JCP 09/2026",
  cc: "902",
  centroCusto: "DESPESAS FINANCEIRAS",
  valor: jcpBrutoSetembro,
  status: "revisar",
  observacao: "Mesma regra de julho/agosto (capital + reservas + lucros acumulados − redutoras, limitado a 50% de lucros e reservas), patrimônio de 31/08/2026 e TJLP do 3º trimestre. IRRF permanece informativo, sem partida automática, como em agosto.",
  rastreio: "derivado",
  fonte: "Padrão de JCP de agosto (nitaplast-jcp-agosto.ts) + saldo patrimonial em 31/08/2026",
}];

if (jcpBrutoSetembro < 0) throw new Error("JCP de setembro não pode ser negativo");
