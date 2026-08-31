import { useEffect, useMemo, useState } from "react";
import type { AberturaSimplesNacional, SocioCapitalAbertura } from "@/types/erp";

const STORAGE_KEY = "erp-simples-nacional-aberturas-v1";

export type DadosAberturaSimplesNacional = {
  dataAbertura: string;
  contaContrapartidaCodigo: string;
  contaContrapartidaDescricao: string;
  contaCapitalCodigo: string;
  contaCapitalDescricao: string;
  socios: Omit<SocioCapitalAbertura, "id">[];
  observacoes?: string | undefined;
};

function carregarTodas(): AberturaSimplesNacional[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AberturaSimplesNacional[];
  } catch {
    return [];
  }
}

/**
 * Persistência local (por navegador) das aberturas contábeis do módulo Simples
 * Nacional. Isolada do motor/dados da Nitaplast — nenhuma leitura ou escrita
 * cruza para as tabelas de Razão/Balancete/DRE já existentes.
 */
export function useAberturaSimplesNacional(empresaId: string) {
  const [todas, setTodas] = useState<AberturaSimplesNacional[]>([]);

  useEffect(() => {
    setTodas(carregarTodas());
  }, []);

  function persistir(proximas: AberturaSimplesNacional[]) {
    setTodas(proximas);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proximas));
    } catch {
      /* ignora */
    }
  }

  const aberturas = useMemo(
    () => todas.filter((item) => item.empresaId === empresaId),
    [todas, empresaId],
  );

  function registrar(dados: DadosAberturaSimplesNacional): AberturaSimplesNacional {
    const registro: AberturaSimplesNacional = {
      id: `abertura-${empresaId}-${Date.now()}`,
      empresaId,
      dataAbertura: dados.dataAbertura,
      contaContrapartidaCodigo: dados.contaContrapartidaCodigo,
      contaContrapartidaDescricao: dados.contaContrapartidaDescricao,
      contaCapitalCodigo: dados.contaCapitalCodigo,
      contaCapitalDescricao: dados.contaCapitalDescricao,
      socios: dados.socios.map((socio, indice) => ({ ...socio, id: `socio-${Date.now()}-${indice}` })),
      observacoes: dados.observacoes,
      criadoEm: new Date().toISOString(),
    };
    persistir([...todas, registro]);
    return registro;
  }

  function remover(id: string) {
    persistir(todas.filter((item) => item.id !== id));
  }

  return { aberturas, registrar, remover };
}
