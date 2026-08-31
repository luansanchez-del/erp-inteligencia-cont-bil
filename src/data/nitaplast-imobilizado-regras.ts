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
 *
 * Extraído de nitaplast-imobilizado.ts para não depender de nitaplast-saldos-julho
 * (que importa nitaplast-razao-integrado.ts) — evita ciclo de import para consumidores
 * que precisam das regras antes do fechamento de julho, como nitaplast-depreciacao-junho.ts.
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
