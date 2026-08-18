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
