// Edge Function: cria um usuário real (convite por e-mail) + perfil vinculado a uma função.
// Roda no ambiente do Supabase, onde SUPABASE_SERVICE_ROLE_KEY já existe injetada
// automaticamente pela plataforma — não precisa ser configurada manualmente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client no contexto de quem chamou (RLS ativo) — só pra checar permissão.
    const supabaseCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseCaller.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "Não autenticado." }, 401);

    const { data: podeCriar, error: erroPermissao } = await supabaseCaller.rpc("tem_permissao", {
      p_modulo: "administracao",
      p_acao: "criar",
    });
    if (erroPermissao || !podeCriar) {
      return jsonResponse({ error: "Você não tem permissão para criar usuários." }, 403);
    }

    const { nome, email, funcaoId } = await req.json();
    if (!nome?.trim() || !email?.trim() || !funcaoId) {
      return jsonResponse({ error: "Preencha nome, e-mail e função." }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: convite, error: erroConvite } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { data: { nome } },
    );
    if (erroConvite || !convite.user) {
      return jsonResponse({ error: erroConvite?.message ?? "Não foi possível convidar este usuário." }, 400);
    }

    const { error: erroPerfil } = await supabaseAdmin.from("profiles").insert({
      id: convite.user.id,
      nome,
      email,
      funcao_id: funcaoId,
      ativo: true,
    });
    if (erroPerfil) {
      return jsonResponse(
        { error: `Convite enviado, mas falhou ao salvar o perfil: ${erroPerfil.message}` },
        500,
      );
    }

    return jsonResponse({ id: convite.user.id });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
