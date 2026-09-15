import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Provisão dos impostos apurados em 08/2026 (ICMS, IPI, PIS, COFINS), lançada
 * contra as mesmas contas usadas no fechamento real de 06/2026
 * (`nitaplast-lancamentos-fiscais-junho.ts`):
 *   - conta "sobre vendas" (débito, dedução de receita) ↔ conta "a recolher"
 *     (crédito, passivo) para o débito bruto do imposto nas saídas;
 *   - conta "a recolher" (débito, reduz o passivo) ↔ conta real de compra/custo
 *     (crédito) para o crédito de entradas.
 *
 * Crédito de entradas — como foi rateado por conta real:
 * `RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv`
 * traz, linha a linha, o valor de ICMS/IPI/PIS/COFINS de cada nota de entrada
 * junto com a Conta Gerencial e o(s) centro(s) de custo. Para chegar na conta
 * REAL do plano de contas (não apenas na conta gerencial) usei a mesma tabela
 * de tradução Conta Gerencial + CC → conta real já validada em
 * `nitaplast-entradas-cc-reconciliadas-junho.ts` (mesma empresa, mesmo plano
 * de contas). Onde uma combinação gerencial+CC não existe na tabela de junho,
 * mas o mesmo código gerencial SÓ aparece com uma única conta real em junho
 * (ou seja, o CC não muda a conta, só a dimensão de centro de custo), apliquei
 * essa conta por inferência direta. Não apliquei esse fallback para gerenciais
 * que em junho já se dividiam em mais de uma conta conforme o grupo de CC
 * (ex.: 12.03.*, 15.02.015, 15.02.020) — nesses casos, um CC novo sem
 * precedente ficaria adivinhado, então prefiro deixar pendente.
 *
 * Isso cobre ~97% do crédito apurado (ICMS bate exatamente com o CSV; IPI/PIS/
 * COFINS têm uma pequena diferença entre o CSV de entradas e o Registro de
 * Apuração oficial — provavelmente ajustes/estornos que não passam por este
 * relatório). O restante (residual de cada imposto, ver `residualNaoMapeado`)
 * fica na conta transitória (4859), marcado "revisar":
 *   - ICMS: identificado por completo (ver `creditoIcmsTransferenciaAgosto`) —
 *     não é mais residual, não fica em 4859;
 *   - IPI/PIS/COFINS: a diferença entre o total do CSV de entradas e o total
 *     do Registro de Apuração oficial (a fonte de maior autoridade fiscal).
 *
 * ICMS ST não entra aqui: a apuração de ICMS ST de 08/2026 (RESUMO ICMS ST
 * MG/PR) ainda não foi lida — só os pagamentos de saldo anterior aparecem na
 * Relação de Pagamentos (I00017-ICMS ST A RECOLHER, R$ 3.394,51 no mês).
 *
 * Fonte dos totais: REGISTRO APURAÇÃO ICMS/IPI/PIS/COFINS.pdf (RESUMO DA
 * APURAÇÃO DO IMPOSTO, período 01/08/2026 a 31/08/2026).
 *
 * PIS/COFINS foram retificados em 14/09/2026 (Registro_de_Apuracao_do_PIS.xlsx
 * e ...COFINS.xlsx, pasta FISCAL/LEGACY) — os valores abaixo já refletem a
 * retificação, conferida contra os DARFs emitidos em 14/09/2026 (PIS
 * R$ 9.344,49, COFINS R$ 43.160,21, ambos vencimento 25/09/2026). Os valores
 * antigos do REGISTRO APURAÇÃO PIS/COFINS.pdf (04/09/2026) ficaram
 * desatualizados. ICMS/IPI não têm retificação correspondente e permanecem
 * como no PDF original.
 */
export const apuracaoImpostosAgosto = {
  icms: { debitoSaidas: 256_359.87, creditoEntradas: 142_347.11, saldoDevedor: 114_012.76 },
  ipi: { debitoSaidas: 165_329.89, creditoEntradas: 129_716.36, saldoDevedor: 35_613.53 },
  pis: { debitoSaidas: 45_966.86, creditoEntradas: 36_622.37, saldoDevedor: 9_344.49 },
  cofins: { debitoSaidas: 211_726.64, creditoEntradas: 168_566.43, saldoDevedor: 43_160.21 },
} as const;

const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio" | "debito" | "credito"> & { status?: LancamentoIntegrado["status"] }): LancamentoIntegrado => ({
  ...parcial,
  debito: nome(parcial.debitoCodigo),
  credito: nome(parcial.creditoCodigo),
  status: parcial.status ?? "validado",
  rastreio: "documento",
});

const CONTA_TRANSITORIA = "4859";

type Imposto = { chave: keyof typeof apuracaoImpostosAgosto; sigla: string; contaSobreVendas: string; contaARecolher: string };

const impostos: Imposto[] = [
  { chave: "icms", sigla: "ICMS", contaSobreVendas: "2827", contaARecolher: "1541" },
  { chave: "ipi", sigla: "IPI", contaSobreVendas: "2826", contaARecolher: "1543" },
  { chave: "pis", sigla: "PIS", contaSobreVendas: "2829", contaARecolher: "1556" },
  { chave: "cofins", sigla: "COFINS", contaSobreVendas: "2830", contaARecolher: "1552" },
];

// Débito bruto das saídas (ICMS e IPI) rateado por centro de custo real,
// extraído de "RESUMO NOTAS FISCAIS SAIDA.csv" (fonte oficial, por CFOP/NF-e
// real, mesma família de relatório já usada nas entradas). Os totais batem
// exatamente com o Registro de Apuração oficial (ICMS R$ 256.359,87, IPI
// R$ 165.329,89), centavo a centavo — conferido em 15/09/2026.
//
// PIS/COFINS ficam FORA deste rateio: esse CSV oficial não tem coluna de
// PIS/COFINS (só ICMS/ICMS-ST/ISS/IPI). Os valores por nota existem no
// relatório detalhado "RELATATORIO DETALHADO SAIDAS POR CENTRO DE CUSTO -
// SOFTDIB", mas os campos V.Pis/V.Cofins vêm quebrados em múltiplas linhas de
// forma irregular no PDF (mesmo tipo de risco de atribuição errada já visto
// na conferência dos títulos de clientes de agosto) — não lancei o rateio por
// esse motivo. PIS/COFINS sobre vendas continuam num único lançamento sem CC,
// como pendência separada.
type DebitoSaidasPorCC = { cc: string; centroCusto: string; icms: number; ipi: number };
const debitoSaidasPorCC: DebitoSaidasPorCC[] = [
  { cc: "201", centroCusto: "VENDAS", icms: 253_707.31, ipi: 165_329.89 },
  { cc: "102", centroCusto: "PRODUÇÃO", icms: 2_297.40, ipi: 0 },
  { cc: "0", centroCusto: "SEM CENTRO DE CUSTO", icms: 355.16, ipi: 0 },
];
const IMPOSTOS_COM_DEBITO_RATEADO = new Set<Imposto["chave"]>(["icms", "ipi"]);

// Crédito de entradas rateado por conta real, extraído do CSV de entradas por
// CC de agosto/2026 via a tabela de tradução gerencial+CC → conta de junho.
type CreditoPorConta = { conta: string; icms: number; ipi: number; pis: number; cofins: number };
const creditoPorConta: CreditoPorConta[] = [
  { conta: "3093", icms: 40_747.07, ipi: 68_703.23, pis: 19_217.48, cofins: 88_398.92 },
  { conta: "3035", icms: 41_781.09, ipi: 49_153.06, pis: 5_055.52, cofins: 23_285.93 },
  { conta: "3244", icms: 25_616.98, ipi: 9_654.72, pis: 3_099.65, cofins: 14_277.20 },
  { conta: "25937", icms: 7_179.26, ipi: 1_944.38, pis: 7_096.90, cofins: 32_688.00 },
  { conta: "4253", icms: 11_372.98, ipi: 0, pis: 1_470.70, cofins: 6_774.45 },
  { conta: "3494", icms: 0, ipi: 0, pis: 483.11, cofins: 2_225.22 },
  { conta: "25943", icms: 531.58, ipi: 287.94, pis: 64.32, cofins: 296.27 },
  { conta: "25070", icms: 0, ipi: 0, pis: 118.72, cofins: 546.88 },
  { conta: "25064", icms: 0, ipi: 6.21, pis: 0, cofins: 0 },
];

export const residualNaoMapeado = {
  icms: 0,
  ipi: 0,
  pis: 15.97,
  cofins: 73.56,
} as const;

/**
 * O que antes ficava "sem conta real" no ICMS (R$ 15.118,15) foi conferido
 * documento a documento contra o CSV de entradas: são 7 notas emitidas pela
 * própria Nitaplast para si mesma (CFOP/NOP 2151 e 2152, gerenciais 01.01.001
 * "Venda de Mercadorias Mercado Interno" e 11.03.002 "Transferência de
 * Produtos para Filial") — ICMS de transferência interna Matriz → Filial, não
 * crédito de compra de terceiro. Mesmo fato e mesma conta de trânsito (25140)
 * que julho já usou nos dois lados (nitaplast-razao-julho-final-base.ts,
 * JUL-ICMS-M-TRANSF e JUL-ICMS-F-CRED).
 */
export const creditoIcmsTransferenciaAgosto = {
  total: 15_118.15,
  documentos: [
    { gerencial: "01.01.001", descricao: "Venda de Mercadorias Mercado Interno (NOP 2152)", quantidade: 6, valor: 14_559.36 },
    { gerencial: "11.03.002", descricao: "Transferência de Produtos para Filial (NOP 2151)", quantidade: 1, valor: 558.79 },
  ],
} as const;

export const lancamentosProvisaoImpostosAgosto: LancamentoIntegrado[] = [
  ...impostos.flatMap(({ chave, sigla, contaSobreVendas, contaARecolher }) => {
  const { debitoSaidas } = apuracaoImpostosAgosto[chave];

  const linhasCredito = creditoPorConta
    .filter((linha) => linha[chave] > 0.01)
    .map((linha, i) =>
      base({
        id: `AGO-TAX-ENT-${sigla}-${String(i + 1).padStart(2, "0")}`,
        data: "31/08/2026",
        origem: `APURAÇÃO ${sigla} 08/2026`,
        debitoCodigo: contaARecolher,
        creditoCodigo: linha.conta,
        historico: `${sigla} sobre compras - crédito de entradas rateado por conta real (relação por CC ago/2026)`,
        documento: `APURAÇÃO ${sigla} 08/2026`,
        cc: "0",
        centroCusto: "SEM CENTRO DE CUSTO",
        valor: linha[chave],
        observacao: "Crédito de entradas do período, atribuído à conta real de compra/custo via tradução Conta Gerencial + CC → conta (mesma tabela usada na reconciliação de junho).",
        fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv",
      }),
    );

  const residual = residualNaoMapeado[chave];
  const linhaResidual =
    residual > 0.01
      ? [
          base({
            id: `AGO-TAX-ENT-${sigla}-REVISAR`,
            data: "31/08/2026",
            origem: `APURAÇÃO ${sigla} 08/2026`,
            debitoCodigo: contaARecolher,
            creditoCodigo: CONTA_TRANSITORIA,
            historico: `${sigla} sobre compras - saldo de crédito ainda não atribuído a conta real`,
            documento: `APURAÇÃO ${sigla} 08/2026`,
            cc: "0",
            centroCusto: "SEM CENTRO DE CUSTO",
            valor: residual,
            status: "revisar",
            observacao: "Códigos de conta gerencial sem precedente na reconciliação de junho, e/ou diferença entre o CSV de entradas por CC e o Registro de Apuração oficial. Pendente de reclassificação.",
            fonte: `REGISTRO APURAÇÃO ${sigla}.pdf + RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv`,
          }),
        ]
      : [];

  const linhasDebito: LancamentoIntegrado[] = IMPOSTOS_COM_DEBITO_RATEADO.has(chave)
    ? debitoSaidasPorCC
        .filter((linha) => linha[chave as "icms" | "ipi"] > 0.01)
        .map((linha, i) =>
          base({
            id: `AGO-TAX-SAI-${sigla}-${String(i + 1).padStart(2, "0")}`,
            data: "31/08/2026",
            origem: `APURAÇÃO ${sigla} 08/2026`,
            debitoCodigo: contaSobreVendas,
            creditoCodigo: contaARecolher,
            historico: `${sigla} sobre vendas - débito bruto apurado em agosto/2026 (CC ${linha.cc} - ${linha.centroCusto})`,
            documento: `APURAÇÃO ${sigla} 08/2026`,
            cc: linha.cc,
            centroCusto: linha.centroCusto,
            valor: linha[chave as "icms" | "ipi"],
            observacao: "Débito bruto das saídas rateado por centro de custo real, extraído do CSV oficial de saídas por CFOP/NF-e (RESUMO NOTAS FISCAIS SAIDA.csv). Bate exatamente com o Registro de Apuração oficial.",
            fonte: "RESUMO NOTAS FISCAIS SAIDA.csv",
          }),
        )
    : [
        base({
          id: `AGO-TAX-SAI-${sigla}`,
          data: "31/08/2026",
          origem: `APURAÇÃO ${sigla} 08/2026`,
          debitoCodigo: contaSobreVendas,
          creditoCodigo: contaARecolher,
          historico: `${sigla} sobre vendas - débito bruto apurado em agosto/2026`,
          documento: `APURAÇÃO ${sigla} 08/2026`,
          cc: "0",
          centroCusto: "SEM CENTRO DE CUSTO",
          valor: debitoSaidas,
          observacao: "Débito bruto das saídas do período (Registro de Apuração, coluna Valor do Imposto). Rateio por centro de custo pendente: o CSV oficial de saídas não tem coluna de PIS/COFINS (só ICMS/IPI); o relatório detalhado por documento tem os valores, mas com campos quebrados em múltiplas linhas de forma irregular no PDF, com risco real de atribuição errada por nota.",
          fonte: `REGISTRO APURAÇÃO ${sigla}.pdf`,
        }),
      ];

  return [
    ...linhasDebito,
    ...linhasCredito,
    ...linhaResidual,
  ];
  }),
  base({
    id: "AGO-TAX-ICMS-TRANSF",
    data: "31/08/2026",
    origem: "APURAÇÃO ICMS 08/2026",
    debitoCodigo: "1541",
    creditoCodigo: "25140",
    historico: "ICMS de transferências internas Matriz → Filial (NOP 2151/2152)",
    documento: "NF 8851, 8856, 8869, 8907, 8922, 8881 / NOP 2151-2152",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: creditoIcmsTransferenciaAgosto.total,
    observacao: "Antes classificado como crédito sem conta real, parado na conta transitória 4859. Identificado documento a documento no CSV de entradas: 7 notas emitidas pela própria Nitaplast para si mesma (gerenciais 01.01.001 e 11.03.002), ICMS de transferência interna Matriz → Filial — não crédito de compra de terceiro. Mesma conta de trânsito (25140) usada em julho para o mesmo fato.",
    fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv",
  }),

  // ICMS/IPI da Filial SP (CNPJ 82.295.817/0003-60) — achado em 15/09/2026: a
  // apuração de agosto tem pasta e documentos próprios ("FILIAL - AGO 26"),
  // completamente separados da Matriz (pasta FISCAL raiz, CNPJ 0001-07), e
  // nunca tinha sido incorporada ao fechamento. Débito bruto conferido pelo
  // CSV oficial de saídas da Filial (RESUMO NOTAS FISCAIS SAIDA.csv, bate com
  // o Registro de Apuração ICMS/IPI próprio da Filial). Contas e padrão
  // idênticos aos usados em julho para o mesmo fato (JUL-ICMS-F-DEB/CRED,
  // JUL-TAX-IPI-F): ICMS via 25054↔25235, IPI via 25055↔25236, cc 502 -
  // COMERCIAL SP (mesmo critério de julho: débito e crédito da Filial em
  // linha única, sem abrir por CC interno).
  base({
    id: "AGO-ICMS-F-DEB",
    data: "31/08/2026",
    origem: "APURAÇÃO ICMS FILIAL 08/2026",
    debitoCodigo: "25054",
    creditoCodigo: "25235",
    historico: "ICMS sobre vendas - débito bruto da Filial SP em agosto/2026",
    documento: "APURAÇÃO ICMS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 60_722.15,
    observacao: "Débito bruto das saídas da Filial SP, extraído do CSV oficial de saídas por CFOP/NF-e (RESUMO NOTAS FISCAIS SAIDA.csv da Filial). Bate com o Registro de Apuração ICMS próprio da Filial (pasta FILIAL - AGO 26).",
    fonte: "RESUMO NOTAS FISCAIS SAIDA.csv (Filial SP) + REGISTRO APURAÇÃO ICMS.pdf (Filial SP)",
  }),
  base({
    id: "AGO-ICMS-F-CRED-COMPRAS",
    data: "31/08/2026",
    origem: "APURAÇÃO ICMS FILIAL 08/2026",
    debitoCodigo: "25235",
    creditoCodigo: "25140",
    historico: "ICMS sobre compras da Filial SP em agosto/2026 (crédito de entradas)",
    documento: "APURAÇÃO ICMS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 15_057.71,
    status: "revisar",
    observacao: "Crédito de ICMS sobre compras da Filial, extraído do CSV oficial de entradas por CFOP/NF-e (RESUMO NOTAS FISCAIS ENTRADA.csv da Filial). Cobre só a parcela de compras — julho também somava fretes e transferências internas no crédito total da Filial (R$ 80.876,62 compras + R$ 1.095,30 fretes + R$ 14.612,97 transferências); a parcela de fretes e a do lado Filial da transferência interna Matriz→Filial (contrapartida de AGO-TAX-ICMS-TRANSF) ainda não foram identificadas para agosto — pendente.",
    fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv (Filial SP)",
  }),
  base({
    id: "AGO-IPI-F-DEB",
    data: "31/08/2026",
    origem: "APURAÇÃO IPI FILIAL 08/2026",
    debitoCodigo: "25055",
    creditoCodigo: "25236",
    historico: "IPI faturado - débito bruto da Filial SP em agosto/2026",
    documento: "APURAÇÃO IPI FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 19_728.46,
    observacao: "Débito bruto das saídas da Filial SP, extraído do CSV oficial de saídas por CFOP/NF-e (RESUMO NOTAS FISCAIS SAIDA.csv da Filial). Bate com o Registro de Apuração IPI próprio da Filial (pasta FILIAL - AGO 26).",
    fonte: "RESUMO NOTAS FISCAIS SAIDA.csv (Filial SP) + REGISTRO APURAÇÃO IPI.pdf (Filial SP)",
  }),
  base({
    id: "AGO-IPI-F-CRED-COMPRAS",
    data: "31/08/2026",
    origem: "APURAÇÃO IPI FILIAL 08/2026",
    debitoCodigo: "25236",
    creditoCodigo: "25139",
    historico: "IPI sobre compras da Filial SP em agosto/2026 (crédito de entradas)",
    documento: "APURAÇÃO IPI FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 2_045.81,
    status: "revisar",
    observacao: "Crédito de IPI sobre compras da Filial, extraído do CSV oficial de entradas por CFOP/NF-e. Não existe conta redutora dedicada para IPI sobre compras (diferente do ICMS, que tem a 25140); creditado direto contra 25139 - Compra de Mercadoria para revenda - Filial, mesmo padrão usado para o crédito de IPI da Matriz contra conta real de compras.",
    fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv (Filial SP)",
  }),

  // PIS/COFINS da Filial SP — achado em 15/09/2026, mesmo padrão do ICMS/IPI:
  // o valor já no código (AGO-TAX-SAI-PIS/COFINS) é só Matriz, extraído de
  // "REGISTRO APURAÇÃO PIS/COFINS.pdf" (raiz FISCAL, CNPJ 0001-07). Diferente
  // do ICMS/IPI, o plano de contas não tem conta dedicada de PIS/COFINS para a
  // Filial — mesma conta usada pela Matriz (2829/2830, 1556/1552), separada só
  // pelo CC 502 (mesmo critério de julho, que também não tem conta própria e
  // separa Matriz/Filial via estabelecimento do lançamento, não da conta).
  // Fonte: ARQUIVO EFD CONTRIBUIÇÕES.TXT (SPED oficial, período 08/2026),
  // registros C100 (documento fiscal) com VL_PIS/VL_COFINS diretos, segregados
  // pelos blocos C010 de cada CNPJ (0001-07 Matriz / 0003-60 Filial). Débito =
  // soma dos C100 com IND_OPER=1 (saídas); crédito = IND_OPER=0 (entradas),
  // mesmos 9 documentos já conferidos pelo CSV de entradas da Filial (ICMS/IPI).
  base({
    id: "AGO-PIS-F-DEB",
    data: "31/08/2026",
    origem: "APURAÇÃO PIS FILIAL 08/2026",
    debitoCodigo: "2829",
    creditoCodigo: "1556",
    historico: "PIS sobre vendas - débito bruto da Filial SP em agosto/2026",
    documento: "APURAÇÃO PIS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 3_841.72,
    observacao: "Débito bruto das saídas da Filial SP (registros C100, IND_OPER=1, campo VL_PIS), segregado do total pelo bloco C010 da Filial (CNPJ 0003-60) no arquivo EFD Contribuições oficial. Confirma que o valor já lançado em AGO-TAX-SAI-PIS (R$ 45.966,86) é só Matriz.",
    fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT (SPED 08/2026)",
  }),
  base({
    id: "AGO-PIS-F-CRED-COMPRAS",
    data: "31/08/2026",
    origem: "APURAÇÃO PIS FILIAL 08/2026",
    debitoCodigo: "1556",
    creditoCodigo: "25139",
    historico: "PIS sobre compras da Filial SP em agosto/2026 (crédito de entradas)",
    documento: "APURAÇÃO PIS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 437.11,
    status: "revisar",
    observacao: "Crédito de PIS sobre compras da Filial (registros C100, IND_OPER=0, campo VL_PIS), mesmos 9 documentos já conferidos via CSV de entradas para o crédito de ICMS/IPI. Creditado contra 25139, mesmo padrão do IPI Filial (sem conta redutora dedicada).",
    fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT (SPED 08/2026)",
  }),
  base({
    id: "AGO-COFINS-F-DEB",
    data: "31/08/2026",
    origem: "APURAÇÃO COFINS FILIAL 08/2026",
    debitoCodigo: "2830",
    creditoCodigo: "1552",
    historico: "COFINS sobre vendas - débito bruto da Filial SP em agosto/2026",
    documento: "APURAÇÃO COFINS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 17_695.29,
    observacao: "Débito bruto das saídas da Filial SP (registros C100, IND_OPER=1, campo VL_COFINS), segregado do total pelo bloco C010 da Filial (CNPJ 0003-60) no arquivo EFD Contribuições oficial. Confirma que o valor já lançado em AGO-TAX-SAI-COFINS (R$ 211.726,64) é só Matriz.",
    fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT (SPED 08/2026)",
  }),
  base({
    id: "AGO-COFINS-F-CRED-COMPRAS",
    data: "31/08/2026",
    origem: "APURAÇÃO COFINS FILIAL 08/2026",
    debitoCodigo: "1552",
    creditoCodigo: "25139",
    historico: "COFINS sobre compras da Filial SP em agosto/2026 (crédito de entradas)",
    documento: "APURAÇÃO COFINS FILIAL 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 2_013.29,
    status: "revisar",
    observacao: "Crédito de COFINS sobre compras da Filial (registros C100, IND_OPER=0, campo VL_COFINS), mesmos 9 documentos já conferidos via CSV de entradas para o crédito de ICMS/IPI. Creditado contra 25139, mesmo padrão do IPI Filial (sem conta redutora dedicada).",
    fonte: "ARQUIVO EFD CONTRIBUIÇÕES.TXT (SPED 08/2026)",
  }),
];

export const resumoProvisaoImpostosFilialAgosto = {
  icms: { debitoSaidas: 60_722.15, creditoComprasIdentificado: 15_057.71 },
  ipi: { debitoSaidas: 19_728.46, creditoComprasIdentificado: 2_045.81 },
  pis: { debitoSaidas: 3_841.72, creditoComprasIdentificado: 437.11 },
  cofins: { debitoSaidas: 17_695.29, creditoComprasIdentificado: 2_013.29 },
  observacao: "Descoberto em 15/09/2026: a apuração de ICMS/IPI/PIS/COFINS da Filial SP nunca tinha sido incorporada ao fechamento de agosto — só a Matriz estava lançada. ICMS/IPI vêm da apuração própria da Filial (pasta FILIAL - AGO 26, CNPJ 0003-60); PIS/COFINS vêm do arquivo EFD Contribuições oficial (registros por CNPJ). Débito bruto e crédito de compras agora lançados; crédito de fretes e da transferência interna Matriz→Filial (ICMS) ainda pendentes de identificação.",
} as const;

export const resumoProvisaoImpostosAgosto = {
  aRecolher: {
    icms: apuracaoImpostosAgosto.icms.saldoDevedor,
    ipi: apuracaoImpostosAgosto.ipi.saldoDevedor,
    pis: apuracaoImpostosAgosto.pis.saldoDevedor,
    cofins: apuracaoImpostosAgosto.cofins.saldoDevedor,
    total:
      apuracaoImpostosAgosto.icms.saldoDevedor +
      apuracaoImpostosAgosto.ipi.saldoDevedor +
      apuracaoImpostosAgosto.pis.saldoDevedor +
      apuracaoImpostosAgosto.cofins.saldoDevedor,
  },
} as const;
