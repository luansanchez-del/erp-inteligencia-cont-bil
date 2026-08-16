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
 * DRE ENVIADA de 06/2026.
 * Esta base é referência fixa de conferência e não deve ser recalculada pelo Razão.
 * A DRE Calculada é construída separadamente a partir do Razão/Balancete e comparada contra estes valores.
 */
export const dreCompletaJunho: LinhaDre[] = [
  { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: 3402624.71, nivel: 0, tipo: "grupo", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-matriz-prod", descricao: "Receita Venda Produção Matriz", valor: 2890314.30, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-matriz-rev", descricao: "Receita Revenda Matriz", valor: 162137.33, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-serv", descricao: "Receita Venda de Serviços", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-filial-prod", descricao: "Receita Venda Produção Filial", valor: 350173.08, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-filial-rev", descricao: "Receita Revenda Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },

  { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: 811074.77, nivel: 0, tipo: "grupo", origem: "DRE ENVIADA 06/2026" },
  { id: "dev", descricao: "Devoluções de Produtos", valor: 30997.14, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "desc", descricao: "Descontos Concedidos", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "ipi-m", descricao: "IPI Matriz", valor: 171148.81, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "icms-m", descricao: "ICMS Matriz", valor: 239206.46, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "pis-m", descricao: "PIS Matriz", valor: 47548.49, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "cofins-m", descricao: "COFINS Matriz", valor: 219011.34, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "icms-st", descricao: "ICMS ST", valor: 1496.86, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "icms-f", descricao: "ICMS s/ vendas Filial", valor: 56744.23, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "ipi-f", descricao: "IPI Filial", valor: 20469.32, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "pis-f", descricao: "PIS Filial", valor: 4361.70, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "cofins-f", descricao: "COFINS Filial", valor: 20090.42, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },

  { id: "custos", descricao: "(-) Custo TOTAL", valor: 1188509.50, nivel: 0, tipo: "grupo", origem: "DRE ENVIADA 06/2026" },
  { id: "cpv-m", descricao: "(-) CPV Matriz", valor: 1075274.84, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "cmv-m", descricao: "(-) CMV Matriz", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "cpv-f", descricao: "(-) CPV Filial", valor: 113234.66, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "cmv-f", descricao: "(-) CMV Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "lucro-bruto", descricao: "LUCRO BRUTO", valor: 1403040.44, nivel: 0, tipo: "resultado", origem: "DRE ENVIADA 06/2026" },

  { id: "despesas", descricao: "(-) Despesas Operacionais", valor: 1256946.43, nivel: 0, tipo: "grupo", origem: "DRE ENVIADA 06/2026" },
  { id: "adm", descricao: "Despesas Administrativas", valor: 132400.28, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "nplog", descricao: "Despesas com Serviço - NPLog", valor: 115364.37, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "comerciais", descricao: "Despesas Comerciais", valor: 237639.64, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "producao", descricao: "Despesas Produção", valor: 180057.01, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "veiculos", descricao: "Despesas Veículos", valor: 42644.85, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "barracao", descricao: "Despesas Barracão", valor: 3304.32, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "imobilizado", descricao: "Despesas com Imobilizado", valor: 1429.39, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "industrializacao", descricao: "Despesas com Industrialização", valor: 394965.03, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "tributarias", descricao: "Despesas Tributárias", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "comercial-sp", descricao: "Despesas comercial SP", valor: 40095.68, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "fin-liq", descricao: "Despesas Financeiras Líquidas", valor: 109045.86, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "fin-desp", descricao: "Despesas Financeiras", valor: 153961.84, nivel: 2, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "fin-rec", descricao: "(-) Receitas Financeiras", valor: -44915.98, nivel: 2, tipo: "credito", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },

  { id: "credito-pis", descricao: "(-) PIS não cumulativo s/despesas", valor: -12298.30, nivel: 1, tipo: "credito", origem: "DRE ENVIADA 06/2026" },
  { id: "credito-cofins", descricao: "(-) COFINS não cumulativo s/despesas", valor: -56646.70, nivel: 1, tipo: "credito", origem: "DRE ENVIADA 06/2026" },
  { id: "despesas-liquidas", descricao: "TOTAL DAS DESPESAS OPERACIONAIS", valor: 1188001.43, nivel: 0, tipo: "resultado", origem: "DRE ENVIADA 06/2026" },
  { id: "resultado-op", descricao: "Resultado Operacional", valor: 215039.01, nivel: 0, tipo: "resultado", origem: "DRE ENVIADA 06/2026" },

  { id: "nao-op", descricao: "RESULTADO NÃO OPERACIONAL", valor: 7295.86, nivel: 0, tipo: "grupo", origem: "DRE ENVIADA 06/2026" },
  { id: "alienacao", descricao: "Receita de Alienação Imobilizado", valor: 7295.86, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026", composicaoPendente: true },
  { id: "baixa", descricao: "Custo na Baixa/Alienação Imobilizado", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "prov-ant", descricao: "Provisão para Custos - meses anteriores", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "prov-abr", descricao: "Provisão para Custos - Abril/2026", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "rec-vinter", descricao: "Recuperação de Despesas Vinter", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "sinistros", descricao: "Ganhos ou Perdas com Sinistros de Bens", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "outras", descricao: "Outras Receitas não Operacionais", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "equiv", descricao: "Resultado da Equivalência Patrimonial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE ENVIADA 06/2026" },
  { id: "lucro-liq", descricao: "LUCRO LÍQUIDO", valor: 222334.87, nivel: 0, tipo: "resultado", origem: "DRE ENVIADA 06/2026" },
  { id: "base-ir", descricao: "LUCRO APURADO PARA IRPJ E CSLL", valor: 132502.91, nivel: 0, tipo: "informativo", origem: "DRE ENVIADA 06/2026" },
  { id: "ajuste-jul", descricao: "Ajuste operacional informado no período 06/2026", valor: 82536.10, nivel: 0, tipo: "informativo", origem: "DRE ENVIADA 06/2026 — observação de conferência; não contabilizar automaticamente" },
];

export const idsDespesasOperacionais = [
  "adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "fin-liq",
] as const;
