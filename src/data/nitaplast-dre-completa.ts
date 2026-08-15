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

export const dreCompletaJunho: LinhaDre[] = [
  { id: "receita", descricao: "(+) Receita Operacional Bruta", valor: 3402624.71, nivel: 0, tipo: "grupo", origem: "DRE JUN 26 / Saídas" },
  { id: "rec-matriz-prod", descricao: "Receita Venda Produção Matriz", valor: 2890314.3, nivel: 1, tipo: "detalhe", origem: "Saídas matriz" },
  { id: "rec-matriz-rev", descricao: "Receita Revenda Matriz", valor: 162137.33, nivel: 1, tipo: "detalhe", origem: "Saídas matriz" },
  { id: "rec-serv", descricao: "Receita Venda de Serviços", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "rec-filial-prod", descricao: "Receita Venda Produção Filial", valor: 350173.08, nivel: 1, tipo: "detalhe", origem: "Saídas filial" },
  { id: "rec-filial-rev", descricao: "Receita Revenda Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },

  { id: "deducoes", descricao: "(-) Deduções da Receita Bruta", valor: 811074.77, nivel: 0, tipo: "grupo", origem: "Apurações fiscais / Devoluções" },
  { id: "dev", descricao: "Devoluções de Produtos", valor: 30997.14, nivel: 1, tipo: "detalhe", origem: "Relatório de devoluções" },
  { id: "desc", descricao: "Descontos Concedidos", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "ipi-m", descricao: "IPI Matriz", valor: 171148.81, nivel: 1, tipo: "detalhe", origem: "Apuração IPI" },
  { id: "icms-m", descricao: "ICMS Matriz", valor: 239206.46, nivel: 1, tipo: "detalhe", origem: "Apuração ICMS" },
  { id: "pis-m", descricao: "PIS Matriz", valor: 47548.49, nivel: 1, tipo: "detalhe", origem: "Apuração PIS" },
  { id: "cofins-m", descricao: "COFINS Matriz", valor: 219011.34, nivel: 1, tipo: "detalhe", origem: "Apuração COFINS" },
  { id: "icms-st", descricao: "ICMS ST", valor: 1496.86, nivel: 1, tipo: "detalhe", origem: "Apuração ICMS-ST" },
  { id: "icms-f", descricao: "ICMS sobre vendas Filial", valor: 56744.23, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "ipi-f", descricao: "IPI Filial", valor: 20469.32, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "pis-f", descricao: "PIS Filial", valor: 4361.7, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "cofins-f", descricao: "COFINS Filial", valor: 20090.42, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },

  { id: "custos", descricao: "(-) Custo Total", valor: 1188509.500835063, nivel: 0, tipo: "grupo", origem: "DRE JUN 26 / Estoques" },
  { id: "cpv-m", descricao: "CPV Matriz", valor: 1075274.84, nivel: 1, tipo: "detalhe", origem: "Inventário e custo matriz", composicaoPendente: true },
  { id: "cmv-m", descricao: "CMV Matriz", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "cpv-f", descricao: "CPV Filial", valor: 113234.660835063, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26", composicaoPendente: true },
  { id: "cmv-f", descricao: "CMV Filial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "lucro-bruto", descricao: "Lucro Bruto", valor: 1403040.439164937, nivel: 0, tipo: "resultado", origem: "Receita - Deduções - Custos" },

  { id: "despesas", descricao: "(-) Despesas Operacionais antes dos créditos", valor: 1256946.43, nivel: 0, tipo: "grupo", origem: "DRE JUN 26 / Razão" },
  { id: "adm", descricao: "Despesas Administrativas", valor: 132400.28, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "nplog", descricao: "Despesas com Serviço - NPLog", valor: 115364.37, nivel: 1, tipo: "detalhe", origem: "Notas NPLog / partes relacionadas" },
  { id: "comerciais", descricao: "Despesas Comerciais", valor: 237639.64, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "producao", descricao: "Despesas Produção", valor: 180057.01, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "veiculos", descricao: "Despesas Veículos", valor: 42644.85, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "barracao", descricao: "Despesas Barracão", valor: 3304.32, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "imobilizado", descricao: "Despesas com Imobilizado", valor: 1429.39, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Razão", composicaoPendente: true },
  { id: "industrializacao", descricao: "Despesas com Industrialização", valor: 394965.03, nivel: 1, tipo: "detalhe", origem: "R$ 505.473,68 - R$ 110.508,65", composicaoPendente: true },
  { id: "tributarias", descricao: "Despesas Tributárias", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "comercial-sp", descricao: "Despesas Comercial SP", valor: 40095.68, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / filial", composicaoPendente: true },
  { id: "fin-liq", descricao: "Despesas Financeiras Líquidas", valor: 109045.86, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26 / Financeiro" },
  { id: "fin-desp", descricao: "Despesas Financeiras", valor: 153961.84, nivel: 2, tipo: "detalhe", origem: "R$ 145.591,94 + R$ 8.369,90", composicaoPendente: true },
  { id: "fin-rec", descricao: "(-) Receitas Financeiras", valor: -44915.98, nivel: 2, tipo: "credito", origem: "R$ 19.119,03 + R$ 25.796,95", composicaoPendente: true },

  { id: "credito-pis", descricao: "(-) Crédito PIS não cumulativo sobre despesas", valor: -12298.296750344, nivel: 1, tipo: "credito", origem: "Planilha JUN 26" },
  { id: "credito-cofins", descricao: "(-) Crédito COFINS não cumulativo sobre despesas", valor: -56646.703102411, nivel: 1, tipo: "credito", origem: "Planilha JUN 26" },
  { id: "despesas-liquidas", descricao: "Total das Despesas Operacionais", valor: 1188001.430147246, nivel: 0, tipo: "resultado", origem: "Despesas - créditos PIS/COFINS" },
  { id: "resultado-op", descricao: "Resultado Operacional", valor: 215039.009017691, nivel: 0, tipo: "resultado", origem: "Lucro bruto - despesas operacionais" },

  { id: "nao-op", descricao: "Resultado Não Operacional", valor: 7295.86, nivel: 0, tipo: "grupo", origem: "DRE JUN 26" },
  { id: "alienacao", descricao: "Receita de Alienação de Imobilizado", valor: 7295.86, nivel: 1, tipo: "detalhe", origem: "R$ 2.295,86 + R$ 5.000,00", composicaoPendente: true },
  { id: "baixa", descricao: "Custo na Baixa/Alienação de Imobilizado", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "prov-ant", descricao: "Provisão para Custos - meses anteriores", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "prov-abr", descricao: "Provisão para Custos - abril/2026", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "rec-vinter", descricao: "Recuperação de Despesas Vinter", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "sinistros", descricao: "Ganhos ou Perdas com Sinistros de Bens", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "outras", descricao: "Outras Receitas não Operacionais", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "equiv", descricao: "Resultado da Equivalência Patrimonial", valor: 0, nivel: 1, tipo: "detalhe", origem: "DRE JUN 26" },
  { id: "lucro-liq", descricao: "Lucro Líquido", valor: 222334.869017691, nivel: 0, tipo: "resultado", origem: "Resultado operacional + não operacional" },
  { id: "base-ir", descricao: "Lucro apurado para IRPJ e CSLL", valor: 132502.909017691, nivel: 0, tipo: "informativo", origem: "DRE JUN 26" },
  { id: "ajuste-jul", descricao: "Ajuste operacional indicado para 07/2026", valor: 82536.1, nivel: 0, tipo: "informativo", origem: "Planilha enviada" },
];

export const idsDespesasOperacionais = [
  "adm", "nplog", "comerciais", "producao", "veiculos", "barracao", "imobilizado", "industrializacao", "tributarias", "comercial-sp", "fin-liq",
] as const;
