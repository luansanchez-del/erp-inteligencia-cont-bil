# Criação de usuários com convite por e-mail

O objetivo do código enviado é: um administrador cadastra nome, e-mail e função, o sistema envia um convite por e-mail e cria o perfil já vinculado à função.

Esse comportamento será implementado, mas **não como Edge Function**. Neste projeto (TanStack Start), a lógica interna do aplicativo roda em *server functions*, que já são o backend oficial da aplicação. Criar uma Edge Function aqui adicionaria um segundo backend paralelo, com CORS manual, autenticação manual e deploy separado — sem nenhum ganho. A server function equivalente é mais simples, mais segura e usa a mesma sessão de login do ERP.

## O que já existe no backend

- Tabelas `profiles` e `funcoes` criadas.
- Função de banco `tem_permissao(modulo, acao)` funcionando.
- Chave de serviço disponível no servidor.

## O que será feito

### 1. Server function `criarUsuario`

Arquivo novo `src/lib/usuarios.functions.ts`, com a mesma regra do código enviado:

- Exige usuário autenticado (middleware de autenticação existente).
- Verifica `tem_permissao('administracao', 'criar')` no contexto do próprio chamador — quem não tem permissão recebe erro claro.
- Valida nome, e-mail e função (obrigatórios, e-mail em formato válido).
- Envia o convite por e-mail e cria o registro em `profiles` com `id`, `nome`, `email`, `funcao_id`, `ativo = true`.
- Se o convite for enviado mas o perfil falhar, retorna mensagem explícita para o administrador — sem deixar o usuário em estado silenciosamente quebrado.

### 2. Server function `listarUsuarios`

Leitura de `profiles` + `funcoes` para que a aba **Usuários** deixe de exibir dados mockados e passe a mostrar os usuários reais.

### 3. Tela de Administração

Em `src/routes/administracao.tsx`, aba **Usuários**:

- Botão **Novo usuário** abrindo um diálogo com nome, e-mail e seleção de função.
- Lista alimentada pelos dados reais do banco, com atualização automática após o convite.
- Botão visível apenas para quem tem permissão de criar em Administração.
- Mensagens de sucesso e de erro via toast.

## Detalhes técnicos

- `criarUsuario` usa `createServerFn({ method: 'POST' })` com `.middleware([requireSupabaseAuth])`; a checagem de permissão usa o client do chamador (RLS ativo) e a criação usa o client administrativo carregado dentro do handler.
- Sem CORS, sem `Deno.serve`, sem `SUPABASE_ANON_KEY` manual: a chamada é same-origin e o token já é anexado pelo middleware registrado em `src/start.ts`.
- O arquivo de tipos do banco está desatualizado (não lista `profiles`/`funcoes`); será regenerado antes de escrever o código que depende dessas tabelas.
- Nenhum arquivo de contabilidade, Razão, Balancete ou DRE é tocado.

## Observação

Se ainda assim você quiser especificamente uma Edge Function em Deno — por exemplo porque um sistema externo (PIER, Questor, automação) vai chamar esse endpoint de fora do ERP —, me diga: nesse caso a saída correta continua não sendo Edge Function, e sim uma rota HTTP pública em `src/routes/api/public/`, com verificação de credencial no próprio handler.
