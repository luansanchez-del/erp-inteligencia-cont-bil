import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { folhaAgostoDetalhe } from "./nitaplast-folha-agosto";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const centros: Record<string, string> = {
  "201": "VENDAS",
  "203": "FATURAMENTO",
  "206": "EXPORTAÇÃO",
  "210": "MARKETING",
  "301": "RECEPÇÃO",
  "302": "FINANCEIRO",
  "304": "ADM GERAL",
  "502": "COMERCIAL SP",
};
const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const fonte = "RELAÇÃO DE CÁLCULO FOLHA 09.2026 - MATRIZ E FILIAL";

type ColaboradorSetembro = {
  matricula: string;
  nome: string;
  cc: string;
  unidade: "Matriz" | "Filial SP";
  remuneracao: number;
  faltas?: number;
  adiantamento?: number;
  beneficios?: number;
  vales?: number;
  consignado?: number;
  pensao?: number;
  irrf?: number;
  inss: number;
  inss13?: number;
  vtNaoUtilizado?: number;
  vrNaoUtilizado?: number;
  desconto13?: number;
  fgts?: number;
  fgtsRescisao?: number;
  fgtsDecimo?: number;
  baseEncargos: number;
  decimoProporcional?: number;
  feriasProporcionais?: number;
  rescisao?: boolean;
};

/**
 * Valores extraídos da Relação de Cálculo de 01/09/2026 a 30/09/2026 (Matriz e Filial),
 * conferidos por funcionário (proventos, descontos e líquido) e contra o resumo da folha.
 * 30358 Maria Isabel Santos: admitida em 01/09/2026, CC 304 provisório (a confirmar).
 * 30357 Eder Marcos dos Santos: rescisão; o líquido rescisório fica em 1634 até o pagamento.
 */
export const folhaSetembroDetalhe: ColaboradorSetembro[] = [
  { matricula: "30349", nome: "ALANA PREU ROSAS", cc: "301", unidade: "Matriz", remuneracao: 3076.8, faltas: 5.6, adiantamento: 880.0, beneficios: 198.28, fgts: 245.69, inss: 257.13, baseEncargos: 3071.2 },
  { matricula: "30302", nome: "BIANCA CABRAL CASTELLANO", cc: "206", unidade: "Matriz", remuneracao: 4736.52, faltas: 13.36, adiantamento: 1620.0, beneficios: 21.25, fgts: 377.85, inss: 462.74, baseEncargos: 4723.16 },
  { matricula: "30319", nome: "CAROLINA LINDEMANN DE SOUZA MOREIRA", cc: "201", unidade: "Matriz", remuneracao: 7431.7, adiantamento: 2184.0, beneficios: 989.89, fgts: 594.53, irrf: 35.89, inss: 841.94, baseEncargos: 7431.7 },
  { matricula: "30334", nome: "DANIELE OSLICKI AMARANTE DE MELO", cc: "210", unidade: "Matriz", remuneracao: 5416.74, adiantamento: 1660.0, beneficios: 1733.89, fgts: 433.33, inss: 559.84, baseEncargos: 5416.74 },
  { matricula: "30281", nome: "EMERSON CORTES DE OLIVEIRA", cc: "203", unidade: "Matriz", remuneracao: 4900.0, adiantamento: 1840.0, beneficios: 604.47, fgts: 392.0, inss: 487.5, baseEncargos: 4900 },
  { matricula: "30350", nome: "KAUHANE FERNANDES FARIA AZEVEDO", cc: "210", unidade: "Matriz", remuneracao: 3200.0, faltas: 24.24, beneficios: 27.58, fgts: 254.06, inss: 269.68, baseEncargos: 3175.76 },
  { matricula: "30356", nome: "LETICIA DOS SANTOS", cc: "301", unidade: "Matriz", remuneracao: 2250.0, faltas: 4.6, adiantamento: 800.0, fgts: 179.63, inss: 177.76, baseEncargos: 2245.4 },
  { matricula: "30358", nome: "MARIA ISABEL SANTOS", cc: "304", unidade: "Matriz", remuneracao: 2120.0, faltas: 154.18, adiantamento: 800.0, fgts: 157.26, inss: 152.6, baseEncargos: 1965.82 },
  { matricula: "30320", nome: "MARILIA APARECIDA IGNACHEWSKI ANTUNES", cc: "201", unidade: "Matriz", remuneracao: 4619.16, adiantamento: 1380.0, beneficios: 564.36, fgts: 369.53, inss: 448.18, baseEncargos: 4619.16 },
  { matricula: "30271", nome: "VERA SANDERS", cc: "201", unidade: "Matriz", remuneracao: 3300.0, adiantamento: 1240.0, beneficios: 176.2, fgts: 264.0, inss: 284.58, baseEncargos: 3300 },
  { matricula: "30345", nome: "WALLERIA MARTINS", cc: "302", unidade: "Matriz", remuneracao: 3650.0, faltas: 13.55, vales: 300.0, adiantamento: 1300.0, beneficios: 247.52, fgts: 290.91, inss: 324.96, consignado: 1033.72, baseEncargos: 3636.45 },
  { matricula: "30321", nome: "WILLIAN MACIEL DO AMARAL", cc: "201", unidade: "Matriz", remuneracao: 4160.15, faltas: 28.36, adiantamento: 1340.0, beneficios: 257.87, fgts: 330.54, inss: 384.4, baseEncargos: 4131.79 },
  { matricula: "30352", nome: "CAUAN DOS SANTOS", cc: "502", unidade: "Filial SP", remuneracao: 2570.0, adiantamento: 880.0, beneficios: 173.87, fgts: 205.6, inss: 206.98, baseEncargos: 2570 },
  { matricula: "30357", nome: "EDER MARCOS DOS SANTOS", cc: "502", unidade: "Filial SP", remuneracao: 1066.67, faltas: 145.46, decimoProporcional: 333.33, feriasProporcionais: 222.23, vtNaoUtilizado: 63.6, desconto13: 83.33, vrNaoUtilizado: 276.0, pensao: 199.07, fgtsRescisao: 73.69, fgtsDecimo: 20.0, inss: 69.09, inss13: 24.99, baseEncargos: 1254.54, rescisao: true },
  { matricula: "30323", nome: "JUSSARA SODRE LIMA", cc: "502", unidade: "Filial SP", remuneracao: 4435.91, adiantamento: 1412.0, fgts: 354.87, inss: 422.52, baseEncargos: 4435.91 },
  { matricula: "30335", nome: "THAUANY SANTOS CARDOSO", cc: "502", unidade: "Filial SP", remuneracao: 3370.48, faltas: 7.95, adiantamento: 1040.0, fgts: 269.0, inss: 292.09, consignado: 880.52, baseEncargos: 3362.53 },
];

function lancamento(
  colaborador: ColaboradorSetembro,
  id: string,
  debitoCodigo: string,
  creditoCodigo: string,
  historico: string,
  valor: number,
  observacao: string,
): LancamentoIntegrado {
  return {
    id: `SET-FOL-${colaborador.matricula}-${id}`,
    data: "30/09/2026",
    origem: `FOLHA ${colaborador.unidade.toUpperCase()} 09/2026`,
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico: `${colaborador.nome} - ${historico}`,
    documento: colaborador.matricula,
    cc: colaborador.cc,
    centroCusto: centros[colaborador.cc] ?? "SEM CENTRO DE CUSTO",
    valor: arred(valor),
    status: colaborador.matricula === "30358" ? "revisar" : "validado",
    observacao,
    rastreio: "documento",
    fonte,
  };
}

export const lancamentosFolhaSetembro: LancamentoIntegrado[] = folhaSetembroDetalhe.flatMap((colaborador) => {
  const linhas: LancamentoIntegrado[] = [];
  const adicionar = (id: string, debito: string, credito: string, historico: string, valor: number, observacao: string) => {
    if (Math.abs(valor) > 0.005) linhas.push(lancamento(colaborador, id, debito, credito, historico, valor, observacao));
  };
  adicionar("REM", "4014", "1634", "remuneração normal, comissões e DSR", colaborador.remuneracao, "Valor normal da folha; verbas rescisórias em contas próprias.");
  adicionar("FALTAS", "1634", "4014", "faltas, DSR de faltas e atrasos", colaborador.faltas ?? 0, "Desconto informado na relação de cálculo.");
  adicionar("ADT", "1634", "312", "baixa de adiantamento salarial", colaborador.adiantamento ?? 0, "Desconto de adiantamento salarial informado na folha.");
  adicionar("BEN", "1634", "1496", "descontos de plano de saúde e benefícios", colaborador.beneficios ?? 0, "Mensalidades e coparticipações descontadas; creditadas em 1496, mesma conta da despesa da Unimed (critério de agosto).");
  adicionar("VALES", "1634", "25115", "vales parcelados", colaborador.vales ?? 0, "Desconto de vales parcelados: recuperação de empréstimo a funcionário.");
  adicionar("CONS", "1634", "25231", "consignado, pensão judicial ou Crédito do Trabalhador", (colaborador.consignado ?? 0) + (colaborador.pensao ?? 0), "Desconto a repassar conforme a relação de cálculo.");
  adicionar("IRRF", "1634", "25232", "IRRF sobre salários", colaborador.irrf ?? 0, "IRRF retido na folha.");
  adicionar("INSS", "1634", "25227", "INSS descontado", colaborador.inss, "INSS normal retido na folha.");
  adicionar("INSS-13", "25238", "25227", "INSS sobre 13º proporcional", colaborador.inss13 ?? 0, "Retenção previdenciária sobre 13º proporcional da rescisão.");
  adicionar("VT", "1634", "4037", "vale-transporte não utilizado", colaborador.vtNaoUtilizado ?? 0, "Desconto de VT não utilizado na rescisão.");
  adicionar("VR", "1634", "4028", "vale-refeição não utilizado", colaborador.vrNaoUtilizado ?? 0, "Desconto de VR não utilizado na rescisão.");
  adicionar("DESC-13", "1634", "25238", "desconto de 13º salário", colaborador.desconto13 ?? 0, "Desconto de 13º informado na rescisão.");
  const taxaEncargos = colaborador.unidade === "Matriz" ? 0.273 : 0.268;
  adicionar("ENC", "4020", "25227", "encargos patronais, terceiros e GILRAT", arred(colaborador.baseEncargos * taxaEncargos), `Carga patronal de ${(taxaEncargos * 100).toFixed(1)}% sobre a base INSS Empresa do relatório: 20% patronal + terceiros + GILRAT (${colaborador.unidade === "Matriz" ? "matriz, GILRAT 1,5%" : "filial, GILRAT 1,0%"}).`);
  adicionar("FGTS", "4021", "25228", "FGTS mensal", colaborador.fgts ?? 0, "FGTS mensal informado na folha.");
  adicionar("FGTS-RES", "4021", "25228", "FGTS rescisório do mês", colaborador.fgtsRescisao ?? 0, "FGTS rescisório informado na rescisão.");
  adicionar("FGTS-13-RES", "4021", "25228", "FGTS rescisório sobre 13º", colaborador.fgtsDecimo ?? 0, "FGTS sobre 13º proporcional informado na rescisão.");
  if (colaborador.rescisao) {
    adicionar("RES-13", "25238", "1634", "13º salário proporcional na rescisão", colaborador.decimoProporcional ?? 0, "Verba rescisória baixada da provisão de 13º.");
    adicionar("RES-FER", "25237", "1634", "férias proporcionais e 1/3 na rescisão", colaborador.feriasProporcionais ?? 0, "Verba rescisória baixada da provisão de férias.");
  }
  return linhas;
});

const matriculasAgosto = new Set(folhaAgostoDetalhe.filter((colaborador) => !colaborador.rescisao).map((colaborador) => colaborador.matricula));
const matriculasSetembro = new Set(folhaSetembroDetalhe.map((colaborador) => colaborador.matricula));

export const comparacaoFolhaAgostoSetembro = {
  entradas: folhaSetembroDetalhe.filter((colaborador) => !matriculasAgosto.has(colaborador.matricula)).map(({ matricula, nome, cc, unidade }) => ({ matricula, nome, cc, unidade })),
  saidas: [...matriculasAgosto].filter((matricula) => !matriculasSetembro.has(matricula)),
  desligadosNaCompetencia: folhaSetembroDetalhe.filter((colaborador) => colaborador.rescisao).map(({ matricula, nome, cc, unidade }) => ({ matricula, nome, cc, unidade })),
} as const;

export const resumoFolhaSetembro = {
  proventosMatriz: 48861.07,
  proventosFilial: 11998.62,
  baseInssMatriz: 48617.18,
  baseInssFilial: 11622.98,
  fgtsMensalMatriz: 3889.33,
  fgtsFilial: 829.47,
  fgtsRescisorioFilial: 93.69,
  inssSeguradosMatriz: 4651.31,
  inssSeguradosFilial: 1015.67,
  encargosPatronaisTerceirosGilratMatriz: 13272.45,
  encargosPatronaisTerceirosGilratFilial: 3114.91,
  dctfwebFilial: 4130.58,
  irrfMatriz: 35.89,
  funcionarios: 16,
} as const;

const somaUnidade = (unidade: ColaboradorSetembro["unidade"], campo: (colaborador: ColaboradorSetembro) => number) =>
  arred(folhaSetembroDetalhe.filter((colaborador) => colaborador.unidade === unidade).reduce((total, colaborador) => total + campo(colaborador), 0));
const proventos = (colaborador: ColaboradorSetembro) => colaborador.remuneracao + (colaborador.decimoProporcional ?? 0) + (colaborador.feriasProporcionais ?? 0);
const fgtsTotal = (colaborador: ColaboradorSetembro) => (colaborador.fgts ?? 0) + (colaborador.fgtsRescisao ?? 0) + (colaborador.fgtsDecimo ?? 0);
const inssTotal = (colaborador: ColaboradorSetembro) => colaborador.inss + (colaborador.inss13 ?? 0);

if (comparacaoFolhaAgostoSetembro.entradas.length !== 1 || comparacaoFolhaAgostoSetembro.entradas[0]?.matricula !== "30358") throw new Error("Entrada da folha de setembro divergente");
if (comparacaoFolhaAgostoSetembro.saidas.length !== 0) throw new Error("Saída da folha de setembro divergente");
if (somaUnidade("Matriz", proventos) !== resumoFolhaSetembro.proventosMatriz) throw new Error("Proventos da Matriz em setembro divergentes");
if (somaUnidade("Filial SP", proventos) !== resumoFolhaSetembro.proventosFilial) throw new Error("Proventos da Filial em setembro divergentes");
if (somaUnidade("Matriz", (colaborador) => colaborador.baseEncargos) !== resumoFolhaSetembro.baseInssMatriz) throw new Error("Base INSS da Matriz em setembro divergente");
if (somaUnidade("Filial SP", (colaborador) => colaborador.baseEncargos) !== resumoFolhaSetembro.baseInssFilial) throw new Error("Base INSS da Filial em setembro divergente");
if (somaUnidade("Matriz", fgtsTotal) !== resumoFolhaSetembro.fgtsMensalMatriz) throw new Error("FGTS da Matriz em setembro divergente");
if (somaUnidade("Filial SP", fgtsTotal) !== arred(resumoFolhaSetembro.fgtsFilial + resumoFolhaSetembro.fgtsRescisorioFilial)) throw new Error("FGTS da Filial em setembro divergente");
if (somaUnidade("Matriz", inssTotal) !== resumoFolhaSetembro.inssSeguradosMatriz) throw new Error("INSS segurados da Matriz em setembro divergente");
if (somaUnidade("Filial SP", inssTotal) !== resumoFolhaSetembro.inssSeguradosFilial) throw new Error("INSS segurados da Filial em setembro divergente");
