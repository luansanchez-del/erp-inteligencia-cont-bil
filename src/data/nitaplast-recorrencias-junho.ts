import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-integrado";

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

const basesCc = [
  ["301", "RECEPÇÃO", 2200.00],
  ["206", "EXPORTAÇÃO", 4141.46],
  ["201", "VENDAS", 14975.94],
  ["210", "MARKETING", 8638.58],
  ["203", "FATURAMENTO", 4600.00],
  ["304", "ADM GERAL", 5720.00],
  ["302", "FINANCEIRO", 3250.00],
] as const;

const totalBaseCc = basesCc.reduce((total, [, , valor]) => total + valor, 0);

function ratear(total: number) {
  let acumulado = 0;
  return basesCc.map(([cc, descricao, base], index) => {
    const valor = index === basesCc.length - 1
      ? Math.round((total - acumulado) * 100) / 100
      : Math.round((total * base / totalBaseCc) * 100) / 100;
    acumulado += valor;
    return { cc, descricao, valor };
  });
}

function gerarProvisao(params: {
  prefixo: string;
  debitoCodigo: string;
  creditoCodigo: string;
  total: number;
  historico: string;
  documento: string;
  status: "validado" | "revisar";
  observacao: string;
  fonte: string;
}): LancamentoIntegrado[] {
  return ratear(params.total).map(({ cc, descricao, valor }, index) => ({
    id: `${params.prefixo}-${String(index + 1).padStart(2, "0")}`,
    data: "30/06/2026",
    origem: "RECORRÊNCIAS / FOLHA 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: `${params.historico} - ${descricao}`,
    documento: params.documento,
    cc,
    centroCusto: descricao,
    valor,
    status: params.status,
    observacao: params.observacao,
    rastreio: "derivado",
    fonte: params.fonte,
  }));
}

const provisoesFolha: LancamentoIntegrado[] = [
  ...gerarProvisao({
    prefixo: "REC-PROV-FER", debitoCodigo: "25057", creditoCodigo: "25237", total: 4530.99,
    historico: "Provisão mensal de férias de junho", documento: "FOLHA PROVISÃO FÉRIAS 06/2026", status: "validado",
    observacao: "Total extraído da folha mensal de junho; rateio por CC segue a mesma base de salários já integrada no fechamento.",
    fonte: "EXTRATO FOLHA MENSAL - 06.2026 - MATRIZ(4).pdf",
  }),
  ...gerarProvisao({
    prefixo: "REC-PROV-13", debitoCodigo: "25059", creditoCodigo: "25238", total: 3389.28,
    historico: "Provisão mensal de 13º salário de junho", documento: "FOLHA PROVISÃO 13 06/2026", status: "validado",
    observacao: "Total extraído da folha mensal de junho; rateio por CC segue a mesma base de salários já integrada no fechamento.",
    fonte: "EXTRATO FOLHA MENSAL - 06.2026 - MATRIZ(4).pdf",
  }),
  ...gerarProvisao({
    prefixo: "REC-ENC-FER", debitoCodigo: "25058", creditoCodigo: "25230", total: 1575.08,
    historico: "Encargos sobre provisão de férias de junho", documento: "ENC PROV FÉRIAS 06/2026", status: "revisar",
    observacao: "Estimativa pela mesma relação contábil usada pela contabilidade anterior em maio (R$ 2.122,10 / R$ 6.104,60). Confirmar contra resumo/DCTFWeb antes da exportação definitiva.",
    fonte: "Balancete 05/2026 da contabilidade anterior + folha atual 06/2026",
  }),
  ...gerarProvisao({
    prefixo: "REC-ENC-13", debitoCodigo: "25060", creditoCodigo: "25229", total: 1196.40,
    historico: "Encargos sobre provisão de 13º salário de junho", documento: "ENC PROV 13 06/2026", status: "revisar",
    observacao: "Estimativa pela mesma relação contábil usada pela contabilidade anterior em maio (R$ 1.597,94 / R$ 4.526,81). Confirmar contra resumo/DCTFWeb antes da exportação definitiva.",
    fonte: "Balancete 05/2026 da contabilidade anterior + folha atual 06/2026",
  }),
];

const amortizacao: LancamentoIntegrado[] = [
  {
    id: "REC-AMORT-01", data: "30/06/2026", origem: "PADRÃO DO BALANCETE/RAZÃO 05/2026",
    debitoCodigo: "25085", debito: nomeConta("25085"), creditoCodigo: "1166", credito: nomeConta("1166"),
    historico: "Amortização de marcas e patentes - VENDAS", documento: "AMORT 06/2026", cc: "201", centroCusto: "VENDAS", valor: 100.06,
    status: "revisar", observacao: "Recorrência reproduzida do padrão mensal de maio; confirmar relatório de amortização de junho.", rastreio: "derivado",
    fonte: "BALANCETE POR CENTRO DE CUSTOS 05.2026 - NITAPLAST",
  },
  {
    id: "REC-AMORT-02", data: "30/06/2026", origem: "PADRÃO DO BALANCETE/RAZÃO 05/2026",
    debitoCodigo: "25085", debito: nomeConta("25085"), creditoCodigo: "1166", credito: nomeConta("1166"),
    historico: "Amortização de marcas e patentes - ADM GERAL", documento: "AMORT 06/2026", cc: "304", centroCusto: "ADM GERAL", valor: 33.67,
    status: "revisar", observacao: "Recorrência reproduzida do padrão mensal de maio; confirmar relatório de amortização de junho.", rastreio: "derivado",
    fonte: "BALANCETE POR CENTRO DE CUSTOS 05.2026 - NITAPLAST",
  },
];

// Maio movimentava as remessas/retornos de industrialização também em contas compensatórias.
// Junho possui R$ 1.003.019,30 em saídas CFOP 5901 e R$ 804.272,15 em retornos CFOP 1902.
const controlesIndustrializacao: LancamentoIntegrado[] = [
  {
    id: "CTRL-IND-REM-06", data: "30/06/2026", origem: "CONTROLE FISCAL INDUSTRIALIZAÇÃO 06/2026",
    debitoCodigo: "25205", debito: nomeConta("25205"), creditoCodigo: "25242", credito: nomeConta("25242"),
    historico: "Remessas para industrialização em terceiros - CFOP 5901", documento: "CFOP 5901 06/2026", cc: "102", centroCusto: "PRODUÇÃO",
    valor: 1003019.30, status: "validado", observacao: "Movimento compensatório sem efeito no resultado; segue o tratamento observado no balancete de maio.", rastreio: "derivado",
    fonte: "SAIDAS - NITAPLAST(3).xlsx - CFOP/Natureza 5901",
  },
  {
    id: "CTRL-IND-RET-06", data: "30/06/2026", origem: "CONTROLE FISCAL INDUSTRIALIZAÇÃO 06/2026",
    debitoCodigo: "25242", debito: nomeConta("25242"), creditoCodigo: "25205", credito: nomeConta("25205"),
    historico: "Retornos de industrialização em terceiros - CFOP 1902", documento: "CFOP 1902 06/2026", cc: "102", centroCusto: "PRODUÇÃO",
    valor: 804272.15, status: "validado", observacao: "Baixa do controle compensatório das remessas; sem efeito no resultado.", rastreio: "derivado",
    fonte: "ENTRADAS - NITAPLAST(3).xlsx / relação de documentos - CFOP 1902",
  },
];

export const pendenciasPadraoMaioJunho = [
  {
    item: "Transferências matriz/filial - CFOP 6151",
    valorFiscal: 138885.12,
    motivo: "O documento fiscal existe, mas a reclassificação de estoque deve ser pelo custo. Não usar o valor fiscal como custo sem suporte.",
  },
  {
    item: "Água e esgoto",
    valorFiscal: 0,
    motivo: "Maio possuía movimento recorrente, porém nenhuma fatura SANEPAR/água de junho foi localizada nas fontes atuais. Não foi criado lançamento sem documento.",
  },
] as const;

export const recorrenciasJunho: LancamentoIntegrado[] = [...provisoesFolha, ...amortizacao, ...controlesIndustrializacao];

export const resumoRecorrenciasJunho = {
  provisaoFerias: 4530.99,
  provisao13: 3389.28,
  encargosFerias: 1575.08,
  encargos13: 1196.40,
  amortizacao: 133.73,
  remessasIndustrializacao: 1003019.30,
  retornosIndustrializacao: 804272.15,
  quantidade: recorrenciasJunho.length,
  revisar: recorrenciasJunho.filter((linha) => linha.status === "revisar").length,
} as const;
