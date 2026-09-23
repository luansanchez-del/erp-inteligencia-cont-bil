import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta não encontrada no plano"}`;

/**
 * Faturas dos cartões corporativos Itaú Business (dois cartões distintos,
 * final 4005-0722 e 6202-6083) pagas em 03/08/2026 — achado em 23/09/2026 a
 * partir de "PAGAMENTOS EFETUADOS.pdf" (fornecedor F22542-ITAU UNIBANCO SA,
 * classificação 1501012 Cartões de Crédito) e confirmado no extrato real do
 * Itaú (linhas "BUSINESS 4005-0722" e "BUSINESS 6202-6083").
 *
 * Cartão final 6202-6083: em 23/09/2026 o cliente pediu pra remover a
 * classificação comercial que tinha sido dada de forma verbal, sem
 * documento — essa fatura não aparece em "DESPESAS CARTÃO CRÉDITO.xlsx"
 * (nem na aba JULHO 26, nem na AGOSTO 26); só o cartão 4005-0722 tem
 * detalhamento nesse arquivo (ver `nitaplast-cartao-4005-jussara-rodrigo-
 * agosto.ts`). Volta pra conta transitória (4859) até aparecer um
 * documento real (fatura detalhada ou outra planilha) que comprove o que
 * essa fatura paga.
 *
 * Cartão final 4005-0722 também segue na transitória — só as porções de
 * Jussara e Rodrigo já saíram de lá, documentadas na planilha (ver arquivo
 * citado acima). O restante dos portadores desse cartão ainda não foi
 * reclassificado.
 *
 * Mesmo tratamento (débito 4859) já tinha sido dado à fatura de junho antes
 * de existir conta própria (ver `nitaplast-movimento-financeiro.ts`, evento
 * 203 → 4859 em `contrapartidaPorEvento` de `nitaplast-razao-base.ts`).
 *
 * Julho tem a mesma fatura em aberto (F22542, 01/07/2026, R$ 39.720,46 +
 * R$ 15.089,95 = R$ 54.810,41, confirmado no mesmo "PAGAMENTOS EFETUADOS.pdf")
 * mas NÃO foi lançada aqui — julho já está fechado; lançar isso exigiria um
 * estorno/ajuste retroativo como o já feito para outros achados de julho
 * (ver `AGO-EST-JUL-VERSAO-CC503-*` em nitaplast-razao-julho-final-v2.ts),
 * decisão que precisa de aprovação separada antes de mexer num mês fechado.
 */
export const lancamentosCartaoCreditoAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-CARTAO-ITAU-4005",
    data: "03/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "4859",
    debito: nomeConta("4859"),
    creditoCodigo: "11",
    credito: nomeConta("11"),
    historico: "Fatura cartão corporativo Itaú Business final 4005-0722 — 08/2026",
    documento: "F22542 — Título 3082026/001",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 28_030.68,
    status: "revisar",
    observacao: "Débito automático em conta transitória (4859) por falta de conta própria de cartão de crédito no plano de contas. Precisa ser reclassificado nota a nota (fatura detalhada) pra sair da transitória.",
    rastreio: "documento",
    fonte: "PAGAMENTOS EFETUADOS.pdf + extrato Itaú 08/2026 (linha \"BUSINESS 4005-0722\")",
  },
  {
    id: "AGO-CARTAO-ITAU-6202",
    data: "03/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "4859",
    debito: nomeConta("4859"),
    creditoCodigo: "11",
    credito: nomeConta("11"),
    historico: "Fatura cartão corporativo Itaú Business final 6202-6083 — 08/2026",
    documento: "F22542 — Título 3082026/002",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 18_497.38,
    status: "revisar",
    observacao: "Débito automático em conta transitória (4859) por falta de conta própria de cartão de crédito no plano de contas e por não haver fonte documental (não consta em \"DESPESAS CARTÃO CRÉDITO.xlsx\"). Precisa de documento (fatura detalhada ou planilha) pra sair da transitória.",
    rastreio: "documento",
    fonte: "PAGAMENTOS EFETUADOS.pdf + extrato Itaú 08/2026 (linha \"BUSINESS 6202-6083\")",
  },
];
