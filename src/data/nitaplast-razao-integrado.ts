import { movimentosFinanceiros } from "./nitaplast-movimento-financeiro";
import { saldosImplantacao } from "./nitaplast-implantacao";

export type LancamentoIntegrado = {
  id: string;
  data: string;
  origem: string;
  debitoCodigo: string;
  debito: string;
  creditoCodigo: string;
  credito: string;
  historico: string;
  documento: string;
  cc: string;
  centroCusto: string;
  valor: number;
  status: "validado" | "revisar";
  observacao: string;
};

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

// De/para entre os códigos bancários do movimento financeiro de junho e o plano contábil do balancete.
export const contaPorBanco: Record<string, string> = {
  B00002: "25035",
  B00003: "25110",
  B00100: "10",
  B23700: "9",
  B23702: "25001",
  B34100: "11",
  B34101: "25002",
};

const contrapartidaPorEvento: Record<string, string> = {
  "1": "25111",
  "7": "2859",
  "12": "1712",
  "101": "1496",
  "104": "25104",
  "110": "1634",
  "111": "312",
  "125": "1634",
  "127": "1496",
  "131": "25221",
  "132": "25221",
  "190": "4885",
  "199": "1496",
  "203": "25221",
  "204": "25116",
  "242": "25219",
  "251": "25221",
};

const centroCusto: Record<string, string> = {
  "0": "SEM CENTRO DE CUSTO",
  "201": "VENDAS",
  "203": "FATURAMENTO",
  "206": "EXPORTAÇÃO",
  "210": "MARKETING",
  "301": "RECEPÇÃO",
  "302": "FINANCEIRO",
  "304": "ADM GERAL",
  "902": "DESPESAS FINANCEIRAS",
};

const cdc = (codigo: string) => centroCusto[codigo] ?? "SEM CENTRO DE CUSTO";

function outroBanco(historico: string, atual: string) {
  return historico.match(/B\d{5}/g)?.find((codigo) => codigo !== atual);
}

const bancarios: LancamentoIntegrado[] = movimentosFinanceiros.flatMap((movimento, index) => {
  const bancoCodigo = contaPorBanco[movimento.banco];
  if (!bancoCodigo) return [];
  const bancoContrapartida = movimento.codigo === "96" ? contaPorBanco[outroBanco(movimento.historico, movimento.banco) ?? ""] : undefined;
  const contrapartidaCodigo = bancoContrapartida ?? contrapartidaPorEvento[movimento.codigo] ?? "25221";
  const entrada = movimento.tipo === "credito";
  const revisar = ["131", "132", "203"].includes(movimento.codigo) || !bancoContrapartida && movimento.codigo === "96";
  return [{
    id: `BAN-${String(index + 1).padStart(5, "0")}`,
    data: movimento.data,
    origem: "MOVIMENTAÇÃO BANCÁRIA 06/2026",
    debitoCodigo: entrada ? bancoCodigo : contrapartidaCodigo,
    debito: nomeConta(entrada ? bancoCodigo : contrapartidaCodigo),
    creditoCodigo: entrada ? contrapartidaCodigo : bancoCodigo,
    credito: nomeConta(entrada ? contrapartidaCodigo : bancoCodigo),
    historico: movimento.historico,
    documento: movimento.codigo,
    cc: "0",
    centroCusto: cdc("0"],
    valor: movimento.valor,
    status: revisar ? "revisar" as const : "validado" as const,
    observacao: revisar ? "Contrapartida sugerida; confirmar antes da exportação." : "Vinculado pelo código do evento e pela conta bancária de origem.",
  }];
});

const depreciacoes = [
  ["25078", "1147", 26745.98, "Depreciação de máquinas"],
  ["25080", "25183", 1916.57, "Depreciação de instalações industriais"],
  ["25081", "25184", 3110.24, "Depreciação de móveis e utensílios ADM"],
  ["25081", "25185", 155.58, "Depreciação de móveis e utensílios industrial"],
  ["25082", "25186", 2780.09, "Depreciação de equipamentos de informática"],
  ["25083", "25187", 19762.52, "Depreciação de veículos"],
  ["25084", "25189", 56.97, "Depreciação de ferramentas e acessórios"],
  ["25087", "25190", 263.18, "Depreciação de benfeitorias em imóveis de terceiros"],
  ["25090", "25191", 3.12, "Depreciação de móveis e utensílios comercial"],
  ["25080", "25192", 331.10, "Depreciação de instalações administrativas"],
  ["25086", "25193", 318.65, "Depreciação de equipamentos telefônicos"],
  ["25091", "25194", 2417.02, "Depreciação de ferramental de extrusão"],
] as const;

const pontuais: LancamentoIntegrado[] = [
  {
    id: "PON-JCP-001", data: "30/06/2026", origem: "PADRÃO DO RAZÃO ANTERIOR", debitoCodigo: "25107", debito: nomeConta("25107"), creditoCodigo: "25253", credito: nomeConta("25253"), historico: "Juros remuneratórios sobre capital próprio - junho/2026", documento: "JCP 06/2026", cc: "902", centroCusto: cdc("902"], valor: 140469.22, status: "validado", observacao: "Valor de junho; contas convertidas para o plano do balancete enviado.",
  },
  ...depreciacoes.map(([debitoCodigo, creditoCodigo, valor, historico], index) => ({
    id: `PON-DEP-${String(index + 1).padStart(3, "0")}`,
    data: "30/06/2026",
    origem: "PADRÃO DO RAZÃO ANTERIOR",
    debitoCodigo,
    debito: nomeConta(debitoCodigo),
    creditoCodigo,
    credito: nomeConta(creditoCodigo),
    historico: `${historico} - junho/2026`,
    documento: "DEP 06/2026",
    cc: "0",
    centroCusto: cdc("0"],
    valor,
    status: "validado" as const,
    observacao: "Padrão conta a conta do razão anterior; códigos convertidos para o plano do balancete.",
  })),
];

const folhaPorCc = [
  ["301", 2200.00],
  ["206", 4141.46],
  ["201", 14975.94],
  ["210", 8638.58],
  ["203", 4600.00],
  ["304", 5720.00],
  ["302", 3250.00],
] as const;
const totalFolha = folhaPorCc.reduce((total, [, valor]) => total + valor, 0);

function rateio(valor: number, parcela: number, index: number) {
  if (index < folhaPorCc.length - 1) return Math.round(valor * parcela / totalFolha * 100) / 100;
  const anteriores = folhaPorCc.slice(0, -1).reduce((total, [, base]) => total + Math.round(valor * base / totalFolha * 100) / 100, 0);
  return Math.round((valor - anteriores) * 100) / 100;
}

const folha: LancamentoIntegrado[] = [
  ...folhaPorCc.map(([cc, valor], index) => ({ id: `FOL-SAL-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4014", debito: nomeConta("4014"), creditoCodigo: "1634", credito: nomeConta("1634"), historico: `Salários e ordenados de junho - ${centroCusto[cc]}`, documento: "FOLHA 06/2026", cc, centroCusto: cdc(cc], valor, status: "validado" as const, observacao: "Valor da folha de junho; centro de custo herdado da folha anterior por funcionário." })),
  ...folhaPorCc.map(([cc, base], index) => ({ id: `FOL-INSS-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4020", debito: nomeConta("4020"), creditoCodigo: "25227", credito: nomeConta("25227"), historico: `INSS patronal e terceiros - ${centroCusto[cc]}`, documento: "DCTFWEB 06/2026", cc, centroCusto: cdc(cc], valor: rateio(13947.33, base, index), status: "validado" as const, observacao: "Rateado pelo valor de proventos de cada centro de custo." })),
  ...folhaPorCc.map(([cc, base], index) => ({ id: `FOL-FGTS-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4021", debito: nomeConta("4021"), creditoCodigo: "25228", credito: nomeConta("25228"), historico: `FGTS mensal - ${centroCusto[cc]}`, documento: "FGTS 06/2026", cc, centroCusto: cdc(cc], valor: rateio(3310.19, base, index), status: "validado" as const, observacao: "Rateado pelo valor de proventos de cada centro de custo." })),
  { id: "FOL-DED-001", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "25227", debito: nomeConta("25227"), creditoCodigo: "1634", credito: nomeConta("1634"), historico: "Salário-família compensado na DCTFWeb", documento: "FOLHA 06/2026", cc: "304", centroCusto: cdc("304"], valor: 47.27, status: "validado", observacao: "Vantagem da folha e dedução da contribuição previdenciária." },
  { id: "FOL-DED-002", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "25227", credito: nomeConta("25227"), historico: "INSS descontado dos empregados", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"], valor: 3962.76, status: "validado", observacao: "Conforme resumo de rubricas da folha." },
  { id: "FOL-DED-003", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "312", credito: nomeConta("312"), historico: "Desconto de adiantamento salarial", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"], valor: 13444.00, status: "validado", observacao: "Baixa da conta de adiantamentos de salários." },
  { id: "FOL-DED-004", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "25221", credito: nomeConta("25221"), historico: "Demais descontos da folha: benefícios, empréstimos, uniforme e rescisão", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"], valor: 8056.55, status: "revisar", observacao: "Abrir por obrigação específica antes da exportação ao Questor." },
  { id: "FOL-FGTS-RCT", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "25941", debito: nomeConta("25941"), creditoCodigo: "4885", credito: nomeConta("4885"), historico: "FGTS rescisório de junho", documento: "FGTS RCT 06/2026", cc: "304", centroCusto: cdc("304"], valor: 141.98, status: "validado", observacao: "Funcionária desligada alocada no CC 304 conforme folha anterior." },
];

export const lancamentosIntegrados: LancamentoIntegrado[] = [...bancarios, ...folha, ...pontuais];
export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;
