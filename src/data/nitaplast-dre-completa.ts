export type LinhaDre = {
  id: string;
  descricao: string;
  valor: number;
  nivel: 0 | 1 | 2;
  tipo: "grupo" | "detalhe" | "resultado" | "credito" | "informativo";
  origem: string;
  composicaoPendente?: boolean;
};

export const cadastroFiscalNitaplast = {
  regimeTributario: "Lucro Real",
  formaApuracaoIrpjCsll: "Estimativa mensal",
  confirmadoPeloCliente: true,
} as const;

export const receitaBrutaJunho = 3402624.71;

/**
 * DRE de referência de 06/2026 conforme composição contábil validada.
 *
 * Regra: Razão -> Balancete -> DRE.
 * O CPV é composto somente pelas contas 25944 e 25945 já contabilizadas.
 * Não existe ajuste adicional de R$ 82.536,10 na DRE.
 *
 * Referência de 06/2026:
 * - Receita Bruta: R$ 3.402.624,71;
 * - Deduções: R$ 811.074,77;
 * - Receita Líquida: R$ 2.591.549,94;
 * - CPV/CMV: R$ 1.271.045,60;
 * - Lucro Bruto: R$ 1.320.504,34;
 * - Despesas Operacionais Líquidas: R$ 1.188.001,43;
 * - Resultado Operacional: R$ 132.502,91;
 * - Resultado Não Operacional: R$ 7.295,86;
 * - Lucro Líquido: R$ 139.798,77.
 *
 * Despesas Produção inclui o complemento contábil de R$ 595,38 (lançamento
 * DESP-FECH-PRODUCAO-062026, já existente no Razão) que fecha a competência:
 * R$ 179.461,63 + R$ 595,38 = R$ 180.057,01. Ver nitaplast-dre-detalhada-v7.ts
 * e conferido contra a DRE enviada ao cliente (Lucro Líquido R$ 139.798,77).
 */
export const dreCompletaJunho: LinhaDre[] = [
  { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: 3402624.71, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "rec-matriz-prod", descricao: "2606 · Vendas de Produtos a Prazo", valor: 2840574.32, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "rec-st", descricao: "25025 · Mercado Interno com ST", valor: 7619.18, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "rec-vista", descricao: "2629 · Vendas de Produtos a Vista", valor: 57415.55, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "rec-matriz-rev", descricao: "2655 · Vendas de Mercadorias a Prazo", valor: 497015.66, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },

  { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: 811074.77, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "dev", descricao: "25943 · DEVOLUÇÃO DE PRODUTOS", valor: 30997.14, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "ipi-m", descricao: "2826 · (-) IPI", valor: 171148.81, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "icms-m", descricao: "2827 · (-) ICMS", valor: 239206.46, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "pis-m", descricao: "2829 · PIS sobre vendas — Matriz", valor: 47548.49, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "pis-f", descricao: "2829 · PIS sobre vendas — Filial", valor: 4361.70, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "cofins-m", descricao: "2830 · COFINS sobre vendas — Matriz", valor: 219011.34, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "cofins-f", descricao: "2830 · COFINS sobre vendas — Filial", valor: 20090.42, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "icms-st", descricao: "2832 · (-) ICMS Substiruição Tributária", valor: 1496.86, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "icms-f", descricao: "25054 · ICMS S/ VENDAS FILIAL", valor: 56744.23, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "ipi-f", descricao: "25055 · IPI FATURADO - FILIAL SÃO PAULO", valor: 20469.32, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "receita-liquida", descricao: "Receita Operacional Líquida", valor: 2591549.94, nivel: 0, tipo: "resultado", origem: "RAZÃO/BALANCETE 06/2026" },

  { id: "custos", descricao: "(-) Custos / CPV / CMV", valor: 1271045.60, nivel: 0, tipo: "grupo", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "cpv-m", descricao: "25944 · Custos de produtos vendidos", valor: 1157810.94, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "cpv-f", descricao: "25945 · Custos de Produtos Vendidos - Filial", valor: 113234.66, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: 1320504.34, nivel: 0, tipo: "resultado", origem: "RAZÃO/BALANCETE 06/2026" },

  { id: "despesas", descricao: "(-) Despesas Operacionais antes dos créditos", valor: 1256946.43, nivel: 0, tipo: "grupo", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "adm", descricao: "Despesas Administrativas", valor: 132400.28, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "nplog", descricao: "Despesas com Serviço - NPLog", valor: 115364.37, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "comerciais", descricao: "Despesas Comerciais", valor: 237639.64, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "producao", descricao: "Despesas Produção", valor: 180057.01, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "veiculos", descricao: "Despesas Veículos", valor: 42644.85, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "barracao", descricao: "Despesas Barracão", valor: 3304.32, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "imobilizado", descricao: "Despesas com Imobilizado", valor: 1429.39, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "industrializacao", descricao: "Despesas com Industrialização", valor: 394965.03, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "tributarias", descricao: "Despesas Tributárias", valor: 0, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "comercial-sp", descricao: "Despesas Comercial SP", valor: 40095.68, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "fin-liq", descricao: "Despesas Financeiras Líquidas", valor: 109045.86, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "fin-desp", descricao: "(-) Despesas Financeiras", valor: 153961.84, nivel: 2, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },
  { id: "fin-rec", descricao: "(+) Receitas Financeiras", valor: -44915.98, nivel: 2, tipo: "credito", origem: "RAZÃO/BALANCETE 06/2026", composicaoPendente: true },

  { id: "credito-pis", descricao: "(-) Crédito de PIS sobre custos e despesas", valor: -12298.30, nivel: 1, tipo: "credito", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "credito-cofins", descricao: "(-) Crédito de COFINS sobre custos e despesas", valor: -56646.70, nivel: 1, tipo: "credito", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "despesas-liquidas", descricao: "Total Despesas Operacionais Líquidas", valor: 1188001.43, nivel: 0, tipo: "resultado", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "resultado-op", descricao: "RESULTADO OPERACIONAL", valor: 132502.91, nivel: 0, tipo: "resultado", origem: "RAZÃO/BALANCETE 06/2026" },

  { id: "nao-op", descricao: "Resultado Não Operacional", valor: 7295.86, nivel: 0, tipo: "grupo", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "alienacao", descricao: "4736 · Vendas do Ativo Imobilizado", valor: 15000.00, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "baixa", descricao: "4760 · Custo Vendas do Ativo Imobilizado", valor: 7704.14, nivel: 1, tipo: "detalhe", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "lucro-liq", descricao: "LUCRO / PREJUÍZO LÍQUIDO", valor: 139798.77, nivel: 0, tipo: "resultado", origem: "RAZÃO/BALANCETE 06/2026" },
  { id: "base-ir", descricao: "LUCRO APURADO PARA IRPJ E CSLL", valor: 132502.91, nivel: 0, tipo: "informativo", origem: "RAZÃO/BALANCETE 06/2026" },
];

export const idsDespesasOperacionais = [
  "adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "fin-liq",
] as const;
