# Fundação do ERP Contábil — arquitetura de telas, rotas e navegação

Escopo desta etapa: **somente casca visual e navegação**. Sem motor contábil, sem API externa, sem importação real, sem automações. Dados apenas em mocks mínimos (poucas linhas) para dar forma às telas.

## Shell da aplicação

Layout fixo em todas as telas:

```text
+---------------------------------------------------------------+
| Topbar: [Empresa v] [Competência v]   busca global   [usuário] |
+-----------+---------------------------------------------------+
| Sidebar   | Breadcrumb + título da página                      |
| (fixa,    |                                                    |
|  colapsa) | Filtros / ações                                    |
|           | Conteúdo (tabela, cards, formulário)               |
+-----------+---------------------------------------------------+
```

- Seletor global de empresa e de competência na topbar, persistidos e visíveis em todas as telas.
- Faixa de identificação da empresa ativa (nome, CNPJ, competência) sempre visível.
- Sidebar fixa, agrupada por módulo, colapsável para ícones, com grupo ativo aberto.
- Módulos futuros aparecem na sidebar marcados como "Em breve" e abrem uma tela padrão de placeholder.

## Rotas

Principais:
- `/` Dashboard
- `/empresas` e `/empresas/:id`
- `/grupos`
- `/importacoes`
- `/integracoes`
- `/relatorios`
- `/administracao` (usuários, perfis/funções, permissões, parâmetros)

Contábil (`/contabil/...`):
`competencias`, `plano-de-contas`, `centros-de-custo`, `historicos`, `lancamentos`, `lotes`, `rateios`, `conciliacao`, `fechamento`, `encerramento`, `razao`, `diario`, `balancete`, `dre`, `balanco-patrimonial`

Módulos futuros (placeholder): `/fiscal`, `/patrimonio`, `/ecd-ecf`, `/obrigacoes`

## Padrões de tela reutilizáveis

- **Página de listagem**: cabeçalho + barra de filtros (busca, período, status) + tabela densa com colunas fixas, ordenação, seleção múltipla, paginação server-ready e estados de vazio/carregando.
- **Tabela de alto volume**: componente único de DataTable com paginação e estrutura pronta para virtualização; todas as listagens usam ele.
- **Formulários/detalhe**: painel lateral ou página de detalhe, sem validação contábil.
- **Placeholder de módulo futuro**: título, descrição do que virá, sem controles falsos.

## Conteúdo por área

- **Dashboard**: cartões de indicadores (valores estáticos discretos), atalhos por módulo, status da competência.
- **Empresas**: lista com busca/filtro por grupo e regime; detalhe com abas (Dados, Contábil, Grupos, Integrações).
- **Grupos de Empresas**: lista de grupos e empresas vinculadas.
- **Contábil**: cada rota entrega a tela padrão adequada (listagem, relatório ou fluxo em etapas para fechamento/encerramento), sem cálculo.
- **Importações**: tela conceitual com cartões por formato (TXT, CSV, XLSX, OFX, PDF, XML, API), área de upload desabilitada e histórico de importações vazio.
- **Integrações**: catálogo de conectores com card Questor em estado "não conectado", mais espaço para conectores futuros.
- **Relatórios**: catálogo de relatórios contábeis apontando para as telas do módulo Contábil.
- **Administração**: usuários, funções e matriz de permissões por módulo/ação — apenas UI.

## Entidades sugeridas (modelo de referência, ainda sem banco)

Empresa, GrupoEmpresa, Competencia, ContaContabil (plano de contas hierárquico), CentroDeCusto, HistoricoPadrao, Lote, Lancamento, PartidaLancamento, Rateio, ConciliacaoItem, FechamentoPeriodo, Usuario, Funcao, Permissao, ImportacaoJob, Integracao.

Tipos TypeScript dessas entidades ficam em `src/types/` para a fase seguinte plugar backend.

## Notas técnicas

- TanStack Router com arquivos em `src/routes/`; layout compartilhado no `__root.tsx` + rota de layout do app com sidebar/topbar.
- Estado global de empresa/competência via contexto React + persistência local.
- Camada de permissões: hook `useCan(modulo, acao)` com perfil mockado, para já envolver itens de menu e botões.
- shadcn/ui + Tailwind, tokens semânticos em `src/styles.css`, identidade sóbria e densa (tema claro por padrão, opção escura).
- `head()` próprio em cada rota de conteúdo.
- Sem backend nesta etapa; Lovable Cloud entra quando o modelo de dados for aprovado.
