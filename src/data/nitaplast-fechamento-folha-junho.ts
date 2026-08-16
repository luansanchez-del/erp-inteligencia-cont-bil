import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const TOTAL_FOLHA = 72685.80;
const TOTAL_REMUNERACAO = 52981.27;
const TOTAL_INSS_EMPRESA = 13947.33;
const TOTAL_FGTS = 4204.47;
const BENEFICIOS_PATRONAIS_PENDENTES = 1552.73;

const OBRIGACOES = {
  liquidoSalarios: 22476.15,
  inssEmpregado: 4778.19,
  inssEmpresa: TOTAL_INSS_EMPRESA,
  fgts: TOTAL_FGTS,
  adiantamentos: 13444.00,
  creditoTrabalhador: 1229.26,
  outrasObrigacoes: 11053.67,
} as const;

const nomesCc: Record<string, string> = {
  "201": "VENDAS",
  "203": "FATURAMENTO",
  "206": "EXPORTAÇÃO",
  "210": "MARKETING",
  "301": "RECEPÇÃO",
  "302": "FINANCEIRO",
  "304": "ADM GERAL",
  "502": "COMERCIAL SP",
};

/**
 * Custo total por CC conforme Folha Abr x Jun / relatório de rateio de junho.
 * Cada total já contém remuneração + INSS empresa + FGTS + demais custos patronais.
 */
const custoPorCc = [
  { cc: "201", custo: 20254.92, inss: 4082.61, fgts: 1196.37 },
  { cc: "203", custo: 6223.80, inss: 1255.80, fgts: 368.00 },
  { cc: "206", custo: 5603.38, inss: 1130.61, fgts: 331.31 },
  { cc: "210", custo: 11688.00, inss: 2358.34, fgts: 691.08 },
  { cc: "301", custo: 2975.64, inss: 599.86, fgts: 175.78 },
  { cc: "302", custo: 4381.61, inss: 875.16, fgts: 256.45 },
  { cc: "304", custo: 8877.94, inss: 1124.76, fgts: 433.18 },
  { cc: "502", custo: 12680.51, inss: 2520.19, fgts: 752.30 },
] as const;

const arred = (valor: number) => Math.round(valor * 100) / 100;

function nomeConta(codigo: string) {
  const nomes: Record<string, string> = {
    "4014": "Salários e Ordenados",
    "4020": "INSS",
    "4021": "FGTS",
    "4031": "Benefícios Concedidos",
    "1634": "Salários e Ordenados a Pagar",
    "25227": "INSS a Recolher",
    "25228": "FGTS a Recolher",
    "312": "Adiantamentos de Salários",
    "25231": "Emprest Crédito Trabalhador",
    "25020": "Provisões para Custos",
  };
  return `${codigo} - ${nomes[codigo] ?? "Conta a revisar"}`;
}

function lancamento(params: {
  id: string;
  debitoCodigo: string;
  creditoCodigo: string;
  valor: number;
  historico: string;
  cc?: string;
  observacao: string;
  rastreio?: LancamentoIntegrado["rastreio"];
}): LancamentoIntegrado {
  const cc = params.cc ?? "0";
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "FECHAMENTO FOLHA OFICIAL 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: "FOLHA 06/2026",
    cc,
    centroCusto: nomesCc[cc] ?? "SEM CENTRO DE CUSTO",
    valor: arred(params.valor),
    status: "validado",
    observacao: params.observacao,
    rastreio: params.rastreio ?? "documento",
    fonte: "EXTRATO FOLHA MENSAL 06.2026 + Folha Abr x Jun + Lançamentos Ajustes",
  };
}

/**
 * Reconstrói somente a folha de junho, substituindo a montagem anterior por uma
 * apropriação que fecha exatamente com o relatório de custo por centro de custo.
 *
 * Método:
 * 1. reconhece remuneração/encargos por CC contra 25020;
 * 2. reclassifica de 25020 para as obrigações comprovadas;
 * 3. mantém em 25020 apenas R$ 12.606,40 ainda sem abertura analítica completa
 *    (R$ 11.053,67 de descontos/obrigações + R$ 1.552,73 de benefícios patronais).
 *
 * Assim o Razão fecha, o Balancete mostra a pendência real e a DRE recebe o custo
 * correto sem duplicar INSS/FGTS nem reaproveitar o rateio parcial anterior.
 */
export function aplicarFechamentoFolhaJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const semFolhaAntiga = base.filter((linha) => !linha.id.startsWith("FOL-"));
  const novos: LancamentoIntegrado[] = [];

  let totalRemuneracao = 0;
  let totalInss = 0;
  let totalFgts = 0;

  for (const item of custoPorCc) {
    let remuneracao = arred(item.custo - item.inss - item.fgts);

    // Os R$ 1.552,73 são benefícios/custos patronais ainda sem natureza analítica.
    // Para não inflar Salários, segregamos o total no CC 304 em Benefícios Concedidos.
    if (item.cc === "304") remuneracao = arred(remuneracao - BENEFICIOS_PATRONAIS_PENDENTES);

    novos.push(lancamento({
      id: `FOL-OFICIAL-REM-${item.cc}`,
      debitoCodigo: "4014",
      creditoCodigo: "25020",
      valor: remuneracao,
      cc: item.cc,
      historico: `Remuneração de junho apropriada pelo custo final do CC ${item.cc} - ${nomesCc[item.cc]}`,
      observacao: "Remuneração reconciliada ao custo por funcionário/CC do relatório de junho; substitui o rateio parcial anteriormente usado.",
    }));
    totalRemuneracao = arred(totalRemuneracao + remuneracao);

    novos.push(lancamento({
      id: `FOL-OFICIAL-INSS-${item.cc}`,
      debitoCodigo: "4020",
      creditoCodigo: "25020",
      valor: item.inss,
      cc: item.cc,
      historico: `INSS patronal de junho - CC ${item.cc} - ${nomesCc[item.cc]}`,
      observacao: "INSS empresa conforme custo individual da folha de junho; não duplicar com qualquer rateio anterior.",
    }));
    totalInss = arred(totalInss + item.inss);

    novos.push(lancamento({
      id: `FOL-OFICIAL-FGTS-${item.cc}`,
      debitoCodigo: "4021",
      creditoCodigo: "25020",
      valor: item.fgts,
      cc: item.cc,
      historico: `FGTS de junho - CC ${item.cc} - ${nomesCc[item.cc]}`,
      observacao: "FGTS conforme custo individual da folha de junho; não duplicar com lançamento anterior.",
    }));
    totalFgts = arred(totalFgts + item.fgts);
  }

  novos.push(lancamento({
    id: "FOL-OFICIAL-BEN-304",
    debitoCodigo: "4031",
    creditoCodigo: "25020",
    valor: BENEFICIOS_PATRONAIS_PENDENTES,
    cc: "304",
    historico: "Outros custos patronais/benefícios de junho ainda a abrir analiticamente",
    observacao: "Valor identificado na memória da folha como outros custos patronais/benefícios a identificar. Mantido segregado e rastreável.",
    rastreio: "derivado",
  }));

  // A 25020 funciona como conta-ponte da apropriação. Reclassificamos tudo que
  // já possui obrigação conhecida, mantendo nela apenas a parcela ainda a abrir.
  const reclassificacoesObrigacoes = [
    { id: "SAL", conta: "1634", valor: OBRIGACOES.liquidoSalarios, historico: "Líquido da folha a pagar" },
    { id: "INSS", conta: "25227", valor: arred(OBRIGACOES.inssEmpregado + OBRIGACOES.inssEmpresa), historico: "INSS empregado + empresa a recolher" },
    { id: "FGTS", conta: "25228", valor: OBRIGACOES.fgts, historico: "FGTS a recolher" },
    { id: "ADIANT", conta: "312", valor: OBRIGACOES.adiantamentos, historico: "Baixa dos adiantamentos salariais descontados na folha" },
    { id: "CREDTRAB", conta: "25231", valor: OBRIGACOES.creditoTrabalhador, historico: "Crédito do Trabalhador descontado em folha" },
  ] as const;

  for (const item of reclassificacoesObrigacoes) {
    novos.push(lancamento({
      id: `FOL-OFICIAL-OBR-${item.id}`,
      debitoCodigo: "25020",
      creditoCodigo: item.conta,
      valor: item.valor,
      historico: item.historico,
      observacao: "Reclassificação da conta-ponte da folha para obrigação/ativo comprovado pela memória de junho.",
    }));
  }

  const totalCusto = arred(custoPorCc.reduce((total, item) => total + item.custo, 0));
  const saldoPendente25020 = arred(
    TOTAL_FOLHA
    - OBRIGACOES.liquidoSalarios
    - OBRIGACOES.inssEmpregado
    - OBRIGACOES.inssEmpresa
    - OBRIGACOES.fgts
    - OBRIGACOES.adiantamentos
    - OBRIGACOES.creditoTrabalhador,
  );

  if (Math.abs(totalCusto - TOTAL_FOLHA) > 0.01) throw new Error(`Folha por CC não fecha: ${totalCusto.toFixed(2)}`);
  if (Math.abs(totalRemuneracao - TOTAL_REMUNERACAO) > 0.01) throw new Error(`Remuneração da folha não fecha: ${totalRemuneracao.toFixed(2)}`);
  if (Math.abs(totalInss - TOTAL_INSS_EMPRESA) > 0.01) throw new Error(`INSS empresa não fecha: ${totalInss.toFixed(2)}`);
  if (Math.abs(totalFgts - TOTAL_FGTS) > 0.01) throw new Error(`FGTS não fecha: ${totalFgts.toFixed(2)}`);
  if (Math.abs(saldoPendente25020 - arred(OBRIGACOES.outrasObrigacoes + BENEFICIOS_PATRONAIS_PENDENTES)) > 0.01) {
    throw new Error(`Saldo pendente da folha na 25020 não fecha: ${saldoPendente25020.toFixed(2)}`);
  }

  return [...semFolhaAntiga, ...novos];
}

export const fechamentoFolhaJunho = {
  total: TOTAL_FOLHA,
  remuneracao: TOTAL_REMUNERACAO,
  inssEmpresa: TOTAL_INSS_EMPRESA,
  fgts: TOTAL_FGTS,
  beneficiosPatronaisPendentes: BENEFICIOS_PATRONAIS_PENDENTES,
  saldoPendente25020: arred(OBRIGACOES.outrasObrigacoes + BENEFICIOS_PATRONAIS_PENDENTES),
  custoPorCc,
} as const;
