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

## Regra permanente do livro Razão

- Ao consultar uma conta específica, o Razão deve sempre apresentar o **saldo anterior transportado** antes dos movimentos da competência.
- Saldo anterior transportado é linha informativa do livro e referência para cálculo do saldo corrente; **não é lançamento contábil**, não gera débito/crédito, não entra na quantidade de partidas e não pode ser exportado como fato contábil.
- Se uma conta tiver saldo anterior e nenhum movimento na competência, o Razão deve informar claramente “Nenhuma movimentação na competência” e manter saldo final igual ao saldo anterior.
- A consulta deve identificar a conta por código, descrição e classificação do plano. Código inexistente deve ser informado como “Conta não encontrada no plano”; é proibido inventar nome ou classificação.
- Pendências gerais de fechamento, folha, bancos, câmbio ou conciliação pertencem aos módulos de Conciliação/Fechamento e não devem aparecer como card genérico dentro do Razão de uma conta.
- Esta regra é estrutural e deve ser herdada por qualquer empresa e qualquer competência cadastrada; não pode depender de conta, empresa ou mês hardcoded.

## Regra permanente de impressão e relatórios

- Impressão é regra estrutural do ERP, nunca ajuste específico por empresa ou competência.
- Balancete, Razão, Diário, DRE e Lançamentos devem usar o mesmo padrão de impressão para qualquer empresa e qualquer mês cadastrado.
- A impressão deve representar o **documento contábil**, não a interface da tela: cards de indicadores, filtros, buscas, botões, alertas gerenciais e elementos de navegação não podem aparecer no PDF/impressão.
- Todo relatório impresso deve obter dinamicamente do cadastro/contexto: razão social, nome fantasia quando aplicável, CNPJ, nome do relatório e período da competência selecionada. É proibido fixar nome de empresa ou mês no layout de impressão.
- **Documentos contábeis impressos são monocromáticos (preto e branco).** Cores da interface, fundos azuis/verdes/âmbar, badges e cores de status nunca podem aparecer no Balancete, Razão, Diário, DRE ou Lançamentos impressos. A hierarquia deve ser representada por negrito, recuo, bordas e tipografia.
- Tabelas impressas devem ocupar a largura útil da página, repetir o cabeçalho em novas páginas e evitar corte de linhas entre páginas.
- Colunas exclusivamente operacionais da tela, como “Detalhe”, “Ações”, “Editar”, “Excluir” ou navegação para outro módulo, não pertencem ao documento impresso.
- O padrão global de impressão deve ser implementado no shell/CSS/componentes reutilizáveis para que novas empresas e novas competências herdem a regra automaticamente.
