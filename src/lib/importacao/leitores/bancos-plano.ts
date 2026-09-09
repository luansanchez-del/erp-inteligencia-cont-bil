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

/**
 * Mapeamento pelo nome de banco como aparece no export "EXTRATO MOVIMENTO —
 * SISTEMA CLIENTE SOFTDIB" (ERP interno da Nitaplast) — esse arquivo não traz
 * agência/conta por linha, só a descrição do banco. Conferido cruzando os 11
 * movimentos "BANCO DO BRASIL SA" do CSV contra o extrato BB em PDF já
 * validado (mesmas datas/valores). Descrição não mapeada aqui também vira
 * impedimento — nunca supõe qual conta é.
 */
const CONTAS_SOFTDIB: { descBanco: string; codigo: string }[] = [
  { descBanco: "BANCO DO BRASIL SA", codigo: "10" },
  { descBanco: "BRADESCO  C/C", codigo: "9" },
  { descBanco: "BANCO ITAU C/C", codigo: "11" },
];

export function contaSoftdibPor(descBanco: string): string | undefined {
  const alvo = normalizar(descBanco);
  return CONTAS_SOFTDIB.find((item) => normalizar(item.descBanco) === alvo)?.codigo;
}
