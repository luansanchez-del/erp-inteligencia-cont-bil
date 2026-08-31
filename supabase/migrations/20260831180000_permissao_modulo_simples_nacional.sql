-- Concede acesso ao novo módulo "Simples Nacional" (cadastro e abertura contábil de
-- empresas do regime Simples Nacional, isolado do motor contábil da Nitaplast).

update public.funcoes
set permissoes = permissoes || '[{"modulo":"simples_nacional","acoes":["ver","criar","editar","excluir","efetivar"]}]'::jsonb
where nome = 'Administrador'
  and not exists (
    select 1 from jsonb_array_elements(permissoes) perm where perm->>'modulo' = 'simples_nacional'
  );

update public.funcoes
set permissoes = permissoes || '[{"modulo":"simples_nacional","acoes":["ver","criar","editar"]}]'::jsonb
where nome = 'Contador'
  and not exists (
    select 1 from jsonb_array_elements(permissoes) perm where perm->>'modulo' = 'simples_nacional'
  );

update public.funcoes
set permissoes = permissoes || '[{"modulo":"simples_nacional","acoes":["ver"]}]'::jsonb
where nome = 'Consulta'
  and not exists (
    select 1 from jsonb_array_elements(permissoes) perm where perm->>'modulo' = 'simples_nacional'
  );
