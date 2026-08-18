import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const arred = (v: number) => Math.round(v * 100) / 100;
const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

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

type ProvisaoCc = {
  unidade: "matriz" | "filial";
  cc: string;
  feriasPrincipal: number;
  feriasEncargos: number;
  decimoPrincipal: number;
  decimoEncargos: number;
};

/**
 * Valores extraídos dos relatórios contínuos de 07/2026.
 * Não são estimativas por salário/12: correspondem à linha "Provisão Mês" dos relatórios.
 * Férias principal = Férias + 1/3; encargos = INSS + FGTS. PIS = zero.
 * 13º principal = Provisão; encargos = INSS + FGTS. PIS = zero.
 */
export const provisoesJulhoReaisPorCc: ProvisaoCc[] = [
  { unidade: "matriz", cc: "201", feriasPrincipal: 2034.04, feriasEncargos: 718.03, decimoPrincipal: 1520.28, decimoEncargos: 536.66 },
  { unidade: "matriz", cc: "203", feriasPrincipal: 511.11, feriasEncargos: 180.42, decimoPrincipal: 383.33, decimoEncargos: 135.31 },
  { unidade: "matriz", cc: "206", feriasPrincipal: 510.94, feriasEncargos: 180.37, decimoPrincipal: 380.85, decimoEncargos: 134.43 },
  { unidade: "matriz", cc: "210", feriasPrincipal: 946.42, feriasEncargos: 334.09, decimoPrincipal: 705.97, decimoEncargos: 249.21 },
  { unidade: "matriz", cc: "302", feriasPrincipal: 361.11, feriasEncargos: 127.47, decimoPrincipal: 270.83, decimoEncargos: 95.60 },
  { unidade: "matriz", cc: "301", feriasPrincipal: 466.67, feriasEncargos: 164.74, decimoPrincipal: 350.00, decimoEncargos: 123.54 },
  { unidade: "matriz", cc: "304", feriasPrincipal: 200.00, feriasEncargos: 70.60, decimoPrincipal: 150.00, decimoEncargos: 52.95 },
  { unidade: "filial", cc: "502", feriasPrincipal: 1061.98, feriasEncargos: 369.57, decimoPrincipal: 796.20, decimoEncargos: 277.07 },
];

const fonteFeriasMatriz = "PROVISÃO FERIAS 07.2026(3).pdf — Filial 1 / Matriz";
const fonte13Matriz = "PROVISAO 13º SALARIO 07.2026(4).pdf — Filial 1 / Matriz";
const fonteFeriasFilial = "PROVISÃO FERIAS 07.2026(2).pdf — Filial 2 / Filial SP";
const fonte13Filial = "PROVISAO 13º SALARIO 07.2026(3).pdf — Filial 2 / Filial SP";

function lancamento(params: {
  id: string;
  origem: string;
  debitoCodigo: string;
  creditoCodigo: string;
  historico: string;
  documento: string;
  cc: string;
  valor: number;
  fonte: string;
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "31/07/2026",
    origem: params.origem,
    debitoCodigo: params.debitoCodigo,
    debito: nome(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nome(params.creditoCodigo),
    historico: params.historico,
    documento: params.documento,
    cc: params.cc,
    centroCusto: centros[params.cc] ?? "SEM CENTRO DE CUSTO",
    valor: params.valor,
    status: "validado",
    observacao: "Apropriação real da linha Provisão Mês do relatório contínuo de 07/2026. Ajuste, Pago e Diferença Pgto não são reconhecidos novamente como despesa nesta partida; permanecem em reconciliação para evitar duplicidade com saldos e baixas já contabilizados.",
    rastreio: "documento",
    fonte: params.fonte,
  };
}

export const lancamentosProvisoesJulhoReais: LancamentoIntegrado[] = provisoesJulhoReaisPorCc.flatMap((item) => {
  const unidade = item.unidade === "matriz" ? "M" : "F";
  const fonteFerias = item.unidade === "matriz" ? fonteFeriasMatriz : fonteFeriasFilial;
  const fonte13 = item.unidade === "matriz" ? fonte13Matriz : fonte13Filial;
  const centro = centros[item.cc];
  return [
    lancamento({
      id: `JUL-PROV-REAL-${unidade}-${item.cc}-FER`,
      origem: `PROVISÃO FÉRIAS REAL 07/2026 ${item.unidade.toUpperCase()}`,
      debitoCodigo: "25057",
      creditoCodigo: "25237",
      historico: `Apropriação mensal de férias + 1/3 de julho/2026 - ${centro}`,
      documento: `PROVISÃO FÉRIAS 07/2026 ${item.unidade.toUpperCase()}`,
      cc: item.cc,
      valor: item.feriasPrincipal,
      fonte: fonteFerias,
    }),
    lancamento({
      id: `JUL-PROV-REAL-${unidade}-${item.cc}-FER-ENC`,
      origem: `PROVISÃO FÉRIAS REAL 07/2026 ${item.unidade.toUpperCase()}`,
      debitoCodigo: "25058",
      creditoCodigo: "25230",
      historico: `INSS + FGTS sobre provisão mensal de férias de julho/2026 - ${centro}`,
      documento: `PROVISÃO FÉRIAS 07/2026 ${item.unidade.toUpperCase()}`,
      cc: item.cc,
      valor: item.feriasEncargos,
      fonte: fonteFerias,
    }),
    lancamento({
      id: `JUL-PROV-REAL-${unidade}-${item.cc}-13`,
      origem: `PROVISÃO 13º REAL 07/2026 ${item.unidade.toUpperCase()}`,
      debitoCodigo: "25059",
      creditoCodigo: "25238",
      historico: `Apropriação mensal de 13º salário de julho/2026 - ${centro}`,
      documento: `PROVISÃO 13º 07/2026 ${item.unidade.toUpperCase()}`,
      cc: item.cc,
      valor: item.decimoPrincipal,
      fonte: fonte13,
    }),
    lancamento({
      id: `JUL-PROV-REAL-${unidade}-${item.cc}-13-ENC`,
      origem: `PROVISÃO 13º REAL 07/2026 ${item.unidade.toUpperCase()}`,
      debitoCodigo: "25060",
      creditoCodigo: "25229",
      historico: `INSS + FGTS sobre provisão mensal de 13º de julho/2026 - ${centro}`,
      documento: `PROVISÃO 13º 07/2026 ${item.unidade.toUpperCase()}`,
      cc: item.cc,
      valor: item.decimoEncargos,
      fonte: fonte13,
    }),
  ];
});

const soma = (campo: keyof Pick<ProvisaoCc, "feriasPrincipal" | "feriasEncargos" | "decimoPrincipal" | "decimoEncargos">, unidade?: ProvisaoCc["unidade"]) =>
  arred(provisoesJulhoReaisPorCc.filter((x) => !unidade || x.unidade === unidade).reduce((total, x) => total + x[campo], 0));

export const resumoProvisoesJulhoReais = {
  fonte: "relatorios-reais-07-2026",
  metodo: "Linha Provisão Mês dos relatórios contínuos de férias e 13º, sem estimativa por salário/12.",
  matriz: {
    feriasPrincipal: soma("feriasPrincipal", "matriz"),
    feriasEncargos: soma("feriasEncargos", "matriz"),
    feriasTotal: arred(soma("feriasPrincipal", "matriz") + soma("feriasEncargos", "matriz")),
    decimoPrincipal: soma("decimoPrincipal", "matriz"),
    decimoEncargos: soma("decimoEncargos", "matriz"),
    decimoTotal: arred(soma("decimoPrincipal", "matriz") + soma("decimoEncargos", "matriz")),
    controleRelatorio: {
      ferias: { ajuste: 1987.32, pago: -14710.00, diferencaPagamento: 51.97 },
      decimoTerceiro: { ajuste: -58.06, pago: 0, diferencaPagamento: 0 },
    },
  },
  filial: {
    feriasPrincipal: soma("feriasPrincipal", "filial"),
    feriasEncargos: soma("feriasEncargos", "filial"),
    feriasTotal: arred(soma("feriasPrincipal", "filial") + soma("feriasEncargos", "filial")),
    decimoPrincipal: soma("decimoPrincipal", "filial"),
    decimoEncargos: soma("decimoEncargos", "filial"),
    decimoTotal: arred(soma("decimoPrincipal", "filial") + soma("decimoEncargos", "filial")),
    controleRelatorio: {
      ferias: { ajuste: -22.46, pago: -2414.51, diferencaPagamento: -185.30 },
      decimoTerceiro: { ajuste: -19.68, pago: 0, diferencaPagamento: 0 },
    },
  },
  consolidado: {
    feriasPrincipal: soma("feriasPrincipal"),
    feriasEncargos: soma("feriasEncargos"),
    feriasTotal: arred(soma("feriasPrincipal") + soma("feriasEncargos")),
    decimoPrincipal: soma("decimoPrincipal"),
    decimoEncargos: soma("decimoEncargos"),
    decimoTotal: arred(soma("decimoPrincipal") + soma("decimoEncargos")),
  },
} as const;

if (resumoProvisoesJulhoReais.matriz.feriasTotal !== 6806.01) throw new Error("Provisão real de férias matriz divergente");
if (resumoProvisoesJulhoReais.filial.feriasTotal !== 1431.55) throw new Error("Provisão real de férias filial divergente");
if (resumoProvisoesJulhoReais.matriz.decimoTotal !== 5088.96) throw new Error("Provisão real de 13º matriz divergente");
if (resumoProvisoesJulhoReais.filial.decimoTotal !== 1073.27) throw new Error("Provisão real de 13º filial divergente");
if (resumoProvisoesJulhoReais.consolidado.feriasPrincipal !== 6092.27) throw new Error("Principal férias consolidado divergente");
if (resumoProvisoesJulhoReais.consolidado.feriasEncargos !== 2145.29) throw new Error("Encargos férias consolidado divergente");
if (resumoProvisoesJulhoReais.consolidado.decimoPrincipal !== 4557.46) throw new Error("Principal 13º consolidado divergente");
if (resumoProvisoesJulhoReais.consolidado.decimoEncargos !== 1604.77) throw new Error("Encargos 13º consolidado divergente");
