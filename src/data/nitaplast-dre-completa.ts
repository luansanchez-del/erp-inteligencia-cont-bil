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
 * DRE FINAL de 06/2026 para conferência do fechamento.
 *
 * A versão anterior apresentava Custo Total de R$ 1.188.509,50,
 * Resultado Operacional de R$ 215.039,01 e Lucro Líquido de R$ 222.334,87.
 * O ajuste operacional de estoque de R$ 82.536,10, porém, precisa permanecer
 * incorporado ao CPV de junho. Depois dessa correção:
 * - Custo Total: R$ 1.271.045,60;
 * - Resultado Operacional / lucro apurado informado para IRPJ e CSLL: R$ 132.502,91;
 * - Resultado Não Operacional: R$ 7.295,86;
 * - Lucro Líquido final: R$ 139.798,77.
 *
 * A DRE Calculada continua nascendo do Razão/Balancete. Estes valores são a
 * referência final de conferência de junho, preservando o ajuste documentado.
 */
export const dreCompletaJunho: LinhaDre[] = [
  { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: 3402624.71, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "rec-matriz-prod", descricao: "Receita Venda Produção Matriz", valor: 2890314.30, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "rec-matriz-rev", descricao: "Receita Revenda Matriz", valor: 162137.33, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "rec-serv", descricao: "Receita Venda de Serviços", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "rec-filial-prod", descricao: "Receita Venda Produção Filial", valor: 350173.08, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "rec-filial-rev", descricao: "Receita Revenda Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },

  { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: 811074.77, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "dev", descricao: "Devoluções de Produtos", valor: 30997.14, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "desc", descricao: "Descontos Concedidos", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "ipi-m", descricao: "IPI Matriz", valor: 171148.81, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "icms-m", descricao: "ICMS Matriz", valor: 239206.46, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "pis-m", descricao: "PIS Matriz", valor: 47548.49, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "cofins-m", descricao: "COFINS Matriz", valor: 219011.34, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "icms-st", descricao: "ICMS ST", valor: 1496.86, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "icms-f", descricao: "ICMS s/ vendas Filial", valor: 56744.23, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "ipi-f", descricao: "IPI Filial", valor: 20469.32, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "pis-f", descricao: "PIS Filial", valor: 4361.70, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "cofins-f", descricao: "COFINS Filial", valor: 20090.42, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },

  { id: "custos", descricao: "(-) Custo TOTAL", valor: 1271045.60, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026 — ajuste de estoque incorporado ao CPV" },
  { id: "cpv-m", descricao: "(-) CPV Matriz", valor: 1157810.94, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026 — ajuste de estoque incorporado ao CPV", composicaoPendente: true },
  { id: "cmv-m", descricao: "(-) CMV Matriz", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "cpv-f", descricao: "(-) CPV Filial", valor: 113234.66, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "cmv-f", descricao: "(-) CMV Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: 1320504.34, nivel: 0, tipo: "resultado", origem: "DRE FINAL 06/2026 — ajuste de estoque incorporado ao CPV" },

  { id: "despesas", descricao: "(-) Despesas Operacionais", valor: 1256946.43, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "adm", descricao: "Despesas Administrativas", valor: 132400.28, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "nplog", descricao: "Despesas com Serviço - NPLog", valor: 115364.37, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "comerciais", descricao: "Despesas Comerciais", valor: 237639.64, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "producao", descricao: "Despesas Produção", valor: 180057.01, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "veiculos", descricao: "Despesas Veículos", valor: 42644.85, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "barracao", descricao: "Despesas Barracão", valor: 3304.32, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "imobilizado", descricao: "Despesas com Imobilizado", valor: 1429.39, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "industrializacao", descricao: "Despesas com Industrialização", valor: 394965.03, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "tributarias", descricao: "Despesas Tributárias", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "comercial-sp", descricao: "Despesas comercial SP", valor: 40095.68, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "fin-liq", descricao: "Despesas Financeiras Líquidas", valor: 109045.86, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "fin-desp", descricao: "Despesas Financeiras", valor: 153961.84, nivel: 2, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "fin-rec", descricao: "(-) Receitas Financeiras", valor: -44915.98, nivel: 2, tipo: "credito", origem: "DRE FINAL 06/2026", composicaoPendente: true },

  { id: "credito-pis", descricao: "(-) PIS não cumulativo s/despesas", valor: -12298.30, nivel: 1, tipo: "credito", origem: "DRE FINAL 06/2026" },
  { id: "credito-cofins", descricao: "(-) COFINS não cumulativo s/despesas", valor: -56646.70, nivel: 1, tipo: "credito", origem: "DRE FINAL 06/2026" },
  { id: "despesas-liquidas", descricao: "TOTAL DAS DESPESAS OPERACIONAIS", valor: 1188001.43, nivel: 0, tipo: "resultado", origem: "DRE FINAL 06/2026" },
  { id: "resultado-op", descricao: "Resultado Operacional", valor: 132502.91, nivel: 0, tipo: "resultado", origem: "DRE FINAL 06/2026 — após ajuste de estoque no CPV" },

  { id: "nao-op", descricao: "RESULTADO NÃO OPERACIONAL", valor: 7295.86, nivel: 0, tipo: "grupo", origem: "DRE FINAL 06/2026" },
  { id: "alienacao", descricao: "Receita de Alienação Imobilizado", valor: 7295.86, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026", composicaoPendente: true },
  { id: "baixa", descricao: "Custo na Baixa/Alienação Imobilizado", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "prov-ant", descricao: "Provisão para Custos - meses anteriores", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "prov-abr", descricao: "Provisão para Custos - Abril/2026", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "rec-vinter", descricao: "Recuperação de Despesas Vinter", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "sinistros", descricao: "Ganhos ou Perdas com Sinistros de Bens", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "outras", descricao: "Outras Receitas não Operacionais", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "equiv", descricao: "Resultado da Equivalência Patrimonial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE FINAL 06/2026" },
  { id: "lucro-liq", descricao: "LUCRO LÍQUIDO", valor: 139798.77, nivel: 0, tipo: "resultado", origem: "DRE FINAL 06/2026 — após ajuste de estoque e resultado não operacional" },
  { id: "base-ir", descricao: "LUCRO APURADO PARA IRPJ E CSLL", valor: 132502.91, nivel: 0, tipo: "informativo", origem: "DRE FINAL 06/2026" },
  { id: "ajuste-jul", descricao: "Ajuste de estoque incorporado ao CPV de 06/2026", valor: 82536.10, nivel: 0, tipo: "informativo", origem: "DRE FINAL 06/2026 — ajuste contabilizado no fechamento; não repetir em 07/2026" },
];

export const idsDespesasOperacionais = [
  "adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "fin-liq",
] as const;
