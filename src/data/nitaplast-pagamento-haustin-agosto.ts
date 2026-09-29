import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta não encontrada no plano"}`;

/**
 * Baixa da NF 29 série F (fornecedor F02474 HAUSTIN CASTER VIEIRA SANDES,
 * lançada em `nitaplast-despesas-documentais-agosto.ts` como AGO-ENT-DOC-0034 —
 * débito 25938 Serviços de Terceiros / crédito 1496 Fornecedores Diversos,
 * R$ 11.700,00) — o pagamento em si nunca tinha sido lançado.
 *
 * "PAGAMENTOS EFETUADOS.pdf" (05/08/2026) mostra a baixa em duas partes: R$
 * 10.580,00 pagos via Banco Itaú (conta 11, código bancário B34100) e R$
 * 1.120,00 classificados no relatório como "Desconto Auferido" — mas o
 * cliente confirmou em 23/09/2026 que não é desconto comercial, é a baixa
 * parcial do adiantamento já concedido ao Haustin (conta 25126, saldo de
 * implantação R$ 4.360,00, parado desde 31/05/2026 sem nenhum movimento).
 * Por isso a contrapartida aqui é 25126, não uma conta de desconto/receita.
 *
 * Reduz o saldo do adiantamento de R$ 4.360,00 para R$ 3.240,00 em agosto.
 *
 * O cliente informou (25/09/2026) mais dois descontos de R$ 1.120,00 contra o
 * adiantamento — 05/03/2026 e 04/05/2026 — que a contabilidade anterior não
 * baixou, por isso seguem no saldo de implantação de 31/05. São regularizados
 * aqui em agosto (AGO-PAG-HAUSTIN-ADTO-REG-*), mesma contrapartida da baixa de
 * 05/08. Saldo de implantação corrigido em 29/09/2026 de R$ 4.360,00 para
 * R$ 4.480,00 (contrapartida 5747 Ajuste de Exercício Anterior), por decisão do
 * usuário — o balancete Domínio de maio mostra R$ 4.360,00. Saldo final da 25126
 * em agosto: R$ 1.120,00, baixado em 05/09 (setembro), como o cliente informou.
 */
export const lancamentosPagamentoHaustinAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-PAG-HAUSTIN-NF29",
    data: "05/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "11",
    credito: nomeConta("11"),
    historico: "Baixa NF 29 série F — F02474 HAUSTIN CASTER VIEIRA SANDES — pago via Banco Itaú",
    documento: "NF 29 série F / Título 3082026-29",
    cc: "303",
    centroCusto: "CONTROLADORIA",
    valor: 10_580.00,
    status: "validado",
    observacao: "Parcela em dinheiro da baixa da NF 29 (valor bruto R$ 11.700,00). Ver AGO-PAG-HAUSTIN-ADTO para a outra parcela, baixada contra o adiantamento (conta 25126).",
    rastreio: "documento",
    fonte: "PAGAMENTOS EFETUADOS.pdf",
  },
  {
    id: "AGO-PAG-HAUSTIN-ADTO",
    data: "05/08/2026",
    origem: "PAGAMENTOS EFETUADOS 08/2026",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "25126",
    credito: nomeConta("25126"),
    historico: "Baixa NF 29 série F — F02474 HAUSTIN CASTER VIEIRA SANDES — abatida contra adiantamento concedido",
    documento: "NF 29 série F / Título 3082026-29",
    cc: "303",
    centroCusto: "CONTROLADORIA",
    valor: 1_120.00,
    status: "validado",
    observacao: "Parcela da NF 29 quitada com o adiantamento a fornecedores já concedido ao Haustin (conta 25126), não é desconto comercial — confirmado pelo cliente em 23/09/2026. Reduz o saldo do adiantamento de R$ 4.360,00 para R$ 3.240,00.",
    rastreio: "documento",
    fonte: "PAGAMENTOS EFETUADOS.pdf",
  },
  {
    id: "AGO-PAG-HAUSTIN-ADTO-REG-0503",
    data: "31/08/2026",
    origem: "REGULARIZAÇÃO ADIANTAMENTO 08/2026",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "25126",
    credito: nomeConta("25126"),
    historico: "Baixa manual do adiantamento — desconto de 05/03/2026 não baixado pela contabilidade anterior — F02474 HAUSTIN CASTER VIEIRA SANDES",
    documento: "Informação do cliente em 25/09/2026",
    cc: "303",
    centroCusto: "CONTROLADORIA",
    valor: 1_120.00,
    status: "validado",
    observacao: "Desconto de R$ 1.120,00 abatido do adiantamento em 05/03/2026 (antes da implantação de 31/05), não baixado pela contabilidade anterior. Sem documento bancário do período — baseado na informação do cliente.",
    rastreio: "documento",
    fonte: "Informação do cliente em 25/09/2026",
  },
  {
    id: "AGO-PAG-HAUSTIN-ADTO-REG-0405",
    data: "31/08/2026",
    origem: "REGULARIZAÇÃO ADIANTAMENTO 08/2026",
    debitoCodigo: "1496",
    debito: nomeConta("1496"),
    creditoCodigo: "25126",
    credito: nomeConta("25126"),
    historico: "Baixa manual do adiantamento — desconto de 04/05/2026 não baixado pela contabilidade anterior — F02474 HAUSTIN CASTER VIEIRA SANDES",
    documento: "Informação do cliente em 25/09/2026",
    cc: "303",
    centroCusto: "CONTROLADORIA",
    valor: 1_120.00,
    status: "validado",
    observacao: "Desconto de R$ 1.120,00 abatido do adiantamento em 04/05/2026 (antes da implantação de 31/05), não baixado pela contabilidade anterior. Com esta baixa o saldo da 25126 fica em R$ 1.120,00 em 31/08/2026.",
    rastreio: "documento",
    fonte: "Informação do cliente em 25/09/2026",
  },
];
