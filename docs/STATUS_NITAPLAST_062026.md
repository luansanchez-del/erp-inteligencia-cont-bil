# Checkpoint — Nitaplast 06/2026

Este arquivo é o ponto de retomada obrigatório do fechamento. Não considerar uma tarefa concluída apenas porque a tela foi criada; marcar concluída somente depois de a cadeia contábil correspondente estar coerente.

## Regra contábil permanente

**Documentos / fontes → Lançamentos → Razão → Balancete → DRE Oficial → Exportação Questor**

- A DRE de Validação é apenas comparação com DRE manual/enviada.
- A DRE de Validação nunca alimenta Razão, Balancete ou DRE Oficial.
- Todo lançamento exportável deve existir como conta analítica no Balancete.
- Toda conta de resultado exportável deve ter destino reconhecido pela mesma classificação usada na DRE Oficial.
- Conta 4859 é válida no plano: pode ser exportada como transitória, com alerta para reclassificação posterior.
- Alertas não bloqueiam exportação; erros estruturais reais bloqueiam.

## Estrutura de telas acordada

### Contábil
- Lançamentos
- Razão
- Diário
- Balancete
- DRE Oficial
- DRE de Validação
- Balanço Patrimonial
- Fechamento / Fechamento Assistido

### Relatórios
Menu expansível de acesso direto. Não deve existir central intermediária em cards.
- DRE Oficial
- Razão
- Diário
- Balancete
- Balanço Patrimonial

## Correções estruturais concluídas no código

- [x] Remover central de cards de `/relatorios`; acesso direto redireciona para DRE Oficial.
- [x] Remover bloco fixo `Fechamento em andamento → Nitaplast 06/2026` do sidebar; empresa e competência pertencem ao contexto global.
- [x] DRE Oficial separada da DRE de Validação.
- [x] DRE Oficial calculada pelo mesmo Razão ajustado do Balancete.
- [x] Lote/CSV final montado pelo mesmo Razão ajustado da DRE Oficial e do Balancete.
- [x] Conta 4859 tratada como alerta exportável, não bloqueante.
- [x] Lote bloqueia conta inexistente no plano/Balancete e conta de resultado sem destino na DRE Oficial.
- [x] DRE Oficial com exportação CSV e impressão/PDF.
- [x] Balancete com exportação CSV e impressão/PDF.
- [x] Impressão global sem sidebar/topbar, em A4 paisagem.
- [x] Fechamento de estoque legado `EST-REV-*` / `EST-FIN-*` retirado da base definitiva; usar inventário oficial.

## Próxima validação obrigatória — NÃO PULAR

- [ ] Atualizar aplicação local com `git pull origin main`.
- [ ] Confirmar que `/relatorios` não mostra mais cards.
- [ ] Confirmar que o bloco fixo `Nitaplast 06/2026` sumiu do sidebar.
- [ ] Abrir `Contábil → Lançamentos` e verificar quantidade de **Pendências bloqueantes**.
- [ ] Se bloqueantes = 0, comparar total de débitos/créditos do lote com o Razão ajustado e o Balancete.
- [ ] Conferir DRE Oficial resultante do mesmo Razão.
- [ ] Só então considerar o lote apto para importar no Questor.

## Não fazer no meio da validação

- Não alterar números da DRE para fazê-la bater com a DRE manual.
- Não criar conta/sintética artificial para encaixar lançamento no Balancete.
- Não iniciar nova melhoria de layout antes de concluir a validação acima, salvo erro que impeça a própria validação.
