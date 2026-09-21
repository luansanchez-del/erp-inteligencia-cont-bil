import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { saldosImplantacao } from "./nitaplast-implantacao";

const descricao = new Map(saldosImplantacao.map((conta) => [conta.conta, conta.descricao]));
const nome = (conta: string) => `${conta} - ${descricao.get(conta) ?? "Conta a revisar"}`;
const base = (linha: Omit<LancamentoIntegrado, "debito" | "credito" | "status" | "rastreio"> & Partial<Pick<LancamentoIntegrado, "status" | "rastreio">>): LancamentoIntegrado => ({
  ...linha,
  debito: nome(linha.debitoCodigo),
  credito: nome(linha.creditoCodigo),
  status: linha.status ?? "validado",
  rastreio: linha.rastreio ?? "documento",
});

const FONTE_ENTRADAS = "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26";
const FONTE_PAGAMENTOS = "RELAÇÃO DOS PAGAMENTOS EFETUADOS 08/2026 — NITAPLAST SAO PAULO";
const OBS_PADRAO = "Pagamento bancário efetuado via conta da Matriz (a Filial não tem banco próprio); baixa a obrigação em 1496, sem duplicar esta despesa.";

/**
 * Despesas operacionais da Filial SP em agosto/2026 — reconciliadas em
 * 21/09/2026 contra duas fontes: "RESUMO NOTAS FISCAIS ENTRADA.csv" (notas
 * fiscais, pasta FILIAL - AGO 26) e "RELAÇÃO DOS PAGAMENTOS EFETUADOS"
 * (pagamentos com conta gerencial própria, relatório "NITAPLAST - SAO
 * PAULO"). Nenhuma tinha sido importada — só as 6 compras de mercadoria para
 * revenda (CFOP 1102, ver nitaplast-cpv-depreciacao-agosto.ts) estavam no
 * Razão.
 *
 * Conferido, antes de lançar, que nenhum destes fornecedores/NFs aparece em
 * nitaplast-despesas-documentais-agosto.ts nem no relatório de entradas da
 * Matriz: os itens parecidos que já existiam lá (Softdib, Pluxee) são notas
 * fiscais diferentes, de valor e centro de custo da Matriz — sem duplicidade.
 *
 * Contrapartida em 1496 (Fornecedores Diversos), mesmo padrão de
 * "despesa documentada, pagamento bancário baixa depois" já usado no projeto
 * inteiro (Matriz e Filial).
 */
export const lancamentosDespesasFilialAgosto: LancamentoIntegrado[] = [
  base({
    id: "AGO-DESP-F-MASTMED",
    data: "10/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "25056",
    creditoCodigo: "1496",
    historico: "Exames médicos - MASTMED MEDICINA OCUPACIONAL LTDA",
    documento: "NF 120992 / Conta gerencial 12.03.008",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 208.48,
    observacao: `Valor efetivamente pago (a NF de entrada registrava R$ 218,65; pequena diferença não explicada por acréscimo/desconto no relatório de pagamentos, mantido o valor pago). ${OBS_PADRAO}`,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-SOFTDIB",
    data: "10/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "25938",
    creditoCodigo: "1496",
    historico: "Serviço de sistema/TI - SOFTDIB INFORMATICA LTDA",
    documento: "NF 1585 / Conta gerencial 11.02.002",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 1907.00,
    observacao: `Conta 25938 (Serviços de Terceiro PJ) segue o mesmo critério já usado pela Matriz para a conta gerencial 11.02.002 (Softdib, Hiroclean). ${OBS_PADRAO}`,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-PLUXEE-COMB-502",
    data: "13/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "5799",
    creditoCodigo: "1496",
    historico: "Combustível cartão frota - PLUXEE FROTA E COMBUSTIVEL BRASIL LTDA",
    documento: "NF 995767 / Conta gerencial 12.03.003",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 300.00,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-PLUXEE-COMB-505",
    data: "13/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "5799",
    creditoCodigo: "1496",
    historico: "Combustível cartão frota - PLUXEE FROTA E COMBUSTIVEL BRASIL LTDA",
    documento: "NF 995767 / Conta gerencial 12.03.003",
    cc: "505",
    centroCusto: "FILIAL SP",
    valor: 332.00,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-PLUXEE-BENEF",
    data: "26/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "4028",
    creditoCodigo: "1496",
    historico: "Vale-alimentação/refeição (PAT) - PLUXEE BENEFICIOS BRASIL SA",
    documento: "NF 665 / Conta gerencial 12.03.001",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 2898.00,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-HIROCLEAN",
    data: "31/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "25938",
    creditoCodigo: "1496",
    historico: "Serviço de limpeza - HIROCLEAN SERVICOS ESPECIALIZADOS LTDA",
    documento: "NF 753 / Conta gerencial 11.02.002",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 350.00,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-ALUGUEL",
    data: "10/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "3524",
    creditoCodigo: "1496",
    historico: "Aluguel do imóvel da Filial - IMOBILIARIA NOVOLAR",
    documento: "NF/Boleto 8082025 / Conta gerencial 13.01.001",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 10825.02,
    observacao: `Achado em 21/09/2026: nenhum lançamento de aluguel da Filial existia em agosto — despesa recorrente mensal confirmada pelo relatório de pagamentos. ${OBS_PADRAO}`,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-ENERGIA",
    data: "24/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "3494",
    creditoCodigo: "1496",
    historico: "Energia elétrica - ELETROPAULO METROPOLITANA",
    documento: "Boleto 24082026 / Conta gerencial 15.02.020",
    cc: "304",
    centroCusto: "FILIAL SP",
    valor: 374.66,
    observacao: `CC 304 conforme relatório de pagamentos da Filial (mesmo número usado pela Matriz para outro CC; classificação por estabelecimento não depende do número do CC, e sim da fonte/documento, que aqui é exclusivamente da Filial). ${OBS_PADRAO}`,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-AGUA",
    data: "27/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "3493",
    creditoCodigo: "1496",
    historico: "Água e esgoto - CIA DE SANEAMENTO",
    documento: "Boleto 27082026 / Conta gerencial 15.02.019",
    cc: "504",
    centroCusto: "ADM GERAL - SP",
    valor: 163.96,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-SEGURO-505",
    data: "18/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "4024",
    creditoCodigo: "1496",
    historico: "Seguro de vida em grupo - PORTO SEGURO CIA DE SEGUROS",
    documento: "Apólice 08/2026 / Conta gerencial 15.02.025",
    cc: "505",
    centroCusto: "FILIAL SP",
    valor: 60.84,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-SEGURO-502",
    data: "18/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "4024",
    creditoCodigo: "1496",
    historico: "Seguro de vida em grupo - PORTO SEGURO CIA DE SEGUROS",
    documento: "Apólice 08/2026 / Conta gerencial 15.02.025",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 121.68,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-TREINAMENTO",
    data: "05/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "4040",
    creditoCodigo: "1496",
    historico: "Curso/treinamento - UNIAO EDUCACIONAL",
    documento: "NF 30352/011 / Conta gerencial 12.03.005",
    cc: "505",
    centroCusto: "FILIAL SP",
    valor: 347.75,
    observacao: OBS_PADRAO,
    fonte: FONTE_PAGAMENTOS,
  }),
  base({
    id: "AGO-DESP-F-HGF",
    data: "19/08/2026",
    origem: "PAGAMENTOS FILIAL 08/2026",
    debitoCodigo: "25938",
    creditoCodigo: "1496",
    historico: "Serviço de terceiro PJ - HGF COMERCIO E MANUTENCAO",
    documento: "NF 205 / Conta gerencial 11.02.002",
    cc: "10009",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 650.00,
    status: "revisar",
    observacao: `CC 10009 não identificado nos centros de custo padrão da Filial; mantido como no relatório de origem, marcado para revisão do centro de custo real. ${OBS_PADRAO}`,
    fonte: FONTE_PAGAMENTOS,
  }),
  // Nove faturas de R$ 80,00 da mesma transportadora ao longo do mês — taxa/serviço
  // recorrente por remessa (NOP 1933, "COMPRA D[espesas]"), separada das notas de
  // transferência de mercadoria (NOP 2152) que já compõem o CPV. Datas de emissão
  // confirmadas dentro de agosto pelo CSV de entradas; onde ainda não pagas até
  // 31/08 (prazo de 15 dias), permanecem como obrigação em aberto na 1496.
  ...([
    ["AGO-DESP-F-GAMPER-01", "04/08/2026", "3350"],
    ["AGO-DESP-F-GAMPER-02", "11/08/2026", "3362"],
    ["AGO-DESP-F-GAMPER-03", "13/08/2026", "3368"],
    ["AGO-DESP-F-GAMPER-04", "13/08/2026", "3369"],
    ["AGO-DESP-F-GAMPER-05", "13/08/2026", "3370"],
    ["AGO-DESP-F-GAMPER-06", "18/08/2026", "3374"],
    ["AGO-DESP-F-GAMPER-07", "18/08/2026", "3375"],
    ["AGO-DESP-F-GAMPER-08", "31/08/2026", "3388"],
    ["AGO-DESP-F-GAMPER-09", "31/08/2026", "3389"],
  ] as const).map(([id, data, nf]) =>
    base({
      id,
      data,
      origem: "ENTRADAS FILIAL 08/2026",
      debitoCodigo: "4253",
      creditoCodigo: "1496",
      historico: "Frete/taxa recorrente por remessa - TRANSPORTADORA GAMPER LTDA.",
      documento: `NF ${nf} série F / NOP 1933`,
      cc: "201",
      centroCusto: "VENDAS",
      valor: 80.00,
      observacao: "Fatura de valor fixo (R$ 80,00) por remessa, recorrente ao longo do mês; distinta do frete embutido nas transferências de mercadoria (NOP 2152). Conferida contra o relatório de pagamentos onde já liquidada dentro de agosto.",
      fonte: FONTE_ENTRADAS,
    }),
  ),
];
