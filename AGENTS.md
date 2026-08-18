<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Regras permanentes de governança contábil

- Abertura gerencial nunca vira lançamento no Razão. Razão recebe somente fato contábil real.
- O fluxo oficial é: documentos/evidências → lançamentos → Razão → Balancete → DRE/BP.
- Nunca criar plug, lançamento de encaixe ou ajuste automático apenas para fechar relatório.
- O módulo de Lançamentos deve sempre permitir ao usuário **criar, editar e excluir** uma partida contábil.
- Criar/editar/excluir deve preservar trilha de auditoria. Lançamento vindo de documento/importação não é apagado silenciosamente: edição deve manter referência ao original e exclusão deve ser tratada por estorno/auditoria explícita.
- Alterações manuais precisam repercutir na mesma base usada por Razão, Balancete, Diário e DRE.
- Ações manuais devem permitir, no mínimo: data, conta débito, conta crédito, histórico, valor e centro de custo.

## Regra permanente de impressão e relatórios

- Impressão é regra estrutural do ERP, nunca ajuste específico por empresa ou competência.
- Balancete, Razão, Diário, DRE e Lançamentos devem usar o mesmo padrão de impressão para qualquer empresa e qualquer mês cadastrado.
- A impressão deve representar o **documento contábil**, não a interface da tela: cards de indicadores, filtros, buscas, botões, alertas gerenciais e elementos de navegação não podem aparecer no PDF/impressão.
- Todo relatório impresso deve obter dinamicamente do cadastro/contexto: razão social, nome fantasia quando aplicável, CNPJ, nome do relatório e período da competência selecionada. É proibido fixar nome de empresa ou mês no layout de impressão.
- Tabelas impressas devem ocupar a largura útil da página, repetir o cabeçalho em novas páginas e evitar corte de linhas entre páginas.
- Colunas exclusivamente operacionais da tela, como “Detalhe”, “Ações”, “Editar”, “Excluir” ou navegação para outro módulo, não pertencem ao documento impresso.
- O padrão global de impressão deve ser implementado no shell/CSS/componentes reutilizáveis para que novas empresas e novas competências herdem a regra automaticamente.
