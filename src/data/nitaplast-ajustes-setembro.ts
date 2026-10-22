import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { lancamentosCartaoJussaraRodrigoAgosto } from "./nitaplast-cartao-4005-jussara-rodrigo-agosto";
import { lancamentosCartaoFaturaAgosto, lancamentosCartaoFaturaJulho, lancamentosCartaoSetembro } from "./nitaplast-cartao-setembro";
import { lancamentosItauAgosto } from "./nitaplast-itau-agosto";
import { lancamentosEntradasSetembro } from "./nitaplast-entradas-setembro";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const setor = (centro: string) => centro.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m) => m.toUpperCase()).replace(" Da ", " da ").replace(" E ", " e ");

/**
 * Compras nacionais de matéria-prima de agosto creditadas na 25116 (Importações em Andamento) dentro de
 * AGO-CUSTO-MP-NAC, em vez de Fornecedores (1496). Os títulos foram pagos em setembro debitando a 1496.
 * Agosto fica como está; a reclassificação é patrimonial e não muda o resultado.
 * Ficam na 25116 as duas notas de importação que também estavam em AGO-CUSTO-MP-NAC (94262 Licharz e 94251 Greatland).
 */
const comprasNacionaisAgosto = [
  { nf: "15223", fornecedor: "TRICON ENERGY DO BRASIL", valor: 202_901.1 },
  { nf: "33500", fornecedor: "SM RESINAS BRASIL", valor: 90_636.72 },
  { nf: "125820", fornecedor: "AVIENT BRASIL", valor: 6_842.29 },
  { nf: "8064", fornecedor: "ACTIVAS PLASTICOS INDUSTRIAIS", valor: 153_894.13 },
  { nf: "15277", fornecedor: "TRICON ENERGY DO BRASIL", valor: 108_213.92 },
];

/**
 * Despesas de Jussara e Rodrigo da fatura de agosto (aba AGOSTO 26, vencimento 01/09/2026), lançadas em
 * agosto contra a transitória 4859 em vez de Fornecedores. A fatura foi paga em 01/09 baixando a 1496
 * (Itaú, F22542). A reclassificação leva a dívida para Fornecedores; a 4859 fica só com a fatura de julho
 * paga em 03/08. A despesa continua em agosto; não muda o resultado.
 */
const cartaoAgostoNaTransitoria = Math.round(
  lancamentosCartaoJussaraRodrigoAgosto.reduce((t, l) => t + (l.creditoCodigo === "4859" ? l.valor : l.debitoCodigo === "4859" ? -l.valor : 0), 0) * 100,
) / 100;

export const lancamentosAjustesSetembro: LancamentoIntegrado[] = [
  {
    id: "SET-RECLASS-CARTAO-AGOSTO",
    data: "01/09/2026",
    origem: "RECLASSIFICAÇÃO 08/2026",
    debitoCodigo: "4859",
    debito: nome("4859"),
    creditoCodigo: "1496",
    credito: nome("1496"),
    historico: "Fatura dos cartões de agosto (venc. 01/09/2026) — despesas de Jussara e Rodrigo lançadas contra a transitória",
    documento: "DESPESAS CARTÃO CRÉDITO.xlsx aba AGOSTO 26 / F22542 1092026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: cartaoAgostoNaTransitoria,
    status: "validado",
    observacao: "Leva para Fornecedores a dívida do cartão já reconhecida como despesa em agosto (AGO-CARTAO-4005-JUSSARA-* e RODRIGO-*), para fechar com o pagamento de 01/09. Sem efeito no resultado.",
    rastreio: "derivado",
    fonte: "nitaplast-cartao-4005-jussara-rodrigo-agosto.ts + extrato Itaú 01/09/2026",
  },
  ...comprasNacionaisAgosto.map((n) => ({
    id: `SET-RECLASS-MP-NAC-${n.nf}`,
    data: "01/09/2026",
    origem: "RECLASSIFICAÇÃO 08/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "1496",
    credito: nome("1496"),
    historico: `Reclassificação do fornecedor de matéria-prima nacional de agosto — NF ${n.nf} ${n.fornecedor}`,
    documento: `NF ${n.nf} / AGO-CUSTO-MP-NAC`,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: n.valor,
    status: "validado" as const,
    observacao: "Compra nacional creditada em agosto na 25116 em vez de Fornecedores; os títulos foram pagos em setembro contra a 1496. Sem efeito no resultado.",
    rastreio: "derivado" as const,
    fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv + PAGAMENTOS 092026.csv",
  })),
  {
    id: "SET-EST-AGO-DUPLIC-94251",
    data: "01/09/2026",
    origem: "CORREÇÃO 08/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "3093",
    credito: nome("3093"),
    historico: "Estorno de lançamento em duplicidade — NF 94251 Greatland Valve no custo de agosto",
    documento: "NF 94251 / AGO-CUSTO-MP-IMP-94251",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 109_923.88,
    status: "validado",
    observacao: "A NF 94251 (R$ 109.923,89 no Softdib) entrou em agosto duas vezes: dentro de AGO-CUSTO-MP-NAC (gerencial 11.01.003, 7 documentos, R$ 856.124,54) e em AGO-CUSTO-MP-IMP-94251. Erro de lançamento do sistema; os relatórios do cliente trazem a nota uma vez. Agosto não é alterado; o estorno entra em setembro por decisão do usuário em 14/10/2026.",
    rastreio: "derivado",
    fonte: "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv + DANFE NF 94251",
  },
  {
    id: "SET-CAMBIO-LICHARZ-VCA",
    data: "22/09/2026",
    origem: "CÂMBIO DE IMPORTAÇÃO 09/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "25096",
    credito: nome("25096"),
    historico: "Variação cambial ativa — Licharz GmbH, NF 94262 (DUIMP de agosto), contrato 635110685",
    documento: "Contrato de câmbio 635110685 / NF 94262 / INV 2041233",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 2_795.94,
    status: "validado",
    observacao: "Título da mercadoria pela DI: R$ 122.575,60. Liquidação: EUR 20.260,43 × 5,9120 = R$ 119.779,66 (Bradesco, 22/09/2026). Diferença a favor da empresa: R$ 2.795,94 (o próprio Softdib registra o desconto no pagamento).",
    rastreio: "documento",
    fonte: "C:/092026/CONTRATO DE CAMBIO 092026/Licharz 635110685.pdf + PAGAMENTOS 092026.csv",
  },
];

/**
 * Aluguel do imóvel da fábrica — Victors Inc (F00071, contrato cadastrado no Softdib em 02/02/2026,
 * R$ 28.580,10 por mês). Em 31/05 não havia aluguel a pagar (Domínio: "Aluguéis a Pagar" zerado), mas as
 * parcelas de junho, julho e agosto foram pagas baixando Fornecedores e nunca viraram despesa.
 * Decisão do usuário em 21/10/2026 (aluguel confirmado pela empresa): reconhecer as três em setembro,
 * sem reabrir os meses, e ratear essas e a de setembro pelos CCs do Softdib (PAGAMENTOS 092026.csv, conta 1301001).
 */
const rateioAluguelVictors: [cc: string, centro: string, valor: number][] = [
  ["101", "ALMOXARIFADO", 7_450.83], ["102", "PRODUÇÃO", 11_200.54], ["103", "TEFLONAGEM", 657.34],
  ["104", "TRATAMENTO E PINTURA", 720.22], ["105", "QUALIDADE", 242.93], ["106", "OFICINA", 2_212.1],
  ["107", "PROJETOS", 242.93], ["108", "ADM DA PRODUÇÃO", 331.53], ["109", "COMPRAS", 331.53],
  ["201", "VENDAS", 820.25], ["202", "PESAGEM", 1_046.03], ["203", "FATURAMENTO", 94.31],
  ["204", "ADM DE VENDAS", 217.21], ["205", "EXPEDIÇÃO", 1_166.07], ["206", "EXPORTAÇÃO", 94.31],
  ["301", "RECEPÇÃO", 734.51], ["302", "FINANCEIRO", 405.84], ["303", "CONTROLADORIA", 202.92],
  ["304", "ADM GERAL", 154.33], ["305", "TI - TECNOLOGIA DA INFORMAÇÃO", 51.45], ["306", "RH - RECURSOS HUMANOS", 202.92],
];
const ALUGUEL_VICTORS = 28_580.1;
if (Math.abs(rateioAluguelVictors.reduce((t, [, , v]) => t + v, 0) - ALUGUEL_VICTORS) > 0.005) throw new Error("Rateio do aluguel Victors não fecha");
const fonteVictors = "C:/092026/PAGAMENTOS 092026.csv (F00071 10022026/008, rateio por CC) + BALANCETE Domínio 05/2026 (Aluguéis a Pagar = 0)";

const parcelasVictorsAnteriores = [
  { parcela: "005", mes: "junho", pagamento: "10/06/2026", lancamento: "movimento financeiro de junho (Itaú)" },
  { parcela: "006", mes: "julho", pagamento: "10/07/2026", lancamento: "agregado de pagamentos do Itaú de julho (JUL-BAN-OP-028/030)" },
  { parcela: "007", mes: "agosto", pagamento: "10/08/2026", lancamento: "AGO-ITAU-EXT-222" },
  { parcela: "008", mes: "setembro", pagamento: "10/09/2026", lancamento: "SET-ITAU-EXT-196" },
];

export const lancamentosAluguelVictorsSetembro: LancamentoIntegrado[] = [
  ...parcelasVictorsAnteriores.flatMap(({ parcela, mes, pagamento, lancamento }) =>
    rateioAluguelVictors.map(([cc, centro, valor]): LancamentoIntegrado => ({
      id: `SET-ALUGUEL-VICTORS-${parcela}-${cc}`,
      data: parcela === "008" ? "10/09/2026" : "30/09/2026",
      origem: parcela === "008" ? "ALUGUEL 09/2026" : "ALUGUEL DE MESES ANTERIORES 09/2026",
      debitoCodigo: "3524",
      debito: nome("3524"),
      creditoCodigo: "1496",
      credito: nome("1496"),
      historico: `Aluguel do imóvel da fábrica (Victors Inc) referente a ${mes}/2026 — parcela ${Number(parcela)} do contrato, paga em ${pagamento} pelo Itaú.${parcela === "008" ? "" : ` Não entrou como despesa em ${mes}; reconhecido em setembro.`} Parte do setor ${setor(centro)} (CC ${cc}): ${reais(valor)} de ${reais(ALUGUEL_VICTORS)}.`,
      documento: `F00071 10022026/${parcela}`,
      cc,
      centroCusto: centro,
      valor,
      status: "validado",
      observacao: parcela === "008"
        ? "Aluguel do mês, rateado pelos CCs do Softdib; o pagamento (SET-ITAU-EXT-196) baixa Fornecedores."
        : `Pago em ${pagamento} baixando Fornecedores (${lancamento}) sem dívida aberta; a despesa não tinha entrado. Reconhecida em setembro por decisão do usuário (21/10/2026); o crédito devolve a Fornecedores o débito indevido.`,
      rastreio: "documento",
      fonte: fonteVictors,
    })),
  ),
];

/**
 * iPhone 16E (Magazine Luiza, NF 69112, 10 × R$ 399,90 no cartão do Alexandre) lançado como manutenção de
 * veículos (4215). Por decisão do usuário (21/10/2026) é equipamento de informática: R$ 3.999,00 passa do
 * limite de R$ 1.200,00 e vai para o imobilizado (4857). Reclassifica as parcelas lançadas em setembro.
 */
const parcelasIphone = [...lancamentosCartaoFaturaJulho, ...lancamentosCartaoFaturaAgosto, ...lancamentosCartaoSetembro]
  .filter((l) => l.debitoCodigo === "4215" && /MAGAZINE LUIZA/i.test(l.historico));
if (parcelasIphone.length !== 3) throw new Error(`Parcelas do iPhone no cartão: ${parcelasIphone.length} (esperado 3)`);

export const lancamentosIphoneSetembro: LancamentoIntegrado[] = parcelasIphone.map((l): LancamentoIntegrado => ({
  id: `SET-RECLASS-IPHONE-${l.id}`,
  data: l.data,
  origem: "RECLASSIFICAÇÃO 09/2026",
  debitoCodigo: "4857",
  debito: nome("4857"),
  creditoCodigo: "4215",
  credito: nome("4215"),
  historico: `iPhone 16E para a TI comprado na Magazine Luiza (NF 69112) no cartão do Alexandre — parcela ${l.historico.match(/(\d{2})\/10/)?.[1] ?? "?"} de 10, ${reais(l.valor)}. Passa de manutenção de veículos para equipamento de informática (imobilizado).`,
  documento: `NF 69112 / ${l.id}`,
  cc: l.cc,
  centroCusto: l.centroCusto,
  valor: l.valor,
  status: "validado",
  observacao: "Aparelho de TI comprado no cartão em 10 parcelas (R$ 3.999,00). Ativo imobilizado; as parcelas anteriores ficaram em despesa no fechamento dos meses de origem.",
  rastreio: "derivado",
  fonte: `Referência contábil: ${l.id} / ${l.fonte}`,
}));

/** Sette Case (pago em 05/08, veio da transitória para 4912 Material de Consumo) é condomínio: 4430. */
const setteCaseAgosto = lancamentosItauAgosto.find((l) => l.id === "AGO-ITAU-EXT-115");
if (!setteCaseAgosto) throw new Error("AGO-ITAU-EXT-115 (Sette Case) não encontrado");
export const lancamentosSetteCaseSetembro: LancamentoIntegrado[] = [{
  id: "SET-RECLASS-SETTE-CASE-AGO",
  data: "01/09/2026",
  origem: "RECLASSIFICAÇÃO 09/2026",
  debitoCodigo: "4430",
  debito: nome("4430"),
  creditoCodigo: "4912",
  credito: nome("4912"),
  historico: "Condomínio Sette Case pago em 05/08/2026 pelo Itaú (R$ 3.445,38) — passa de material de uso e consumo para aluguéis e condomínios.",
  documento: "Reclassificação de SET-TRANSIT-AGO-ITAU-EXT-115",
  cc: "304",
  centroCusto: "ADM GERAL",
  valor: setteCaseAgosto.valor,
  status: "validado",
  observacao: "Mesma natureza do pagamento de setembro da Sette Case (4430). Não muda o resultado.",
  rastreio: "derivado",
  fonte: "Referência contábil: AGO-ITAU-EXT-115",
}];

/**
 * Combustível Naciopetro (NF 12702, R$ 8.900,00) veio do Softdib no CC 204 (Adm de Vendas). Por decisão do
 * usuário (22/10/2026) é combustível da produção: estorna no CC 204 e relança no CC 102, na mesma conta 4213.
 * Não muda o resultado; a DRE leva a 4213 com CC de produção para Despesas Produção.
 */
const combustivelNaciopetro = lancamentosEntradasSetembro.filter((l) => l.debitoCodigo === "4213" && /^NF 12702 /.test(l.documento ?? "") && /NACIOPETRO/.test(l.historico));
if (combustivelNaciopetro.length !== 1) throw new Error(`NF 12702 Naciopetro: ${combustivelNaciopetro.length} lançamento(s) (esperado 1)`);
const naciopetro = combustivelNaciopetro[0]!;
export const lancamentosCombustivelProducaoSetembro: LancamentoIntegrado[] = [
  {
    id: "SET-RECLASS-NACIOPETRO-12702-ESTORNO",
    data: naciopetro.data,
    origem: "RECLASSIFICAÇÃO 09/2026",
    debitoCodigo: naciopetro.creditoCodigo,
    debito: nome(naciopetro.creditoCodigo),
    creditoCodigo: "4213",
    credito: nome("4213"),
    historico: `Combustível Naciopetro NF 12702 (${reais(naciopetro.valor)}) — sai do CC 204 Adm de Vendas; é combustível da produção.`,
    documento: `NF 12702 / ${naciopetro.id}`,
    cc: naciopetro.cc,
    centroCusto: naciopetro.centroCusto,
    valor: naciopetro.valor,
    status: "validado",
    observacao: "Estorno do CC de origem (Softdib). O lançamento da nota permanece preservado.",
    rastreio: "derivado",
    fonte: `Referência contábil: ${naciopetro.id}`,
  },
  {
    id: "SET-RECLASS-NACIOPETRO-12702-PRODUCAO",
    data: naciopetro.data,
    origem: "RECLASSIFICAÇÃO 09/2026",
    debitoCodigo: "4213",
    debito: nome("4213"),
    creditoCodigo: naciopetro.creditoCodigo,
    credito: nome(naciopetro.creditoCodigo),
    historico: `Combustível Naciopetro NF 12702 (${reais(naciopetro.valor)}) — entra no CC 102 Produção.`,
    documento: `NF 12702 / ${naciopetro.id}`,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: naciopetro.valor,
    status: "validado",
    observacao: "Decisão do usuário em 22/10/2026. Não muda o resultado.",
    rastreio: "derivado",
    fonte: `Referência contábil: ${naciopetro.id}`,
  },
];
