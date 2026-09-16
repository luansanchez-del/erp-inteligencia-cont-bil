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
  // Compras de mercadoria para revenda da Filial SP em agosto, CFOP 1102, extraídas de
  // RESUMO NOTAS FISCAIS ENTRADA.csv (C:/082026/FILIAL - AGO 26). Mesmo tratamento aplicado
  // em julho (nitaplast-razao-julho-final-base.ts): só CFOP 1102 compõe compra nova; CFOP
  // 2152 é transferência interna Matriz → Filial e não é tratado como aquisição de terceiro.
  base({ id: "AGO-CUSTO-REV-F-01", data: "10/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - ROCHLING PLASTICOS DE ENGENHARIA DO B", documento: "NF 16636 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 6_008.13, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
  base({ id: "AGO-CUSTO-REV-F-02", data: "13/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - ATHOS METAIS LTDA", documento: "NF 11912 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 3_500, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
  base({ id: "AGO-CUSTO-REV-F-03", data: "17/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - POLYROOF BRASIL LTDA", documento: "NF 1822 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 1_004.34, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
  base({ id: "AGO-CUSTO-REV-F-04", data: "26/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - POLIFLUOR IND COM PLASTICOS LTDA", documento: "NF 89863 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 14_804.74, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
  base({ id: "AGO-CUSTO-REV-F-05", data: "26/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - POLIFLUOR IND COM PLASTICOS LTDA", documento: "NF 89903 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 2_751.96, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
  base({ id: "AGO-CUSTO-REV-F-06", data: "26/08/2026", origem: "ENTRADAS FILIAL 08/2026", debitoCodigo: "25139", creditoCodigo: "1496", historico: "Compra filial - LUCC INDUSTRIA E COMERCIO DE PLASTICO", documento: "NF 54039 série 1 / CFOP 1102", cc: "201", centroCusto: "VENDAS", valor: 3_450, observacao: "Valor bruto; créditos de ICMS/IPI contabilizados separadamente contra a mesma conta de custo.", fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26" }),
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
 * padrão de julho: baixa do estoque inicial, encerramento das compras líquidas
 * DA PRÓPRIA COMPETÊNCIA e reconhecimento do estoque final documentado no
 * inventário da filial, página 11.
 *
 * Achado em 15/09/2026 (CPV Filial maior que a receita da Filial): a conta 25139
 * carrega um saldo patrimonial acumulado de competências anteriores (R$ 420.540,54
 * na abertura de agosto). Julho já enfrentou o mesmo saldo e decidiu, documentado
 * em nitaplast-razao-julho-final-base.ts (JUL-CPV-F-COMP): fechar no CPV só o
 * MOVIMENTO da própria competência, mantendo o saldo anterior patrimonial "até
 * conciliação, sem contaminar o resultado". Um lançamento anterior aqui
 * (AGO-CPV-F-COMP) quebrava essa regra ao fechar o saldo de abertura inteiro
 * (que é exatamente esse mesmo saldo legado, nunca reconciliado) no CPV de
 * agosto — foi removido. Só AGO-CPV-F-COMP-DOC (compras de agosto,
 * documentadas) fecha no CPV; o saldo acumulado continua patrimonial na 25139,
 * pendente de conciliação, como julho já decidiu.
 */
const estoqueInicialFilialAgosto = saldoAberturaAgostoPorConta.get("25138") ?? 0;
export const estoqueFinalFilialAgostoTotal = 218_373.04;

/** Compras de mercadoria para revenda da Filial SP documentadas na própria competência de agosto (CFOP 1102) — a única parcela que fecha no CPV de agosto (ver nota acima sobre o saldo acumulado de competências anteriores). */
const comprasFilialDocumentadasAgosto = arred(
  lancamentosComprasCpvAgosto
    .filter((linha) => linha.id.startsWith("AGO-CUSTO-REV-F-"))
    .reduce((total, linha) => total + linha.valor, 0),
);

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
    id: "AGO-CPV-F-COMP-DOC",
    data: "31/08/2026",
    origem: "FECHAMENTO ESTOQUE FILIAL 08/2026",
    debitoCodigo: "25945",
    creditoCodigo: "25139",
    historico: "Encerramento das compras documentadas de agosto da filial no CPV",
    documento: "CFOP 1102 08/2026 / 6 documentos",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: comprasFilialDocumentadasAgosto,
    observacao: "Compras líquidas da própria competência de agosto, documentadas por 6 NFs de CFOP 1102 (AGO-CUSTO-REV-F-01 a 06): R$ 31.519,17. Único encerramento de compras no CPV de agosto — o saldo acumulado de competências anteriores (R$ 420.540,54 na abertura) permanece patrimonial na 25139, pendente de conciliação, mesmo critério de julho (JUL-CPV-F-COMP).",
    fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv — FILIAL AGO 26",
  }),
  // Transferências internas Matriz↔Filial de agosto (achado em 16/09/2026, ao
  // investigar CPV Filial > receita Filial): a fórmula estoque inicial +
  // compras − estoque final atribuía a queda física do estoque inteiramente a
  // vendas, mas parte dela é mercadoria que só mudou de estabelecimento, sem
  // venda a terceiro. Ambas as pontas conferidas nos CSVs de entrada/saída dos
  // dois estabelecimentos (mesmos valores nos dois lados, nenhuma nota
  // cancelada). Contrapartida em 4859 (conta transitória) — não existe conta
  // patrimonial dedicada de "transferência de mercadoria entre
  // estabelecimentos" no plano de contas; mesmo critério já usado no projeto
  // para valores sem conta real confirmada.
  base({
    id: "AGO-CPV-F-TRANSF-RECEBIDA",
    data: "31/08/2026",
    origem: "TRANSFERÊNCIA INTERNA 08/2026",
    debitoCodigo: "25945",
    creditoCodigo: "4859",
    // Historico/documento evitam citar o outro estabelecimento: mencionar "Matriz" +
    // "transferência" aqui aciona a heurística de estabelecimentoLancamentoNitaplast que
    // classifica como "Matriz ↔ Filial" (compartilhado) — mas este lançamento ajusta só o
    // CPV da própria Filial (cc 502), não deve ficar fora do card/análise por estabelecimento.
    historico: "Mercadoria recebida por transferência interna entre estabelecimentos (NOP 2152, 33 documentos)",
    documento: "33 documentos NOP 2152",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 119_957.34,
    status: "revisar",
    observacao: "Entra no CPV como se fosse compra (mercadoria disponível para revenda recebida da Matriz por transferência interna, que não veio de terceiro nem está mais em estoque físico). Fecha o mesmo fato cujo ICMS está em AGO-TAX-ICMS-TRANSF-F. Contrapartida em 4859 até identificar a conta patrimonial definitiva de transferência entre estabelecimentos.",
    fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv (Filial SP)",
  }),
  base({
    id: "AGO-CPV-F-TRANSF-ENVIADA",
    data: "31/08/2026",
    origem: "TRANSFERÊNCIA INTERNA 08/2026",
    debitoCodigo: "4859",
    creditoCodigo: "25945",
    // Mesmo motivo do lançamento acima: historico/documento sem citar o outro
    // estabelecimento, para não cair na classificação "Matriz ↔ Filial".
    historico: "Mercadoria enviada por transferência interna entre estabelecimentos (NOP 6151, 6 documentos)",
    documento: "NF 8851, 8856, 8869, 8907, 8922, 8881 / NOP 6151",
    cc: "502",
    centroCusto: "COMERCIAL SP",
    valor: 353_394.77,
    status: "revisar",
    observacao: "Sai do CPV (mercadoria que deixou o estoque físico da Filial sem ser vendida a terceiro — foi para a Matriz por transferência interna). NF 8907 (R$ 341.248,73) tem 'SEM VALOR COMERCIAL' na condição de pagamento, confirmando natureza de transferência. Fecha o mesmo fato cujo ICMS está em AGO-TAX-ICMS-TRANSF (Filial → Matriz). Contrapartida em 4859 até identificar a conta patrimonial definitiva de transferência entre estabelecimentos.",
    fonte: "RESUMO NOTAS FISCAIS SAIDA.csv (Filial SP), conferido contra o CSV de entradas do outro estabelecimento",
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
    observacao: "Inventário com data de referência 31/08/2026, emitido em 04/09/2026 às 14:33, página 11: produto acabado, 5.051 peças, 22.195,379 kg e total de R$ 218.373,04. Correção documental do lançamento AGO-CPV-F-FINAL, preservado com o mesmo ID: o valor anterior de R$ 997.936,86 era calculado pela soma dos saldos transportados (estoque inicial + saldo acumulado da 25139), sem inventário final. A correção não valida o encerramento das compras da competência.",
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

/**
 * Contrapartida na Matriz das duas transferências internas Matriz↔Filial de
 * agosto (ver lancamentosFechamentoEstoqueFilialAgosto, AGO-CPV-F-TRANSF-*).
 * Achado em 16/09/2026: só o lado da Filial tinha sido lançado — a Matriz
 * nunca reconheceu ter recebido mercadoria da Filial nem ter enviado
 * mercadoria para a Filial. Mesma lógica da Filial, espelhada: mercadoria
 * recebida entra no CPV (como compra); mercadoria enviada sai do CPV (não foi
 * vendida a terceiro). Contrapartida em 4859 (conta transitória) — as duas
 * pontas juntas (Filial + Matriz) zeram a 4859 nessas transferências, como
 * esperado de uma conta de passagem entre estabelecimentos.
 */
export const lancamentosTransferenciaInternaMatrizAgosto: LancamentoIntegrado[] = [
  base({
    id: "AGO-CPV-M-TRANSF-RECEBIDA",
    data: "31/08/2026",
    origem: "TRANSFERÊNCIA INTERNA 08/2026",
    debitoCodigo: "25944",
    creditoCodigo: "4859",
    historico: "Mercadoria recebida por transferência interna entre estabelecimentos (NOP 2151/2152, 6 documentos)",
    documento: "NF 8851, 8856, 8869, 8907, 8922, 8881 / NOP 2151-2152",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 353_394.77,
    status: "revisar",
    observacao: "Entra no CPV da Matriz como se fosse compra (mercadoria recebida por transferência interna, que não veio de terceiro). Contrapartida de AGO-CPV-F-TRANSF-ENVIADA (Filial). Fecha o mesmo fato cujo ICMS está em AGO-TAX-ICMS-TRANSF. Contrapartida em 4859 até identificar a conta patrimonial definitiva de transferência entre estabelecimentos.",
    fonte: "RESUMO NOTAS FISCAIS ENTRADA.csv (Matriz)",
  }),
  base({
    id: "AGO-CPV-M-TRANSF-ENVIADA",
    data: "31/08/2026",
    origem: "TRANSFERÊNCIA INTERNA 08/2026",
    debitoCodigo: "4859",
    creditoCodigo: "25944",
    historico: "Mercadoria enviada por transferência interna entre estabelecimentos (NOP 2152, 33 documentos)",
    documento: "33 documentos NOP 2152",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 119_957.34,
    status: "revisar",
    observacao: "Sai do CPV da Matriz (mercadoria que deixou o estoque físico da Matriz sem ser vendida a terceiro — foi para a Filial por transferência interna). Contrapartida de AGO-CPV-F-TRANSF-RECEBIDA (Filial). Fecha o mesmo fato cujo ICMS está em AGO-TAX-ICMS-TRANSF-F. Contrapartida em 4859 até identificar a conta patrimonial definitiva de transferência entre estabelecimentos.",
    fonte: "RESUMO NOTAS FISCAIS SAIDA.csv (Matriz)",
  }),
];

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
