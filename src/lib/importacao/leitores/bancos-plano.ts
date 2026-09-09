/**
 * Mapeamento (banco, agência, conta) → código da conta contábil de bancos,
 * conferido contra `saldosImplantacao` (`@/data/nitaplast-implantacao*`).
 * Deliberadamente pequeno: só entra aqui o que foi confirmado contra o plano
 * real. Conta bancária não mapeada vira impedimento na leitura — nunca um
 * chute de código de conta.
 *
 * Adicionar uma linha aqui quando um novo extrato apontar "conta bancária
 * não identificada".
 */
interface ContaBancoConhecida {
  banco: "bb" | "bradesco" | "itau";
  agencia: string;
  conta: string;
  codigo: string;
  descricao: string;
}

const CONTAS_BANCO: ContaBancoConhecida[] = [
  { banco: "bb", agencia: "3275-1", conta: "30807-2", codigo: "10", descricao: "Banco do Brasil 3275-1 30807-2" },
  { banco: "bradesco", agencia: "6349", conta: "0003035-0", codigo: "9", descricao: "Banco Bradesco 6349 3035-0" },
  { banco: "itau", agencia: "1656", conta: "02182-9", codigo: "11", descricao: "Banco Itaú 1656 02182-9" },
  // Conferido contra `controlesBancariosJulho.itau04114` (nitaplast-bancos-julho.ts): mesma
  // conta contábil "11" também recebe a sub-conta Itaú 04114-0.
  { banco: "itau", agencia: "1656", conta: "0004114-0", codigo: "11", descricao: "Banco Itaú 1656 04114-0" },
];

function normalizar(valor: string) {
  return valor.replace(/\s+/g, "").toUpperCase();
}

export function contaBancoPor(banco: ContaBancoConhecida["banco"], agencia: string, conta: string): ContaBancoConhecida | undefined {
  const ag = normalizar(agencia);
  const cc = normalizar(conta);
  return CONTAS_BANCO.find((item) => item.banco === banco && normalizar(item.agencia) === ag && (normalizar(item.conta) === cc || normalizar(item.conta).replace(/^0+/, "") === cc.replace(/^0+/, "")));
}
