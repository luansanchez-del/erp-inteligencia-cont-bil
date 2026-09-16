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
 * (R$ 87.409,07) não tinham lançamento correspondente — o SOFTDIB está
 * incompleto em relação ao Questor para essa categoria específica.
 *
 * Fonte de valor e fornecedor: Questor (autoridade — sistema contábil
 * oficial). Fonte de CC/NOP, quando encontrada: cruzamento por nome +
 * valor contra o CSV detalhado do SOFTDIB (RELATATORIO DETALHADO ENTRADAS
 * POR CENTRO DE CUSTO). Metade dos 46 não foi localizada no SOFTDIB (não
 * existe lá, nem com outro CC) — fica sem CC específico, status "revisar".
 * Nenhum valor foi estimado ou arredondado; tudo vem direto do Questor.
 */
const CONTA_SERVICOS = "25938";
const CONTA_FORNECEDORES = "1496";

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
};

const servicosQuestorAgosto: ServicoQuestor[] = [
  { id: "AGO-QST-001", fornecedor: "LOGCOMEX LTDA", valor: 2300.00, documentoQuestor: "26932", data: "01/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "15.02.050" },
  { id: "AGO-QST-002", fornecedor: "DENTALUNI - COOPERATIVA ODONTOLOGICA", valor: 299.70, documentoQuestor: "711883", data: "01/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-003", fornecedor: "GOOGLE BRASIL INTERNET LTDA", valor: 2509.01, documentoQuestor: "38442194", data: "02/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "2933", gerencial: "15.01.008" },
  { id: "AGO-QST-004", fornecedor: "FACEBOOK SERVICOS ONLINE DO BRASIL LTDA", valor: 1002.48, documentoQuestor: "143344256", data: "03/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "2933", gerencial: "15.01.008" },
  { id: "AGO-QST-005", fornecedor: "SALESBUD TECNOLOGIA LTDA", valor: 911.20, documentoQuestor: "2465", data: "03/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "2933", gerencial: "15.02.050" },
  { id: "AGO-QST-006", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 5814.30, documentoQuestor: "974133", data: "03/08/2026", cc: "203", centroCusto: "COMERCIAL", nop: "1949", gerencial: "12.03.002" },
  { id: "AGO-QST-007", fornecedor: "UNIMED CURITIBA - SOCIEDADE COOPERATIVA", valor: 3910.53, documentoQuestor: "974288", data: "03/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1949", gerencial: "12.03.002" },
  { id: "AGO-QST-008", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.00, documentoQuestor: "38", data: "04/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-009", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.00, documentoQuestor: "39", data: "04/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-010", fornecedor: "SAMUEL MOSCARDI PEREIRA DA SILVA", valor: 600.00, documentoQuestor: "4", data: "05/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-011", fornecedor: "SALLES VAZ SOLUCOES INDUSTRIAIS LTDA", valor: 2701.38, documentoQuestor: "42", data: "05/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.02.002" },
  { id: "AGO-QST-012", fornecedor: "STOP AND GO TURISMO LTDA", valor: 1649.13, documentoQuestor: "648", data: "05/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "15.01.002" },
  { id: "AGO-QST-013", fornecedor: "NEFFA GESTAO, TURISMO E NEGOCIOS S/A", valor: 1795.50, documentoQuestor: "9363", data: "06/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "2933", gerencial: "15.01.001" },
  { id: "AGO-QST-014", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.00, documentoQuestor: "43", data: "07/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-015", fornecedor: "ATLANTIS PARANAGUA TERMINAIS DE CONTAINERS LTDA", valor: 275.00, documentoQuestor: "55394", data: "08/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-016", fornecedor: "MYRH TECNOLOGIA LTDA", valor: 423.35, documentoQuestor: "10769", data: "10/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1949", gerencial: "15.02.050" },
  { id: "AGO-QST-017", fornecedor: "TECNOPONTO TECNOLOGIA AVANCADA EM CONTROLE DE PONTO", valor: 344.96, documentoQuestor: "145205", data: "10/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1949", gerencial: "15.02.050" },
  { id: "AGO-QST-018", fornecedor: "L. C. REALI - COBRANCAS", valor: 2566.46, documentoQuestor: "27", data: "11/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-019", fornecedor: "ABS LABORATORIO FARMACEUTICO LTDA", valor: 359.00, documentoQuestor: "20878", data: "11/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-020", fornecedor: "RD GESTAO E SISTEMAS S.A.", valor: 1296.90, documentoQuestor: "389206", data: "12/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-021", fornecedor: "ESTACIONAMENTO JOCKEY PLAZA LTDA", valor: 20.00, documentoQuestor: "754840", data: "14/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-022", fornecedor: "RENOVA AMBIENTAL DO BRASIL TRATAMENTO DE RESIDUOS", valor: 1400.00, documentoQuestor: "1817", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-023", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 150.00, documentoQuestor: "3192", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "13.02.004" },
  { id: "AGO-QST-024", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.00, documentoQuestor: "3193", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "13.02.004" },
  { id: "AGO-QST-025", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.00, documentoQuestor: "3194", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "13.02.004" },
  { id: "AGO-QST-026", fornecedor: "IRMAOS MAIO LTDA - EPP", valor: 80.00, documentoQuestor: "3195", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "13.02.004" },
  { id: "AGO-QST-027", fornecedor: "SOFTDIB INFORMATICA LTDA", valor: 8944.00, documentoQuestor: "1584", data: "17/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-028", fornecedor: "MAECIO B. DE CARVALHO SERVICO DE HOTELARIA LTDA", valor: 500.00, documentoQuestor: "1099", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "2933", gerencial: "15.01.001" },
  { id: "AGO-QST-029", fornecedor: "DC LOGISTICS BRASIL LTDA", valor: 6262.26, documentoQuestor: "13593", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-030", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 1884.48, documentoQuestor: "1984082", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-031", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "486", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-032", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "488", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-033", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 1231.96, documentoQuestor: "490", data: "18/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-034", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 5599.31, documentoQuestor: "1985637", data: "19/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-035", fornecedor: "CORREBROKERS ASSESSORIA COMEX EXTERIOR", valor: 750.00, documentoQuestor: "79", data: "19/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-036", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 5146.14, documentoQuestor: "1985791", data: "20/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-037", fornecedor: "TCP - TERMINAL DE CONTEINERES DE PARANAGUA S/A", valor: 1708.80, documentoQuestor: "1986145", data: "20/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-038", fornecedor: "TELEFONICA BRASIL S.A.", valor: 54.47, documentoQuestor: "1211875", data: "22/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-039", fornecedor: "CM COMERCIO DE SUCATAS LTDA", valor: 150.00, documentoQuestor: "7", data: "25/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-040", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "680", data: "25/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-041", fornecedor: "MAXIPAS SAUDE OCUPACIONAL LTDA", valor: 215.24, documentoQuestor: "10103", data: "25/08/2026", cc: "210", centroCusto: "MARKETING", nop: "1949", gerencial: "12.03.008" },
  { id: "AGO-QST-042", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "700", data: "26/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-043", fornecedor: "EVL TRANSPORTES E LOGISTICA LTDA", valor: 801.55, documentoQuestor: "724", data: "26/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.04.014" },
  { id: "AGO-QST-044", fornecedor: "ESTACIONAMENTO JOCKEY PLAZA LTDA", valor: 20.00, documentoQuestor: "800045", data: "27/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
  { id: "AGO-QST-045", fornecedor: "CONT LEGACY - INTELIGENCIA CONTABIL LTDA", valor: 14773.06, documentoQuestor: "353", data: "28/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", nop: "1933", gerencial: "11.02.002" },
  { id: "AGO-QST-046", fornecedor: "L. C. REALI - COBRANCAS", valor: 2481.88, documentoQuestor: "30", data: "31/08/2026", cc: "0", centroCusto: "SEM CENTRO DE CUSTO" },
];

export const totalServicosQuestorAgosto = servicosQuestorAgosto.reduce((s, x) => s + x.valor, 0);

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
  observacao: s.nop
    ? "Valor e fornecedor conforme Questor oficial (autoridade). CC/NOP/gerencial cruzados por nome+valor contra o CSV detalhado do SOFTDIB — não estava lançado antes por não constar no relatório resumido usado na sessão anterior."
    : "Valor e fornecedor conforme Questor oficial (autoridade). Não localizado no CSV detalhado do SOFTDIB (nem por nome nem por valor) — sem CC/NOP disponível, fica sem centro de custo específico até identificação documental.",
  rastreio: "documento",
  fonte: "Questor_Exportacao - entradas (atualizado).xlsx",
}));
