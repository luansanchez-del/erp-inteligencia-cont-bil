import type { AcaoPermissao, ModuloId } from "@/types/erp";

// Perfil mockado. Na fase seguinte vem do usuário autenticado.
const perfilAtual = {
  funcao: "Administrador",
  permissoes: "todas" as "todas" | Record<ModuloId, AcaoPermissao[]>,
};

export function useCan(modulo: ModuloId, acao: AcaoPermissao = "ver"): boolean {
  if (perfilAtual.permissoes === "todas") return true;
  return perfilAtual.permissoes[modulo]?.includes(acao) ?? false;
}

export function useFuncaoAtual() {
  return perfilAtual.funcao;
}
