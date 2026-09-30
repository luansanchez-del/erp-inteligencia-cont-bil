import type { LancamentoIntegrado } from "./nitaplast-razao-base";

/**
 * Retirada do Razão em 30/09/2026 e relançada no mesmo dia por decisão do usuário.
 *
 * Provisão de receita não operacional de R$ 400.000,00 na competência 08/2026 —
 * ajuste manual solicitado pelo usuário em 28/09/2026, com autorização do
 * cliente, para ser estornado integralmente em 09/2026.
 *
 * Não há documento de origem (nota, contrato, título) para esta receita nem um
 * devedor identificado para o crédito: a partida fica isolada em contas próprias
 * (25949/25950, criadas para ela) para ficar visível no Balancete e na DRE e
 * não se misturar com receitas/créditos documentados. Mesmo padrão da provisão
 * de custo de julho (JUL-PROV-CUSTO-CLIENTE-100K), em sentido contrário.
 *
 * O estorno de setembro ainda precisa ser lançado quando a base de 09/2026
 * existir (débito 25950 / crédito 25949, R$ 400.000,00).
 */
export const lancamentosProvisaoReceitaAgosto: LancamentoIntegrado[] = [
  {
    id: "AGO-PROV-RECEITA-NAO-OPER-400K",
    data: "31/08/2026",
    origem: "PROVISÃO DE RECEITA — AJUSTE MANUAL AUTORIZADO PELO CLIENTE 08/2026",
    debitoCodigo: "25949",
    debito: "25949 - Outros Créditos - Provisão de Receita a Receber",
    creditoCodigo: "25950",
    credito: "25950 - Outras Receitas Não Operacionais",
    historico: "PROVISÃO DE RECEITA, PARA SER ESTORNADA NO MÊS SEGUINTE",
    documento: "AJUSTE MANUAL AUTORIZADO PELO CLIENTE — SEM DOCUMENTO DE ORIGEM",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: 400_000.0,
    status: "revisar",
    observacao: "Ajuste manual autorizado pelo cliente, sem documento de origem nem devedor identificado. Estorno integral programado para 09/2026 (D 25950 / C 25949). Não confundir com receita realizada.",
    rastreio: "sugerido",
    fonte: "Solicitação do usuário em 28/09/2026, com autorização do cliente",
  },
];
