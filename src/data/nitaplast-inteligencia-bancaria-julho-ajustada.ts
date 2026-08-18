import {
  gruposBancoJulho as gruposBancoJulhoBase,
  resumoBancoJulho as resumoBancoJulhoBase,
  type GrupoBancoJulho,
  type StatusGrupoBanco,
} from "./nitaplast-inteligencia-bancaria-julho";

export type { GrupoBancoJulho, StatusGrupoBanco };

/**
 * Ajuste documental solicitado sobre a conciliação de julho:
 * o movimento de R$ 25.000,00 antes mantido como transferência a revisar
 * corresponde a Adiantamento de Lucros MVS. A fonte bancária permanece intacta;
 * esta camada altera apenas a classificação contábil/gerencial apresentada.
 */
export const gruposBancoJulho: GrupoBancoJulho[] = gruposBancoJulhoBase.map((grupo) => {
  if (grupo.id !== "GRP-01") return grupo;
  return {
    ...grupo,
    status: "identificado",
    gerencial: "15.90.004",
    descricaoGerencial: "ADIANTAMENTO DE DISTRIBUIÇÃO DE LUCROS",
    acao: "adiantamento_lucros",
    acaoLabel: "Adiantamento de Lucros MVS",
    confianca: 100,
    exemplos: "MVS — transferência/estorno identificado na movimentação financeira",
    documentos: "Movimentação financeira 07/2026",
  };
});

export const resumoBancoJulho = {
  ...resumoBancoJulhoBase,
  identificados: resumoBancoJulhoBase.identificados + 1,
  revisar: 0,
} as const;
