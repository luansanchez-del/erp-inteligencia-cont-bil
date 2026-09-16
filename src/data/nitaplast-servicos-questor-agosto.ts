import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Serviços de terceiros PJ (conta 25938) achados em 16/09/2026 comparando o
 * Questor oficial ("Questor_Exportacao - entradas (atualizado).xlsx", 587
 * lançamentos de entrada da Matriz em agosto) contra o que já estava lançado
 * a partir do CSV SOFTDIB ("RELATATORIO DETALHADO ENTRADAS POR CENTRO DE
 * CUSTO", nitaplast-despesas-documentais-agosto.ts). Das 79 notas de serviço
 * do Questor (Natureza 8000001/8000002 "SERVIÇOS TOMADOS"), 46 fornecedores
 * (R$ 87.409,07) não tinham lançamento correspondente.
 *
 * Fonte de valor e fornecedor: Questor (autoridade — sistema contábil
 * oficial). Fonte de CC: cruzamento por número de documento + fornecedor +
 * valor contra o CSV detalhado do SOFTDIB (RELATATORIO DETALHADO ENTRADAS
 * POR CENTRO DE CUSTO), lendo os 4 blocos de rateio por CC que o relatório
 * traz por nota (colunas Ccusto/Desc Ccusto/Valor Ccusto repetidas 4 vezes —
 * o mesmo padrão usado por scripts/gerar-despesas-documentais-agosto.mjs
 * para os ~541 documentos já lançados antes desta rodada).
 *
 * statusCc por lançamento:
 * - "confirmado": documento + fornecedor + valor batem exatamente com uma
 *   linha do SOFTDIB; CC vem direto do rateio da nota.
 * - "parcial": a nota está no SOFTDIB, mas o rateio informado (até 4 CCs)
 *   não cobre o valor total do documento — o relatório do SOFTDIB tem um
 *   limite físico de 4 colunas de rateio e não comporta despesas que
 *   atingem mais departamentos (ex.: UNIMED, DENTALUNI, MAXIPAS, rateadas
 *   por praticamente todos os CCs da empresa). Nesses casos o documento foi
 *   desmembrado em uma linha por CC conhecido, mais uma linha residual sem
 *   CC pelo valor que o relatório não conseguiu detalhar. A soma das partes
 *   sempre fecha com o valor total do Questor.
 * - "rejeitado": existe um documento com o mesmo número no SOFTDIB, mas o
 *   fornecedor e/ou valor não conferem — risco de colisão de numeração
 *   (sequenciais de NF são reaproveitados por fornecedor/período). Não foi
 *   usado, para não repetir o falso positivo já identificado nesta sessão
 *   (RD Gestão × Sergio Baggio - Jardinagem).
 * - "ausente": o documento simplesmente não existe no CSV do SOFTDIB.
 *
 * Nenhum valor foi estimado ou arredondado; tudo vem direto do Questor.
 */
const CONTA_SERVICOS = "25938";
const CONTA_FORNECEDORES = "1496";

type StatusCc = "confirmado" | "parcial" | "rejeitado" | "ausente";

type ServicoQuestor = {
  id: string;
  fornecedor: string;
  valor: number;
  documentoQuestor: string;
  data: string;
  cc: string;
  centroCusto: string;
  nop?: string;
  gerencial?: string;
  statusCc: StatusCc;
  notaCc?: string;
};

const servicosQuestorAgosto: ServicoQuestor[] = [
  { id: "AGO-QST-001", fornecedor: "LOGCOMEX LTDA", valor: 2300.0, documentoQuestor: "26932", data: "01/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1933", gerencial: "15.02.050", statusCc: "confirmado" },
  { id: "AGO-QST-002A", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 39.96, documentoQuestor: "711883", data: "01/08/2026", cc: "101", centroCusto: "ALMOXARIFADO", statusCc: "confirmado" },
  { id: "AGO-QST-002B", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 119.88, documentoQuestor: "711883", data: "01/08/2026", cc: "201", centroCusto: "VENDAS", statusCc: "confirmado" },
  { id: "AGO-QST-002C", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 59.94, documentoQuestor: "711883", data: "01/08/2026", cc: "203", centroCusto: "FATURAMENTO", statusCc: "confirmado" },
  { id: "AGO-QST-002D", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 39.96, documentoQuestor: "711883", data: "01/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", statusCc: "confirmado" },
  { id: "AGO-QST-002E", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 39.96, documentoQuestor: "711883", data: "01/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO (rateio SOFTDIB limitado a 4 centros)", statusCc: "parcial" },
  { id: "AGO-QST-003", fornecedor: "GOOGLE BRASIL INTERNET LTDA", valor: 2509.01, documentoQuestor: "38442194", data: "02/08/2026", cc: "201", centroCusto: "VENDAS", nop: "2933", gerencial: "15.01.008", statusCc: "confirmado" },
  { id: "AGO-QST-004", fornecedor: "FACEBOOK SERVICOS ONLINE DO BRASIL LTDA", valor: 1002.48, documentoQuestor: "143344256", data: "03/08/2026", cc: "201", centroCusto: "VENDAS", nop: "2933", gerencial: "15.01.008", statusCc: "confirmado" },
  { id: "AGO-QST-005", fornecedor: "SALESBUD TECNOLOGIA LTDA", valor: 911.2, documentoQuestor: "2465", data: "03/08/2026", cc: "201", centroCusto: "VENDAS", nop: "2933", gerencial: "15.02.050", statusCc: "confirmado" },
  { id: "AGO-QST-006A", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 955.22, documentoQuestor: "974133", data: "03/08/2026", cc: "106", centroCusto: "OFICINA", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-006B", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 382.65, documentoQuestor: "974133", data: "03/08/2026", cc: "108", centroCusto: "ADM DA PRODUÇÃO", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-006C", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 1436.72, documentoQuestor: "974133", data: "03/08/2026", cc: "201", centroCusto: "VENDAS", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-006D", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 834.06, documentoQuestor: "974133", data: "03/08/2026", cc: "203", centroCusto: "FATURAMENTO", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-006E", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 2205.65, documentoQuestor: "974133", data: "03/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO (rateio SOFTDIB limitado a 4 centros)", nop: "1949", gerencial: "12.03.002", statusCc: "parcial" },
  { id: "AGO-QST-007A", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 1542.74, documentoQuestor: "974288", data: "03/08/2026", cc: "201", centroCusto: "VENDAS", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-007B", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 2367.79, documentoQuestor: "974288", data: "03/08/2026", cc: "210", centroCusto: "MARKETING", nop: "1949", gerencial: "12.03.002", statusCc: "confirmado" },
  { id: "AGO-QST-008", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.0, documentoQuestor: "38", data: "04/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 38 do mesmo fornecedor, mas com valor de R$ 9.173,87 (não R$ 750,00) — numeração não corresponde ao mesmo lançamento, não usado." },
  { id: "AGO-QST-009", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.0, documentoQuestor: "39", data: "04/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 39 do mesmo fornecedor, mas com valor de R$ 11.253,87 (não R$ 750,00) — numeração não corresponde ao mesmo lançamento, não usado." },
  { id: "AGO-QST-010", fornecedor: "SAMUEL MOSCARDI PEREIRA DA SILVA", valor: 600.0, documentoQuestor: "4", data: "05/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-011", fornecedor: "SALLES VAZ SOLUCOES INDUSTRIAIS LTDA", valor: 2701.38, documentoQuestor: "42", data: "05/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.02.002", statusCc: "rejeitado", notaCc: "SOFTDIB tem SALLES VAZ nos documentos 44/45 com valor de R$ 2.720,00 cada (não R$ 2.701,38, doc. 42 não existe) — não é o mesmo lançamento, não usado." },
  { id: "AGO-QST-012", fornecedor: "STOP AND GO TURISMO LTDA", valor: 1649.13, documentoQuestor: "648", data: "05/08/2026", cc: "204", centroCusto: "ADM DE VENDAS", nop: "1933", gerencial: "15.01.002", statusCc: "confirmado" },
  { id: "AGO-QST-013", fornecedor: "NEFFA GESTAO, TURISMO E NEGOCIOS S/A", valor: 1795.5, documentoQuestor: "9363", data: "06/08/2026", cc: "201", centroCusto: "VENDAS", nop: "2933", gerencial: "15.01.001", statusCc: "confirmado" },
  { id: "AGO-QST-014", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.0, documentoQuestor: "43", data: "07/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 43 do mesmo fornecedor, mas com valor de R$ 16.250,84 (não R$ 750,00) — numeração não corresponde ao mesmo lançamento, não usado." },
  { id: "AGO-QST-015", fornecedor: "ATLANTIS PARANAGUA TERMINAIS DE CONTAINERS LTDA", valor: 275.0, documentoQuestor: "55394", data: "08/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-016", fornecedor: "MYRH TECNOLOGIA LTDA", valor: 423.35, documentoQuestor: "10769", data: "10/08/2026", cc: "304", centroCusto: "ADM GERAL", nop: "1949", gerencial: "15.02.050", statusCc: "confirmado" },
  { id: "AGO-QST-017", fornecedor: "TECNOPONTO TECNOLOGIA AVANCADA EM CONTROLE DE PONTO", valor: 344.96, documentoQuestor: "145205", data: "10/08/2026", cc: "304", centroCusto: "ADM GERAL", nop: "1949", gerencial: "15.02.050", statusCc: "confirmado" },
  { id: "AGO-QST-018", fornecedor: "L. C. REALI - COBRANCAS", valor: 2566.46, documentoQuestor: "27", data: "11/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-019", fornecedor: "ABS LABORATORIO FARMACEUTICO LTDA", valor: 359.0, documentoQuestor: "20878", data: "11/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-020", fornecedor: "RD GESTAO E SISTEMAS S.A.", valor: 1296.9, documentoQuestor: "389206", data: "12/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-021", fornecedor: "ESTACIONAMENTO JOCKEY PLAZA LTDA", valor: 20.0, documentoQuestor: "754840", data: "14/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-022", fornecedor: "RENOVA AMBIENTAL DO BRASIL TRATAMENTO DE RESIDUOS", valor: 1400.0, documentoQuestor: "1817", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 1817 do mesmo fornecedor, mas com valor de R$ 1.344,00 (não R$ 1.400,00, diferença de R$ 56,00) — não bate integralmente, não usado sem confirmação do cliente." },
  { id: "AGO-QST-023", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 150.0, documentoQuestor: "3192", data: "17/08/2026", cc: "204", centroCusto: "ADM DE VENDAS", nop: "1933", gerencial: "13.02.004", statusCc: "confirmado" },
  { id: "AGO-QST-024", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.0, documentoQuestor: "3193", data: "17/08/2026", cc: "204", centroCusto: "ADM DE VENDAS", nop: "1933", gerencial: "13.02.004", statusCc: "confirmado" },
  { id: "AGO-QST-025", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.0, documentoQuestor: "3194", data: "17/08/2026", cc: "204", centroCusto: "ADM DE VENDAS", nop: "1933", gerencial: "13.02.004", statusCc: "confirmado" },
  { id: "AGO-QST-026", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.0, documentoQuestor: "3195", data: "17/08/2026", cc: "204", centroCusto: "ADM DE VENDAS", nop: "1933", gerencial: "13.02.004", statusCc: "confirmado" },
  { id: "AGO-QST-027", fornecedor: "SOFTDIB INFORMATICA LTDA", valor: 8944.0, documentoQuestor: "1584", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "rejeitado", notaCc: "SOFTDIB tem SOFTDIB INFORMATICA no documento 1618 com valor de R$ 7.194,00 (não R$ 8.944,00, doc. 1584 não existe) — não é o mesmo lançamento, não usado." },
  { id: "AGO-QST-028", fornecedor: "MAECIO B. DE CARVALHO SERVICO DE HOTELARIA LTDA", valor: 500.0, documentoQuestor: "1099", data: "18/08/2026", cc: "201", centroCusto: "VENDAS", nop: "2933", gerencial: "15.01.001", statusCc: "confirmado" },
  { id: "AGO-QST-029", fornecedor: "DC LOGISTICS BRASIL LTDA", valor: 6262.26, documentoQuestor: "13593", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-030", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 1884.48, documentoQuestor: "1984082", data: "18/08/2026", cc: "209", centroCusto: "IMPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-031", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "486", data: "18/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-032", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "488", data: "18/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-033", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "490", data: "18/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-034", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 5599.31, documentoQuestor: "1985637", data: "19/08/2026", cc: "209", centroCusto: "IMPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-035", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.0, documentoQuestor: "79", data: "19/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-036", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 5146.14, documentoQuestor: "1985791", data: "20/08/2026", cc: "209", centroCusto: "IMPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-037", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 1708.8, documentoQuestor: "1986145", data: "20/08/2026", cc: "209", centroCusto: "IMPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-038", fornecedor: "TELEFONICA BRASIL S.A.", valor: 54.47, documentoQuestor: "1211875", data: "22/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-039", fornecedor: "CM COMERCIO DE SUCATAS LTDA", valor: 150.0, documentoQuestor: "7", data: "25/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-040", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "680", data: "25/08/2026", cc: "209", centroCusto: "IMPORTAÇÃO", nop: "1933", gerencial: "11.04.014", statusCc: "confirmado" },
  { id: "AGO-QST-041A", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 53.31, documentoQuestor: "10103", data: "25/08/2026", cc: "201", centroCusto: "VENDAS", nop: "1949", gerencial: "12.03.008", statusCc: "confirmado" },
  { id: "AGO-QST-041B", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 17.77, documentoQuestor: "10103", data: "25/08/2026", cc: "203", centroCusto: "FATURAMENTO", nop: "1949", gerencial: "12.03.008", statusCc: "confirmado" },
  { id: "AGO-QST-041C", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 17.77, documentoQuestor: "10103", data: "25/08/2026", cc: "206", centroCusto: "EXPORTAÇÃO", nop: "1949", gerencial: "12.03.008", statusCc: "confirmado" },
  { id: "AGO-QST-041D", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 35.54, documentoQuestor: "10103", data: "25/08/2026", cc: "210", centroCusto: "MARKETING", nop: "1949", gerencial: "12.03.008", statusCc: "confirmado" },
  { id: "AGO-QST-041E", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 90.85, documentoQuestor: "10103", data: "25/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO (rateio SOFTDIB limitado a 4 centros)", nop: "1949", gerencial: "12.03.008", statusCc: "parcial" },
  { id: "AGO-QST-042", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "700", data: "26/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 700 do mesmo fornecedor, mas com valor de R$ 14.027,02 (não R$ 801,55) — numeração não corresponde ao mesmo lançamento, não usado." },
  { id: "AGO-QST-043", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "724", data: "26/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014", statusCc: "rejeitado", notaCc: "SOFTDIB tem documento 724 do mesmo fornecedor, mas com valor de R$ 26.436,25 (não R$ 801,55) — numeração não corresponde ao mesmo lançamento, não usado." },
  { id: "AGO-QST-044", fornecedor: "ESTACIONAMENTO JOCKEY PLAZA LTDA", valor: 20.0, documentoQuestor: "800045", data: "27/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
  { id: "AGO-QST-045", fornecedor: "CONT LEGACY - INTELIGENCIA CONTABIL LTDA", valor: 14773.06, documentoQuestor: "353", data: "28/08/2026", cc: "304", centroCusto: "ADM GERAL", nop: "1933", gerencial: "11.02.002", statusCc: "confirmado" },
  { id: "AGO-QST-046", fornecedor: "L. C. REALI - COBRANCAS", valor: 2481.88, documentoQuestor: "30", data: "31/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", statusCc: "ausente" },
];

export const totalServicosQuestorAgosto = servicosQuestorAgosto.reduce((s, x) => s + x.valor, 0);

const observacaoPorStatus = (s: ServicoQuestor): string => {
  switch (s.statusCc) {
    case "confirmado":
      return "Valor e fornecedor conforme Questor oficial (autoridade). CC confirmado por número de documento + fornecedor + valor batendo exatamente com o rateio por centro de custo do relatório detalhado do SOFTDIB.";
    case "parcial":
      return "Valor e fornecedor conforme Questor oficial (autoridade). O documento está no SOFTDIB, mas seu rateio por CC (limitado a 4 centros no relatório) não cobre o valor total da nota — esta linha é a parcela sem CC identificado; as demais parcelas do mesmo documento têm CC confirmado.";
    case "rejeitado":
      return `Valor e fornecedor conforme Questor oficial (autoridade). ${s.notaCc ?? ""} Fica sem centro de custo específico até identificação documental.`;
    case "ausente":
      return "Valor e fornecedor conforme Questor oficial (autoridade). Não localizado no CSV detalhado do SOFTDIB (nem por número de documento, nem por fornecedor) — sem CC disponível, fica sem centro de custo específico até identificação documental.";
    default:
      return "Valor e fornecedor conforme Questor oficial (autoridade).";
  }
};

export const lancamentosServicosQuestorAgosto: LancamentoIntegrado[] = servicosQuestorAgosto.map((s) => ({
  id: s.id,
  data: s.data,
  origem: "QUESTOR ENTRADAS 08/2026 (ATUALIZADO)",
  debitoCodigo: CONTA_SERVICOS,
  debito: nome(CONTA_SERVICOS),
  creditoCodigo: CONTA_FORNECEDORES,
  credito: nome(CONTA_FORNECEDORES),
  historico: `SERVIÇOS DE TERCEIROS OPERACIONAL - ${s.fornecedor}`,
  documento: `Documento Questor ${s.documentoQuestor}${s.nop ? ` / NOP ${s.nop}` : ""}${s.gerencial ? ` / gerencial ${s.gerencial}` : ""}`,
  cc: s.cc,
  centroCusto: s.centroCusto,
  valor: s.valor,
  status: "revisar",
  observacao: observacaoPorStatus(s),
  rastreio: "documento",
  fonte: "Questor_Exportacao - entradas (atualizado).xlsx + RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv",
}));
