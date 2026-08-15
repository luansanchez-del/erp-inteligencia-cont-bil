export type LancamentoSimulado = {
  id: string;
  data: string;
  origem: string;
  debito: string;
  credito: string;
  historico: string;
  valor: number;
  status: "validado" | "revisar";
};

const dep = [
  ["5193 - Depreciação de máquinas", "612 - Depreciação acumulada de máquinas", 26745.98],
  ["5207 - Depreciação de instalações", "620 - Depreciação acumulada de instalações", 1916.57],
  ["5215 - Depreciação de móveis e utensílios", "639 - Depreciação acumulada móveis ADM", 3110.24],
  ["5215 - Depreciação de móveis e utensílios", "647 - Depreciação acumulada móveis industrial", 155.58],
  ["5223 - Depreciação de informática", "655 - Depreciação acumulada informática", 2780.09],
  ["5231 - Depreciação de veículos", "663 - Depreciação acumulada veículos", 19762.52],
  ["5258 - Depreciação de ferramentas", "680 - Depreciação acumulada ferramentas", 56.97],
  ["10103 - Depreciação benfeitorias", "4448 - Depreciação acumulada benfeitorias", 263.18],
  ["5215 - Depreciação de móveis e utensílios", "6114 - Depreciação acumulada móveis comercial", 3.12],
  ["5207 - Depreciação de instalações", "6513 - Depreciação acumulada instalações ADM", 331.1],
  ["8842 - Depreciação equipamentos telefônicos", "8850 - Depreciação acumulada telefônicos", 318.65],
  ["5258 - Depreciação de ferramentas", "12688 - Depreciação acumulada ferramental extrusão", 2417.02],
] as const;

const base: Array<Omit<LancamentoSimulado, "id" | "data">> = [
  { origem: "Saídas", debito: "Clientes", credito: "Receita venda produção - matriz", historico: "Vendas de produção da matriz - 06/2026", valor: 2890314.3, status: "validado" },
  { origem: "Saídas", debito: "Clientes", credito: "Receita de revenda - matriz", historico: "Revendas da matriz - 06/2026", valor: 162137.33, status: "validado" },
  { origem: "Saídas filial", debito: "Clientes - filial", credito: "Receita venda produção - filial", historico: "Vendas de produção da filial - 06/2026", valor: 350173.08, status: "validado" },
  { origem: "Devoluções", debito: "Devoluções de produtos", credito: "Clientes", historico: "Devoluções de vendas da competência", valor: 30997.14, status: "validado" },
  { origem: "IPI", debito: "IPI sobre vendas - matriz", credito: "IPI a recolher", historico: "Apuração do IPI - matriz", valor: 171148.81, status: "validado" },
  { origem: "ICMS", debito: "ICMS sobre vendas - matriz", credito: "ICMS a recolher", historico: "Apuração do ICMS - matriz", valor: 239206.46, status: "validado" },
  { origem: "PIS", debito: "PIS sobre vendas - matriz", credito: "PIS a recolher", historico: "Apuração do PIS - matriz", valor: 47548.49, status: "validado" },
  { origem: "COFINS", debito: "COFINS sobre vendas - matriz", credito: "COFINS a recolher", historico: "Apuração da COFINS - matriz", valor: 219011.34, status: "validado" },
  { origem: "ICMS-ST", debito: "ICMS-ST sobre vendas", credito: "ICMS-ST a recolher", historico: "Apuração do ICMS-ST", valor: 1496.86, status: "validado" },
  { origem: "Tributos filial", debito: "Tributos sobre vendas - filial", credito: "Tributos a recolher - filial", historico: "ICMS, IPI, PIS e COFINS da filial", valor: 101665.67, status: "validado" },
  { origem: "Estoque", debito: "CPV - matriz", credito: "Estoques", historico: "Custo dos produtos vendidos - matriz", valor: 1075274.84, status: "validado" },
  { origem: "Estoque filial", debito: "CPV - filial", credito: "Estoques - filial", historico: "Custo dos produtos vendidos - filial", valor: 113234.660835063, status: "validado" },
  { origem: "Partes relacionadas", debito: "Despesa com serviços - NPLog", credito: "Fornecedor NPLog", historico: "Serviços NPLog da competência", valor: 115364.37, status: "validado" },
  { origem: "Despesas", debito: "Despesas operacionais a compor por conta/CC", credito: "Fornecedores e obrigações", historico: "Demais despesas operacionais, excluídos NPLog e depreciação", valor: 974675.18, status: "revisar" },
  { origem: "JCP", debito: "6181 - Juros sobre capital próprio", credito: "6180 - Marcos Victor Siedel - JCP", historico: "Juros remuneratórios sobre capital próprio - 06/2026", valor: 140469.22, status: "validado" },
  { origem: "Financeiro", debito: "Outras despesas financeiras", credito: "Bancos e obrigações financeiras", historico: "Despesas financeiras sem JCP", valor: 13492.62, status: "revisar" },
  { origem: "Financeiro", debito: "Bancos e aplicações", credito: "Receitas financeiras", historico: "Rendimentos e demais receitas financeiras", valor: 44915.98, status: "validado" },
  { origem: "Crédito PIS", debito: "PIS a recuperar", credito: "Créditos de PIS sobre despesas", historico: "Crédito não cumulativo de PIS sobre despesas", valor: 12298.296750344, status: "validado" },
  { origem: "Crédito COFINS", debito: "COFINS a recuperar", credito: "Créditos de COFINS sobre despesas", historico: "Crédito não cumulativo de COFINS sobre despesas", valor: 56646.703102411, status: "validado" },
];

export const lancamentosJunho: LancamentoSimulado[] = [
  ...base.map((l, i) => ({ ...l, id: `J${String(i + 1).padStart(3, "0")}`, data: "30/06/2026" })),
  ...dep.map(([debito, credito, valor], i) => ({
    id: `D${String(i + 1).padStart(3, "0")}`,
    data: "30/06/2026",
    origem: "Depreciação",
    debito,
    credito,
    historico: "Depreciação de junho conforme padrão individual do razão de maio",
    valor,
    status: "revisar" as const,
  })),
];

export const dreControle = [
  { grupo: "Receita", descricao: "Receita operacional bruta", valor: 3402624.71, controle: 3402624.71 },
  { grupo: "Deduções", descricao: "Deduções da receita bruta", valor: 811074.77, controle: 811074.77 },
  { grupo: "Custos", descricao: "Custo total", valor: 1188509.500835063, controle: 1188509.500835063 },
  { grupo: "Resultado", descricao: "Lucro bruto", valor: 1403040.439164937, controle: 1403040.439164937 },
  { grupo: "Despesas", descricao: "Despesas operacionais antes dos créditos", valor: 1256946.43, controle: 1256946.43 },
  { grupo: "Créditos", descricao: "Créditos PIS/COFINS sobre despesas", valor: 68944.999852755, controle: 68944.999852755 },
  { grupo: "Resultado", descricao: "Resultado operacional", valor: 215039.009017692, controle: 215039.009017692 },
];

export const balanceteProvisorio = [
  { conta: "1", descricao: "ATIVO - saldo de implantação", anterior: 40828008.01, debito: 68944.999852755, credito: 0, atual: 40896953.00985276, natureza: "D" },
  { conta: "2", descricao: "PASSIVO E PATRIMÔNIO LÍQUIDO - implantação", anterior: 40252789.33, debito: 0, credito: 0, atual: 40252789.33, natureza: "C" },
  { conta: "3", descricao: "RECEITAS ACUMULADAS JAN-MAI", anterior: 8163769.32, debito: 0, credito: 0, atual: 8163769.32, natureza: "C" },
  { conta: "4", descricao: "CUSTOS E DESPESAS ACUMULADOS JAN-MAI", anterior: 7588550.64, debito: 0, credito: 0, atual: 7588550.64, natureza: "D" },
  { conta: "3.1", descricao: "Receitas e créditos de junho", anterior: 0, debito: 0, credito: 3516485.689852755, atual: 3516485.689852755, natureza: "C" },
  { conta: "4.1", descricao: "Deduções, custos e despesas de junho", anterior: 0, debito: 3301446.680835064, credito: 0, atual: 3301446.680835064, natureza: "D" },
  { conta: "5", descricao: "RESULTADO OPERACIONAL DE JUNHO", anterior: 0, debito: 0, credito: 215039.009017692, atual: 215039.009017692, natureza: "C" },
];

export const totalDebitos = lancamentosJunho.reduce((s, l) => s + l.valor, 0);
export const totalCreditos = totalDebitos;
