import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho, saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";
import { aberturasCcImplantacaoMaio } from "./nitaplast-balancete-cc-junho";
import { nomesCcFonte } from "./nitaplast-centros-custo-fonte";

const arred = (v: number) => Math.round(v * 100) / 100;
const nomeConta = (codigo: string, fallback?: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? fallback ?? "Conta a revisar"}`;

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
  { id: "moveis-industrial", nome: "Móveis e utensílios industrial", contasAtivo: ["25146"], contaDepreciacaoAcumulada: "25185", contaDespesa: "25081", valorMensalReferencia: 155.58, observacao: "PENDÊNCIA (achado de fechamento): saldo de abertura de maio/2026 traz depreciação acumulada (25185) maior que o custo bruto (25146) em R$ 40.477,88 — residual negativo herdado da implantação, sem lançamento em junho. Investigar origem antes de aprovar o fechamento." },
  { id: "informatica", nome: "Equipamentos de informática", contasAtivo: ["4857"], contaDepreciacaoAcumulada: "25186", contaDespesa: "25082", valorMensalReferencia: 2780.09 },
  {
    id: "veiculos",
    nome: "Veículos",
    contasAtivo: ["1089"],
    contaDepreciacaoAcumulada: "25187",
    contaDespesa: "25083",
    valorMensalReferencia: 14298.16,
    observacao: "Referência de julho exclui Mini Cooper BBU1F77 (R$ 3.298,33/mês) e Corolla AOX3J09 (R$ 2.166,03/mês), alienados em 03/07 e 08/07. Os valores residuais informados pelo cliente já são a base da baixa e não recebem uma nova cota mensal integral de julho.",
  },
  { id: "seguranca", nome: "Equipamentos de segurança", contasAtivo: ["25147"], contaDepreciacaoAcumulada: "25188", observacao: "Sem recorrência mensal em junho; se integralmente depreciado, permanece com cálculo zero. Residual de abertura de maio/2026 é -R$ 0,08 (diferença irrisória de arredondamento, sem impacto material)." },
  { id: "ferramentas", nome: "Ferramentas e acessórios para fábrica", contasAtivo: ["25148"], contaDepreciacaoAcumulada: "25189", contaDespesa: "25084", valorMensalReferencia: 56.97 },
  { id: "benfeitorias", nome: "Benfeitorias em imóveis de terceiros", contasAtivo: ["25149"], contaDepreciacaoAcumulada: "25190", contaDespesa: "25087", valorMensalReferencia: 263.18 },
  { id: "moveis-comercial", nome: "Móveis e utensílios comercial", contasAtivo: ["25150"], contaDepreciacaoAcumulada: "25191", contaDespesa: "25090", valorMensalReferencia: 3.12, observacao: "PENDÊNCIA (achado de fechamento): saldo de abertura de maio/2026 traz depreciação acumulada (25191) maior que o custo bruto (25150) em R$ 9.961,50 — residual negativo herdado da implantação, sem lançamento em junho. Investigar origem antes de aprovar o fechamento." },
  { id: "inst-adm", nome: "Instalações administrativas", contasAtivo: ["25151"], contaDepreciacaoAcumulada: "25192", contaDespesa: "25080", valorMensalReferencia: 331.10 },
  { id: "telefonia", nome: "Equipamentos telefônicos", contasAtivo: ["25152"], contaDepreciacaoAcumulada: "25193", contaDespesa: "25086", valorMensalReferencia: 318.65 },
  { id: "ferramental-extrusao", nome: "Ferramental de extrusão", contasAtivo: ["25153"], contaDepreciacaoAcumulada: "25194", contaDespesa: "25091", valorMensalReferencia: 2417.02 },

  // Filial: exibir saldos, porém sem cálculo automático enquanto não houver parâmetro histórico seguro.
  { id: "filial-maquinas", nome: "Máquinas e equipamentos — Comercial SP", contasAtivo: ["25154"], contaDepreciacaoAcumulada: "25195", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-inst-industrial", nome: "Instalações industriais — Filial", contasAtivo: ["25155"], contaDepreciacaoAcumulada: "25196", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático." },
  { id: "filial-moveis-adm", nome: "Móveis e utensílios ADM — Comercial SP", contasAtivo: ["25156"], contaDepreciacaoAcumulada: "25197", observacao: "Sem parâmetro mensal histórico seguro para cálculo automático. PENDÊNCIA (achado de fechamento): saldo de abertura de maio/2026 traz depreciação acumulada (25197) maior que o custo bruto (25156) em R$ 1.226,48 — residual negativo herdado da implantação, sem lançamento em junho. Investigar origem antes de aprovar o fechamento." },
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

const regraPorContaAtivo = new Map(regrasImobilizadoNitaplast.flatMap((regra) => regra.contasAtivo.map((conta) => [conta, regra] as const)));

/**
 * Inventário de implantação preservado do Balancete por Centro de Custos do
 * Domínio em 31/05/2026. É abertura informativa: não cria lançamento em junho.
 */
export const inventarioImobilizadoImplantacaoMaio = aberturasCcImplantacaoMaio.flatMap(([contaAtivo, cc, saldo]) => {
  const regra = regraPorContaAtivo.get(contaAtivo);
  if (!regra) return [];
  return [{
    id: `${contaAtivo}-${cc}`,
    contaAtivo,
    descricaoContaAtivo: descricaoContaJulho.get(contaAtivo) ?? "Conta a revisar",
    cc,
    bem: nomesCcFonte[cc] ?? "Centro de custo a revisar",
    grupo: regra.nome,
    contaDepreciacaoAcumulada: regra.contaDepreciacaoAcumulada ?? null,
    contaDespesaDepreciacao: regra.contaDespesa ?? null,
    saldoImplantacao: arred(saldo),
    origem: "BALANCETE POR CENTRO DE CUSTOS 05.2026 - NITAPLAST / Domínio",
  }];
});

export const resumoInventarioImobilizadoImplantacaoMaio = {
  itens: inventarioImobilizadoImplantacaoMaio.length,
  contas: new Set(inventarioImobilizadoImplantacaoMaio.map((item) => item.contaAtivo)).size,
  total: arred(inventarioImobilizadoImplantacaoMaio.reduce((s, item) => s + item.saldoImplantacao, 0)),
} as const;

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

export const alienacoesImobilizadoValidadasJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-ALIEN-MINI-REC",
    data: "03/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "25222",
    debito: nomeConta("25222", "Gongra Comercio de Veiculos LTDA"),
    creditoCodigo: "4736",
    credito: nomeConta("4736", "Vendas do Ativo Imobilizado"),
    historico: "Alienação I/MINI COOPER S BBU1F77 - entrada na aquisição do MINI Countryman JCW",
    documento: "NF 93495 / CFOP 5551",
    cc: "422",
    centroCusto: "MINI COOPER PLACA BBU1F77",
    valor: 119900,
    status: "validado",
    rastreio: "documento",
    fonte: "DANFE NF 93495 + CRLV BBU1F77 + ORDEM DE COMPRA Gongra + saldo contábil 30/06",
    observacao: "A NF 93495 de R$ 119.900,00 foi usada como entrada na compra do MINI Countryman de R$ 269.900,00. O saldo de abertura da Gongra na conta 25222 é exatamente R$ 119.900,00; a alienação liquida essa obrigação sem movimentar banco.",
  },
  {
    id: "JUL-ALIEN-MINI-CUSTO",
    data: "03/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "4760",
    debito: "4760 - Custo Vendas do Ativo Imobilizado",
    creditoCodigo: "1089",
    credito: nomeConta("1089", "Veículos"),
    historico: "Baixa líquida do valor contábil residual - MINI COOPER S BBU1F77",
    documento: "NF 93495 / residual cliente",
    cc: "422",
    centroCusto: "MINI COOPER PLACA BBU1F77",
    valor: 52500,
    status: "validado",
    rastreio: "documento",
    fonte: "NF 93495 + CRLV BBU1F77 com anotação de saldo residual fornecida pelo cliente",
    observacao: "O cliente autorizou expressamente considerar a anotação de R$ 52.500,00 como valor contábil residual. Como não há abertura documental segura do custo histórico e da depreciação acumulada do Mini, a baixa patrimonial é registrada pelo residual líquido, sem inventar o desdobramento bruto. Ganho documentado: R$ 67.400,00.",
  },
  {
    id: "JUL-ALIEN-COROLLA-REC",
    data: "08/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "1712",
    debito: nomeConta("1712", "Adiantamento de Clientes"),
    creditoCodigo: "4736",
    credito: nomeConta("4736", "Vendas do Ativo Imobilizado"),
    historico: "Reconhecimento da venda do COROLLA GLI 2.0L AOX3J09",
    documento: "NF 93569 / CFOP 5551",
    cc: "441",
    centroCusto: "COROLLA GLI 2.0L",
    valor: 127000,
    status: "validado",
    rastreio: "documento",
    fonte: "DANFE NF 93569 + ATPV/identificação do veículo + extrato bancário 07/2026",
    observacao: "O recebimento já está no banco de julho em Adiantamento de Clientes; esta partida apenas reclassifica R$ 127.000,00 para a receita de alienação e não duplica caixa.",
  },
  {
    id: "JUL-ALIEN-COROLLA-DEP",
    data: "08/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "25187",
    debito: nomeConta("25187", "(-) Veículos"),
    creditoCodigo: "1089",
    credito: nomeConta("1089", "Veículos"),
    historico: "Baixa da depreciação acumulada - COROLLA GLI 2.0L AOX3J09",
    documento: "NF 93569 / saldo residual cliente",
    cc: "441",
    centroCusto: "COROLLA GLI 2.0L",
    valor: 36822.51,
    status: "validado",
    rastreio: "documento",
    fonte: "SALDO RESIDUAL Corolla + NF 93569",
    observacao: "Custo original R$ 129.961,80 menos residual R$ 93.139,29 = depreciação acumulada de R$ 36.822,51.",
  },
  {
    id: "JUL-ALIEN-COROLLA-CUSTO",
    data: "08/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "4760",
    debito: "4760 - Custo Vendas do Ativo Imobilizado",
    creditoCodigo: "1089",
    credito: nomeConta("1089", "Veículos"),
    historico: "Baixa do valor contábil residual - COROLLA GLI 2.0L AOX3J09",
    documento: "NF 93569 / saldo residual cliente",
    cc: "441",
    centroCusto: "COROLLA GLI 2.0L",
    valor: 93139.29,
    status: "validado",
    rastreio: "documento",
    fonte: "SALDO RESIDUAL Corolla + NF 93569",
    observacao: "Valor residual documentado R$ 93.139,29. Venda R$ 127.000,00; ganho na alienação R$ 33.860,71.",
  },
  {
    id: "JUL-ALIEN-TRANSFORMADOR-REC",
    data: "14/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "25111",
    debito: "25111 - Duplicatas a Receber",
    creditoCodigo: "4736",
    credito: nomeConta("4736", "Vendas do Ativo Imobilizado"),
    historico: "Reconhecimento da venda do Transformador seco 1000KVA",
    documento: "NF 93639",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 60000,
    status: "validado",
    rastreio: "documento",
    fonte: "NF 93639",
    observacao: "Venda em 14/07/2026. Recebimento em parcelas previstas para agosto e setembro/2026; mantido em Duplicatas a Receber até a confirmação bancária.",
  },
  {
    id: "JUL-ALIEN-TRANSFORMADOR-DEP",
    data: "14/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "1147",
    debito: nomeConta("1147", "(-) Máquinas, Aparelhos e Equipamentos"),
    creditoCodigo: "1083",
    credito: nomeConta("1083", "Máquinas, Aparelhos e Equipamentos"),
    historico: "Baixa da depreciação acumulada - Transformador seco 1000KVA",
    documento: "NF 93639 / memória de cálculo da depreciação",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 40377.14,
    status: "validado",
    rastreio: "documento",
    fonte: "Memória de cálculo: depreciação acumulada em 31/05 R$ 39.179,17 + junho R$ 816,80 + 01 a 14/07 (816,80 ÷ 30 × 14) R$ 381,17 = R$ 40.377,14.",
    observacao: "Parcela sem efeito no resultado; reduz o grupo agregado de Máquinas (1083/1147), pois não há ficha patrimonial individual nesta base.",
  },
  {
    id: "JUL-ALIEN-TRANSFORMADOR-CUSTO",
    data: "14/07/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 07/2026",
    debitoCodigo: "4760",
    debito: "4760 - Custo Vendas do Ativo Imobilizado",
    creditoCodigo: "1083",
    credito: nomeConta("1083", "Máquinas, Aparelhos e Equipamentos"),
    historico: "Baixa do valor contábil líquido - Transformador seco 1000KVA",
    documento: "NF 93639 / memória de cálculo da depreciação",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 57638.86,
    status: "validado",
    rastreio: "documento",
    fonte: "Memória de cálculo: custo original R$ 98.016,00 - depreciação acumulada R$ 40.377,14 = valor contábil líquido R$ 57.638,86.",
    observacao: "Valor contábil líquido reconhecido como custo não operacional da baixa. Ganho na venda: R$ 60.000,00 - R$ 57.638,86 = R$ 2.361,14.",
  },
];

export const resumoAlienacoesImobilizadoJulho = {
  vendasReconhecidas: 306900,
  custoResidualReconhecido: 203278.15,
  ganhoReconhecido: 103621.85,
  mini: { venda: 119900, residual: 52500, ganho: 67400 },
  corolla: { venda: 127000, custoOriginal: 129961.80, depreciacaoAcumulada: 36822.51, residual: 93139.29, ganho: 33860.71 },
  transformador: { venda: 60000, custoOriginal: 98016.00, depreciacaoAcumulada: 40377.14, residual: 57638.86, ganho: 2361.14, observacao: "Depreciação acumulada até a venda (14/07): saldo em 31/05 R$ 39.179,17 + junho R$ 816,80 + 01 a 14/07 R$ 381,17 = R$ 40.377,14. Recebimento em parcelas em 08/2026 e 09/2026." },
} as const;

export function calcularDepreciacaoImobilizado(base: LancamentoIntegrado[], data = "31/07/2026") {
  const posicoes = calcularPosicoesImobilizado(base);
  const depreciacoes: LancamentoIntegrado[] = posicoes.grupos.flatMap((grupo, index) => {
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
      observacao: grupo.id === "veiculos"
        ? "Recorrência mensal de veículos ajustada para excluir Mini Cooper BBU1F77 e Corolla AOX3J09, alienados no início de julho e baixados pelos valores residuais documentados."
        : "Recorrência mensal baseada no valor efetivamente contabilizado em 06/2026, limitada ao saldo residual; sem estimativa de taxa ou vida útil.",
    }];
  });

  return { ...posicoes, lancamentos: [...depreciacoes, ...alienacoesImobilizadoValidadasJulho] } as const;
}

export const totalMensalReferenciaDepreciacaoJunho = 57861.02 as const;
