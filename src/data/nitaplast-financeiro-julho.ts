import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho, saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Fechamento financeiro de julho/2026.
 *
 * JCP:
 * - base em 30/06/2026: capital social integralizado + reservas de lucros +
 *   lucros/prejuízos acumulados, considerando as contas redutoras do mesmo grupo;
 * - reserva de capital genérica (25239) fica fora até comprovar enquadramento legal;
 * - TJLP julho/2026 = 0,7617%.
 *
 * Câmbio:
 * - contrato por si só não cria receita/despesa cambial;
 * - a variação realizada nasce entre o valor contábil da obrigação/direito e o valor
 *   liquidado no contrato;
 * - somente contratos com vínculo documental suficiente são lançados; os demais
 *   ficam em pendência para não fabricar resultado.
 */
const contasBaseJcp = ["2348", "25240", "2515", "5747", "25241"] as const;
export const baseJcpJulho = arred(contasBaseJcp.reduce((total, conta) => total + (saldoAberturaJulhoPorConta.get(conta) ?? 0), 0));
export const taxaTjlpJulho = 0.007617;
export const jcpBrutoJulho = arred(baseJcpJulho * taxaTjlpJulho);
export const aliquotaIrrfJcpJulho = 0.175;
export const irrfJcpJulho = arred(jcpBrutoJulho * aliquotaIrrfJcpJulho);
export const jcpLiquidoJulho = arred(jcpBrutoJulho - irrfJcpJulho);

export const lancamentosJcpJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-JCP-01",
    data: "31/07/2026",
    origem: "CÁLCULO JCP 07/2026",
    debitoCodigo: "25107",
    debito: nomeConta("25107"),
    creditoCodigo: "25253",
    credito: nomeConta("25253"),
    historico: "Juros sobre capital próprio de julho/2026 pela TJLP mensal",
    documento: "JCP 07/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: jcpBrutoJulho,
    status: "validado",
    observacao: `Base elegível em 30/06 R$ ${baseJcpJulho.toFixed(2)}; TJLP 0,7617%; JCP bruto R$ ${jcpBrutoJulho.toFixed(2)}. Reserva de capital genérica 25239 excluída por prudência até comprovar natureza legal.`,
    rastreio: "derivado",
    fonte: "Balancete 30/06/2026 + Lei 9.249/1995 art. 9 + TJLP Receita Federal 07/2026",
  },
  {
    id: "JUL-JCP-IRRF",
    data: "31/07/2026",
    origem: "CÁLCULO JCP 07/2026",
    debitoCodigo: "25253",
    debito: nomeConta("25253"),
    creditoCodigo: "1546",
    credito: nomeConta("1546"),
    historico: "IRRF sobre JCP creditado em julho/2026",
    documento: "JCP 07/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: irrfJcpJulho,
    status: "validado",
    observacao: `IRRF 17,5% sobre JCP bruto de R$ ${jcpBrutoJulho.toFixed(2)}; líquido a pagar ao beneficiário R$ ${jcpLiquidoJulho.toFixed(2)}.`,
    rastreio: "derivado",
    fonte: "Lei 9.249/1995 art. 9, §2º, redação vigente em 2026",
  },
];

// NF 93556 / JHS: a conciliação contábil reconhece R$ 295.699,18 na obrigação.
// Contrato 617226937 liquidou USD 55.900,00 por R$ 285.313,60 em 27/07.
// Diferença realizada favorável: R$ 10.385,58.
export const cambioJhs93556 = {
  documento: "NF 93556 / INV JXGX20260328624 / contrato 617226937",
  valorContabilObrigacao: 295699.18,
  valorLiquidado: 285313.60,
  variacaoAtiva: 10385.58,
  taxaContrato: 5.104,
} as const;

export const lancamentosCambioJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-CAMBIO-JHS-93556-BAIXA",
    data: "27/07/2026",
    origem: "CONTRATO DE CÂMBIO 617226937",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "25116",
    credito: nomeConta("25116"),
    historico: "Reclassificação da liquidação cambial da NF 93556 JHS para baixa da obrigação",
    documento: "NF 93556 / JXGX20260328624",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: cambioJhs93556.valorLiquidado,
    status: "validado",
    observacao: "O banco já registra a saída em Importações em Andamento. Esta partida transfere a liquidação para a obrigação reconhecida na entrada, sem duplicar banco.",
    rastreio: "documento",
    fonte: "Conciliação entradas 07/2026 + contrato de câmbio 617226937",
  },
  {
    id: "JUL-CAMBIO-JHS-93556-VCA",
    data: "27/07/2026",
    origem: "CONTRATO DE CÂMBIO 617226937",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "25096",
    credito: nomeConta("25096"),
    historico: "Variação cambial ativa realizada na liquidação da NF 93556 JHS",
    documento: "NF 93556 / JXGX20260328624",
    cc: "901",
    centroCusto: "RECEITAS FINANCEIRAS",
    valor: cambioJhs93556.variacaoAtiva,
    status: "validado",
    observacao: `Obrigação contábil R$ ${cambioJhs93556.valorContabilObrigacao.toFixed(2)} menos liquidação R$ ${cambioJhs93556.valorLiquidado.toFixed(2)} = variação cambial ativa R$ ${cambioJhs93556.variacaoAtiva.toFixed(2)}.`,
    rastreio: "documento",
    fonte: "Conciliação entradas 07/2026 + contrato de câmbio 617226937",
  },
];

export const contratosCambioJulhoPendentes = [
  { contrato: "610005759", data: "03/07/2026", beneficiario: "JHS INTERNATIONAL", usd: 55900.00, brl: 291295.51, referencia: "JXGX20260326616", motivo: "Entrada é de junho; falta abrir o valor contábil do principal estrangeiro dentro da obrigação agregada de junho para calcular a variação sem usar impostos/custos da DI." },
  { contrato: "610926788", data: "07/07/2026", beneficiario: "ENVALIOR", usd: 43200.00, brl: 223749.06, referencia: "901189655", motivo: "Falta vínculo documental inequívoco entre a fatura do contrato e o valor contábil remanescente da obrigação que veio de maio/junho." },
  { contrato: "611879451", data: "10/07/2026", beneficiario: "GREATLAND VALVE", usd: 55863.94, brl: 287550.64, referencia: "GTL-PI-260401A/B", motivo: "A NF 92535 teve liquidações parciais anteriores; é necessário abrir o principal remanescente da fatura A/B antes de calcular nova variação." },
  { contrato: "613498289", data: "15/07/2026", beneficiario: "JHS INTERNATIONAL", usd: 55900.00, brl: 285816.70, referencia: "JXGX20260328623", motivo: "A NF 93461 contém valor fiscal/importação diferente do principal cambial; não usar o total da DI como obrigação em moeda estrangeira." },
  { contrato: "615923488", data: "22/07/2026", beneficiario: "ZHENJIANG INTERNATIONAL", usd: 13940.61, brl: 71306.22, referencia: "03-NITA-26", motivo: "Pagamento antecipado: permanece em importações/adiantamento; não existe variação realizada contra obrigação anterior sem documento de reconhecimento do passivo." },
  { contrato: "617257802", data: "27/07/2026", beneficiario: "FERMAQ", usd: 12430.39, brl: 63084.23, referencia: "EXPORTAÇÃO", motivo: "Falta o valor contábil em reais do contas a receber originado na venda para medir a variação ativa/passiva na liquidação." },
  { contrato: "617262643", data: "27/07/2026", beneficiario: "PLASTICENTRO", usd: 47588.30, brl: 241510.62, referencia: "EXPORTAÇÃO", motivo: "Falta o valor contábil em reais do contas a receber originado na venda para medir a variação ativa/passiva na liquidação." },
] as const;

export const resumoFinanceiroJulho = {
  baseJcpJulho,
  taxaTjlpJulho,
  jcpBrutoJulho,
  irrfJcpJulho,
  jcpLiquidoJulho,
  variacaoCambialAtivaValidada: cambioJhs93556.variacaoAtiva,
  contratosCambioPendentes: contratosCambioJulhoPendentes.length,
  valorEntradasSemCcPendente: 7047.92,
} as const;

export const lancamentosFinanceirosJulho: LancamentoIntegrado[] = [
  ...lancamentosJcpJulho,
  ...lancamentosCambioJulho,
];
