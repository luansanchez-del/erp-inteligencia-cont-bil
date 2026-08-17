import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho, saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";

const arred = (v: number) => Math.round(v * 100) / 100;

export type RegraImobilizado = {
  id: string;
  nome: string;
  contasAtivo: string[];
  contaDepreciacaoAcumulada?: string;
  contaDespesa?: string;
  valorMensalReferencia?: number;
  naoDepreciavel?: boolean;
  observacao?: string;
};

/**
 * Cadastro contábil do imobilizado da Nitaplast.
 * A depreciação automática NÃO presume taxa nem vida útil: usa somente a recorrência
 * mensal efetivamente contabilizada em 06/2026 e limita o valor ao saldo residual.
 */
export const regrasImobilizadoNitaplast: RegraImobilizado[] = [
  {
    id: "maquinas",
    nome: "Máquinas, aparelhos e equipamentos",
    contasAtivo: ["1083", "25162", "25163", "25164", "25165", "25166", "25167", "25168", "25169", "25170", "25171", "25173", "25174", "25175", "25176", "25178", "25179", "25180", "25181", "25182"],
    contaDepreciacaoAcumulada: "1147",
    contaDespesa: "25078",
    valorMensalReferencia: 26745.98,
  },
  { id: "inst-industriais", nome: "Instalações industriais", contasAtivo: ["1082"], contaDepreciacaoAcumulada: "25183", contaDespesa: "25080", valorMensalReferencia: 1916.57 },
  { id: "moveis-adm", nome: "Móveis e utensílios ADM", contasAtivo: ["25145"], contaDepreciacaoAcumulada: "25184", contaDespesa: "25081", valorMensalReferencia: 3110.24 },
  { id: "moveis-industrial", nome: "Móveis e utensílios industrial", contasAtivo: ["25146"], contaDepreciacaoAcumulada: "25185", contaDespesa: "25081", valorMensalReferencia: 155.58 },
  { id: "informatica", nome: "Equipamentos de informática", contasAtivo: ["4857"], contaDepreciacaoAcumulada: "25186", contaDespesa: "25082", valorMensalReferencia: 2780.09 },
  { id: "veiculos", nome: "Veículos", contasAtivo: ["1089"], contaDepreciacaoAcumulada: "25187", contaDespesa: "25083", valorMensalReferencia: 19762.52 },
  { id: "seguranca", nome: "Equipamentos de segurança", contasAtivo: ["25147"], contaDepreciacaoAcumulada: "25188", observacao: "Sem recorrência mensal em junho; se integralmente depreciado, permanece com cálculo zero." },
  { id: "ferramentas", nome: "Ferramentas e acessórios para fábrica", contasAtivo: ["25148"], contaDepreciacaoAcumulada: "25189", contaDespesa: "25084", valorMensalReferencia: 56.97 },
  { id: "benfeitorias", nome: "Benfeitorias em imóveis de terceiros", contasAtivo: ["25149"], contaDepreciacaoAcumulada: "25190", contaDespesa: "25087", valorMensalReferencia: 263.18 },
  { id: "moveis-comercial", nome: "Móveis e utensílios comercial", contasAtivo: ["25150"], contaDepreciacaoAcumulada: "25191", contaDespesa: "25090", valorMensalReferencia: 3.12 },
  { id: "inst-adm", nome: "Instalações administrativas", contasAtivo: ["25151"], contaDepreciacaoAcumulada: "25192", contaDespesa: "25080", valorMensalReferencia: 331.10 },
  { id: "telefonia", nome: "Equipamentos telefônicos", contasAtivo: ["25152"], contaDepreciacaoAcumulada: "25193", contaDespesa: "25086", valorMensalReferencia: 318.65 },
  { id: "ferramental-extrusao", nome: "Ferramental de extrusão", contasAtivo: ["25153"], contaDepreciacaoAcumulada: "25194", contaDespesa: "25091", valorMensalReferencia: 2417.02 },

  // Filial: exibir saldos, porém sem cálculo automático enquanto não houver parâmetro histórico seguro.
  { id: "filial-maquinas", nome: "Máquinas e equipamentos — Comercial SP", contasAtivo: ["25154"], contaDepreciacaoAcumulada: "25195", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-inst-industrial", nome: "Instalações industriais — Filial", contasAtivo: ["25155"], contaDepreciacaoAcumulada: "25196", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-moveis-adm", nome: "Móveis e utensílios ADM — Comercial SP", contasAtivo: ["25156"], contaDepreciacaoAcumulada: "25197", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-inst-adm", nome: "Instalações administrativas — Comercial SP", contasAtivo: ["25157"], contaDepreciacaoAcumulada: "25198", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-telefonia", nome: "Equipamentos telefônicos — Comercial SP", contasAtivo: ["25158"], contaDepreciacaoAcumulada: "25199", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-moveis", nome: "Móveis e utensílios — Filial SP 0003", contasAtivo: ["25159"], contaDepreciacaoAcumulada: "25200", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-informatica", nome: "Equipamentos de informática — Filial SP 0003", contasAtivo: ["25160"], contaDepreciacaoAcumulada: "25201", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },

  // Contas patrimoniais visíveis no módulo, mas fora da depreciação automática.
  { id: "terrenos", nome: "Terrenos", contasAtivo: ["1051", "25217"], naoDepreciavel: true, observacao: "Terrenos não entram no cálculo de depreciação." },
  { id: "construcao", nome: "Construção em andamento", contasAtivo: ["25161"], naoDepreciavel: true, observacao: "Sem depreciação enquanto não estiver disponível para uso." },
  { id: "consorcio", nome: "Consórcio de imobilizado", contasAtivo: ["25172"], naoDepreciavel: true, observacao: "Conta patrimonial sem regra de depreciação automática." },
  { id: "apartamento", nome: "Apartamento Sette Casa", contasAtivo: ["25177"], observacao: "Ativo exibido no módulo, mas sem parâmetro mensal histórico seguro cadastrado." },
];

function movimentoConta(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, l) => total + (l.debitoCodigo === codigo ? l.valor : 0) - (l.creditoCodigo === codigo ? l.valor : 0), 0));
}

function saldoConta(base: LancamentoIntegrado[], codigo: string) {
  return arred((saldoAberturaJulhoPorConta.get(codigo) ?? 0) + movimentoConta(base, codigo));
}

export function calcularPosicoesImobilizado(base: LancamentoIntegrado[]) {
  const grupos = regrasImobilizadoNitaplast.map((regra) => {
    const bruto = arred(regra.contasAtivo.reduce((s, c) => s + Math.max(0, saldoConta(base, c)), 0));
    const saldoAcumulada = regra.contaDepreciacaoAcumulada ? saldoConta(base, regra.contaDepreciacaoAcumulada) : 0;
    const depreciacaoAcumulada = arred(Math.max(0, -saldoAcumulada));
    const residual = arred(Math.max(0, bruto - depreciacaoAcumulada));
    const mensalReferencia = regra.valorMensalReferencia ?? 0;
    const depreciacaoCalculada = regra.naoDepreciavel || !regra.valorMensalReferencia ? 0 : arred(Math.min(mensalReferencia, residual));
    const status = regra.naoDepreciavel
      ? "nao_depreciavel"
      : residual <= 0.005
        ? "depreciado"
        : regra.valorMensalReferencia && regra.contaDespesa && regra.contaDepreciacaoAcumulada
          ? "calculavel"
          : "sem_regra";
    return { ...regra, bruto, depreciacaoAcumulada, residual, mensalReferencia, depreciacaoCalculada, status };
  });

  const contas = regrasImobilizadoNitaplast.flatMap((regra) => regra.contasAtivo.map((conta) => ({
    grupoId: regra.id,
    grupo: regra.nome,
    conta,
    descricao: descricaoContaJulho.get(conta) ?? "Conta a revisar",
    saldo: saldoConta(base, conta),
    statusGrupo: regra.naoDepreciavel ? "Não depreciável" : regra.valorMensalReferencia ? "Com regra automática" : "Sem regra automática",
  })));

  return {
    grupos,
    contas,
    totalBruto: arred(grupos.reduce((s, g) => s + g.bruto, 0)),
    totalDepreciacaoAcumulada: arred(grupos.reduce((s, g) => s + g.depreciacaoAcumulada, 0)),
    totalResidual: arred(grupos.reduce((s, g) => s + g.residual, 0)),
    totalDepreciacaoCalculada: arred(grupos.reduce((s, g) => s + g.depreciacaoCalculada, 0)),
    gruposCalculaveis: grupos.filter((g) => g.status === "calculavel").length,
    gruposSemRegra: grupos.filter((g) => g.status === "sem_regra").length,
  } as const;
}

export function calcularDepreciacaoImobilizado(base: LancamentoIntegrado[], data = "31/07/2026") {
  const posicoes = calcularPosicoesImobilizado(base);
  const lancamentos: LancamentoIntegrado[] = posicoes.grupos.flatMap((grupo, index) => {
    if (grupo.status !== "calculavel" || grupo.depreciacaoCalculada <= 0 || !grupo.contaDespesa || !grupo.contaDepreciacaoAcumulada) return [];
    return [{
      id: `JUL-DEP-${String(index + 1).padStart(2, "0")}`,
      data,
      origem: "DEPRECIAÇÃO IMOBILIZADO 07/2026",
      debitoCodigo: grupo.contaDespesa,
      debito: `${grupo.contaDespesa} - ${descricaoContaJulho.get(grupo.contaDespesa) ?? "Conta a revisar"}`,
      creditoCodigo: grupo.contaDepreciacaoAcumulada,
      credito: `${grupo.contaDepreciacaoAcumulada} - ${descricaoContaJulho.get(grupo.contaDepreciacaoAcumulada) ?? "Conta a revisar"}`,
      historico: `Depreciação mensal - ${grupo.nome}`,
      documento: "DEP 07/2026",
      cc: "0",
      centroCusto: "SEM CENTRO DE CUSTO",
      valor: grupo.depreciacaoCalculada,
      status: "validado",
      rastreio: "derivado",
      fonte: "Recorrência de depreciação efetivamente contabilizada em 06/2026 + saldos do imobilizado em 30/06/2026",
      observacao: "Recorrência mensal baseada no valor efetivamente contabilizado em 06/2026, limitada ao saldo residual; sem estimativa de taxa ou vida útil.",
    }];
  });

  return { ...posicoes, lancamentos } as const;
}

export const totalMensalReferenciaDepreciacaoJunho = 57861.02 as const;
