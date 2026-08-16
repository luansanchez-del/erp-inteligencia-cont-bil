import { movimentosFinanceiros } from "./nitaplast-movimento-financeiro";
import { saldosImplantacao } from "./nitaplast-implantacao";
import { lancamentosFiscaisJunho } from "./nitaplast-lancamentos-fiscais-junho";
import { recorrenciasJunho } from "./nitaplast-recorrencias-junho";
import { ajustesFilialJunho } from "./nitaplast-filial-junho";
import { ajustesAplicacoesJunho } from "./nitaplast-aplicacoes-junho";

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
  rastreio: "documento" | "derivado" | "sugerido";
  fonte: string;
};

const descricaoPorConta = new Map(saldosImplantacao.map((linha) => [linha.conta, linha.descricao]));
const nomeConta = (codigo: string) => `${codigo} - ${descricaoPorConta.get(codigo) ?? "Conta a revisar"}`;

export const contaPorBanco: Record<string, string> = {
  // B00002 é a conta corrente Greencred. A conta 25035 é integralização de capital e não deve receber giro bancário.
  B00002: "21",
  B00003: "25110",
  B00100: "10",
  B23700: "9",
  B23702: "25001",
  B34100: "11",
  B34101: "25002",
};

// 25221 - Contas a pagar NÃO é conta de pendência.
// Eventos sem contrapartida documental segura ficam na 4859 - Conta Transitória
// até a abertura analítica, evitando inverter artificialmente uma obrigação do passivo.
const contrapartidaPorEvento: Record<string, string> = {
  "1": "25111", "7": "2859", "12": "1712", "101": "1496", "104": "25104",
  "110": "1634", "111": "312", "125": "1634", "127": "1496", "131": "4859",
  "132": "4859", "190": "4885", "199": "1496", "203": "4859", "204": "25116", "242": "25219", "251": "4859",
};

const centroCusto: Record<string, string> = {
  "0": "SEM CENTRO DE CUSTO", "201": "VENDAS", "203": "FATURAMENTO", "206": "EXPORTAÇÃO",
  "210": "MARKETING", "301": "RECEPÇÃO", "302": "FINANCEIRO", "304": "ADM GERAL", "502": "COMERCIAL SP", "902": "DESPESAS FINANCEIRAS",
};
const cdc = (codigo: string) => centroCusto[codigo] ?? "SEM CENTRO DE CUSTO";

function outroBanco(historico: string, atual: string) {
  return historico.match(/B\d{5}/g)?.find((codigo) => codigo !== atual);
}

function contrapartidaEspecial(codigo: string, historico: string) {
  const h = historico.toLocaleUpperCase("pt-BR");
  if (codigo === "96" && h.includes("NITA P/ MVS")) return "25129";
  if (codigo === "101" && h.includes("COPEL")) return "25218";

  // Débitos automáticos que estavam contaminando 25221.
  if (codigo === "203" && h.includes("BANCO BRADESCO SA")) return "25104";
  if (codigo === "203" && (h.includes("ENERGIA RESERVA") || h.includes("ENERGIA NUCLEAR") || h.includes("RESERVA DE CAPACIDADE"))) return "25218";
  if (codigo === "203" && h.includes("ENVALIOR")) return "1496";
  if (codigo === "204" && h.includes("ENVALIOR")) return "1496";
  if (codigo === "203" && h.includes("ITAU UNIBANCO SA")) return "1496";
  return undefined;
}

const bancarios: LancamentoIntegrado[] = movimentosFinanceiros.flatMap((movimento, index) => {
  const bancoCodigo = contaPorBanco[movimento.banco];
  if (!bancoCodigo) return [];
  const bancoContrapartida = movimento.codigo === "96" ? contaPorBanco[outroBanco(movimento.historico, movimento.banco) ?? ""] : undefined;

  // Transferências entre contas próprias aparecem nos dois extratos: débito na origem e crédito no destino.
  // Mantemos somente a ponta de débito (origem) para não contabilizar a mesma transferência duas vezes.
  if (bancoContrapartida && movimento.tipo === "credito") return [];

  // No Bradesco 895, os créditos do evento 7 são eventos internos do Invest Fácil.
  // Rendimento, aplicações e resgates são contabilizados em ajustesAplicacoesJunho para separar C/C e aplicação.
  if (movimento.banco === "B23702" && movimento.codigo === "7" && movimento.tipo === "credito") return [];

  const especialBradesco895 = movimento.banco === "B23702" && movimento.codigo === "7" && movimento.tipo === "debito" ? "25104" : undefined;
  const especial = especialBradesco895 ?? contrapartidaEspecial(movimento.codigo, movimento.historico);
  const contrapartidaCodigo = bancoContrapartida ?? especial ?? contrapartidaPorEvento[movimento.codigo] ?? "4859";

  // No extrato interno B23700 algumas tarifas (evento 104) vieram com indicador C,
  // embora no extrato bancário oficial sejam débitos. Para o Bradesco 6349,
  // evento 104 é sempre saída da conta corrente. Isso corrige R$ 71,33 de tarifas
  // que estavam aumentando o banco e reduzindo a despesa em vez do contrário.
  const entrada = movimento.banco === "B23700" && movimento.codigo === "104"
    ? false
    : movimento.tipo === "credito";

  const contrapartidaMapeada = Boolean(bancoContrapartida) || Boolean(especial) || movimento.codigo in contrapartidaPorEvento;
  const contrapartidaGenerica = contrapartidaCodigo === "25221" || contrapartidaCodigo === "4859";
  const revisar = ["131", "132", "203", "251"].includes(movimento.codigo) || (!bancoContrapartida && !especial && movimento.codigo === "96");
  const observacaoEspecial = especial === "25129"
    ? "Transferência Nitaplast para MVS classificada na Conta Corrente Marcos Victor Siedel, conciliada com o extrato bancário da MVS."
    : especial === "25104"
      ? "Débito bancário classificado como despesa/tarifa bancária; não utilizar Contas a pagar como conta de pendência."
      : especial === "25218"
        ? "Pagamento de energia classificado na conta específica Energia Elétrica a Pagar, seguindo o padrão contábil do período anterior."
        : especial === "1496"
          ? "Favorecido identificado no histórico bancário. Retirado de Contas a pagar genérica e mantido em Fornecedores Diversos até confirmar a conta analítica específica."
          : "Contrapartida identificada pelo documento.";
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
    centroCusto: cdc("0"),
    valor: movimento.valor,
    status: revisar ? "revisar" : "validado",
    observacao: especial ? observacaoEspecial : revisar ? "Movimento ainda sem conta analítica segura; mantido na Conta Transitória 4859 para revisão, sem contaminar Contas a pagar." : "Vinculado pelo código do evento e pela conta bancária de origem.",
    rastreio: contrapartidaMapeada && !contrapartidaGenerica ? "documento" : "sugerido",
    fonte: `Extrato/movimento financeiro 06/2026 - banco ${movimento.banco}, evento ${movimento.codigo}, linha ${index + 1}`,
  }];
});

export const depreciacoes = [
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
    id: "PON-JCP-001", data: "30/06/2026", origem: "PADRÃO DO RAZÃO ANTERIOR", debitoCodigo: "25107", debito: nomeConta("25107"), creditoCodigo: "25253", credito: nomeConta("25253"), historico: "Juros remuneratórios sobre capital próprio - junho/2026", documento: "JCP 06/2026", cc: "902", centroCusto: cdc("902"), valor: 140469.22, status: "validado", observacao: "Valor de junho; contas convertidas para o plano do balancete enviado.", rastreio: "derivado", fonte: "Cálculo de JCP replicado do razão de maio/2026 - falta ata/memória de cálculo de junho",
  },
  ...depreciacoes.map(([debitoCodigo, creditoCodigo, valor, historico], index) => ({
    id: `PON-DEP-${String(index + 1).padStart(3, "0")}`, data: "30/06/2026", origem: "PADRÃO DO RAZÃO ANTERIOR",
    debitoCodigo, debito: nomeConta(debitoCodigo), creditoCodigo, credito: nomeConta(creditoCodigo), historico: `${historico} - junho/2026`, documento: "DEP 06/2026", cc: "0", centroCusto: cdc("0"), valor,
    status: "validado" as const, observacao: "Padrão conta a conta do razão anterior; códigos convertidos para o plano do balancete.", rastreio: "derivado" as const, fonte: "Razão de maio/2026, lançamento de depreciação conta a conta - falta ficha de bens de junho",
  })),
];

const folhaPorCc = [["301",2200.00],["206",4141.46],["201",14975.94],["210",8638.58],["203",4600.00],["304",5720.00],["302",3250.00]] as const;
const totalFolha = folhaPorCc.reduce((total, [, valor]) => total + valor, 0);
function rateio(valor: number, parcela: number, index: number) {
  if (index < folhaPorCc.length - 1) return Math.round(valor * parcela / totalFolha * 100) / 100;
  const anteriores = folhaPorCc.slice(0, -1).reduce((total, [, base]) => total + Math.round(valor * base / totalFolha * 100) / 100, 0);
  return Math.round((valor - anteriores) * 100) / 100;
}

const folha: LancamentoIntegrado[] = [
  ...folhaPorCc.map(([cc, valor], index) => ({ id: `FOL-SAL-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4014", debito: nomeConta("4014"), creditoCodigo: "1634", credito: nomeConta("1634"), historico: `Salários e ordenados de junho - ${cdc(cc)}`, documento: "FOLHA 06/2026", cc, centroCusto: cdc(cc), valor, status: "validado" as const, observacao: "Valor da folha de junho; centro de custo herdado da folha anterior por funcionário.", rastreio: "documento" as const, fonte: "Resumo da folha 06/2026 por centro de custo" })),
  ...folhaPorCc.map(([cc, base], index) => ({ id: `FOL-INSS-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4020", debito: nomeConta("4020"), creditoCodigo: "25227", credito: nomeConta("25227"), historico: `INSS patronal e terceiros - ${cdc(cc)}`, documento: "DCTFWEB 06/2026", cc, centroCusto: cdc(cc), valor: rateio(13947.33, base, index), status: "validado" as const, observacao: "Rateado pelo valor de proventos de cada centro de custo.", rastreio: "derivado" as const, fonte: "Folha/DCTFWeb 06/2026 - total do documento rateado por proventos do centro de custo" })),
  ...folhaPorCc.map(([cc, base], index) => ({ id: `FOL-FGTS-${index + 1}`, data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "4021", debito: nomeConta("4021"), creditoCodigo: "25228", credito: nomeConta("25228"), historico: `FGTS mensal - ${cdc(cc)}`, documento: "FGTS 06/2026", cc, centroCusto: cdc(cc), valor: rateio(3310.19, base, index), status: "validado" as const, observacao: "Rateado pelo valor de proventos de cada centro de custo.", rastreio: "derivado" as const, fonte: "Folha/DCTFWeb 06/2026 - total do documento rateado por proventos do centro de custo" })),
  { id: "FOL-DED-001", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "25227", debito: nomeConta("25227"), creditoCodigo: "1634", credito: nomeConta("1634"), historico: "Salário-família compensado na DCTFWeb", documento: "FOLHA 06/2026", cc: "304", centroCusto: cdc("304"), valor: 47.27, status: "validado", observacao: "Vantagem da folha e dedução da contribuição previdenciária.", rastreio: "documento", fonte: "Resumo de rubricas da folha 06/2026" },
  { id: "FOL-DED-002", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "25227", credito: nomeConta("25227"), historico: "INSS descontado dos empregados", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"), valor: 3962.76, status: "validado", observacao: "Conforme resumo de rubricas da folha.", rastreio: "documento", fonte: "Resumo de rubricas da folha 06/2026" },
  { id: "FOL-DED-003", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "312", credito: nomeConta("312"), historico: "Desconto de adiantamento salarial", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"), valor: 13444.00, status: "validado", observacao: "Baixa da conta de adiantamentos de salários.", rastreio: "documento", fonte: "Resumo de rubricas da folha 06/2026" },
  { id: "FOL-DED-CRED-TRAB", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "25231", credito: nomeConta("25231"), historico: "Empréstimo Crédito do Trabalhador descontado em folha - matriz e filial", documento: "FGTS DIGITAL / FOLHA 06/2026", cc: "0", centroCusto: cdc("0"), valor: 1229.26, status: "validado", observacao: "FGTS Digital identifica 2 trabalhadores e total de R$ 1.229,26; conta específica já existe no plano.", rastreio: "documento", fonte: "EXTRATO FOLHA MENSAL - 06.2026 - MATRIZ(4).pdf + FOLHA MENSAL 06.2026 - FILIAL" },
  { id: "FOL-DED-004", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "1634", debito: nomeConta("1634"), creditoCodigo: "4859", credito: nomeConta("4859"), historico: "Demais descontos da folha ainda a abrir: benefícios, uniforme, empréstimos e rescisão", documento: "FOLHA 06/2026", cc: "0", centroCusto: cdc("0"), valor: 6827.29, status: "revisar", observacao: "R$ 1.229,26 de Crédito do Trabalhador já foi aberto na conta 25231. O restante fica transitório até abertura por obrigação específica; não contaminar Contas a pagar.", rastreio: "sugerido", fonte: "Folha 06/2026 - descontos agrupados; Crédito do Trabalhador identificado separadamente" },
  { id: "FOL-FGTS-RCT", data: "30/06/2026", origem: "FOLHA MENSAL 06/2026", debitoCodigo: "25941", debito: nomeConta("25941"), creditoCodigo: "4885", credito: nomeConta("4885"), historico: "FGTS rescisório de junho", documento: "FGTS RCT 06/2026", cc: "304", centroCusto: cdc("304"), valor: 141.98, status: "validado", observacao: "Funcionária desligada alocada no CC 304 conforme folha anterior.", rastreio: "documento", fonte: "Guia de FGTS rescisório 06/2026" },
];

export const lancamentosIntegrados: LancamentoIntegrado[] = [
  ...bancarios,
  ...ajustesAplicacoesJunho,
  ...folha,
  ...pontuais,
  ...recorrenciasJunho,
  ...lancamentosFiscaisJunho,
  ...ajustesFilialJunho,
];
export const totalDebitosIntegrados = lancamentosIntegrados.reduce((total, linha) => total + linha.valor, 0);
export const totalCreditosIntegrados = totalDebitosIntegrados;
export const lancamentosPorRastreio = {
  documento: lancamentosIntegrados.filter((linha) => linha.rastreio === "documento").length,
  derivado: lancamentosIntegrados.filter((linha) => linha.rastreio === "derivado").length,
  sugerido: lancamentosIntegrados.filter((linha) => linha.rastreio === "sugerido").length,
};
