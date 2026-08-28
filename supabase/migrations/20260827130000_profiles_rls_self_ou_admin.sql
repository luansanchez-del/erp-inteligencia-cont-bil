-- Restringe a leitura de public.profiles: cada usuário só enxerga o próprio perfil,
-- exceto quem tem permissão de "ver" no módulo administracao (aí enxerga todos, o
-- que a tela Administração > Usuários precisa). Corrige o apontamento do scanner de
-- segurança do Lovable: "All authenticated users can read every user's profile data".

create or replace function public.tem_permissao(p_modulo text, p_acao text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.funcoes f on f.id = p.funcao_id
    where p.id = auth.uid()
      and exists (
        select 1
        from jsonb_array_elements(f.permissoes) perm
        where perm->>'modulo' = p_modulo
          and perm->'acoes' ? p_acao
      )
  );
$$;

drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.tem_permissao('administracao', 'ver'));
