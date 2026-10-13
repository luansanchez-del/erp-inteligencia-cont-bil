import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { lancamentosItauAgosto } from "./nitaplast-itau-agosto";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const TRANSITORIA = "4859";

/**
 * Regularização da transitória 4859 em 09/2026 — o fechamento de setembro não deixa saldo nela.
 * Agosto e julho ficam como estão; a classificação entra em setembro (sai da 4859 para a conta da natureza).
 * As faturas de cartão que estavam na 4859 saem por nitaplast-cartao-setembro.ts.
 */

// Títulos pagos pelo Itaú em agosto sem nota de entrada, lançados na 4859 (AGO-ITAU-EXT-*).
function contaTituloItau(historico: string): { conta: string; revisar?: boolean } {
  const h = historico.toUpperCase();
  if (/TELEFONICA|TIM S\.A|PINHAIS NET/.test(h)) return { conta: "4478" };
  if (/SANEAMENTO/.test(h)) return { conta: "4476" };
  if (/COPEL|CAMARA DE COMERCIALIZACAO DE ENERGIA/.test(h)) return { conta: "3494" };
  if (/IPVA/.test(h)) return { conta: "4669" };
  if (/DETRAN|FUNDO DE URBANIZACAO|FUNDO DA JUSTICA/.test(h)) return { conta: "4663" };
  if (/DESPESAS E TARIFAS/.test(h)) return { conta: "25104" };
  if (/ASSOCIACAO COMERCIAL|SIND TRAB|CAMARA DE DIRIGENTES/.test(h)) return { conta: "4553" };
  if (/PROTE[ÇC][ÃA]O A INFANCIA/.test(h)) return { conta: "4539" };
  if (/PORTO SEGURO|AZUL COMPANHIA DE SEGUROS/.test(h)) return { conta: "4611" };
  if (/METROCARD|SEM PARAR|UBER|MOTORISTA|ESTACIONAMENTO/.test(h)) return { conta: "4544" };
  if (/FRUTAS/.test(h)) return { conta: "4546" };
  if (/UNIMED/.test(h)) return { conta: "4337" };
  if (/DESP VIAGEM|CART[ÃA]O NITA|RODRIGO A DE LIMA/.test(h)) return { conta: "25063" };
  if (/MARCOS VICTOR SIEDEL/.test(h)) return { conta: "25129", revisar: true };
  if (/DIAS TRABALHADOS|FIX PAY/.test(h)) return { conta: "1634", revisar: true };
  return { conta: "4912", revisar: true };
}

const titulosItauAgosto = lancamentosItauAgosto.filter((l) => l.debitoCodigo === TRANSITORIA || l.creditoCodigo === TRANSITORIA);

export const lancamentosTransitoriaTitulosAgosto: LancamentoIntegrado[] = titulosItauAgosto.map((original) => {
  const { conta, revisar } = contaTituloItau(original.historico);
  const entrou = original.debitoCodigo === TRANSITORIA; // saiu do banco: despesa; entrou no banco: redução/recuperação
  return {
    id: `SET-TRANSIT-${original.id}`,
    data: "01/09/2026",
    origem: "REGULARIZAÇÃO TRANSITÓRIA 09/2026",
    debitoCodigo: entrou ? conta : TRANSITORIA,
    debito: nome(entrou ? conta : TRANSITORIA),
    creditoCodigo: entrou ? TRANSITORIA : conta,
    credito: nome(entrou ? TRANSITORIA : conta),
    historico: `${original.historico} (pago em ${original.data})`,
    documento: `Reclassificação de ${original.id}`,
    cc: original.cc,
    centroCusto: original.centroCusto,
    valor: original.valor,
    status: revisar ? "revisar" : "validado",
    observacao: `Título pago pelo Itaú em ${original.data} sem nota de entrada, lançado na transitória em agosto. Classificado pela natureza do pagamento.`,
    rastreio: "derivado",
    fonte: `Referência contábil: ${original.id} / ${original.fonte}`,
  };
});

type Regularizacao = { id: string; descricao: string; conta: string; valor: number; revisar?: boolean; observacao: string };
// valor > 0: a 4859 tem saldo devedor (sai a crédito); valor < 0: saldo credor (sai a débito).
const regularizacoes: Regularizacao[] = [
  { id: "SEGURO-HDI-JULHO", descricao: "Seguro HDI pago em julho (JUL-BAN-OP-048)", conta: "4611", valor: 691.5, observacao: "Lançado na transitória em julho como \"SEGURO HDI - CONTA TRANSITÓRIA\"." },
  { id: "SALDOS-JUNHO-JULHO", descricao: "Saldo da transitória de junho e movimentos de julho sem detalhe (JUL-BAN-OP-009/049/051)", conta: "4912", valor: 3_677.07, revisar: true, observacao: "Saldo de R$ 2.859,27 vindo de junho e R$ 817,80 de julho, sem documento de origem identificado. Despesa geral administrativa." },
  { id: "PIS-COFINS-AGOSTO", descricao: "Crédito de PIS/COFINS de agosto sem conta (AGO-TAX-ENT-PIS/COFINS-REVISAR)", conta: "3093", valor: -89.53, observacao: "Diferença entre o crédito das notas e o SPED de agosto (PIS 15,97 + COFINS 73,56); reduz o custo de matéria-prima." },
  { id: "RESIDUOS-BANCOS-0109", descricao: "Diferenças bancárias de origem não identificada acertadas em 01/09 (SET-ACERTO-BANCO-*)", conta: "25097", valor: -512.84, revisar: true, observacao: "Itaú −517,09 e −1,03; Bradesco 6349 +11,15; Bradesco 895 +1,35 e −7,22. Saldo líquido a favor da empresa — receita eventual." },
  { id: "BRINDE-KAUHANE", descricao: "Reembolso à Kauhane — compra de brinde de final de ano (SET-ITAU-EXT-663)", conta: "4085", valor: 22, observacao: "Brinde — publicidade." },
];

export const lancamentosTransitoriaRegularizacoes: LancamentoIntegrado[] = regularizacoes.map((r) => ({
  id: `SET-TRANSIT-${r.id}`,
  data: "30/09/2026",
  origem: "REGULARIZAÇÃO TRANSITÓRIA 09/2026",
  debitoCodigo: r.valor > 0 ? r.conta : TRANSITORIA,
  debito: nome(r.valor > 0 ? r.conta : TRANSITORIA),
  creditoCodigo: r.valor > 0 ? TRANSITORIA : r.conta,
  credito: nome(r.valor > 0 ? TRANSITORIA : r.conta),
  historico: r.descricao,
  documento: "Regularização da conta transitória",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor: Math.abs(r.valor),
  status: r.revisar ? "revisar" : "validado",
  observacao: r.observacao,
  rastreio: "derivado",
  fonte: "Razão da conta 4859 (junho a setembro/2026)",
}));

export const lancamentosTransitoriaSetembro: LancamentoIntegrado[] = [...lancamentosTransitoriaTitulosAgosto, ...lancamentosTransitoriaRegularizacoes];
