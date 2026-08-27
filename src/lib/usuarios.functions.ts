import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  convidarUsuario,
  exigirPermissao,
  listarFuncoesDoBanco,
  listarUsuariosDoBanco,
  validarNovoUsuario,
  type FuncaoListada,
  type NovoUsuarioEntrada,
  type UsuarioListado,
} from "./usuarios.server";

export type { FuncaoListada, UsuarioListado };

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioListado[]> => {
    return listarUsuariosDoBanco(context.supabase as unknown as SupabaseClient);
  });

export const listarFuncoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FuncaoListada[]> => {
    return listarFuncoesDoBanco(context.supabase as unknown as SupabaseClient);
  });

export const podeCriarUsuario = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    try {
      await exigirPermissao(
        context.supabase as unknown as SupabaseClient,
        "administracao",
        "criar",
      );
      return true;
    } catch {
      return false;
    }
  });

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NovoUsuarioEntrada & { redirectTo?: string }) => input)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const caller = context.supabase as unknown as SupabaseClient;
    await exigirPermissao(caller, "administracao", "criar");

    const entrada = validarNovoUsuario(data);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return convidarUsuario(
      supabaseAdmin as unknown as SupabaseClient,
      entrada,
      data.redirectTo,
    );
  });
