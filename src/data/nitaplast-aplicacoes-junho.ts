import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

/**
 * Conciliação documental das aplicações de junho/2026.
 *
 * Itaú Trust DI (conta 25002):
 * - saldo bruto anterior: 837.809,76
 * - aplicações: 761.270,00
 * - resgates líquidos já refletidos no movimento bancário: 1.147.300,00
 * - rendimento bruto do período: 8.739,98
 * - rendimento já capturado no movimento financeiro: 5.486,23
 * - complemento de rendimento: 3.253,75
 * - IOF retido: 2.339,19
 * - IRRF retido: 1.416,13
 * - saldo bruto final conciliado: 456.764,42
 *
 * Bradesco 895 / Invest Fácil:
 * - conta corrente: 25001
 * - aplicação Invest Fácil: 62
 * - saldo líquido da aplicação em 31/05: 16.828,03
 * - aplicações em junho: 5.004,61 (4.512,44 em 17/06 + 492,17 em 23/06)
 * - resgates líquidos em junho: 16.869,02
 * - rendimento bruto apropriado no período: 2,04
 * - IOF do período conciliado: 0,05
 * - IRRF do período conciliado: 0,45
 * - saldo líquido da aplicação em 30/06: 4.965,16
 * - saldo da conta corrente após separar aplicação/resgate: 1,00
 *
 * Greencred (conta 25110):
 * - saldo contábil em 31/05: 1.608.508,04
 * - aplicação em junho: 400.000,00
 * - posição bruta em 30/06: 2.039.048,38
 * - rendimento bruto de junho: 30.540,34
 * - rendimento já capturado no movimento financeiro: 14.119,24
 * - complemento de rendimento: 16.421,10
 * - posição líquida informativa em 30/06: 2.002.659,72
 *
 * A posição líquida Greencred contém IOF/IR projetados na liquidação. Como não houve
 * resgate em junho, a contabilidade segue o critério do razão de maio e reconhece a
 * posição bruta / rendimento bruto, sem antecipar retenções ainda não realizadas.
 *
 * Não há lançamento de ajuste para bater saldo. Os lançamentos abaixo reproduzem
 * aplicações, resgates, rendimentos e retenções identificados nos extratos.
 */
export const ajustesAplicacoesJunho: LancamentoIntegrado[] = [
  {
    id: "APL-ITAU-TRUST-REND-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25002",
    debito: nomeConta("25002"),
    creditoCodigo: "25098",
    credito: nomeConta("25098"),
    historico: "Complemento do rendimento bruto Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 3253.75,
    status: "validado",
    observacao: "Rendimento bruto do extrato (R$ 8.739,98) menos rendimento já capturado no movimento financeiro (R$ 5.486,23).",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },
  {
    id: "APL-ITAU-TRUST-IOF-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25105",
    debito: nomeConta("25105"),
    creditoCodigo: "25002",
    credito: nomeConta("25002"),
    historico: "IOF retido nos resgates do Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 2339.19,
    status: "validado",
    observacao: "IOF retido no período conforme extrato da aplicação.",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },
  {
    id: "APL-ITAU-TRUST-IRRF-001",
    data: "30/06/2026",
    origem: "EXTRATO ITAÚ TRUST DI 06/2026",
    debitoCodigo: "25118",
    debito: nomeConta("25118"),
    creditoCodigo: "25002",
    credito: nomeConta("25002"),
    historico: "IRRF sobre aplicações financeiras - Itaú Trust DI - junho/2026",
    documento: "TRUST DI 06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 1416.13,
    status: "validado",
    observacao: "IRRF retido no período reconhecido em IRRF s/ Aplicações Financeiras.",
    rastreio: "documento",
    fonte: "Nita fundo.pdf - Itaú Trust DI, período 01/06/2026 a 30/06/2026",
  },

  // Bradesco 895 - aplicações: D Invest Fácil / C Conta Corrente.
  {
    id: "APL-BRAD-895-APLIC-001",
    data: "17/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "62",
    debito: nomeConta("62"),
    creditoCodigo: "25001",
    credito: nomeConta("25001"),
    historico: "Aplicação Invest Fácil Bradesco 895 - certificado 1262718752982",
    documento: "INVEST FACIL 17/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 4512.44,
    status: "validado",
    observacao: "Transferência da conta corrente para a aplicação, conforme extrato do Invest Fácil.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - aplicações de junho/2026",
  },
  {
    id: "APL-BRAD-895-APLIC-002",
    data: "23/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "62",
    debito: nomeConta("62"),
    creditoCodigo: "25001",
    credito: nomeConta("25001"),
    historico: "Aplicação Invest Fácil Bradesco 895 - certificado 1262724446457",
    documento: "INVEST FACIL 23/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 492.17,
    status: "validado",
    observacao: "Transferência da conta corrente para a aplicação, conforme extrato do Invest Fácil.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - aplicações de junho/2026",
  },

  // Bradesco 895 - resgates líquidos: D Conta Corrente / C Invest Fácil.
  {
    id: "APL-BRAD-895-RESG-001",
    data: "10/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "Resgate líquido Invest Fácil Bradesco 895 - 10/06/2026",
    documento: "RESG INVEST FACIL 10/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 11816.20,
    status: "validado",
    observacao: "Crédito líquido dos resgates do dia na conta corrente, conforme extrato da aplicação.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - resgates de junho/2026",
  },
  {
    id: "APL-BRAD-895-RESG-002",
    data: "15/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "Resgate líquido Invest Fácil Bradesco 895 - 15/06/2026",
    documento: "RESG INVEST FACIL 15/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 48.21,
    status: "validado",
    observacao: "Crédito líquido do resgate do dia na conta corrente; a saída de R$ 48,21 permanece como tarifa/despesa bancária no movimento bancário.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - resgates de junho/2026",
  },
  {
    id: "APL-BRAD-895-RESG-003",
    data: "18/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "Resgate líquido Invest Fácil Bradesco 895 - 18/06/2026",
    documento: "RESG INVEST FACIL 18/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 4512.44,
    status: "validado",
    observacao: "Crédito líquido dos resgates do dia na conta corrente, conforme extrato da aplicação.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - resgates de junho/2026",
  },
  {
    id: "APL-BRAD-895-RESG-004",
    data: "24/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25001",
    debito: nomeConta("25001"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "Resgate líquido Invest Fácil Bradesco 895 - 24/06/2026",
    documento: "RESG INVEST FACIL 24/06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 492.17,
    status: "validado",
    observacao: "Crédito líquido dos resgates do dia na conta corrente, conforme extrato da aplicação.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - resgates de junho/2026",
  },

  // Rendimento/tributos do Invest Fácil apropriados no período.
  {
    id: "APL-BRAD-895-REND-001",
    data: "30/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "62",
    debito: nomeConta("62"),
    creditoCodigo: "25098",
    credito: nomeConta("25098"),
    historico: "Rendimento bruto apropriado Invest Fácil Bradesco 895 - junho/2026",
    documento: "INVEST FACIL 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 2.04,
    status: "validado",
    observacao: "Rendimento bruto apropriado no período conforme extrato do Invest Fácil.",
    rastreio: "documento",
    fonte: "Nita Bradesco energia.pdf - rendimento bruto apropriado no período",
  },
  {
    id: "APL-BRAD-895-IOF-001",
    data: "30/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25105",
    debito: nomeConta("25105"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "IOF do período sobre Invest Fácil Bradesco 895 - junho/2026",
    documento: "INVEST FACIL 06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 0.05,
    status: "validado",
    observacao: "IOF líquido do período obtido pela conciliação entre posição inicial, resgates e posição final do extrato.",
    rastreio: "derivado",
    fonte: "Nita Bradesco energia.pdf - posição inicial, resgates e posição final",
  },
  {
    id: "APL-BRAD-895-IRRF-001",
    data: "30/06/2026",
    origem: "EXTRATO BRADESCO INVEST FÁCIL 06/2026",
    debitoCodigo: "25118",
    debito: nomeConta("25118"),
    creditoCodigo: "62",
    credito: nomeConta("62"),
    historico: "IRRF do período sobre Invest Fácil Bradesco 895 - junho/2026",
    documento: "INVEST FACIL 06/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 0.45,
    status: "validado",
    observacao: "IRRF líquido do período obtido pela conciliação entre posição inicial, resgates e posição final do extrato.",
    rastreio: "derivado",
    fonte: "Nita Bradesco energia.pdf - posição inicial, resgates e posição final",
  },

  // Greencred - complemento do rendimento bruto de junho seguindo o critério contábil de maio.
  {
    id: "APL-GREEN-REND-001",
    data: "30/06/2026",
    origem: "POSIÇÃO GREENCRED 30/06/2026",
    debitoCodigo: "25110",
    debito: nomeConta("25110"),
    creditoCodigo: "25098",
    credito: nomeConta("25098"),
    historico: "Complemento do rendimento bruto Greencred - junho/2026",
    documento: "GREENCRED 30/06/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: 16421.10,
    status: "validado",
    observacao: "Posição bruta em 30/06 de R$ 2.039.048,38 (R$ 2.400.000,00 aplicados + R$ 183.701,22 de juros/correção - R$ 544.652,84 já resgatados). Partindo do saldo contábil de 31/05 de R$ 1.608.508,04 e da aplicação de R$ 400.000,00 em junho, o rendimento bruto do mês é R$ 30.540,34. O movimento financeiro já capturou R$ 14.119,24; este lançamento reconhece apenas o complemento de R$ 16.421,10, seguindo o critério do razão de maio.",
    rastreio: "documento",
    fonte: "Green Junho.pdf + Razão por Centro de Custos 05/2026, conta 67611/25110",
  },

  // Bradesco 6349 / Invest Fácil (CDB, correntista Marcos Victor Siedel) — achado
  // em 23/09/2026 ao investigar por que a conta 62 não fechava contra o extrato
  // real de agosto. Existe uma SEGUNDA aplicação Invest Fácil, na conta corrente
  // 6349/3035-0 (diferente da 895/27418-6 já reconciliada acima), que nunca foi
  // lançada — nem na implantação de maio, nem em junho — apesar do dinheiro ser
  // real e comprovado: o próprio extrato mensal da conta corrente Bradesco
  // ("BRADESCO - NITA.pdf", pasta 06 - JUNHO - 2026) traz uma seção "Saldos
  // Invest Fácil" mostrando o saldo dia a dia, fechando em 30/06/2026 em
  // R$ 285.385,82 (bruto) — batendo exato com o extrato específico da aplicação
  // ("Bradesco Invest fácil.pdf", pasta 7 Julho 2026, mesmo total na linha
  // "Saldo anterior em 30/06/2026"). Confirmado também que a conta corrente 9
  // (Banco Bradesco 6349) já fecha certo em junho (R$ 286.604,52 no Razão contra
  // R$ 286.600,88 do extrato, diferença de R$ 3,64 imaterial) — ou seja, esse
  // saldo JÁ está embutido no banco, porque a varredura automática do Invest
  // Fácil não aparece como lançamento visível no extrato de movimentação, só
  // nessa seção-resumo separada.
  //
  // Por isso este NÃO é um lançamento de receita: é uma RECLASSIFICAÇÃO dentro
  // do Ativo Circulante, tirando de "Banco" (conta 9) e reconhecendo em
  // "Aplicações Financeiras" (conta 62) o valor que já estava lá, sem alterar o
  // total do ativo nem passar pela DRE. Por instrução do contador (Luan
  // Sanchez, 23/09/2026), confirmada a validação cruzada entre os dois extratos
  // do banco antes de lançar.
  {
    id: "APL-BRAD6349-RECLASS-001",
    data: "30/06/2026",
    origem: "RECLASSIFICAÇÃO — APLICAÇÃO INVEST FÁCIL BRADESCO 6349",
    debitoCodigo: "62",
    debito: nomeConta("62"),
    creditoCodigo: "9",
    credito: nomeConta("9"),
    historico: "Reclassificação de disponibilidades — saldo aplicado no Invest Fácil (CDB) da conta 6349/3035-0 em 30/06/2026, nunca antes reconhecido",
    documento: "BRADESCO - NITA.pdf (extrato conta corrente, seção 'Saldos Invest Fácil') × Bradesco Invest fácil.pdf (extrato de investimentos)",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 285_379.60,
    status: "validado",
    observacao: "Não é receita nova: o dinheiro já estava no banco (conta 9 já fecha certo em junho, R$ 286.604,52 no sistema contra R$ 286.600,88 real). Reclassifica de Banco para Aplicações Financeiras o valor líquido que o próprio extrato Bradesco confirma, em duas fontes independentes e batendo entre si, estar aplicado no Invest Fácil em 30/06/2026. Sem efeito na DRE.",
    rastreio: "documento",
    fonte: "BRADESCO - NITA.pdf (06/2026) + Bradesco Invest fácil.pdf (07/2026) — instrução do contador em 23/09/2026.",
  },

  // Itaú aplicação automática (conta 54) — mesmo padrão de varredura automática
  // do Bradesco Invest Fácil, achado em 23/09/2026. Os lançamentos de julho
  // (JUL-APL-ITAU-AUTO-001 a 005, em nitaplast-bancos-julho-completo.ts) partem
  // de uma "abertura bruta" de R$ 59.898,31 (citada no próprio comentário do
  // arquivo, fonte "Nitaplast Itau resumo.pdf") que nunca foi de fato lançada
  // em junho — a conta 54 nasce em zero no sistema. Confirmado que o dinheiro é
  // real: a conta corrente Itaú (11) já fecha junho em R$ 59.898,01, valor
  // praticamente idêntico (diferença de R$ 0,30) ao saldo aplicado — mesmo
  // padrão do Bradesco, onde a varredura automática fica embutida no saldo do
  // banco sem aparecer como lançamento visível.
  //
  // Reclassificação pura (Banco -> Aplicações), sem efeito na DRE. Por
  // instrução do contador (Luan Sanchez, 23/09/2026).
  {
    id: "APL-ITAU-AUTO-RECLASS-001",
    data: "30/06/2026",
    origem: "RECLASSIFICAÇÃO — APLICAÇÃO AUTOMÁTICA ITAÚ 04114-0",
    debitoCodigo: "54",
    debito: nomeConta("54"),
    creditoCodigo: "11",
    credito: nomeConta("11"),
    historico: "Reclassificação de disponibilidades — saldo aplicado automaticamente na conta 04114-0 em 30/06/2026, nunca antes reconhecido",
    documento: "Nitaplast Itau resumo.pdf (referência à abertura bruta de julho, R$ 59.898,31)",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 59_898.31,
    status: "validado",
    observacao: "Não é receita nova: a conta corrente Itaú (11) já fecha junho em R$ 59.898,01, praticamente o mesmo valor (diferença de R$ 0,30). Reclassifica de Banco para Aplicações Financeiras, sem efeito na DRE — mesmo padrão de varredura automática usado no Bradesco Invest Fácil.",
    rastreio: "derivado",
    fonte: "Nitaplast Itau resumo.pdf + saldo de conta corrente Itaú (11) de junho — instrução do contador em 23/09/2026.",
  },
];
