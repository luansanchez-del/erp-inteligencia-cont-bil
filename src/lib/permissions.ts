import { useAuth } from "@/context/auth-context";
import type { AcaoPermissao, ModuloId } from "@/types/erp";

export function useCan(modulo: ModuloId, acao: AcaoPermissao = "ver"): boolean {
  const { perfil } = useAuth();
  if (!perfil) return false;
  return perfil.permissoes.some((p) => p.modulo === modulo && p.acoes.includes(acao));
}

export function useFuncaoAtual() {
  const { perfil } = useAuth();
  return perfil?.funcaoNome ?? "—";
}
