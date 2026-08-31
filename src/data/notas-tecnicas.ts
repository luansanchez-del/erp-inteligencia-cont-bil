/**
 * Registro central de notas técnicas de fechamento, por grupo econômico e
 * competência. Objetivo: tirar achados, pendências e decisões documentadas
 * das telas de Balancete/DRE/Razão (que devem mostrar só a tabela contábil,
 * como um ERP de verdade) e concentrar tudo num lugar consultável.
 *
 * Segue a taxonomia de src/../CLAUDE.md (Fechamento contábil):
 * - impedimento: bloqueia fechamento;
 * - alerta: exige atenção, mas pode permitir fechamento;
 * - informacao: evidência ou observação sem bloqueio.
 */
export type CategoriaNotaTecnica = "impedimento" | "alerta" | "informacao";

export type NotaTecnica = {
  id: string;
  grupoId: string;
  /** Competência específica ("2026-06") ou "*" para notas válidas em todas as competências do grupo. */
  competenciaId: string | "*";
  categoria: CategoriaNotaTecnica;
  titulo: string;
  descricao: string;
  origem: string;
};

export const notasTecnicas: NotaTecnica[] = [
  {
    id: "nitaplast-estrutura-dominio-preservada",
    grupoId: "g-nitaplast",
    competenciaId: "*",
    categoria: "informacao",
    titulo: "Estrutura Domínio preservada",
    descricao: "Junho e julho usam os mesmos códigos, classificações e descrições do Balancete de maio (implantação); o plano de contas atual do sistema fica somente como rastreio técnico da vinculação.",
    origem: "Implantação, 31/05/2026",
  },
  {
    id: "nitaplast-residual-negativo-imobilizado-junho",
    grupoId: "g-nitaplast",
    competenciaId: "2026-06",
    categoria: "alerta",
    titulo: "Residual negativo em 4 contas de imobilizado",
    descricao: "Saldo de abertura de maio/2026 (implantação) traz depreciação acumulada maior que o custo bruto em 4 contas — residual negativo, contabilmente impossível: Móveis/utensílios industrial (25146/25185) -R$ 40.477,88; Móveis/utensílios comercial (25150/25191) -R$ 9.961,50; Móveis ADM Comercial SP (25156/25197) -R$ 1.226,48; Equipamentos de segurança (25147/25188) -R$ 0,08 (arredondamento). Nenhum lançamento de junho originou ou agravou o problema — é herdado do próprio saldo do Domínio em 31/05. Investigar origem antes de aprovar o fechamento definitivo.",
    origem: "Achado de fechamento — commit 8176f26",
  },
  {
    id: "nitaplast-depreciacao-junho-aberta-rateio",
    grupoId: "g-nitaplast",
    competenciaId: "2026-06",
    categoria: "informacao",
    titulo: "Depreciação de junho aberta por conta analítica, com rateio",
    descricao: "O balancete real do Domínio de 06/2026 lançou a depreciação do mês (R$ 53.782,84) inteira na conta sintética 1.2.03.03, sem abrir por conta analítica — prática irregular. A pedido do contador, os lançamentos foram abertos por conta (10 grupos de imobilizado), replicando a regra de teto pelo saldo residual já validada em julho. O cálculo bruto por essa regra dá R$ 57.702,32; sem ficha/memória de cálculo do cliente para justificar a diferença por conta, os valores foram rateados proporcionalmente para fechar exatamente nos R$ 53.782,84 reais. O Lucro Líquido de junho (já validado contra a planilha do cliente) não muda — só o detalhe analítico do Ativo foi enriquecido.",
    origem: "Decisão do contador — commit 491c983",
  },
  {
    id: "nitaplast-irpj-csll-exclui-nao-operacional-junho",
    grupoId: "g-nitaplast",
    competenciaId: "2026-06",
    categoria: "informacao",
    titulo: "Base do IRPJ/CSLL de junho exclui o resultado não operacional",
    descricao: "A Base para IRPJ e CSLL de junho (R$ 132.502,91) é o Resultado Operacional, excluindo o Resultado Não Operacional de R$ 7.295,86 (ganho na alienação de imobilizado). Confirmado contra o LALUR real do cliente (\"CÁLCULO IRPJ E CSLL — LUCRO REAL POR ESTIMATIVA MENSAL — Competência JUNHO/2026\"): a linha \"Lucro/(Prejuízo) Contábil do mês\" de junho está lançada nesse mesmo valor. Não é erro nem pendência — é a apuração real do contador para a base do IRPJ/CSLL por estimativa mensal.",
    origem: "Confirmado contra o LALUR real do cliente, 31/08/2026",
  },
  {
    id: "nitaplast-cc503-lancamento-versao-julho",
    grupoId: "g-nitaplast",
    competenciaId: "2026-07",
    categoria: "informacao",
    titulo: "Lançamento de versão — CC 503 e ICMS/COFINS Matriz",
    descricao: "Julho/2026 fecha em R$ 234.732,08 via lançamento manual real no Razão (ids JUL-VERSAO-*, origem \"LANÇAMENTO DE VERSÃO 07/2026\", status \"revisar\"), decidido pelo contador em 24/08/2026, com estorno programado para agosto/2026. Diferença de R$ 15.457,20 em relação ao Razão \"puro\" (R$ 250.189,28), decomposta em CC 503 \"Manutenção SP\" (Filial, contada em duplicidade pela planilha do cliente) e ICMS/COFINS Matriz (a planilha do cliente diverge da própria contabilidade dele). Ao aplicar em agosto/2026: localizar os 5 lançamentos JUL-VERSAO-* e lançar o estorno exato deles na competência de agosto antes de lançar a versão definitiva.",
    origem: "Decisão do contador, 24/08/2026",
  },
];

export function notasTecnicasDoGrupo(grupoId: string, competenciaId: string): NotaTecnica[] {
  return notasTecnicas.filter(
    (nota) => nota.grupoId === grupoId && (nota.competenciaId === "*" || nota.competenciaId === competenciaId),
  );
}
