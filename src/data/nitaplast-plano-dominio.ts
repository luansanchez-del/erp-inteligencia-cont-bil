import { balanceteDominioMaio } from "./nitaplast-balancete-dominio-maio";
import { saldosImplantacao } from "./nitaplast-implantacao";

export type VinculoContaDominio = {
  contaAtual: string;
  contaDominio: string;
  classificacaoDominio: string;
  descricaoDominio: string;
  criterio: "descricao" | "saldo" | "manual-documentado";
};

const centavos = (valor: number) => Math.round(valor * 100);
const texto = (valor: string) => valor
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Z0-9]+/gi, " ")
  .trim()
  .toUpperCase();

const contasDominio = balanceteDominioMaio.filter((linha) => linha.tipo === "A");
const ajustesDocumentados: Record<string, string> = {
  "21": "67611", // Movimento Greencred no grupo de aplicações
  "54": "67800", // Aplicação automática Itaú
  "290": "9644", // Adiantamento de importação
  "1712": "57096", // Adiantamentos de clientes em credores diversos
  "1734": "1147", // Obrigação cambial em fornecedores
  "2655": "1988", // Venda no mercado nacional
  "2859": "11665", // Receitas de aplicações financeiras
  "2892": "54640", // Recuperação/reembolso de despesas
  "312": "221", // Adiantamento de salário (ativo)
  "4885": "1449", // FGTS rescisório a recolher
  "25227": "1430", // INSS a recolher
  "25228": "1449", // FGTS a recolher
  "25057": "3034", // Provisão para férias (resultado)
  "3093": "4537", // Compras de matéria-prima
  "3095": "4537", // Frete de aquisição incorporado à compra de matéria-prima
  "3171": "3930", // Serviços de terceiros pessoa jurídica
  "3244": "3360", // Materiais auxiliares e de consumo
  "4038": "3484", // Uniformes em material de segurança
  "4089": "6564", // Brindes/bonificações
  "4115": "3344", // Hospedagem em viagens e representações
  "3494": "3697", // Energia elétrica
  "4185": "3697", // Energia elétrica
  "4253": "3433", // Fretes e carretos
  "4477": "3697", // Energia elétrica
  "1542": "16543", // ICMS ST a recolher
  "3203": "2917", // Assistência médica e social
  "4023": "2917", // Assistência médica e social — folha
  "4028": "2941", // Alimentação do trabalhador — folha
  "4337": "2917", // Assistência médica e social
  "4342": "2941", // Alimentação do trabalhador
  "4405": "3344", // Despesas e adiantamentos de viagem
  "4505": "3549", // Combustíveis e lubrificantes
  "4537": "3930", // Serviços profissionais de pessoa jurídica
  "4539": "6033", // Donativos sem analítica própria no plano anterior
  "4546": "3395", // Lanches e refeições
  "4607": "3085", // Manutenção e reparos
  "4736": "4294", // Venda de imobilizado em receitas eventuais
  "4760": "5681", // Custo da baixa do imobilizado em perdas
  "4898": "67564", // Adiantamento de lucros em conta corrente do sócio
  "4912": "3360", // Material de uso e consumo
  "5799": "3549", // Combustível concedido ao trabalhador
  "1580": "57096", // Retenções agrupadas em credores diversos
  "25020": "57096", // Provisões de custos em credores diversos
  "4430": "3590", // Aluguéis e condomínios
  "25064": "3360", // Materiais auxiliares e de consumo
};
const porDescricao = new Map<string, typeof contasDominio>();
const porSaldo = new Map<number, typeof contasDominio>();

for (const conta of contasDominio) {
  const descricao = texto(conta.descricao);
  porDescricao.set(descricao, [...(porDescricao.get(descricao) ?? []), conta]);
  porSaldo.set(centavos(conta.saldoAtual), [...(porSaldo.get(centavos(conta.saldoAtual)) ?? []), conta]);
}

type Proposta = VinculoContaDominio & { prioridade: number };
const propostas: Proposta[] = [];

for (const atual of saldosImplantacao) {
  const ajuste = ajustesDocumentados[atual.conta];
  const contaAjustada = ajuste ? contasDominio.find((item) => item.conta === ajuste) : undefined;
  if (contaAjustada) {
    propostas.push({ contaAtual: atual.conta, contaDominio: contaAjustada.conta, classificacaoDominio: contaAjustada.classificacao, descricaoDominio: contaAjustada.descricao, criterio: "manual-documentado", prioridade: 3 });
    continue;
  }
  const descricao = porDescricao.get(texto(atual.descricao)) ?? [];
  const saldoAssinado = atual.natureza === "C" ? -Math.abs(atual.saldo) : Math.abs(atual.saldo);
  const saldo = Math.abs(saldoAssinado) >= 0.005 ? (porSaldo.get(centavos(saldoAssinado)) ?? []) : [];
  const candidata = descricao.length === 1 && descricao[0]
    ? { conta: descricao[0], criterio: "descricao" as const, prioridade: 2 }
    : saldo.length === 1 && saldo[0]
      ? { conta: saldo[0], criterio: "saldo" as const, prioridade: 1 }
      : null;
  if (!candidata) continue;
  propostas.push({
    contaAtual: atual.conta,
    contaDominio: candidata.conta.conta,
    classificacaoDominio: candidata.conta.classificacao,
    descricaoDominio: candidata.conta.descricao,
    criterio: candidata.criterio,
    prioridade: candidata.prioridade,
  });
}

for (const [contaAtual, contaDominio] of Object.entries(ajustesDocumentados)) {
  if (propostas.some((item) => item.contaAtual === contaAtual)) continue;
  const contaAjustada = contasDominio.find((item) => item.conta === contaDominio);
  if (!contaAjustada) continue;
  propostas.push({ contaAtual, contaDominio, classificacaoDominio: contaAjustada.classificacao, descricaoDominio: contaAjustada.descricao, criterio: "manual-documentado", prioridade: 3 });
}

// Um código Domínio nunca pode receber automaticamente duas contas de origem.
// Em colisão, somente uma descrição exata e inequívoca prevalece; o restante fica
// explicitamente pendente para conferência, sem criar conta ou saldo de encaixe.
const agrupadas = new Map<string, Proposta[]>();
for (const proposta of propostas) {
  agrupadas.set(proposta.contaDominio, [...(agrupadas.get(proposta.contaDominio) ?? []), proposta]);
}

export const vinculosContasDominio: VinculoContaDominio[] = [...agrupadas.values()]
  .flatMap((grupo) => grupo)
  .map(({ prioridade: _prioridade, ...vinculo }) => vinculo)
  .sort((a, b) => Number(a.contaDominio) - Number(b.contaDominio));

export const contaDominioPorContaAtual = new Map(vinculosContasDominio.map((item) => [item.contaAtual, item]));

export function obterContaDominio(contaAtual: string) {
  return contaDominioPorContaAtual.get(contaAtual);
}

export const resumoPlanoDominio = {
  contasDominio: contasDominio.length,
  contasOrigem: saldosImplantacao.length,
  vinculadas: vinculosContasDominio.length,
  pendentes: saldosImplantacao.length - vinculosContasDominio.length,
} as const;
