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
 *   - ICMS: 2 códigos gerenciais sem qualquer precedente em junho (01.01.001 e
 *     11.03.002) somam R$ 14.762,95 do residual de R$ 15.118,15;
 *   - IPI/PIS/COFINS: a diferença entre o total do CSV de entradas e o total
 *     do Registro de Apuração oficial (a fonte de maior autoridade fiscal).
 *
 * ICMS ST não entra aqui: a apuração de ICMS ST de 08/2026 (RESUMO ICMS ST
 * MG/PR) ainda não foi lida — só os pagamentos de saldo anterior aparecem na
 * Relação de Pagamentos (I00017-ICMS ST A RECOLHER, R$ 3.394,51 no mês).
 *
 * Fonte dos totais: REGISTRO APURAÇÃO ICMS/IPI/PIS/COFINS.pdf (RESUMO DA
 * APURAÇÃO DO IMPOSTO, período 01/08/2026 a 31/08/2026).
 */
export const apuracaoImpostosAgosto = {
  icms: { debitoSaidas: 256_359.87, creditoEntradas: 142_347.11, saldoDevedor: 114_012.76 },
  ipi: { debitoSaidas: 165_329.89, creditoEntradas: 129_716.36, saldoDevedor: 35_613.53 },
  pis: { debitoSaidas: 49_808.58, creditoEntradas: 37_150.89, saldoDevedor: 12_657.69 },
  cofins: { debitoSaidas: 229_421.93, creditoEntradas: 171_000.85, saldoDevedor: 58_421.08 },
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
  icms: 15_118.15,
  ipi: 0,
  pis: 544.49,
  cofins: 2_507.98,
} as const;

export const lancamentosProvisaoImpostosAgosto: LancamentoIntegrado[] = impostos.flatMap(({ chave, sigla, contaSobreVendas, contaARecolher }) => {
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

  return [
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
      observacao: "Débito bruto das saídas do período (Registro de Apuração, coluna Valor do Imposto). Rateio por centro de custo pendente, igual às saídas fiscais de junho.",
      fonte: `REGISTRO APURAÇÃO ${sigla}.pdf`,
    }),
    ...linhasCredito,
    ...linhaResidual,
  ];
});

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
