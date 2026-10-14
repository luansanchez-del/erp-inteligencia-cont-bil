import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { saldoAberturaSetembroPorConta } from "./nitaplast-saldos-setembro";
import { lancamentosEntradasSetembro } from "./nitaplast-entradas-setembro";
import { lancamentosImpostosSetembro } from "./nitaplast-impostos-setembro";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;
const arred = (valor: number) => Math.round(valor * 100) / 100;
const base = (
  linha: Omit<LancamentoIntegrado, "debito" | "credito" | "status" | "rastreio"> & Partial<Pick<LancamentoIntegrado, "status" | "rastreio">>,
): LancamentoIntegrado => ({
  ...linha,
  debito: nome(linha.debitoCodigo),
  credito: nome(linha.creditoCodigo),
  status: linha.status ?? "validado",
  rastreio: linha.rastreio ?? "documento",
});

/**
 * Transferências de mercadoria entre estabelecimentos em 09/2026, mesmo critério de agosto
 * (AGO-CPV-*-TRANSF-*): quem recebe põe no CPV como se fosse compra; quem envia tira do CPV,
 * porque a mercadoria saiu do estoque sem venda a terceiro. Contrapartida na transitória 4859,
 * que fecha em zero com os dois lados.
 *  - Matriz → Filial: 38 NF-e CFOP 6151 / 2152, R$ 125.755,71 (saídas da Matriz = entradas da Filial).
 *  - Filial → Matriz: 1 NF-e CFOP 6151 / 2151, R$ 10.894,26.
 */
export const transferenciasSetembro = {
  matrizParaFilial: { valor: 125_755.71, documentos: 38 },
  filialParaMatriz: { valor: 10_894.26, documentos: 1 },
} as const;

const fonteTransf = "RESUMO NOTAS FISCAIS SAIDA.csv e ENTRADA.csv — Matriz e Filial SET 26";

export const lancamentosTransferenciasSetembro: LancamentoIntegrado[] = [
  base({ id: "SET-CPV-M-TRANSF-ENVIADA", data: "30/09/2026", origem: "TRANSFERÊNCIA INTERNA 09/2026", debitoCodigo: "4859", creditoCodigo: "25944", historico: "Mercadoria enviada por transferência interna entre estabelecimentos (NOP 6151, 38 documentos)", documento: "38 documentos NOP 6151", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: transferenciasSetembro.matrizParaFilial.valor, status: "revisar", observacao: "Sai do CPV da Matriz: mercadoria que deixou o estoque sem venda a terceiro. Contrapartida de SET-CPV-F-TRANSF-RECEBIDA.", fonte: fonteTransf }),
  base({ id: "SET-CPV-M-TRANSF-RECEBIDA", data: "30/09/2026", origem: "TRANSFERÊNCIA INTERNA 09/2026", debitoCodigo: "25944", creditoCodigo: "4859", historico: "Mercadoria recebida por transferência interna entre estabelecimentos (NOP 2151, 1 documento)", documento: "1 documento NOP 2151", cc: "0", centroCusto: "SEM CENTRO DE CUSTO", valor: transferenciasSetembro.filialParaMatriz.valor, status: "revisar", observacao: "Entra no CPV da Matriz como compra. Contrapartida de SET-CPV-F-TRANSF-ENVIADA.", fonte: fonteTransf }),
  base({ id: "SET-CPV-F-TRANSF-RECEBIDA", data: "30/09/2026", origem: "TRANSFERÊNCIA INTERNA 09/2026", debitoCodigo: "25945", creditoCodigo: "4859", historico: "Mercadoria recebida por transferência interna entre estabelecimentos (NOP 2152, 38 documentos)", documento: "38 documentos NOP 2152", cc: "502", centroCusto: "COMERCIAL SP", valor: transferenciasSetembro.matrizParaFilial.valor, status: "revisar", observacao: "Entra no CPV da Filial como compra. Contrapartida de SET-CPV-M-TRANSF-ENVIADA.", fonte: fonteTransf }),
  base({ id: "SET-CPV-F-TRANSF-ENVIADA", data: "30/09/2026", origem: "TRANSFERÊNCIA INTERNA 09/2026", debitoCodigo: "4859", creditoCodigo: "25945", historico: "Mercadoria enviada por transferência interna entre estabelecimentos (NOP 6151, 1 documento)", documento: "1 documento NOP 6151", cc: "502", centroCusto: "COMERCIAL SP", valor: transferenciasSetembro.filialParaMatriz.valor, status: "revisar", observacao: "Sai do CPV da Filial: mercadoria enviada sem venda a terceiro. Contrapartida de SET-CPV-M-TRANSF-RECEBIDA.", fonte: fonteTransf }),
];

/**
 * CPV da Filial em 09/2026, mesmo critério de agosto: baixa do estoque inicial, encerramento das
 * compras da própria competência (líquidas dos créditos) e inventário final. O saldo acumulado de
 * competências anteriores na 25139 continua patrimonial, pendente de conciliação (julho e agosto).
 */
export const estoqueFinalFilialSetembro = 215_985.65;
const estoqueInicialFilialSetembro = saldoAberturaSetembroPorConta.get("25138") ?? 0;
const comprasFilialSetembro = arred(
  lancamentosEntradasSetembro.filter((l) => l.debitoCodigo === "25139").reduce((t, l) => t + l.valor, 0) -
    lancamentosImpostosSetembro.filter((l) => l.creditoCodigo === "25139").reduce((t, l) => t + l.valor, 0),
);

export const lancamentosCpvFilialSetembro: LancamentoIntegrado[] = [
  base({ id: "SET-CPV-F-ABERT", data: "30/09/2026", origem: "FECHAMENTO ESTOQUE FILIAL 09/2026", debitoCodigo: "25945", creditoCodigo: "25138", historico: "Baixa do estoque inicial da Filial para apuração do CPV de setembro", documento: "INVENTÁRIO FILIAL 31/08/2026", cc: "502", centroCusto: "COMERCIAL SP", valor: Math.abs(estoqueInicialFilialSetembro), observacao: "Saldo de 31/08/2026 (inventário de agosto) transportado.", fonte: "Saldo contábil 31/08/2026", rastreio: "derivado" }),
  base({ id: "SET-CPV-F-COMP-DOC", data: "30/09/2026", origem: "FECHAMENTO ESTOQUE FILIAL 09/2026", debitoCodigo: "25945", creditoCodigo: "25139", historico: "Encerramento das compras de setembro da Filial no CPV (líquidas dos créditos)", documento: "CFOP 1102 + frete de compra 09/2026", cc: "502", centroCusto: "COMERCIAL SP", valor: comprasFilialSetembro, observacao: "Compras da Filial lançadas em setembro (SET-ENT-F) menos os créditos de ICMS/PIS/COFINS contra a 25139. O saldo de competências anteriores na 25139 fica patrimonial, como em julho e agosto.", fonte: "ENTRADAS SOFTDIB POR CENTRO DE CUSTO FILIAL 092026 + apuração 09/2026" }),
  base({ id: "SET-CPV-F-FINAL", data: "30/09/2026", origem: "FECHAMENTO ESTOQUE FILIAL 09/2026", debitoCodigo: "25138", creditoCodigo: "25945", historico: "Reconhecimento do estoque físico final da Filial em 30/09", documento: "INVENTÁRIO FILIAL 30/09/2026", cc: "502", centroCusto: "COMERCIAL SP", valor: estoqueFinalFilialSetembro, observacao: "Registro de inventário com data de referência 30/09/2026, emitido em 01/10/2026: produto acabado, 4.967 peças, 21.444,289 kg, R$ 215.985,65.", fonte: "C:/092026/FILIAL - SET 26/REGISTRO INVENTARIO ESTOQUE.pdf — resumo PA" }),
].filter((l) => l.valor > 0.005);

/**
 * CPV da Matriz em 09/2026, mesmo critério de agosto (AGO-CPV-BAIXA/FINAL): baixa do saldo de cada conta
 * de estoque contra o CPV (25944) e reconhecimento do inventário final de 30/09.
 * Registro de inventário de 30/09/2026 (emitido em 13/10/2026), total geral R$ 5.202.864,26, por grupo:
 *  - 25135: matérias-primas (001) R$ 749.756,73 + produtos não definidos (901, moídos) R$ 17.686,06;
 *  - 25134: aparas (201) R$ 36.216,41 + refugo (202) R$ 2.630,96 + rejeitos (205) R$ 298,64;
 *  - 25133: grupos 101 a 136 (produto acabado);
 *  - 25136: registro de produtos em elaboração, R$ 107.919,59 (mesmo valor e itens de 31/08).
 */
const inventarioMatrizSetembro = { total: 5_202_864.26, estoque: 5_094_944.67, elaboracao: 107_919.59 } as const;
const materiaPrimaSetembro = arred(749_756.73 + 17_686.06);
const sucatasSetembro = arred(36_216.41 + 2_630.96 + 298.64);

export const estoqueFinalMatrizSetembroPorConta: Record<string, number> = {
  "25133": arred(inventarioMatrizSetembro.estoque - materiaPrimaSetembro - sucatasSetembro),
  "25134": sucatasSetembro,
  "25135": materiaPrimaSetembro,
  "25136": inventarioMatrizSetembro.elaboracao,
  "25137": 0,
};

const somaEstoqueFinal = arred(Object.values(estoqueFinalMatrizSetembroPorConta).reduce((t, v) => t + v, 0));
if (Math.abs(somaEstoqueFinal - inventarioMatrizSetembro.total) > 0.005) {
  throw new Error(`Inventário Matriz 30/09: ${somaEstoqueFinal} x ${inventarioMatrizSetembro.total} do registro`);
}

const fonteInventarioMatriz = "C:/092026/NITAPLAST - SET 26/REGISTRO INVENTARIO ESTOQUE (1).pdf — referência 30/09/2026";

export const lancamentosCpvMatrizSetembro: LancamentoIntegrado[] = Object.entries(estoqueFinalMatrizSetembroPorConta).flatMap(([conta, saldoFinal], indice) => {
  // As contas de estoque não têm movimento em setembro: o saldo anterior é o inventário de 31/08.
  const saldoAnterior = arred(saldoAberturaSetembroPorConta.get(conta) ?? 0);
  const linhas: LancamentoIntegrado[] = [];
  if (Math.abs(saldoAnterior) >= 0.005) linhas.push(base({ id: `SET-CPV-BAIXA-${indice + 1}`, data: "30/09/2026", origem: "FECHAMENTO ESTOQUE MATRIZ 09/2026", debitoCodigo: "25944", creditoCodigo: conta, historico: `Baixa integral do estoque anterior da conta ${conta}`, documento: "INVENTÁRIO 31/08/2026", cc: "102", centroCusto: "PRODUÇÃO", valor: Math.abs(saldoAnterior), observacao: "Fechamento periódico: baixa do saldo de 31/08 antes do reconhecimento do inventário de 30/09.", fonte: "Saldo contábil 31/08/2026", rastreio: "derivado" }));
  if (saldoFinal > 0.005) linhas.push(base({ id: `SET-CPV-FINAL-${indice + 1}`, data: "30/09/2026", origem: "FECHAMENTO ESTOQUE MATRIZ 09/2026", debitoCodigo: conta, creditoCodigo: "25944", historico: `Reconhecimento do inventário final da conta ${conta}`, documento: "INVENTÁRIO 30/09/2026", cc: "102", centroCusto: "PRODUÇÃO", valor: saldoFinal, observacao: conta === "25136" ? "Registro de produtos em elaboração com os mesmos itens e valor de 31/08 — confirmar com a empresa." : "Saldo final do registro de inventário de 30/09/2026.", fonte: fonteInventarioMatriz }));
  return linhas;
});
