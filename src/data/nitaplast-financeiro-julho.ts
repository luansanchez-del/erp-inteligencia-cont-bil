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
 * - pagamentos exteriores já registrados pelo banco em D 25116 / C Banco não são
 *   duplicados: as partidas específicas abaixo apenas limpam/reclassificam a 25116;
 * - somente contratos com vínculo documental suficiente são lançados; os demais
 *   ficam em pendência para não fabricar resultado;
 * - históricos seguem, sempre que a fonte permite, a linguagem usada nos relatórios
 *   contábeis da Nitaplast ("VALOR REF. BAIXA PGTO...", "RECEBIMENTO EXPORTAÇÃO" etc.).
 */
const contasBaseJcp = ["2348", "25240", "2515", "5747", "25241"] as const;
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

// OC 16094 / NF 93077 / DUIMP 26BR0000771074-8 / INV JXGX20260326616.
// A DUIMP fecha exatamente USD 55.900,00 e a base aduaneira/PIS/COFINS da NF é
// R$ 288.975,05. O contrato 610005759 liquidou a mesma invoice por R$ 291.295,51.
// Como a obrigação de junho foi reconhecida no agregado da 1734, a baixa específica
// reduz a 1734; a diferença realizada de R$ 2.320,46 é Variação Cambial Passiva.
export const cambioJhs93077 = {
  documento: "OC 16094 / NF 93077 / DUIMP 26BR0000771074-8 / INV JXGX20260326616 / contrato 610005759",
  valorContabilObrigacao: 288975.05,
  valorLiquidado: 291295.51,
  variacaoPassiva: 2320.46,
  taxaReconhecimento: 5.1695,
  taxaContrato: 5.2110108,
} as const;

// Contrato 615923488 / Zhenjiang: a ordem de pagamento refere-se à INV 03-NITA-26
// e é expressamente PAGAMENTO ANTECIPADO. A importação OC 15889 / NF 93318 / DUIMP
// 26BR0000950023-6 refere-se à fatura 02-NITA-26, portanto não existe baixa daquela
// obrigação nem variação realizada. O pagamento é adiantamento de importação (290).
export const adiantamentoZhenjiang03Nita26 = {
  documento: "INV 03-NITA-26 / contrato 615923488",
  valorLiquidado: 71306.22,
  usd: 13940.61,
  taxaContrato: 5.115,
  contaAdiantamento: "290",
} as const;

// FERMAQ / DP 92249-003: posição documental do título = R$ 62.189,73.
// Contrato 617257802 recebeu USD 12.430,39 por R$ 63.084,23 em 27/07.
// O recebimento bancário já integra o Razão pelo lote agregado do Bradesco;
// aqui entra apenas a reclassificação do excesso baixado de Duplicatas para VCA.
export const cambioFermaq92249 = {
  documento: "DP 92249/003 / contrato 617257802",
  valorContabilDireito: 62189.73,
  valorRecebido: 63084.23,
  variacaoAtiva: 894.50,
  taxaContrato: 5.075,
} as const;

export const lancamentosCambioJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-CAMBIO-JHS-16094-BAIXA",
    data: "03/07/2026",
    origem: "CONTRATO DE CÂMBIO 610005759",
    debitoCodigo: "1734",
    debito: nomeConta("1734"),
    creditoCodigo: "25116",
    credito: nomeConta("25116"),
    historico: "VALOR REF. BAIXA PGTO MP - NF 93077 - OC 16094 - JHS - INV JXGX20260326616 - CONTRATO 610005759",
    documento: "NF 93077 / OC 16094 / DUIMP 26BR0000771074-8 / JXGX20260326616",
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: cambioJhs93077.valorContabilObrigacao,
    status: "validado",
    observacao: `Vínculo documental exato. A obrigação principal reconhecida pela DUIMP/base fiscal é R$ ${cambioJhs93077.valorContabilObrigacao.toFixed(2)}. O banco já registrou o pagamento exterior em D 25116 / C Banco; esta partida baixa a obrigação de junho sem duplicar o banco.`,
    rastreio: "documento",
    fonte: "JHS 16094.pdf + RELAÇÃO NOTAS POR CENTRO DE CUSTO 062026 + contrato de câmbio 610005759 + movimentação bancária Bradesco 07/2026",
  },
  {
    id: "JUL-CAMBIO-JHS-16094-VCP",
    data: "03/07/2026",
    origem: "CONTRATO DE CÂMBIO 610005759",
    debitoCodigo: "25109",
    debito: nomeConta("25109"),
    creditoCodigo: "25116",
    credito: nomeConta("25116"),
    historico: "VARIAÇÃO CAMBIAL PASSIVA REF. BAIXA PGTO MP - NF 93077 - JHS - TX CONTÁBIL 5,1695 / TX PGTO 5,2110108",
    documento: "NF 93077 / JXGX20260326616 / contrato 610005759",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: cambioJhs93077.variacaoPassiva,
    status: "validado",
    observacao: `Obrigação contábil R$ ${cambioJhs93077.valorContabilObrigacao.toFixed(2)} versus liquidação R$ ${cambioJhs93077.valorLiquidado.toFixed(2)} = variação cambial passiva R$ ${cambioJhs93077.variacaoPassiva.toFixed(2)}.`,
    rastreio: "documento",
    fonte: "JHS 16094.pdf + NF 93077/OC 16094 + contrato de câmbio 610005759",
  },
  {
    id: "JUL-CAMBIO-ZHENJIANG-03-NITA-ADIANT",
    data: "22/07/2026",
    origem: "CONTRATO DE CÂMBIO 615923488",
    debitoCodigo: "290",
    debito: nomeConta("290"),
    creditoCodigo: "25116",
    credito: nomeConta("25116"),
    historico: "ADIANTAMENTO DE IMPORTAÇÃO - ZHENJIANG - INV 03-NITA-26 - CONTRATO 615923488",
    documento: "INV 03-NITA-26 / contrato 615923488",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: adiantamentoZhenjiang03Nita26.valorLiquidado,
    status: "validado",
    observacao: "Contrato identificado como PAGAMENTO ANTECIPADO da INV 03-NITA-26. A DUIMP/OC 15889 recebida refere-se à INV 02-NITA-26, logo este contrato não baixa aquela obrigação e não gera variação cambial realizada. O banco já está em D 25116 / C Banco; esta partida reclassifica para Adiantamentos de Importações.",
    rastreio: "documento",
    fonte: "Contrato 615923488 + Zhenjiang 15889.pdf (DUIMP 26BR0000950023-6 / fatura 02-NITA-26) + movimentação bancária Bradesco 07/2026",
  },
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
    observacao: "A saída bancária da importação já está registrada em Importações em Andamento. Esta partida leva somente o principal liquidado para a baixa da obrigação, sem duplicar o banco.",
    rastreio: "documento",
    fonte: "Conciliação entradas 07/2026 + contrato de câmbio 617226937 + movimentação bancária Bradesco 07/2026",
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
    id: "JUL-CAMBIO-FERMAQ-92249-VCA",
    data: "27/07/2026",
    origem: "CONTRATO DE CÂMBIO 617257802",
    debitoCodigo: "25111",
    debito: nomeConta("25111"),
    creditoCodigo: "25096",
    credito: nomeConta("25096"),
    historico: "VARIAÇÃO CAMBIAL REF. RECEBIMENTO EXPORTAÇÃO - DP 92249/003 - FERMAQ - TX CÂMBIO 5,0750",
    documento: "DP 92249/003 / contrato 617257802",
    cc: "901",
    centroCusto: "RECEITAS FINANCEIRAS",
    valor: cambioFermaq92249.variacaoAtiva,
    status: "validado",
    observacao: `O recebimento de R$ ${cambioFermaq92249.valorRecebido.toFixed(2)} já está no lote bancário D Banco / C Duplicatas. Esta partida devolve R$ ${cambioFermaq92249.variacaoAtiva.toFixed(2)} para Duplicatas e reconhece a VCA, deixando a baixa líquida do título em R$ ${cambioFermaq92249.valorContabilDireito.toFixed(2)}.`,
    rastreio: "documento",
    fonte: "Faturados até 31-07-2026.pdf + contrato de câmbio 617257802 + movimentação bancária Bradesco 07/2026",
  },
];

export const contratosCambioJulhoPendentes = [
  { contrato: "610926788", data: "07/07/2026", beneficiario: "ENVALIOR", usd: 43200.00, brl: 223749.06, referencia: "901189655", motivo: "Falta vínculo documental inequívoco entre a fatura do contrato e o valor contábil remanescente da obrigação que veio de maio/junho." },
  { contrato: "611879451", data: "10/07/2026", beneficiario: "GREATLAND VALVE", usd: 55863.94, brl: 287550.64, referencia: "GTL-PI-260401A/B", motivo: "A NF 92535 teve liquidações parciais anteriores; é necessário abrir o principal remanescente da fatura A/B antes de calcular nova variação." },
  { contrato: "613498289", data: "15/07/2026", beneficiario: "JHS INTERNATIONAL", usd: 55900.00, brl: 285816.70, referencia: "JXGX20260328623", motivo: "A conciliação mostra R$ 366.137,21 na NF 93461, mas ainda falta documento que ligue expressamente essa NF à INV JXGX20260328623. Não reconhecer R$ 80.320,51 apenas por inferência." },
  { contrato: "617262643", data: "27/07/2026", beneficiario: "PLASTICENTRO", usd: 47588.30, brl: 241510.62, referencia: "EXPORTAÇÃO", motivo: "Há vários títulos da PLASTICENTRO em aberto; falta identificar quais duplicatas compõem exatamente o recebimento do contrato para medir a variação sem escolher títulos por aproximação." },
] as const;

// Importações documentalmente identificadas para as quais ainda não foi localizado
// contrato de câmbio correspondente. Não geram baixa ou variação enquanto o vínculo
// não existir.
export const importacoesSemContratoCambioJulho = [
  { fornecedor: "ZHENJIANG INTERNATIONAL", oc: "15889", nf: "93318", duimp: "26BR0000950023-6", referencia: "02-NITA-26", valorAduaneiro: 116323.06, motivo: "O contrato 615923488 é da INV 03-NITA-26 e não liquida esta importação." },
  { fornecedor: "BASF SE", oc: "16009/16010", nf: "93361", duimp: "26BR0000925014-0", referencia: "3209714898 / 3209714889", valorAduaneiro: 424292.52, motivo: "Nenhum contrato de câmbio correspondente às duas faturas foi localizado entre os documentos disponíveis." },
] as const;

export const variacaoCambialAtivaValidada = arred(cambioJhs93556.variacaoAtiva + cambioFermaq92249.variacaoAtiva);
export const variacaoCambialPassivaValidada = cambioJhs93077.variacaoPassiva;

export const resumoFinanceiroJulho = {
  baseJcpJulho,
  taxaTjlpJulho,
  jcpBrutoJulho,
  jcpContabilizadoJulho: jcpBrutoJulho,
  irrfJcpJulho,
  irrfContabilizadoJulho: 0,
  jcpLiquidoJulho,
  variacaoCambialAtivaValidada,
  variacaoCambialPassivaValidada,
  contratosCambioValidados: 4,
  contratosCambioPendentes: contratosCambioJulhoPendentes.length,
  importacoesSemContratoCambio: importacoesSemContratoCambioJulho.length,
  valorEntradasSemCcPendente: 7047.92,
} as const;

export const lancamentosFinanceirosJulho: LancamentoIntegrado[] = [
  ...lancamentosJcpJulho,
  ...lancamentosCambioJulho,
];

// Travas de consistência: os contratos validados devem fechar exatamente com o
// principal/adiantamento + variação, sem criar ou duplicar banco.
const totalJhs16094 = arred(cambioJhs93077.valorContabilObrigacao + cambioJhs93077.variacaoPassiva);
if (Math.abs(totalJhs16094 - cambioJhs93077.valorLiquidado) > 0.01) {
  throw new Error(`JHS 16094 não concilia com o contrato 610005759: ${totalJhs16094.toFixed(2)} / ${cambioJhs93077.valorLiquidado.toFixed(2)}`);
}
const zhenjiangGerouResultado = lancamentosCambioJulho.find((x) => x.origem === "CONTRATO DE CÂMBIO 615923488" && (x.debitoCodigo === "25109" || x.creditoCodigo === "25096"));
if (zhenjiangGerouResultado) throw new Error("Pagamento antecipado Zhenjiang 03-NITA-26 não pode gerar variação cambial realizada.");
const zhenjiangNaoFoiAdiantamento = lancamentosCambioJulho.find((x) => x.origem === "CONTRATO DE CÂMBIO 615923488" && x.debitoCodigo !== "290");
if (zhenjiangNaoFoiAdiantamento) throw new Error("Contrato 615923488 deve permanecer em Adiantamentos de Importações (290).");
