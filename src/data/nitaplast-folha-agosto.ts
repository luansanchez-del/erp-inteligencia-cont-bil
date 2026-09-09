import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { folhaFilialDetalhe, folhaMatrizDetalhe } from "./nitaplast-folha-julho";

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
const fonte = "RELAÇÃO DE CÁLCULO FOLHA 08.2026 - MATRIZ E FILIAL / DCTFWEB / FGTS DIGITAL";

type ColaboradorAgosto = {
  matricula: string;
  nome: string;
  cc: string;
  unidade: "Matriz" | "Filial SP";
  remuneracao: number;
  atraso?: number;
  vantagem?: number;
  adiantamento?: number;
  adiantamentoFerias?: number;
  descontosBeneficios?: number;
  consignado?: number;
  pensao?: number;
  salarioFamilia?: number;
  inssNormal: number;
  inssFerias?: number;
  inssDecimo?: number;
  fgts: number;
  fgtsFerias?: number;
  fgtsMesAnterior?: number;
  fgtsRescisao?: number;
  fgtsDecimo?: number;
  baseEncargos: number;
  feriasBrutas?: number;
  decimoProporcional?: number;
  feriasProporcionais?: number;
  rescisao?: boolean;
};

/** Valores extraídos da Relação de Cálculo de 01/08/2026 a 31/08/2026. */
export const folhaAgostoDetalhe: ColaboradorAgosto[] = [
  { matricula: "30349", nome: "ALANA PREU ROSAS", cc: "301", unidade: "Matriz", remuneracao: 2200, atraso: 7.67, adiantamento: 880, descontosBeneficios: 99.64, inssNormal: 172.98, fgts: 175.38, baseEncargos: 2192.33 },
  { matricula: "30302", nome: "BIANCA CABRAL CASTELLANO", cc: "206", unidade: "Matriz", remuneracao: 4231.41, adiantamento: 1620, descontosBeneficios: 21.25, inssNormal: 396.35, fgts: 338.51, baseEncargos: 4231.41 },
  { matricula: "30319", nome: "CAROLINA LINDEMANN DE SOUZA MOREIRA", cc: "201", unidade: "Matriz", remuneracao: 6687.93, adiantamento: 1965.60, adiantamentoFerias: 809.31, descontosBeneficios: 1190.76, inssNormal: 790.89, inssFerias: 70.02, fgts: 535.03, fgtsFerias: 70.35, baseEncargos: 7567.26, feriasBrutas: 879.33 },
  { matricula: "30334", nome: "DANIELE OSLICKI AMARANTE DE MELO", cc: "210", unidade: "Matriz", remuneracao: 5376.03, adiantamento: 1660, descontosBeneficios: 1960.64, inssNormal: 554.14, fgts: 430.08, baseEncargos: 5376.03 },
  { matricula: "30281", nome: "EMERSON CORTES DE OLIVEIRA", cc: "203", unidade: "Matriz", remuneracao: 3412.90, adiantamento: 1349.33, adiantamentoFerias: 1519.03, descontosBeneficios: 568.38, inssNormal: 385.76, inssFerias: 123.50, fgts: 273.03, fgtsFerias: 131.40, baseEncargos: 5055.43, feriasBrutas: 1642.53 },
  { matricula: "30355", nome: "GLEICY KELLY ALVES WEIGERT", cc: "304", unidade: "Matriz", remuneracao: 290.32, salarioFamilia: 22.51, inssNormal: 21.77, inssDecimo: 11.25, fgts: 0, fgtsMesAnterior: 136.75, fgtsRescisao: 23.22, fgtsDecimo: 12, baseEncargos: 440.32, decimoProporcional: 150, feriasProporcionais: 400, rescisao: true },
  { matricula: "30350", nome: "KAUHANE FERNANDES FARIA AZEVEDO", cc: "210", unidade: "Matriz", remuneracao: 3000, atraso: 10.45, descontosBeneficios: 60.43, inssNormal: 247.33, fgts: 239.16, baseEncargos: 2989.55 },
  { matricula: "30356", nome: "LETICIA DOS SANTOS", cc: "301", unidade: "Matriz", remuneracao: 2000, adiantamento: 800, inssNormal: 155.68, fgts: 160, baseEncargos: 2000 },
  { matricula: "30320", nome: "MARILIA APARECIDA IGNACHEWSKI ANTUNES", cc: "201", unidade: "Matriz", remuneracao: 4164.97, atraso: 73.18, adiantamento: 1380, descontosBeneficios: 465.08, inssNormal: 388.38, fgts: 333.19, baseEncargos: 4164.97 },
  { matricula: "30271", nome: "VERA SANDERS", cc: "201", unidade: "Matriz", remuneracao: 3100, adiantamento: 1240, descontosBeneficios: 270.73, inssNormal: 260.58, fgts: 248, baseEncargos: 3100 },
  { matricula: "30345", nome: "WALLERIA MARTINS", cc: "302", unidade: "Matriz", remuneracao: 3250, vantagem: 1.51, adiantamento: 1300, descontosBeneficios: 339.21, consignado: 1033.72, inssNormal: 278.58, fgts: 260, baseEncargos: 3250 },
  { matricula: "30321", nome: "WILLIAN MACIEL DO AMARAL", cc: "201", unidade: "Matriz", remuneracao: 3999.82, adiantamento: 1340, descontosBeneficios: 257.87, inssNormal: 368.56, fgts: 319.98, baseEncargos: 3999.82 },
  { matricula: "30352", nome: "CAUAN DOS SANTOS", cc: "502", unidade: "Filial SP", remuneracao: 2200, adiantamento: 880, descontosBeneficios: 173.87, inssNormal: 173.68, fgts: 176, baseEncargos: 2200 },
  { matricula: "30357", nome: "EDER MARCOS DOS SANTOS", cc: "502", unidade: "Filial SP", remuneracao: 1870.97, adiantamento: 748.39, pensao: 259.04, inssNormal: 144.06, fgts: 149.67, baseEncargos: 1870.97 },
  { matricula: "30323", nome: "JUSSARA SODRE LIMA", cc: "502", unidade: "Filial SP", remuneracao: 3217.30, adiantamento: 1035.47, adiantamentoFerias: 1264.77, inssNormal: 340.80, inssFerias: 102.54, fgts: 257.38, fgtsFerias: 109.38, baseEncargos: 4584.61, feriasBrutas: 1367.31 },
  { matricula: "30335", nome: "THAUANY SANTOS CARDOSO", cc: "502", unidade: "Filial SP", remuneracao: 2967.06, adiantamento: 1040, consignado: 880.52, inssNormal: 244.63, fgts: 237.36, baseEncargos: 2967.06 },
];

function lancamento(
  colaborador: ColaboradorAgosto,
  id: string,
  debitoCodigo: string,
  creditoCodigo: string,
  historico: string,
  valor: number,
  observacao: string,
): LancamentoIntegrado {
  return {
    id: `AGO-FOL-${colaborador.matricula}-${id}`,
    data: "31/08/2026",
    origem: `FOLHA ${colaborador.unidade.toUpperCase()} 08/2026`,
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico: `${colaborador.nome} - ${historico}`,
    documento: colaborador.matricula,
    cc: colaborador.cc,
    centroCusto: centros[colaborador.cc] ?? "SEM CENTRO DE CUSTO",
    valor: arred(valor),
    status: "validado",
    observacao,
    rastreio: "documento",
    fonte,
  };
}

export const lancamentosFolhaAgosto: LancamentoIntegrado[] = folhaAgostoDetalhe.flatMap((colaborador) => {
  const linhas: LancamentoIntegrado[] = [];
  const adicionar = (id: string, debito: string, credito: string, historico: string, valor: number, observacao: string) => {
    if (Math.abs(valor) > 0.005) linhas.push(lancamento(colaborador, id, debito, credito, historico, valor, observacao));
  };
  adicionar("REM", "4014", "1634", "remuneração normal, comissões e DSR", colaborador.remuneracao, "Valor normal da folha; férias e verbas rescisórias são tratadas em contas próprias quando destacadas no relatório.");
  adicionar("ATR", "1634", "4014", "descontos de atrasos e saídas", colaborador.atraso ?? 0, "Desconto informado na relação de cálculo.");
  adicionar("VANT", "4014", "1634", "vantagem/estouro do mês", colaborador.vantagem ?? 0, "Vantagem informada na relação de cálculo.");
  adicionar("ADT", "1634", "312", "baixa de adiantamento salarial", colaborador.adiantamento ?? 0, "Desconto de adiantamento salarial informado na folha.");
  adicionar("BEN", "1634", "25263", "descontos de plano de saúde e benefícios", colaborador.descontosBeneficios ?? 0, "Mensalidades e coparticipações discriminadas nos dados adicionais da folha.");
  adicionar("CONS", "1634", "25231", "consignado, pensão judicial ou Crédito do Trabalhador", (colaborador.consignado ?? 0) + (colaborador.pensao ?? 0), "Desconto a repassar conforme a relação de cálculo. A natureza individual permanece rastreada pelo documento do colaborador.");
  adicionar("INSS", "1634", "25227", "INSS descontado", colaborador.inssNormal, "INSS normal retido na folha.");
  adicionar("INSS-FER", "25237", "25227", "INSS sobre férias", colaborador.inssFerias ?? 0, "Retenção previdenciária sobre férias; o bruto de férias permanece vinculado à provisão já constituída.");
  adicionar("INSS-13", "25238", "25227", "INSS sobre 13º proporcional", colaborador.inssDecimo ?? 0, "Retenção previdenciária sobre 13º proporcional da rescisão.");
  adicionar("SAL-FAM", "25227", "1634", "salário-família", colaborador.salarioFamilia ?? 0, "Benefício informado na rescisão e compensável na contribuição previdenciária.");
  adicionar("ENC", "4020", "25227", "encargos patronais, terceiros e GILRAT", arred(colaborador.baseEncargos * 0.273), "Carga patronal de 27,3% aplicada sobre a base INSS Empresa do relatório: 20% patronal + terceiros + GILRAT.");
  adicionar("FGTS", "4021", "25228", "FGTS mensal", colaborador.fgts, "FGTS mensal informado na folha.");
  adicionar("FGTS-FER", "4021", "25228", "FGTS sobre férias", colaborador.fgtsFerias ?? 0, "FGTS sobre férias informado na folha.");
  adicionar("FGTS-MES-ANT", "4021", "25228", "FGTS normal do mês anterior na rescisão", colaborador.fgtsMesAnterior ?? 0, "FGTS do mês anterior informado no demonstrativo rescisório.");
  adicionar("FGTS-RES", "4021", "25228", "FGTS rescisório do mês", colaborador.fgtsRescisao ?? 0, "FGTS rescisório informado no demonstrativo de rescisão.");
  adicionar("FGTS-13-RES", "4021", "25228", "FGTS rescisório sobre 13º", colaborador.fgtsDecimo ?? 0, "FGTS sobre 13º proporcional informado no demonstrativo de rescisão.");
  if (colaborador.rescisao) {
    adicionar("RES-13", "25238", "1634", "13º salário proporcional na rescisão", colaborador.decimoProporcional ?? 0, "Verba rescisória documentada na relação de cálculo.");
    adicionar("RES-FER", "25237", "1634", "férias proporcionais e 1/3 na rescisão", colaborador.feriasProporcionais ?? 0, "Verba rescisória documentada na relação de cálculo.");
  }
  return linhas;
});

const matriculasJulho = new Set([
  ...folhaMatrizDetalhe.map((colaborador) => colaborador.matricula),
  ...folhaFilialDetalhe.map((colaborador) => colaborador.matricula),
]);
const matriculasAgosto = new Set(folhaAgostoDetalhe.map((colaborador) => colaborador.matricula));

export const comparacaoFolhaJulhoAgosto = {
  entradas: folhaAgostoDetalhe.filter((colaborador) => !matriculasJulho.has(colaborador.matricula)).map(({ matricula, nome, cc, unidade }) => ({ matricula, nome, cc, unidade })),
  saidas: [...matriculasJulho].filter((matricula) => !matriculasAgosto.has(matricula)),
  desligadosNaCompetencia: folhaAgostoDetalhe.filter((colaborador) => colaborador.rescisao).map(({ matricula, nome, cc, unidade }) => ({ matricula, nome, cc, unidade })),
  totalJulho: matriculasJulho.size,
  totalAgosto: matriculasAgosto.size,
} as const;

export const resumoFolhaAgosto = {
  matriz: { colaboradores: folhaAgostoDetalhe.filter((colaborador) => colaborador.unidade === "Matriz").length },
  filial: { colaboradores: folhaAgostoDetalhe.filter((colaborador) => colaborador.unidade === "Filial SP").length },
  proventosMatriz: 44858.42,
  proventosFilial: 11622.64,
  proventosTotal: 56481.06,
  baseInssMatriz: 44367.12,
  baseInssFilial: 11622.64,
  baseInssTotal: 55989.76,
  fgtsMensalMatriz: 3312.36,
  fgtsFeriasMatriz: 201.75,
  fgtsRescisorioMatriz: 171.97,
  inssSeguradosMatriz: 4225.77,
  inssSeguradosFilial: 1005.71,
  encargosPatronaisTerceirosGilratMatriz: 12112.19,
  encargosPatronaisTerceirosGilratFilial: 3172.98,
  dctfwebMatriz: 16337.96,
  dctfwebFilial: 4120.53,
  funcionarios: 16,
} as const;

if (comparacaoFolhaJulhoAgosto.entradas.length !== 1 || comparacaoFolhaJulhoAgosto.entradas[0]?.matricula !== "30357") throw new Error("Entrada da folha de agosto divergente");
if (comparacaoFolhaJulhoAgosto.saidas.length !== 0) throw new Error("Saída da folha de agosto divergente");
if (comparacaoFolhaJulhoAgosto.desligadosNaCompetencia.length !== 1 || comparacaoFolhaJulhoAgosto.desligadosNaCompetencia[0]?.matricula !== "30355") throw new Error("Rescisão da folha de agosto divergente");
if (arred(folhaAgostoDetalhe.filter((colaborador) => colaborador.unidade === "Matriz").reduce((total, colaborador) => total + colaborador.baseEncargos, 0)) !== resumoFolhaAgosto.baseInssMatriz) throw new Error("Base INSS da Matriz em agosto divergente");
if (arred(folhaAgostoDetalhe.filter((colaborador) => colaborador.unidade === "Filial SP").reduce((total, colaborador) => total + colaborador.baseEncargos, 0)) !== resumoFolhaAgosto.baseInssFilial) throw new Error("Base INSS da Filial em agosto divergente");