import { saldosImplantacaoParte1 } from "./nitaplast-implantacao-parte-1";
import { saldosImplantacaoParte2 } from "./nitaplast-implantacao-parte-2";
import { saldosImplantacaoParte3 } from "./nitaplast-implantacao-parte-3";
import { saldosImplantacaoParte4 } from "./nitaplast-implantacao-parte-4";

export type SaldoImplantacao = {
  conta: string;
  classificacao: string;
  descricao: string;
  saldo: number;
  natureza: "D" | "C";
  grupo: "Ativo" | "Passivo e patrimônio líquido" | "Receitas acumuladas" | "Custos e despesas acumulados" | "Contas compensatórias";
};

// Fonte: saldo anterior do Balancete 01/06/2026 a 30/06/2026.
// Data-base da implantação: 31/05/2026. Apenas contas analíticas com saldo diferente de zero.
export const saldosImplantacao: SaldoImplantacao[] = [
  ...saldosImplantacaoParte1,
  ...saldosImplantacaoParte2,
  ...saldosImplantacaoParte3,
  ...saldosImplantacaoParte4,
];

export const resumoImplantacao = {
  dataBase: "31/05/2026",
  quantidadeContas: 338,
  ativo: 40828008.01,
  passivoPatrimonioLiquido: 40252789.33,
  receitasAcumuladas: 8163769.32,
  custosDespesasAcumulados: 7588550.64,
  contasCompensatorias: 14907255.22,
  totalDebitosComCompensatorias: 72276247.56,
  totalCreditosComCompensatorias: 72276247.56,
} as const;
