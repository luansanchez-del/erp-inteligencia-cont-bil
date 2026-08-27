-- Usuários reais (perfis vinculados ao Supabase Auth) e funções com permissões por módulo.
-- Substitui o mock estático de usuarios/funcoes em src/data/mock.ts.

create table public.funcoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  permissoes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  funcao_id uuid references public.funcoes(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.funcoes enable row level security;
alter table public.profiles enable row level security;

-- Leitura liberada para qualquer usuário autenticado (necessário para nav e telas de
-- Administração). Não existe policy de insert/update/delete: toda escrita passa pelo
-- service role (supabaseAdmin) dentro de server functions, que ignora RLS por design.
create policy "funcoes_select_authenticated" on public.funcoes
  for select to authenticated using (true);

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

insert into public.funcoes (nome, descricao, permissoes) values
  ('Administrador', 'Acesso total a todos os módulos', '[
    {"modulo":"dashboard","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"empresas","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"grupos","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"contabil","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"importacoes","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"integracoes","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"relatorios","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"administracao","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"fiscal","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"patrimonio","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"ecd_ecf","acoes":["ver","criar","editar","excluir","efetivar"]},
    {"modulo":"obrigacoes","acoes":["ver","criar","editar","excluir","efetivar"]}
  ]'::jsonb),
  ('Contador', 'Escrituração, relatórios e fechamento', '[
    {"modulo":"dashboard","acoes":["ver"]},
    {"modulo":"empresas","acoes":["ver"]},
    {"modulo":"grupos","acoes":["ver"]},
    {"modulo":"contabil","acoes":["ver","criar","editar","efetivar"]},
    {"modulo":"importacoes","acoes":["ver","criar","editar"]},
    {"modulo":"integracoes","acoes":["ver"]},
    {"modulo":"relatorios","acoes":["ver","criar"]},
    {"modulo":"fiscal","acoes":["ver","criar","editar","efetivar"]},
    {"modulo":"patrimonio","acoes":["ver","criar","editar"]},
    {"modulo":"ecd_ecf","acoes":["ver","criar"]},
    {"modulo":"obrigacoes","acoes":["ver","criar","editar"]}
  ]'::jsonb),
  ('Consulta', 'Somente leitura de relatórios', '[
    {"modulo":"dashboard","acoes":["ver"]},
    {"modulo":"empresas","acoes":["ver"]},
    {"modulo":"grupos","acoes":["ver"]},
    {"modulo":"contabil","acoes":["ver"]},
    {"modulo":"importacoes","acoes":["ver"]},
    {"modulo":"integracoes","acoes":["ver"]},
    {"modulo":"relatorios","acoes":["ver"]},
    {"modulo":"fiscal","acoes":["ver"]},
    {"modulo":"patrimonio","acoes":["ver"]},
    {"modulo":"ecd_ecf","acoes":["ver"]},
    {"modulo":"obrigacoes","acoes":["ver"]}
  ]'::jsonb);

-- Vincula o admin já autenticado (se existir) para não travar o próprio acesso após a migração.
insert into public.profiles (id, nome, email, funcao_id, ativo)
select u.id, 'Luan Sanchez', u.email, f.id, true
from auth.users u, public.funcoes f
where u.email = 'luan.sanchez@grouplegacy.com.br'
  and f.nome = 'Administrador'
on conflict (id) do nothing;
