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

function provisaoFilial(params: {
  id: string;
  debitoCodigo: string;
  creditoCodigo: string;
  valor: number;
  historico: string;
  documento: string;
  fonte: string;
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "PROVISÕES FOLHA FILIAL 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: nomeConta(params.debitoCodigo),
    creditoCodigo: params.creditoCodigo,
    credito: nomeConta(params.creditoCodigo),
    historico: params.historico,
    documento: params.documento,
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: params.valor,
    status: "validado",
    observacao: "Valor mensal conforme relatório específico da filial; integrado ao balancete consolidado da Nitaplast sem misturar a identificação da filial.",
    rastreio: "documento",
    fonte: params.fonte,
  };
}

/**
 * Regra para os relatórios contínuos de provisão:
 * - contabilizamos a PROVISÃO DO MÊS de junho;
 * - as colunas "Ajuste" dos relatórios não são lançadas como nova despesa de junho,
 *   pois representam recomposição do saldo contínuo do sistema de folha e os saldos
 *   de abertura contábeis de 31/05 já trazem provisões reconhecidas pela contabilidade anterior;
 * - valores efetivamente marcados como "Pago"/"Diferença Pgto" são baixados da provisão
 *   e reclassificados para a obrigação corrente correspondente, sem novo efeito no resultado.
 */
const provisoesFolha: LancamentoIntegrado[] = [
  ...gerarProvisao({
    prefixo: "REC-PROV-FER", debitoCodigo: "25057", creditoCodigo: "25237", total: 4618.54,
    historico: "Provisão mensal de férias + 1/3 de junho - matriz", documento: "PROVISÃO FÉRIAS MATRIZ 06/2026", status: "validado",
    observacao: "Relatório específico: férias R$ 3.463,91 + 1/3 R$ 1.154,63 = R$ 4.618,54. Rateio por CC mantém a base da folha da matriz.",
    fonte: "PROVISÃO DE FÉRIAS - MATRIZ - 06.2026 1 (1).pdf",
  }),
  ...gerarProvisao({
    prefixo: "REC-PROV-13", debitoCodigo: "25059", creditoCodigo: "25238", total: 3451.74,
    historico: "Provisão mensal de 13º salário de junho - matriz", documento: "PROVISÃO 13º MATRIZ 06/2026", status: "validado",
    observacao: "Valor da coluna Provisão Mês do relatório contínuo do 13º da filial 1/matriz: R$ 3.451,74.",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  }),
  ...gerarProvisao({
    prefixo: "REC-ENC-FER", debitoCodigo: "25058", creditoCodigo: "25230", total: 1630.36,
    historico: "INSS + FGTS sobre provisão de férias de junho - matriz", documento: "PROVISÃO FÉRIAS MATRIZ 06/2026", status: "validado",
    observacao: "Relatório específico: INSS R$ 1.260,86 + FGTS R$ 369,50 = R$ 1.630,36.",
    fonte: "PROVISÃO DE FÉRIAS - MATRIZ - 06.2026 1 (1).pdf",
  }),
  ...gerarProvisao({
    prefixo: "REC-ENC-13", debitoCodigo: "25060", creditoCodigo: "25229", total: 1218.41,
    historico: "INSS + FGTS sobre provisão de 13º salário de junho - matriz", documento: "PROVISÃO 13º MATRIZ 06/2026", status: "validado",
    observacao: "Relatório contínuo do 13º: INSS R$ 942,25 + FGTS R$ 276,16 = R$ 1.218,41.",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  }),
  provisaoFilial({
    id: "FIL-PROV-FER-001", debitoCodigo: "25057", creditoCodigo: "25237", valor: 1064.75,
    historico: "Provisão mensal de férias + 1/3 de junho - filial SP", documento: "PROVISÃO FÉRIAS FILIAL 06/2026",
    fonte: "PROVISÃO DE FÉRIAS - FILIAL - 06.2026 1(1).pdf",
  }),
  provisaoFilial({
    id: "FIL-ENC-FER-001", debitoCodigo: "25058", creditoCodigo: "25230", valor: 370.53,
    historico: "INSS + FGTS sobre provisão de férias de junho - filial SP", documento: "PROVISÃO FÉRIAS FILIAL 06/2026",
    fonte: "PROVISÃO DE FÉRIAS - FILIAL - 06.2026 1(1).pdf",
  }),
  provisaoFilial({
    id: "FIL-PROV-13-001", debitoCodigo: "25059", creditoCodigo: "25238", valor: 798.65,
    historico: "Provisão mensal de 13º salário de junho - filial SP", documento: "PROVISÃO 13º FILIAL 06/2026",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  }),
  provisaoFilial({
    id: "FIL-ENC-13-001", debitoCodigo: "25060", creditoCodigo: "25229", valor: 277.91,
    historico: "INSS + FGTS sobre provisão de 13º salário de junho - filial SP", documento: "PROVISÃO 13º FILIAL 06/2026",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  }),
];

// Baixas/reclassificações informadas nos relatórios contínuos. Não geram nova despesa.
const baixasProvisoes: LancamentoIntegrado[] = [
  {
    id: "REC-BAIXA-FER-001", data: "30/06/2026", origem: "PROVISÃO FÉRIAS MATRIZ 06/2026",
    debitoCodigo: "25237", debito: nomeConta("25237"), creditoCodigo: "1634", credito: nomeConta("1634"),
    historico: "Baixa de férias + 1/3 marcadas como pagas no relatório contínuo", documento: "BAIXA PROV FÉRIAS 06/2026",
    cc: "304", centroCusto: "ADM GERAL", valor: 400.00, status: "validado", rastreio: "documento",
    observacao: "Relatório da matriz informa Pago: férias R$ 300,00 + 1/3 R$ 100,00. Reclassificação da provisão para a obrigação corrente, sem efeito adicional no resultado.",
    fonte: "PROVISÃO DE FÉRIAS - MATRIZ - 06.2026 1 (1).pdf",
  },
  {
    id: "REC-BAIXA-FER-FGTS-001", data: "30/06/2026", origem: "PROVISÃO FÉRIAS MATRIZ 06/2026",
    debitoCodigo: "25230", debito: nomeConta("25230"), creditoCodigo: "25228", credito: nomeConta("25228"),
    historico: "Diferença de pagamento de FGTS sobre férias", documento: "BAIXA PROV FÉRIAS FGTS 06/2026",
    cc: "304", centroCusto: "ADM GERAL", valor: 32.00, status: "validado", rastreio: "documento",
    observacao: "Diferença Pgto de FGTS de R$ 32,00 reduz a provisão e é reclassificada para FGTS a recolher.",
    fonte: "PROVISÃO DE FÉRIAS - MATRIZ - 06.2026 1 (1).pdf",
  },
  {
    id: "REC-BAIXA-13-001", data: "30/06/2026", origem: "PROVISÃO 13º MATRIZ 06/2026",
    debitoCodigo: "25238", debito: nomeConta("25238"), creditoCodigo: "1634", credito: nomeConta("1634"),
    historico: "Baixa de 13º salário marcado como pago no relatório contínuo", documento: "BAIXA PROV 13º 06/2026",
    cc: "304", centroCusto: "ADM GERAL", valor: 300.00, status: "validado", rastreio: "documento",
    observacao: "Relatório contínuo do 13º da matriz informa R$ 300,00 pagos. Reclassificação da provisão para a obrigação corrente.",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  },
  {
    id: "REC-BAIXA-13-FGTS-001", data: "30/06/2026", origem: "PROVISÃO 13º MATRIZ 06/2026",
    debitoCodigo: "25229", debito: nomeConta("25229"), creditoCodigo: "25228", credito: nomeConta("25228"),
    historico: "FGTS sobre 13º marcado como pago no relatório contínuo", documento: "BAIXA PROV 13º FGTS 06/2026",
    cc: "304", centroCusto: "ADM GERAL", valor: 24.00, status: "validado", rastreio: "documento",
    observacao: "Relatório contínuo do 13º da matriz informa FGTS pago de R$ 24,00; reclassificação para FGTS a recolher.",
    fonte: "Relatorios_Funcionarios_Provisoes_Provisao_13o_Salario_-_Continuo.pdf",
  },
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

export const conciliacaoProvisoesJunho = {
  ferias: {
    matriz: { ajusteRelatorio: 10188.53, provisaoMes: 6248.90, pago: 400.00, diferencaPagamento: 32.00 },
    filial: { ajusteRelatorio: 2305.69, provisaoMes: 1435.28, pago: 0.00 },
    criterioAjuste: "A coluna Ajuste do relatório contínuo não é reconhecida novamente como despesa de junho; comparar com os saldos de abertura herdados da contabilidade anterior.",
  },
  decimoTerceiro: {
    matriz: { ajusteRelatorio: 4643.92, principalMes: 3451.74, encargosMes: 1218.41, totalMes: 4670.15, pagoPrincipal: 300.00, pagoFgts: 24.00 },
    filial: { ajusteRelatorio: 1094.03, principalMes: 798.65, encargosMes: 277.91, totalMes: 1076.56 },
    consolidado: { principalMes: 4250.39, encargosMes: 1496.32, totalMes: 5746.71 },
    criterioAjuste: "A coluna Ajuste do relatório contínuo não é reconhecida novamente como despesa de junho; a abertura contábil já contém provisões de 31/05.",
  },
} as const;

export const pendenciasPadraoMaioJunho = [
  {
    item: "Transferências matriz/filial - CFOP 6151/2152",
    valorFiscal: 138885.12,
    motivo: "As transferências estão documentadas, mas a composição do estoque/CPV consolidado deve seguir custo contábil. Não usar o valor fiscal como CPV sem reconciliar estoque inicial, compras, créditos e estoque final da filial.",
  },
  {
    item: "Água e esgoto",
    valorFiscal: 0,
    motivo: "Maio possuía movimento recorrente, porém nenhuma fatura SANEPAR/água de junho foi localizada nas fontes atuais. Não foi criado lançamento sem documento.",
  },
] as const;

export const recorrenciasJunho: LancamentoIntegrado[] = [...provisoesFolha, ...baixasProvisoes, ...amortizacao, ...controlesIndustrializacao];

export const resumoRecorrenciasJunho = {
  provisaoFeriasMatriz: 4618.54,
  provisaoFeriasFilial: 1064.75,
  provisaoFeriasConsolidada: 5683.29,
  provisao13Matriz: 3451.74,
  provisao13Filial: 798.65,
  provisao13Consolidada: 4250.39,
  encargosFeriasMatriz: 1630.36,
  encargosFeriasFilial: 370.53,
  encargosFeriasConsolidado: 2000.89,
  encargos13Matriz: 1218.41,
  encargos13Filial: 277.91,
  encargos13Consolidado: 1496.32,
  total13MesConsolidado: 5746.71,
  baixasFerias: 432.00,
  baixas13: 324.00,
  amortizacao: 133.73,
  remessasIndustrializacao: 1003019.30,
  retornosIndustrializacao: 804272.15,
  quantidade: recorrenciasJunho.length,
  revisar: recorrenciasJunho.filter((linha) => linha.status === "revisar").length,
} as const;
