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
 * - TJLP julho/2026 = 0,7617%;
 * - somente o JCP bruto entra no Razão nesta etapa;
 * - IRRF permanece apenas como informação/pendência tributária, sem partida contábil.
 *
 * Câmbio:
 * - contrato por si só não cria receita/despesa cambial;
 * - a variação realizada nasce entre o valor contábil da obrigação/direito e o valor
 *   liquidado no contrato;
 * - somente contratos com vínculo documental suficiente são lançados; os demais
 *   ficam em pendência para não fabricar resultado;
 * - históricos seguem, sempre que a fonte permite, a linguagem usada nos relatórios
 *   contábeis da Nitaplast ("VALOR REF. BAIXA PGTO...", "RECEBIMENTO EXPORTAÇÃO" etc.).
 */
const contasBaseJcp = ["2348", "25240", "2515", "5747", "25241"] as const;
// Os saldos patrimoniais de natureza credora são armazenados negativos no mapa de abertura.
// A base fiscal/econômica do JCP deve ser positiva, por isso invertemos o saldo líquido do PL elegível.
export const baseJcpJulho = arred(-contasBaseJcp.reduce((total, conta) => total + (saldoAberturaJulhoPorConta.get(conta) ?? 0), 0));
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
    observacao: `Base elegível em 30/06 R$ ${baseJcpJulho.toFixed(2)}; TJLP 0,7617%; JCP bruto R$ ${jcpBrutoJulho.toFixed(2)}. Reserva de capital genérica 25239 excluída por prudência. IRRF não contabilizado nesta etapa.`,
    rastreio: "derivado",
    fonte: "Balancete 30/06/2026 + cálculo JCP 07/2026",
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

// FERMAQ / DP 92249-003: posição do contas a receber em 31/07 = R$ 62.189,73.
// Contrato 617257802 recebeu USD 12.430,39 por R$ 63.084,23 em 27/07.
// Diferença realizada favorável: R$ 894,50.
export const cambioFermaq92249 = {
  documento: "DP 92249/003 / contrato 617257802",
  valorContabilDireito: 62189.73,
  valorRecebido: 63084.23,
  variacaoAtiva: 894.50,
  taxaContrato: 5.075,
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
    historico: "VALOR REF. BAIXA PGTO MP - NF 93556 - JHS - INV JXGX20260328624 - CONTRATO 617226937",
    documento: "NF 93556 / JXGX20260328624",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: cambioJhs93556.valorLiquidado,
    status: "validado",
    observacao: "O movimento bancário da importação já está reconhecido em Importações em Andamento. Esta partida leva o valor efetivamente liquidado para a baixa da obrigação, sem duplicar o banco.",
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
    historico: "VARIAÇÃO CAMBIAL REF. BAIXA PGTO MP - NF 93556 - JHS - TX PGTO 5,1040",
    documento: "NF 93556 / JXGX20260328624",
    cc: "901",
    centroCusto: "RECEITAS FINANCEIRAS",
    valor: cambioJhs93556.variacaoAtiva,
    status: "validado",
    observacao: `Obrigação contábil R$ ${cambioJhs93556.valorContabilObrigacao.toFixed(2)} menos liquidação R$ ${cambioJhs93556.valorLiquidado.toFixed(2)} = variação cambial ativa R$ ${cambioJhs93556.variacaoAtiva.toFixed(2)}.`,
    rastreio: "documento",
    fonte: "Conciliação entradas 07/2026 + contrato de câmbio 617226937",
  },
  {
    id: "JUL-CAMBIO-FERMAQ-92249-BAIXA",
    data: "27/07/2026",
    origem: "CONTRATO DE CÂMBIO 617257802",
    debitoCodigo: "9",
    debito: nomeConta("9"),
    creditoCodigo: "25111",
    credito: nomeConta("25111"),
    historico: "VALOR REF. RECEBIMENTO EXPORTAÇÃO - DP 92249/003 - FERMAQ - CONTRATO 617257802",
    documento: "DP 92249/003 / contrato 617257802",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: cambioFermaq92249.valorContabilDireito,
    status: "validado",
    observacao: "Baixa do valor contábil do título da FERMAQ contra o Bradesco. A diferença até o valor efetivamente recebido é reconhecida separadamente como variação cambial ativa.",
    rastreio: "documento",
    fonte: "Faturados até 31-07-2026.pdf + contrato de câmbio 617257802",
  },
  {
    id: "JUL-CAMBIO-FERMAQ-92249-VCA",
    data: "27/07/2026",
    origem: "CONTRATO DE CÂMBIO 617257802",
    debitoCodigo: "9",
    debito: nomeConta("9"),
    creditoCodigo: "25096",
    credito: nomeConta("25096"),
    historico: "VARIAÇÃO CAMBIAL REF. RECEBIMENTO EXPORTAÇÃO - DP 92249/003 - FERMAQ - TX CÂMBIO 5,0750",
    documento: "DP 92249/003 / contrato 617257802",
    cc: "901",
    centroCusto: "RECEITAS FINANCEIRAS",
    valor: cambioFermaq92249.variacaoAtiva,
    status: "validado",
    observacao: `Valor recebido R$ ${cambioFermaq92249.valorRecebido.toFixed(2)} menos direito contábil R$ ${cambioFermaq92249.valorContabilDireito.toFixed(2)} = variação cambial ativa R$ ${cambioFermaq92249.variacaoAtiva.toFixed(2)}.`,
    rastreio: "documento",
    fonte: "Faturados até 31-07-2026.pdf + contrato de câmbio 617257802",
  },
];

export const contratosCambioJulhoPendentes = [
  { contrato: "610005759", data: "03/07/2026", beneficiario: "JHS INTERNATIONAL", usd: 55900.00, brl: 291295.51, referencia: "JXGX20260326616", motivo: "Entrada é de junho; falta abrir o valor contábil do principal estrangeiro dentro da obrigação agregada de junho para calcular a variação sem usar impostos/custos da DI." },
  { contrato: "610926788", data: "07/07/2026", beneficiario: "ENVALIOR", usd: 43200.00, brl: 223749.06, referencia: "901189655", motivo: "Falta vínculo documental inequívoco entre a fatura do contrato e o valor contábil remanescente da obrigação que veio de maio/junho." },
  { contrato: "611879451", data: "10/07/2026", beneficiario: "GREATLAND VALVE", usd: 55863.94, brl: 287550.64, referencia: "GTL-PI-260401A/B", motivo: "A NF 92535 teve liquidações parciais anteriores; é necessário abrir o principal remanescente da fatura A/B antes de calcular nova variação." },
  { contrato: "613498289", data: "15/07/2026", beneficiario: "JHS INTERNATIONAL", usd: 55900.00, brl: 285816.70, referencia: "JXGX20260328623", motivo: "A conciliação mostra R$ 366.137,21 na NF 93461, mas ainda falta documento que ligue expressamente essa NF à INV JXGX20260328623. Não reconhecer R$ 80.320,51 apenas por inferência." },
  { contrato: "615923488", data: "22/07/2026", beneficiario: "ZHENJIANG INTERNATIONAL", usd: 13940.61, brl: 71306.22, referencia: "03-NITA-26", motivo: "Pagamento antecipado: permanece em importações/adiantamento; não existe variação realizada contra obrigação anterior sem documento de reconhecimento do passivo." },
  { contrato: "617262643", data: "27/07/2026", beneficiario: "PLASTICENTRO", usd: 47588.30, brl: 241510.62, referencia: "EXPORTAÇÃO", motivo: "Há vários títulos da PLASTICENTRO em aberto; falta identificar quais duplicatas compõem exatamente o recebimento do contrato para medir a variação sem escolher títulos por aproximação." },
] as const;

export const variacaoCambialAtivaValidada = arred(
  cambioJhs93556.variacaoAtiva + cambioFermaq92249.variacaoAtiva,
);

export const resumoFinanceiroJulho = {
  baseJcpJulho,
  taxaTjlpJulho,
  jcpBrutoJulho,
  jcpContabilizadoJulho: jcpBrutoJulho,
  irrfJcpJulho,
  irrfContabilizadoJulho: 0,
  jcpLiquidoJulho,
  variacaoCambialAtivaValidada,
  variacaoCambialPassivaValidada: 0,
  contratosCambioValidados: 2,
  contratosCambioPendentes: contratosCambioJulhoPendentes.length,
  valorEntradasSemCcPendente: 7047.92,
} as const;

export const lancamentosFinanceirosJulho: LancamentoIntegrado[] = [
  ...lancamentosJcpJulho,
  ...lancamentosCambioJulho,
];