import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta não encontrada no plano"}`;

/**
 * Reclassificação de parte da fatura do cartão Itaú Business final 4005-0722
 * (AGO-CARTAO-ITAU-4005, R$ 28.030,68, lançada inteira em 4859 - Conta
 * Transitória) — só as porções de JUSSARA SOARES LIMA e RODRIGO A LIMA, por
 * pedido do cliente em 23/09/2026. O restante da fatura (Alana Preu Rosas,
 * Rafael Camargo, Marcos Victor Siedel, Irapuã Fonseca, Lazlo Victor Siedel,
 * Rodrigo B Guimarães, Pedro Milani, Alexandre da Silva Sadino, Marcelo
 * Nalon, Johny Velasquez, Jeferson Panchinchak) continua em 4859.
 *
 * Fonte: "DESPESAS CARTÃO CRÉDITO.xlsx", aba "AGOSTO 26", que já vem com um
 * "Código Contábil" gerencial próprio por linha (ex.: 15.01.001, 15.03.001) —
 * não é o código do plano de contas da Nitaplast. O de-para abaixo foi feito
 * por natureza da despesa, contra contas já existentes no plano (nenhuma
 * conta nova criada, conforme decisão do cliente em 23/09/2026):
 *   Hospedagem                         → 4115
 *   Combustíveis/Lubrificantes         → 4213
 *   Revisão/manutenção de veículo      → 4215
 *   Passagens, locação de veículo,
 *   estacionamento, táxi/uber/rodov.   → 25063 (Viagens e Representações)
 *   Lanches e refeições                → 25066
 *   Material de informática            → 25068
 *   Material de uso e consumo          → 4912
 *   Estorno "Despesas Facebook"        → 4085 (Publicidade), a crédito
 *
 * Jussara (CC 504) é Filial SP; Rodrigo (CC 201) é Matriz/Vendas — cada
 * grupo de linhas abaixo soma exatamente ao sub-total "CONFERIDO"/"OK" da
 * planilha por pessoa e por cartão (254,69 + 5.448,87 + 7.272,40 - 49,97 =
 * 12.925,99 para Rodrigo, nos três cartões dele: 0890-5132, 0965 e 2588).
 */
const base = (parcial: Omit<LancamentoIntegrado, "status" | "rastreio" | "debito" | "credito">): LancamentoIntegrado => ({
  ...parcial,
  debito: nomeConta(parcial.debitoCodigo),
  credito: nomeConta(parcial.creditoCodigo),
  status: "validado",
  rastreio: "documento",
});

const FONTE = "DESPESAS CARTÃO CRÉDITO.xlsx (aba AGOSTO 26) — cartão Itaú Business final 4005-0722";
const DATA = "03/08/2026";
const ORIGEM = "CARTÃO ITAÚ 4005-0722 — reclassificação 08/2026";

export const lancamentosCartaoJussaraRodrigoAgosto: LancamentoIntegrado[] = [
  // ===== JUSSARA SOARES LIMA (2463) — CC 504, Filial SP =====
  base({ id: "AGO-CARTAO-4005-JUSSARA-4912", data: DATA, origem: ORIGEM, debitoCodigo: "4912", creditoCodigo: "4859", historico: "Material Uso e Consumo — cartão Jussara Soares Lima (NFs Belmicro refrigerador/fogão + material)", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 920.06, observacao: "Reclassificado de 4859; ver nitaplast-cartao-credito-agosto.ts para a fatura completa.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-JUSSARA-25066", data: DATA, origem: ORIGEM, debitoCodigo: "25066", creditoCodigo: "4859", historico: "Lanches e Refeições — cartão Jussara Soares Lima", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 712.30, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-JUSSARA-25068", data: DATA, origem: ORIGEM, debitoCodigo: "25068", creditoCodigo: "4859", historico: "Materiais de Informática — cartão Jussara Soares Lima (NF 1861/4563 memória 8GB notebook)", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 395.00, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-JUSSARA-25063", data: DATA, origem: ORIGEM, debitoCodigo: "25063", creditoCodigo: "4859", historico: "Viagens e Representações (transporte/uber/estacionamento) — cartão Jussara Soares Lima", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 504.16, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-JUSSARA-4115", data: DATA, origem: ORIGEM, debitoCodigo: "4115", creditoCodigo: "4859", historico: "Hospedagem — cartão Jussara Soares Lima", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 724.50, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-JUSSARA-4213", data: DATA, origem: ORIGEM, debitoCodigo: "4213", creditoCodigo: "4859", historico: "Combustíveis e Lubrificantes — cartão Jussara Soares Lima", documento: "Cartão final 2463", cc: "504", centroCusto: "FILIAL SP", valor: 286.92, observacao: "Reclassificado de 4859.", fonte: FONTE }),

  // ===== RODRIGO A LIMA (cartões 0890-5132, 0965, 2588) — CC 201, Matriz/Vendas =====
  base({ id: "AGO-CARTAO-4005-RODRIGO-4912", data: DATA, origem: ORIGEM, debitoCodigo: "4912", creditoCodigo: "4859", historico: "Material Uso e Consumo — cartões Rodrigo A Lima (0965 + 2588)", documento: "Cartões finais 0890-5132/0965/2588", cc: "201", centroCusto: "VENDAS", valor: 731.20, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-25066", data: DATA, origem: ORIGEM, debitoCodigo: "25066", creditoCodigo: "4859", historico: "Lanches e Refeições — cartões Rodrigo A Lima (0965 + 2588)", documento: "Cartões finais 0965/2588", cc: "201", centroCusto: "VENDAS", valor: 4_345.56, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-25063", data: DATA, origem: ORIGEM, debitoCodigo: "25063", creditoCodigo: "4859", historico: "Viagens e Representações (passagens aéreas, locação de veículo, estacionamento, táxi/uber) — cartões Rodrigo A Lima (0965 + 2588)", documento: "Cartões finais 0965/2588", cc: "201", centroCusto: "VENDAS", valor: 2_137.45, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-4115", data: DATA, origem: ORIGEM, debitoCodigo: "4115", creditoCodigo: "4859", historico: "Hospedagem — cartões Rodrigo A Lima (0890-5132 + 0965 + 2588)", documento: "Cartões finais 0890-5132/0965/2588", cc: "201", centroCusto: "VENDAS", valor: 3_229.59, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-4213", data: DATA, origem: ORIGEM, debitoCodigo: "4213", creditoCodigo: "4859", historico: "Combustíveis e Lubrificantes — cartões Rodrigo A Lima (0965 + 2588)", documento: "Cartões finais 0965/2588", cc: "201", centroCusto: "VENDAS", valor: 1_600.52, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-4215", data: DATA, origem: ORIGEM, debitoCodigo: "4215", creditoCodigo: "4859", historico: "Manutenção de Veículos (revisão BYD AOX-3J29) — cartão Rodrigo A Lima (2588)", documento: "Cartão final 2588", cc: "201", centroCusto: "VENDAS", valor: 931.64, observacao: "Reclassificado de 4859.", fonte: FONTE }),
  base({ id: "AGO-CARTAO-4005-RODRIGO-ESTORNO-4085", data: DATA, origem: ORIGEM, debitoCodigo: "4859", creditoCodigo: "4085", historico: "Estorno de despesas Facebook — cartão Rodrigo A Lima (2588)", documento: "Cartão final 2588", cc: "201", centroCusto: "VENDAS", valor: 49.97, observacao: "Estorno de publicidade (Facebook Ads) identificado na fatura do cartão; reduz a relassificação líquida de Rodrigo para R$ 12.925,99.", fonte: FONTE }),
];
