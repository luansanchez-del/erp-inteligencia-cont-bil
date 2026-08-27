// Regras de criação/listagem de usuários. Server-only.
// O arquivo *.functions.ts fica apenas com a casca do createServerFn.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UsuarioListado {
  id: string;
  nome: string;
  email: string;
  funcaoId: string | null;
  funcaoNome: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface NovoUsuarioEntrada {
  nome: string;
  email: string;
  funcaoId: string;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarNovoUsuario(entrada: NovoUsuarioEntrada): NovoUsuarioEntrada {
  const nome = entrada.nome?.trim() ?? "";
  const email = entrada.email?.trim().toLowerCase() ?? "";
  const funcaoId = entrada.funcaoId?.trim() ?? "";

  if (!nome) throw new Error("Informe o nome do usuário.");
  if (!email) throw new Error("Informe o e-mail do usuário.");
  if (!REGEX_EMAIL.test(email)) throw new Error("E-mail em formato inválido.");
  if (!funcaoId) throw new Error("Selecione a função do usuário.");

  return { nome, email, funcaoId };
}

/** Confere a permissão no contexto de quem chamou (RLS ativa). */
export async function exigirPermissao(
  caller: SupabaseClient,
  modulo: string,
  acao: string,
): Promise<void> {
  const { data, error } = await caller.rpc("tem_permissao", {
    p_modulo: modulo,
    p_acao: acao,
  });
  if (error) throw new Error(`Não foi possível verificar suas permissões: ${error.message}`);
  if (data !== true) throw new Error("Você não tem permissão para executar esta ação.");
}

export async function listarUsuariosDoBanco(caller: SupabaseClient): Promise<UsuarioListado[]> {
  const { data, error } = await caller
    .from("profiles")
    .select("id, nome, email, funcao_id, ativo, created_at, funcoes(nome)")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Não foi possível carregar os usuários: ${error.message}`);

  return (data ?? []).map((linha: Record<string, unknown>) => {
    const funcao = linha["funcoes"] as { nome?: string } | { nome?: string }[] | null;
    const funcaoNome = Array.isArray(funcao) ? (funcao[0]?.nome ?? null) : (funcao?.nome ?? null);
    return {
      id: String(linha["id"]),
      nome: String(linha["nome"] ?? ""),
      email: String(linha["email"] ?? ""),
      funcaoId: (linha["funcao_id"] as string | null) ?? null,
      funcaoNome,
      ativo: linha["ativo"] !== false,
      criadoEm: String(linha["created_at"] ?? ""),
    };
  });
}

export interface FuncaoListada {
  id: string;
  nome: string;
  descricao: string;
}

export async function listarFuncoesDoBanco(caller: SupabaseClient): Promise<FuncaoListada[]> {
  const { data, error } = await caller
    .from("funcoes")
    .select("id, nome, descricao")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Não foi possível carregar as funções: ${error.message}`);

  return (data ?? []).map((linha: Record<string, unknown>) => ({
    id: String(linha["id"]),
    nome: String(linha["nome"] ?? ""),
    descricao: String(linha["descricao"] ?? ""),
  }));
}

/**
 * Envia o convite por e-mail e grava o perfil vinculado à função.
 * `admin` ignora RLS — por isso a permissão do chamador é conferida antes.
 */
export async function convidarUsuario(
  admin: SupabaseClient,
  entrada: NovoUsuarioEntrada,
  redirectTo?: string | undefined,
): Promise<{ id: string }> {
  const { nome, email, funcaoId } = entrada;

  const { data: convite, error: erroConvite } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome },
    ...(redirectTo ? { redirectTo } : {}),
  });

  if (erroConvite || !convite?.user) {
    throw new Error(erroConvite?.message ?? "Não foi possível convidar este usuário.");
  }

  const { error: erroPerfil } = await admin
    .from("profiles")
    .insert({ id: convite.user.id, nome, email, funcao_id: funcaoId, ativo: true });

  if (erroPerfil) {
    throw new Error(
      `Convite enviado para ${email}, mas o perfil não foi salvo: ${erroPerfil.message}. ` +
        `Ajuste o perfil antes que o usuário aceite o convite.`,
    );
  }

  return { id: convite.user.id };
}
