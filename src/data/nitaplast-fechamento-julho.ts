import { saldoAberturaJulhoPorConta } from "./nitaplast-saldos-julho";

export type StatusFonteJulho = "validado" | "em revisão" | "pendente" | "manual";

export const competenciaNitaplastJulho = {
  id: "2026-07",
  label: "07/2026",
  inicio: "2026-07-01",
  fim: "2026-07-31",
  empresaId: "nitaplast-matriz",
  cnpjMatriz: "82.295.817/0001-07",
  cnpjFilial: "82.295.817/0003-60",
  status: "fechado_com_pendencias" as const,
};

/**
 * Base documental recebida para 07/2026.
 *
 * Regra de governança mantida de junho:
 * documentos -> normalização -> lançamentos -> Razão -> Balancete -> DRE.
 * Nenhum valor de abertura/controle gerencial gera lançamento no Razão.
 *
 * IMPORTANTE:
 * relatórios/arquivos de VALIDAÇÃO do fiscal NÃO fazem parte da análise contábil.
 * Só considerar escrituração fiscal digital como fonte quando o arquivo TXT/SPED
 * efetivamente for fornecido. PDF/relatório de validação é ignorado.
 */
export const fontesFechamentoJulho = [
  {
    id: "fiscal-matriz",
    nome: "Fiscal — Matriz",
    detalhe: "Entradas, saídas, ICMS, ICMS-ST, IPI, devoluções, CT-e, canceladas e retenções de 07/2026.",
    status: "validado" as StatusFonteJulho,
    observacao: "Documentos fiscais usados na formação dos lançamentos contábeis. Relatórios de validação fiscal permanecem fora da análise contábil.",
  },
  {
    id: "fiscal-filial",
    nome: "Fiscal — Filial SP",
    detalhe: "Entradas, saídas, ICMS, IPI, devoluções, CT-e, canceladas e retenções de 07/2026.",
    status: "validado" as StatusFonteJulho,
    observacao: "Documentos fiscais da filial usados na formação do Razão. Relatórios de validação fiscal permanecem fora da análise contábil.",
  },
  {
    id: "contribuicoes",
    nome: "PIS / COFINS",
    detalhe: "Apurações de PIS e COFINS de 07/2026 usadas como fonte tributária para a contabilização.",
    status: "validado" as StatusFonteJulho,
    observacao: "Eventuais relatórios de validação da EFD-Contribuições são ignorados. TXT/SPED somente será analisado se o arquivo TXT real for fornecido.",
  },
  {
    id: "estoque",
    nome: "Inventário",
    detalhe: "Inventário atualizado com data de referência 31/07/2026, incluindo produtos em elaboração.",
    status: "validado" as StatusFonteJulho,
  },
  {
    id: "cc",
    nome: "Entradas por centro de custo",
    detalhe: "Softdib 07/2026 normalizado por conta gerencial e centro de custo.",
    status: "em revisão" as StatusFonteJulho,
    observacao: "Há R$ 7.047,92 sem distribuição completa por centro de custo em 9 documentos. A pendência fica evidenciada e não será rateada automaticamente.",
  },
  {
    id: "bancos",
    nome: "Bancos e aplicações",
    detalhe: "Bradesco, Itaú, Banco do Brasil, Greencred/Uniprime, Invest Fácil, Trust DI e Maxi DI recebidos para julho.",
    status: "validado" as StatusFonteJulho,
    observacao: "Extratos recebidos e lidos. Aplicações, resgates, transferências, recebimentos e pagamentos com contrapartida segura integram o Razão sem conta de encaixe.",
  },
  {
    id: "cambio",
    nome: "Contratos de câmbio",
    detalhe: "Contratos de importação e exportação de julho conciliados individualmente com títulos e liquidações quando há vínculo documental.",
    status: "em revisão" as StatusFonteJulho,
    observacao: "Duas variações cambiais ativas já foram comprovadas e lançadas: JHS NF 93556 e FERMAQ DP 92249/003. Os demais contratos permanecem pendentes sem estimativa nem lançamento até amarração do valor contábil de origem.",
  },
  {
    id: "clientes",
    nome: "Clientes / faturados",
    detalhe: "Posição de clientes faturados até 31/07/2026 recebida para composição do contas a receber.",
    status: "validado" as StatusFonteJulho,
    observacao: "Fonte recebida e usada na conciliação. Créditos bancários permanecem vinculados a clientes/duplicatas sem reconhecer receita novamente.",
  },
  {
    id: "folha",
    nome: "Folha e provisões 07/2026",
    detalhe: "Folha mensal da matriz e filial, encargos e relatórios reais de provisão de férias e 13º de 07/2026.",
    status: "validado" as StatusFonteJulho,
    observacao: "Folha e encargos foram lançados pela competência. As provisões estimadas foram substituídas pelos relatórios reais de férias e 13º da matriz e filial.",
  },
] as const;

export const fiscalJulho = {
  matriz: {
    entradasDocumentos: 304,
    entradasValor: 4_094_836.16,
    saidasDocumentos: 494,
    saidasValor: 5_786_937.69,
    icmsSaidasRelatorio: 244_252.46,
    icmsStSaidas: 1_024.72,
    ipiSaidasRelatorio: 163_793.67,
    devolucoes: 36_450.71,
  },
  filialSp: {
    entradasDocumentos: 85,
    entradasValor: 695_675.80,
    saidasDocumentos: 128,
    saidasValor: 566_036.36,
    icmsSaidasRelatorio: 84_941.08,
    ipiSaidasRelatorio: 32_002.17,
    devolucoes: 1_956.51,
  },
  contribuicoes: {
    pisDebitoSaidas: 49_820.30,
    pisCreditoEntradas: 33_908.91,
    pisRecolherAntesDeRetencoes: 15_911.39,
    cofinsDebitoSaidas: 229_476.68,
    cofinsCreditoEntradas: 156_119.80,
    cofinsRecolherAntesDeRetencoes: 73_356.88,
  },
} as const;

/**
 * Receita fiscal externa preliminar, sem usar DRE como fonte.
 * Transferências, remessas, alienação de imobilizado e baixas de estoque ficam fora.
 * A segregação segue a mesma lógica documental adotada em junho.
 */
export const receitaFiscalJulho = {
  matriz: {
    producao: 3_449_137.41,
    revenda: 173_371.51,
    total: 3_622_508.92,
  },
  filialSp: {
    producaoOperacaoTriangular: 4_264.28,
    revenda: 517_128.58,
    total: 521_392.86,
  },
  totalBruto: 4_143_901.78,
  deducoesPreliminares: {
    devolucoes: 38_407.22,
    icms: 311_429.02,
    icmsSt: 1_024.72,
    ipi: 195_769.63,
    pis: 49_820.30,
    cofins: 229_476.68,
    total: 825_927.57,
  },
  receitaLiquidaPreliminar: 3_317_974.21,
} as const;

/**
 * Alvos patrimoniais do inventário oficial em 31/07/2026.
 * Mesmas contas usadas no fechamento de junho.
 */
export const estoqueFinalMatrizJulhoPorConta = {
  "25133": 4_207_698.55,
  "25134": 39_464.14,
  "25135": 1_443_376.19,
  "25136": 107_919.59,
  "25137": 5_285.59,
} as const;

export const estoqueFinalMatrizJulhoTotal = 5_803_744.06;

export const entradasCentroCustoJulho = {
  documentosFonte: 597,
  combinacoesGerencialCentroCusto: 103,
  valorContasGerenciais: 4_209_811.76,
  valorDistribuidoCentroCusto: 4_202_763.84,
  valorSemCentroCustoCompleto: 7_047.92,
  documentosComDiferenca: 9,
} as const;

const arred = (valor: number) => Math.round(valor * 100) / 100;
const saldoCredorAbertura = (conta: string) => Math.max(0, -(saldoAberturaJulhoPorConta.get(conta) ?? 0));
const saldoDevedorAbertura = (conta: string) => Math.max(0, saldoAberturaJulhoPorConta.get(conta) ?? 0);

/**
 * Cálculo do JCP de 07/2026 alinhado ao único lançamento que entra no Razão.
 * A base considera as contas redutoras do mesmo grupo patrimonial e exclui a
 * reserva de capital genérica 25239 até validação documental da natureza.
 *
 * Nesta competência, por orientação operacional, o IRRF é apenas informação
 * tributária e não gera partida no Razão.
 */
const capitalSocialIntegralizado = saldoCredorAbertura("2348");
const reservaCapitalContabil = saldoCredorAbertura("25239");
const reservasLucros = saldoCredorAbertura("25240");
const lucrosAcumuladosAnteriores = saldoCredorAbertura("2515");
const ajusteExercicioAnterior = saldoDevedorAbertura("5747");
const distribuicaoLucros = saldoDevedorAbertura("25241");
const reservaCapitalConsiderada = 0;
const redutorasPatrimonio = arred(ajusteExercicioAnterior + distribuicaoLucros);
const lucrosEReservasLiquidos = arred(reservasLucros + lucrosAcumuladosAnteriores - redutorasPatrimonio);
const baseJcpJulho = arred(
  capitalSocialIntegralizado
  + reservaCapitalConsiderada
  + lucrosEReservasLiquidos,
);
const tjlpMensalJulho = 0.007617;
const jcpPelaTjlpJulho = arred(baseJcpJulho * tjlpMensalJulho);
const limiteLucrosReservasJulho = arred(lucrosEReservasLiquidos * 0.5);
const jcpCalculadoJulho = Math.min(jcpPelaTjlpJulho, limiteLucrosReservasJulho);
const irrfPotencialJcpJulho = arred(jcpCalculadoJulho * 0.175);

export const calculoJcpJulho = {
  competencia: "07/2026",
  dataBase: "31/07/2026",
  status: "contabilizado",
  entraNoRazao: true,
  geraIrrfAgora: false,
  base: {
    capitalSocialIntegralizado,
    reservaCapitalContabil,
    reservaCapitalConsiderada,
    reservasLucros,
    lucrosAcumuladosAnteriores,
    ajusteExercicioAnterior,
    distribuicaoLucros,
    redutorasPatrimonio,
    lucrosEReservasLiquidos,
    total: baseJcpJulho,
  },
  tjlp: {
    taxaMensalPercentual: 0.7617,
    taxaDecimal: tjlpMensalJulho,
  },
  limites: {
    pelaTjlp: jcpPelaTjlpJulho,
    cinquentaPorCentoLucrosEReservas: limiteLucrosReservasJulho,
  },
  jcpCalculado: jcpCalculadoJulho,
  irrfReconhecidoAgora: 0,
  irrfPotencialSeCreditado: irrfPotencialJcpJulho,
  observacao: "JCP de julho contabilizado uma única vez no Razão. IRRF não contabilizado nesta etapa. Não alterar junho.",
} as const;

/** Itens com tratamento manual/operacional no fechamento de julho. */
export const itensManuaisJulho = [
  { id: "jcp", nome: "JCP", regra: "lançamento manual contabilizado uma única vez pela rotina financeira", entraAgora: true },
  { id: "depreciacao", nome: "Depreciação", regra: "cálculo de julho contabilizado pelo módulo de imobilizado conforme recorrência real validada", entraAgora: true },
  { id: "provisoes", nome: "Provisões de férias e 13º", regra: "apropriações reais de julho conforme relatórios da matriz e filial", entraAgora: true },
  { id: "variacao-cambial", nome: "Variação cambial", regra: "somente contratos com título e liquidação comprovados; demais permanecem pendentes", entraAgora: true },
] as const;
