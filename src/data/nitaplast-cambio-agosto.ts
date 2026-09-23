import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/** Contratos de câmbio vinculados documentalmente à NF 93.361 da BASF. */
export const vinculosCambioAgosto = [
  { contratoBacen: "621680690", contratoBradesco: "4925166", data: "10/08/2026", invoice: "3209714898", parcela: "001", usd: 41_000, taxa: 5.105, reais: 209_305.00 },
  { contratoBacen: "622836291", contratoBradesco: "4930818", data: "13/08/2026", invoice: "3209714889", parcela: "002", usd: 41_000, taxa: 5.2175, reais: 213_917.50 },
] as const;

export const lancamentosCambioAgosto: LancamentoIntegrado[] = vinculosCambioAgosto.map((vinculo) => ({
  id: `AGO-CAMBIO-${vinculo.contratoBacen}`,
  data: vinculo.data,
  origem: "CONTRATO DE CÂMBIO IMPORTAÇÃO 08/2026",
  debitoCodigo: "5501438",
  debito: nome("5501438"),
  creditoCodigo: "9",
  credito: nome("9"),
  historico: `Liquidação de importação BASF SE — invoice ${vinculo.invoice}`,
  documento: `NF 93361/${vinculo.parcela} — contrato ${vinculo.contratoBacen}`,
  cc: "102",
  centroCusto: "PRODUÇÃO",
  valor: vinculo.reais,
  status: "validado",
  observacao: `Pagamento posterior de importação: USD ${vinculo.usd.toFixed(2)}, taxa ${vinculo.taxa.toFixed(4)}. Baixa o fornecedor; não duplica a compra nem reconhece novamente matéria-prima.`,
  rastreio: "documento",
  fonte: `${vinculo.contratoBacen}.pdf + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv + NF 93361`,
}));

/**
 * Contratos de câmbio da Greatland Valve, achados em 16/09/2026, cujo débito
 * bancário foi confirmado nos extratos Bradesco 6349/3035-0 de abril e julho
 * (linha "CAMBIO IMPORTACAO / CAMBIO IMP CTR <contrato>"). Não há conta de
 * fornecedor dedicada à Greatland no plano de contas (diferente da BASF, que
 * tem a 5501438); por isso a baixa é feita contra a 25116 (Importações em
 * andamento), a mesma conta creditada pela entrada da NF 94222 em
 * `nitaplast-cpv-depreciacao-agosto.ts` (AGO-CUSTO-MP-IMP).
 *
 * Achado em 18/09/2026, confirmado pelo cliente: o processo completo é NF
 * 94222 + NF 94251, duas DUIMPs (26BR0001376062-0 e 26BR0001426125-2,
 * faturas GTL-PI-260401A e GTL-PI-260401B) e os dois contratos de câmbio
 * abaixo — processo já finalizado segundo o cliente. O contrato 611879451
 * (10/07/2026) referencia literalmente "/INV/GTL-PI-260401B/GTL-PI-260401A"
 * no campo Informações da Ordem, confirmando o vínculo com as duas faturas.
 * O que antes parecia "diferença de R$ 68.345,40 sem explicação" contra a NF
 * 94222 isolada é, na verdade, a parcela relativa à NF 94251 — mas o
 * documento/valor da NF 94251 ainda não foi localizado no sistema, então a
 * baixa completa na 25116 continua pendente até esse documento chegar. Não
 * reconciliar por estimativa: evitar valor sem origem identificável.
 *
 * Achado em 23/09/2026, lendo as duas DUIMPs originais (pasta "C:\082026\
 * CONTRATOS DE CAMBIO 082026"): DUIMP 26BR0001376062-0 (NF 94222) tem VALOR
 * FOB MOEDA USD 58.314,59 (valor aduaneiro R$ 321.215,41, taxa 5,1859) e
 * frete prepaid USD 3.625,56. DUIMP 26BR0001426125-2 (NF 94251) tem VALOR
 * FOB MOEDA USD 12.712,84 (valor aduaneiro R$ 69.885,55, taxa 5,2236) e
 * frete prepaid USD 665,97. Soma dos FOB das duas DI: USD 71.027,43 — bate
 * exatamente com o valor que o cliente citou como "USD das duas DI juntas".
 * O contrato 611879451 sozinho (USD 55.863,94) cobre só parte disso, deixando
 * USD 15.163,49 aparentemente sem câmbio — mas o contrato 583972479 (USD
 * 19.455,03, 08/04/2026, o mais antigo, provável adiantamento anterior ao
 * embarque de 21/06/2026) COBRE essa diferença: os dois contratos somados
 * (USD 75.318,97) batem com FOB + frete prepaid das duas DI juntas (USD
 * 71.027,43 + 3.625,56 + 665,97 = USD 75.318,96, diferença de 1 centavo por
 * arredondamento). Ou seja, não falta contrato de câmbio nenhum — os dois já
 * lançados cobrem o processo inteiro (mercadoria + frete). O NF 94222 (R$
 * 454.046,67) é o valor da nota fiscal brasileira de entrada (mercadoria +
 * impostos domésticos + margem), não o valor aduaneiro da DI isolada (R$
 * 321.215,41) nem uma soma simples das duas DI — por isso não batia com
 * nenhum dos dois à primeira vista.
 */
export const vinculosCambioGreatlandAgosto = [
  { contrato: "583972479", data: "08/04/2026", usd: 19_455.03, taxa: 5.045, reais: 98_150.63 },
  { contrato: "611879451", data: "10/07/2026", usd: 55_863.94, taxa: 5.1473390, reais: 287_550.64 },
] as const;

export const lancamentosCambioGreatlandAgosto: LancamentoIntegrado[] = vinculosCambioGreatlandAgosto.map((vinculo) => ({
  id: `AGO-CAMBIO-GREATLAND-${vinculo.contrato}`,
  data: "01/08/2026",
  origem: "CONTRATO DE CÂMBIO IMPORTAÇÃO — GREATLAND VALVE",
  debitoCodigo: "25116",
  debito: nome("25116"),
  creditoCodigo: "9",
  credito: nome("9"),
  historico: "Adiantamento de importação Greatland Valve — pago antes da emissão das NFs 94222/94251",
  documento: `Contrato de câmbio ${vinculo.contrato}, pago em ${vinculo.data}`,
  cc: "209",
  centroCusto: "IMPORTAÇÃO",
  valor: vinculo.reais,
  status: "revisar",
  observacao: `Pagamento antecipado (adiantamento), não baixa de título: USD ${vinculo.usd.toFixed(2)}, taxa ${vinculo.taxa.toFixed(4)}, debitado do Bradesco 6349/3035-0 em ${vinculo.data} — contrato só localizado em 16/09/2026, por isso lançado em agosto na competência da NF 94222 (emitida 18/08/2026), não no mês real do pagamento. Confirmado pelo cliente em 18/09/2026: os dois contratos cobrem NF 94222 + NF 94251 juntas (processo finalizado), não só a 94222. Baixa parcial da 25116 aberta pela entrada da matéria-prima (AGO-CUSTO-MP-IMP); falta o documento da NF 94251 para reconciliar o saldo completo.`,
  rastreio: "documento",
  fonte: `${vinculo.contrato}.pdf + extrato Bradesco 6349/3035-0 (${vinculo.data.slice(3)}) + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv`,
}));

/**
 * Baixa dos tributos federais e despesas aduaneiras da importação Greatland
 * (NF 94222 e NF 94251), pagos por débito automático no registro da DI —
 * ambas as DUIMPs confirmam "Pagamento dos tributos federais realizado -
 * Automático". Fecha parte da 25116 que o câmbio não cobre (câmbio só
 * remete o valor da mercadoria ao fornecedor no exterior; II/IPI/PIS/COFINS/
 * despesas aduaneiras são pagos em reais, no Brasil). Confirmado pelo
 * cliente em 18/09/2026.
 *
 * NF 94222 (DUIMP 26BR0001376062-0): II 51.394,46 + IPI 36.329,45 +
 * PIS 6.745,54 + COFINS 30.997,31 + Siscomex 154,23 + AFRMM 1.649,26 =
 * R$ 127.270,25, valores tirados diretamente do extrato da DUIMP. O frete
 * (R$ 18.801,79) e as despesas aduaneiras/despachante da NF 94222 (estimadas
 * em R$ 5.561,01 por diferença entre o total da NF e os componentes
 * documentados) NÃO estão aqui — permanecem em aberto na 25116 até
 * documento próprio (fatura do despachante e/ou comprovante do frete).
 *
 * NF 94251 (DUIMP 26BR0001426125-2): II 10.464,59 + IPI 5.371,35 +
 * PIS 1.467,60 + COFINS 6.743,96 + despesas aduaneiras 15.990,82 =
 * R$ 40.038,32 — todos os valores conferidos linha a linha no próprio
 * DANFE (campo "Composicao Despesas Acessorias"). O frete (R$ 3.478,77)
 * também não está aqui, mesmo motivo.
 */
export const lancamentosTributosImportacaoGreatlandAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-CAMBIO-GREATLAND-TRIB-94222",
    data: "14/08/2026",
    origem: "PAGAMENTO TRIBUTOS FEDERAIS — DI 26BR0001376062-0",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "9",
    credito: nome("9"),
    historico: "Tributos federais da importação Greatland Valve — NF 94222 (II + IPI + PIS + COFINS + Siscomex + AFRMM)",
    documento: "DUIMP 26BR0001376062-0",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 127_270.25,
    status: "validado",
    observacao: "Débito automático no registro da DI (14/08/2026), conforme extrato da DUIMP: II R$ 51.394,46 + IPI R$ 36.329,45 + PIS R$ 6.745,54 + COFINS R$ 30.997,31 + Siscomex R$ 154,23 + AFRMM R$ 1.649,26. Confirmado pelo cliente em 18/09/2026.",
    rastreio: "documento",
    fonte: "DUIMP 26BR0001376062-0 Greatland.pdf",
  },
  {
    id: "AGO-CAMBIO-GREATLAND-TRIB-94251",
    data: "17/08/2026",
    origem: "PAGAMENTO TRIBUTOS FEDERAIS — DI 26BR0001426125-2",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "9",
    credito: nome("9"),
    historico: "Tributos federais e despesas aduaneiras da importação Greatland Valve — NF 94251 (II + IPI + PIS + COFINS + despesas aduaneiras)",
    documento: "NF 94251, série 001 / DUIMP 26BR0001426125-2",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 40_038.32,
    status: "validado",
    observacao: "Débito automático no registro da DI (17/08/2026): II R$ 10.464,59 + IPI R$ 5.371,35 + PIS R$ 1.467,60 + COFINS R$ 6.743,96 + despesas aduaneiras R$ 15.990,82 — composição conferida no próprio DANFE. Confirmado pelo cliente em 18/09/2026.",
    rastreio: "documento",
    fonte: "DANFE NF-e 000.094.251 + DUIMP 26BR0001426125-2 Greatland.pdf",
  },
];

/**
 * Achado em 18/09/2026: o câmbio remete FOB + frete internacional (valor
 * aduaneiro), não só o FOB — por isso a obrigação contábil correta pra
 * comparar com o câmbio é o valor aduaneiro das duas DI (R$ 391.100,96:
 * R$ 321.215,41 + R$ 69.885,55), não o FOB isolado. Como o câmbio liquidou
 * por menos (R$ 385.701,27, nas taxas de contratação de abril/julho, mais
 * favoráveis que as taxas da DI de agosto), sobra uma variação cambial
 * ATIVA real de R$ 5.399,69 — mesmo padrão e contas de
 * `nitaplast-financeiro-julho.ts` (D 25116 / C 25096).
 */
export const lancamentosVariacaoCambialGreatlandAgosto: LancamentoIntegrado[] = [{
  id: "AGO-CAMBIO-GREATLAND-VCA",
  data: "31/08/2026",
  origem: "VARIAÇÃO CAMBIAL — IMPORTAÇÃO GREATLAND VALVE",
  debitoCodigo: "25116",
  debito: nome("25116"),
  creditoCodigo: "25096",
  credito: nome("25096"),
  historico: "Variação cambial ativa — importação Greatland Valve (NF 94222 + NF 94251)",
  documento: "DUIMPs 26BR0001376062-0 e 26BR0001426125-2 + contratos de câmbio 583972479 e 611879451",
  cc: "209",
  centroCusto: "IMPORTAÇÃO",
  valor: 5_399.69,
  status: "validado",
  observacao: "Obrigação contábil (valor aduaneiro das duas DI, na taxa de registro) R$ 391.100,96 menos valor liquidado pelos dois contratos de câmbio R$ 385.701,27 = variação cambial ativa R$ 5.399,69.",
  rastreio: "documento",
  fonte: "DUIMP 26BR0001376062-0 + DUIMP 26BR0001426125-2 + contratos de câmbio 583972479.pdf e 611879451.pdf",
}];

/**
 * TENTATIVA REVERTIDA em 24/09/2026. Cheguei a lançar variação cambial da
 * BASF usando o "Valor Doc" de "PAGAMENTOS EFETUADOS.pdf" (R$ 212.146,30 em
 * cada parcela da NF 93361) como se fosse o valor da DI na taxa de registro
 * — igual ao padrão usado pra Greatland. Cliente apontou que isso não foi
 * validado de verdade contra nota + contrato + DI juntos. Fui checar a DI
 * da BASF (pasta DUIMP/06 Junho/Basf 16009 e Basf 16010.pdf) e é um PDF
 * escaneado sem camada de texto — não dá pra confirmar o valor aduaneiro
 * real. Sem essa validação, o lançamento foi revertido (não está mais
 * conectado a `nitaplast-razao-agosto.ts`). Falta: conseguir a DI da BASF
 * em formato legível (ou o valor extraído manualmente) antes de lançar de
 * novo. Valores que tinha usado, pra referência: variação ativa R$ 2.841,30
 * (parcela 001, 10/08) e passiva R$ 1.771,20 (parcela 002, 13/08).
 */

export const resumoCambioAgosto = {
  contratos: 2,
  fornecedor: "BASF SE",
  notaFiscal: "93361",
  usd: 82_000,
  reais: 423_222.50,
  notaGreatland94222: {
    notaFiscal: "94222 + 94251",
    valorNotas: 563_970.55,
    contratosVinculados: 385_701.27,
    tributosEDespesasBaixados: 167_308.57,
    variacaoCambialAtiva: 5_399.69,
    saldoAindaAberto25116: 5_561.02,
    observacao: "Processo Greatland finalizado (confirmado pelo cliente em 18/09/2026): NF 94222 (R$ 454.046,67) + NF 94251 (R$ 109.923,88), duas DUIMPs (26BR0001376062-0 e 26BR0001426125-2), dois contratos de câmbio (R$ 385.701,27), tributos federais de ambas as DI (R$ 167.308,57) e variação cambial ativa de R$ 5.399,69 (obrigação contábil pelo valor aduaneiro das DI menos valor liquidado pelo câmbio — mesmo critério de julho). Resta um saldo residual de R$ 5.561,02 na 25116, referente à estimativa de despesas aduaneiras da NF 94222 (calculada por diferença entre o total da NF e os componentes documentados na DUIMP) — falta o documento próprio (DANFE ou fatura do despachante da NF 94222) pra confirmar e fechar. Consultado o RESUMO CTES.csv (18/09/2026): não traz essa informação — os CT-e da LVZ ali são frete nacional já lançado na 25070, sem relação com este resíduo.",
  },
} as const;

