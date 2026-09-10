import { regrasImobilizadoNitaplast } from "./nitaplast-imobilizado-regras";
import { saldosImplantacao } from "./nitaplast-implantacao";
import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { saldoAberturaAgostoPorConta } from "./nitaplast-saldos-agosto";

const arred = (valor: number) => Math.round(valor * 100) / 100;
const descricao = new Map(saldosImplantacao.map((conta) => [conta.conta, conta.descricao]));
const nome = (conta: string) => `${conta} - ${descricao.get(conta) ?? "Conta a revisar"}`;
const base = (linha: Omit<LancamentoIntegrado, "debito" | "credito" | "status" | "rastreio"> & Partial<Pick<LancamentoIntegrado, "status" | "rastreio">>): LancamentoIntegrado => ({
  ...linha,
  debito: nome(linha.debitoCodigo),
  credito: nome(linha.creditoCodigo),
  status: linha.status ?? "validado",
  rastreio: linha.rastreio ?? "documento",
});

/** Compras que compõem o custo de agosto, extraídas do relatório por CC. */
export const lancamentosComprasCpvAgosto: LancamentoIntegrado[] = [
  base({ id: "AGO-CUSTO-REV-M", data: "31/08/2026", origem: "ENTRADAS POR CC 08/2026", debitoCodigo: "3035", creditoCodigo: "1496", historico: "Compras para revenda/materiais diretos — Matriz", documento: "11.01.001 / CC 201 / 35 documentos", cc: "201", centroCusto: "VENDAS", valor: 397_328.55, observacao: "Valor bruto; créditos fiscais são contabilizados separadamente contra a mesma conta de custo.", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv" }),
  base({ id: "AGO-CUSTO-MP-NAC", data: "31/08/2026", origem: "ENTRADAS POR CC 08/2026", debitoCodigo: "3093", creditoCodigo: "25116", historico: "Matéria-prima e insumos nacionais — Matriz", documento: "11.01.003 / CC 102 / 7 documentos", cc: "102", centroCusto: "PRODUÇÃO", valor: 856_124.54, observacao: "Compra bruta rastreada no relatório por centro de custo.", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv" }),
    base({ id: "AGO-CUSTO-MP-IMP", data: "31/08/2026", origem: "ENTRADAS POR CC 08/2026", debitoCodigo: "3093", creditoCodigo: "25116", historico: "Matéria-prima e insumos de importação — NF 94222 — Greatland Valve", documento: "NF 94222 / NOP 3101 / CC 209 / 1 documento", cc: "209", centroCusto: "IMPORTAÇÃO", valor: 454_046.67, status: "revisar", observacao: "NF 94222, emitida em 18/08/2026, fornecedor Greatland Valve Company Limited, foi localizada no relatório fiscal de entradas de agosto. O valor integra a compra de matéria-prima importada; permanece em revisão até vincular o contrato de câmbio e a DI próprios. Não corresponde aos contratos BASF das NFs 93361.", fonte: "RELATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv + RESUMO NOTAS FISCAIS ENTRADA.csv" }),
  base({ id: "AGO-CUSTO-MAT-IND-M", data: "31/08/2026", origem: "ENTRADAS POR CC 08/2026", debitoCodigo: "3244", creditoCodigo: "1496", historico: "Materiais indiretos — Matriz/Produção", documento: "11.01.002 / CC 102 / 2 documentos", cc: "102", centroCusto: "PRODUÇÃO", valor: 197_800.39, observacao: "Valor bruto após exclusão dos NOPs de retorno/transferência adotada no fechamento anterior.", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv" }),
  base({ id: "AGO-CUSTO-MAT-IND-V", data: "31/08/2026", origem: "ENTRADAS POR CC 08/2026", debitoCodigo: "3244", creditoCodigo: "1496", historico: "Materiais indiretos — Vendas", documento: "11.01.002 / CC 201 / 2 documentos", cc: "201", centroCusto: "VENDAS", valor: 44_534.68, observacao: "Valor bruto após exclusão dos NOPs de retorno/transferência adotada no fechamento anterior.", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv" }),
];

export const estoqueFinalMatrizAgostoPorConta: Record<string, number> = {
  "25133": 4_566_016.57,
  "25134": 32_421.30,
  "25135": 1_038_404.65,
  "25136": 107_919.59,
  "25137": 0,
};

export const estoqueFinalMatrizAgostoTotal = 5_744_762.11;

/**
 * Fechamento contábil da filial em agosto, seguindo a mesma regra operacional do
 * padrão de julho: baixa do estoque inicial, encerramento das compras líquidas e
 * reconhecimento do estoque final documentado no inventário da filial, página 11.
 * O encerramento das compras ainda depende da conciliação fiscal da competência.
 */
const estoqueInicialFilialAgosto = saldoAberturaAgostoPorConta.get("25138") ?? 0;
const comprasFilialAgosto = saldoAberturaAgostoPorConta.get("25139") ?? 0;
export const estoqueFinalFilialAgostoTotal = 218_373.04;

export const lancamentosFechamentoEstoqueFilialAgosto: LancamentoIntegrado[] = [
  base({
    id: "AGO-CPV-F-ABERT",
    data: "31/08/2026",
    origem: "FECHAMENTO ESTOQUE FILIAL 08/2026",
    debitoCodigo: "25945",
    creditoCodigo: "25138",
    historico: "Baixa do estoque inicial da filial para apuração do CPV de agosto",
    documento: "SALDO 31/07/2026 + INVENTÁRIO FILIAL",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: Math.abs(estoqueInicialFilialAgosto),
    observacao: "Fechamento periódico do estoque da filial. O saldo anterior é transportado para agosto e serve como referência do inventário de abertura; não é lançamento de abertura gerencial nem ajuste para fechar relatório.",
    fonte: "Saldo contábil transportado 31/07/2026 + documentação do estoque da filial",
    rastreio: "derivado",
  }),
  base({
    id: "AGO-CPV-F-COMP",
    data: "31/08/2026",
    origem: "FECHAMENTO ESTOQUE FILIAL 08/2026",
    debitoCodigo: "25945",
    creditoCodigo: "25139",
    historico: "Encerramento das compras líquidas da filial no CPV de agosto",
    documento: "CFOP 1102 + CRÉDITOS 08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: Math.abs(comprasFilialAgosto),
    observacao: "No fechamento da filial, o saldo patrimonial da conta 25139 fica encerrado no CPV quando a compra líquida da competência é demonstrada pela documentação fiscal/contábil. Caso o inventário final seja refeito, este valor deve ser reavaliado na origem da documentação e não como plug de apresentação.",
    fonte: "Base patrimonial transportada + relatórios de entradas por centro de custo 08/2026",
    rastreio: "derivado",
  }),
  base({
    id: "AGO-CPV-F-FINAL",
    data: "31/08/2026",
    origem: "FECHAMENTO ESTOQUE FILIAL 08/2026",
    debitoCodigo: "25138",
    creditoCodigo: "25945",
    historico: "Reconhecimento do estoque físico final da filial em 31/08",
    documento: "INVENTÁRIO FILIAL 31/08/2026",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: estoqueFinalFilialAgostoTotal,
    observacao: `Inventário com data de referência 31/08/2026, emitido em 04/09/2026 às 14:33, página 11: produto acabado, 5.051 peças, 22.195,379 kg e total de R$ 218.373,04. Correção documental do lançamento AGO-CPV-F-FINAL, preservado com o mesmo ID: o valor anterior de R$ ${arred(Math.abs(estoqueInicialFilialAgosto + comprasFilialAgosto)).toFixed(2)} era calculado pela soma dos saldos transportados, sem inventário final. A correção não valida o encerramento das compras da competência.`,
    fonte: "C:/082026/FILIAL - AGO 26/REGISTRO INVENTARIO ESTOQUE.pdf — página 11, total geral e resumo PA, referência 31/08/2026",
    rastreio: "documento",
  }),
].filter((linha) => Math.abs(linha.valor) > 0.005);

export const lancamentosFechamentoEstoqueAgosto: LancamentoIntegrado[] = Object.entries(estoqueFinalMatrizAgostoPorConta).flatMap(([conta, saldoFinal], indice) => {
  const saldoAnterior = saldoAberturaAgostoPorConta.get(conta) ?? 0;
  const linhas: LancamentoIntegrado[] = [];
  if (Math.abs(saldoAnterior) >= 0.005) linhas.push(base({ id: `AGO-CPV-BAIXA-${indice + 1}`, data: "31/08/2026", origem: "FECHAMENTO ESTOQUE MATRIZ 08/2026", debitoCodigo: "25944", creditoCodigo: conta, historico: `Baixa integral do estoque anterior da conta ${conta}`, documento: "INVENTÁRIO 31/08/2026", cc: "102", centroCusto: "PRODUÇÃO", valor: Math.abs(saldoAnterior), observacao: "Fechamento periódico: baixa do saldo patrimonial anterior antes do reconhecimento do inventário físico final.", fonte: "Saldo contábil fechado em 31/07/2026 + REGISTRO INVENTARIO ESTOQUE 31/08/2026.pdf", rastreio: "derivado" }));
  if (saldoFinal > 0.005) linhas.push(base({ id: `AGO-CPV-FINAL-${indice + 1}`, data: "31/08/2026", origem: "FECHAMENTO ESTOQUE MATRIZ 08/2026", debitoCodigo: conta, creditoCodigo: "25944", historico: `Reconhecimento do inventário físico final da conta ${conta}`, documento: "INVENTÁRIO 31/08/2026", cc: "102", centroCusto: "PRODUÇÃO", valor: saldoFinal, observacao: "Saldo final documentado; permanece no ativo e não é lançamento de encaixe.", fonte: "REGISTRO INVENTARIO ESTOQUE 31/08/2026.pdf", rastreio: "documento" }));
  return linhas;
});

export const lancamentosImobilizadoAgosto: LancamentoIntegrado[] = [
  base({ id: "AGO-IMOB-JEEP", data: "18/08/2026", origem: "AQUISIÇÃO IMOBILIZADO 08/2026", debitoCodigo: "1089", creditoCodigo: "1496", historico: "Aquisição Jeep Commander Overland 2.2 Diesel", documento: "NF 2821198 / série 25", cc: "448", centroCusto: "JEEP COMMANDER OVERLAND", valor: 268_062.08, observacao: "Ativo adquirido em 18/08. Não foi criada cota adicional sem ficha patrimonial, taxa e confirmação da data disponível para uso.", fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv" }),
];

const mensalAgostoPorGrupo: Record<string, number> = {
  // R$ 26.745,98 históricos menos R$ 816,80/mês do transformador baixado em 14/07.
  maquinas: 25_929.18,
  // Referência já exclui Mini Cooper (R$ 3.298,33) e Corolla (R$ 2.166,03),
  // baixados respectivamente em 03/07 e 08/07.
  veiculos: 14_298.16,
};

const saldoAposBaixasJulho = (conta: string) => saldoAberturaAgostoPorConta.get(conta) ?? 0;

/** Depreciação de agosto calculada sobre a posição patrimonial após as baixas de julho. */
export const lancamentosDepreciacaoAgosto: LancamentoIntegrado[] = regrasImobilizadoNitaplast.flatMap((regra, indice) => {
  if (regra.naoDepreciavel || !regra.valorMensalReferencia || !regra.contaDespesa || !regra.contaDepreciacaoAcumulada) return [];
  const mensal = mensalAgostoPorGrupo[regra.id] ?? regra.valorMensalReferencia;
  const bruto = regra.contasAtivo.reduce((soma, conta) => soma + Math.max(0, saldoAposBaixasJulho(conta)), 0);
  const acumulada = Math.max(0, -saldoAposBaixasJulho(regra.contaDepreciacaoAcumulada));
  const residual = arred(Math.max(0, bruto - acumulada));
  const valor = arred(Math.min(mensal, residual));
  if (valor <= 0) return [];
  return [base({
    id: `AGO-DEP-${String(indice + 1).padStart(2, "0")}`,
    data: "31/08/2026",
    origem: "DEPRECIAÇÃO IMOBILIZADO 08/2026",
    debitoCodigo: regra.contaDespesa,
    creditoCodigo: regra.contaDepreciacaoAcumulada,
    historico: `Depreciação mensal — ${regra.nome}`,
    documento: "MEMÓRIA DE CÁLCULO DEP 08/2026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor,
    observacao: regra.id === "maquinas"
      ? "Cota mensal ajustada pela baixa do transformador em julho: R$ 26.745,98 - R$ 816,80 = R$ 25.929,18."
      : regra.id === "veiculos"
        ? "Cota mensal já ajustada para excluir Mini Cooper e Corolla, baixados em julho. Jeep adquirido em agosto não recebeu cota sem ficha e data disponível para uso."
        : "Cota mensal histórica limitada ao saldo residual após os movimentos e baixas de julho.",
    fonte: "Baixas documentadas 07/2026 + posição contábil em 31/07/2026 + recorrência mensal histórica",
    rastreio: "derivado",
  })];
});

export const lancamentosAmortizacaoAgosto: LancamentoIntegrado[] = [];

export const validacaoDepreciacaoMaio = {
  fonteDisponivel: "BALANCETE POR CENTRO DE CUSTOS 05.2026 - NITAPLAST / Domínio",
  razaoDisponivel: false,
  depreciacaoMovimentoMaio: 53_782.84,
  amortizacaoMovimentoMaio: 133.73,
  decisaoAgosto: "Calcular depreciação após as baixas documentadas de julho; manter amortização sem lançamento",
} as const;

export const resumoCpvDepreciacaoAgosto = {
  inventarioFinal: estoqueFinalMatrizAgostoTotal,
  comprasBrutasCpv: arred(lancamentosComprasCpvAgosto.reduce((s, linha) => s + linha.valor, 0)),
  variacaoEstoque: arred(lancamentosFechamentoEstoqueAgosto.reduce((s, linha) => s + (linha.debitoCodigo === "25944" ? linha.valor : -linha.valor), 0)),
  depreciacao: arred(lancamentosDepreciacaoAgosto.reduce((s, linha) => s + linha.valor, 0)),
  amortizacao: arred(lancamentosAmortizacaoAgosto.reduce((s, linha) => s + linha.valor, 0)),
} as const;
