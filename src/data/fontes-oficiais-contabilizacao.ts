import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { lancamentosIntegradosAgosto } from "./nitaplast-razao-agosto";

export type DocumentoOficialContabilizacao = {
  fonte: string;
  origens: string[];
  partidas: number;
  valor: number;
  status: "contabilizado";
};

type BaseOficial = {
  empresaId: string;
  competenciaId: string;
  lancamentos: LancamentoIntegrado[];
};

// Registro central das bases oficiais. Novas competências entram neste mapa;
// relatórios e telas continuam no mesmo motor estrutural.
const basesOficiais: BaseOficial[] = [
  {
    empresaId: "nitaplast-matriz",
    competenciaId: "2026-08",
    lancamentos: lancamentosIntegradosAgosto,
  },
];

export function listarDocumentosOficiais(
  empresaId: string,
  competenciaId: string,
): DocumentoOficialContabilizacao[] {
  const base = basesOficiais.find(
    (item) => item.empresaId === empresaId && item.competenciaId === competenciaId,
  );
  if (!base) return [];

  const documentos = new Map<string, { origens: Set<string>; partidas: number; valor: number }>();
  for (const lancamento of base.lancamentos) {
    const fonte = lancamento.fonte.trim() || "Fonte não identificada";
    const atual = documentos.get(fonte) ?? {
      origens: new Set<string>(),
      partidas: 0,
      valor: 0,
    };
    atual.origens.add(lancamento.origem);
    atual.partidas += 1;
    atual.valor += lancamento.valor;
    documentos.set(fonte, atual);
  }

  return [...documentos]
    .map(([fonte, item]) => ({
      fonte,
      origens: [...item.origens].sort(),
      partidas: item.partidas,
      valor: Math.round(item.valor * 100) / 100,
      status: "contabilizado" as const,
    }))
    .sort((a, b) => a.fonte.localeCompare(b.fonte, "pt-BR"));
}
