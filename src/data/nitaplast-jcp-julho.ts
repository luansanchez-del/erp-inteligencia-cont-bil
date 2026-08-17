import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { calculoJcpJulho } from "./nitaplast-fechamento-julho";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * JCP de 07/2026 autorizado para contabilização.
 *
 * O reconhecimento contábil constitui crédito ao beneficiário mesmo sem pagamento
 * bancário imediato. Por isso, o IRRF é reconhecido separadamente no momento do
 * crédito, mantendo a despesa pelo valor bruto e o passivo do sócio pelo valor líquido.
 */
export const lancamentosJcpJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-JCP-RECON-072026",
    data: "31/07/2026",
    origem: "RECONHECIMENTO JCP 07/2026",
    debitoCodigo: "25107",
    debito: nomeConta("25107"),
    creditoCodigo: "25253",
    credito: nomeConta("25253"),
    historico: "Reconhecimento de juros sobre capital próprio de julho/2026",
    documento: "JCP 07/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: calculoJcpJulho.jcpCalculado,
    status: "validado",
    observacao: "JCP de julho autorizado para contabilização. Valor bruto calculado pela base fiscal/TJLP registrada no fechamento. Manter a deliberação societária/evidência vinculada ao fechamento.",
    rastreio: "derivado",
    fonte: "Cálculo JCP 07/2026 do ERP + autorização de contabilização",
  },
  {
    id: "JUL-JCP-IRRF-072026",
    data: "31/07/2026",
    origem: "RECONHECIMENTO JCP 07/2026",
    debitoCodigo: "25253",
    debito: nomeConta("25253"),
    creditoCodigo: "1546",
    credito: nomeConta("1546"),
    historico: "IRRF de 17,5% sobre o crédito de JCP de julho/2026",
    documento: "JCP 07/2026 - IRRF",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: calculoJcpJulho.irrfPotencialSeCreditado,
    status: "validado",
    observacao: "Retenção reconhecida sobre o crédito do JCP ao beneficiário. Não é crédito de IRPJ/CSLL da empresa pagadora; reduz o passivo líquido devido ao beneficiário e cria IRRF a recolher.",
    rastreio: "derivado",
    fonte: "Cálculo JCP 07/2026 do ERP + LC 224/2025, art. 8",
  },
];

export const resumoJcpJulho = {
  bruto: calculoJcpJulho.jcpCalculado,
  irrf: calculoJcpJulho.irrfPotencialSeCreditado,
  liquidoBeneficiario: Math.round((calculoJcpJulho.jcpCalculado - calculoJcpJulho.irrfPotencialSeCreditado) * 100) / 100,
  aliquotaIrrf: 17.5,
  contabilizado: true,
  pago: false,
} as const;
