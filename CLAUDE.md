# ERP Inteligência Contábil

## Objetivo do produto

Este projeto não é apenas um dashboard ou estudo de caso.

O objetivo é construir um ERP de Inteligência Contábil capaz de apoiar e automatizar o processo de fechamento contábil, análise, validação, rastreabilidade e gestão operacional de múltiplas empresas.

O sistema deverá evoluir para atender múltiplos clientes, usuários, departamentos, responsáveis e competências.

## Regra fundamental

NITAPLAST é atualmente o principal caso real utilizado para desenvolvimento e validação das regras contábeis.

NITAPLAST NÃO é a arquitetura definitiva do produto.

Não criar novas funcionalidades permanentemente acopladas à Nitaplast.

Sempre que possível, separar:

1. motor/regra contábil genérica;
2. dados da empresa;
3. interface;
4. integrações;
5. evidências/documentos de origem.

As regras validadas usando a Nitaplast deverão posteriormente funcionar para outras empresas.

## Princípios contábeis

O sistema deve interpretar contabilmente as contas e não apenas validar sinais matematicamente.

Considerar:

- natureza devedora e credora;
- contas redutoras;
- contas sintéticas e analíticas;
- ativo;
- passivo;
- patrimônio líquido;
- receitas;
- despesas;
- custos;
- fornecedores;
- clientes;
- bancos;
- estoques;
- impostos;
- folha;
- depreciação;
- centro de custos;
- contrapartidas;
- competência;
- saldo anterior;
- movimento;
- saldo final;
- composição da DRE;
- razão;
- balancete;
- balanço patrimonial.

Saldo aparentemente invertido não deve ser automaticamente classificado como erro sem avaliar a natureza contábil da conta.

## Fechamento contábil

Fluxo desejado:

documentos/origens
→ importação
→ normalização
→ lançamentos
→ razão
→ balancete
→ DRE/Balanço
→ validações
→ achados
→ evidências
→ aprovação
→ fechamento

O sistema deve distinguir:

- impedimento: bloqueia fechamento;
- alerta: exige atenção, mas pode permitir fechamento;
- informação: evidência ou observação sem bloqueio.

Alertas devem poder ser aprovados mediante justificativa/evidência quando aplicável.

## Rastreabilidade

Todo valor contábil relevante deverá, no futuro, poder indicar sua origem.

Tipos conceituais:

- documento;
- importado;
- derivado/calculado;
- sugerido pelo sistema;
- ajustado manualmente.

Evitar valores sem origem identificável.

## Gestão

O ERP deverá suportar:

- empresas;
- estabelecimentos;
- grupos econômicos;
- competências;
- departamentos;
- usuários;
- responsáveis;
- carteiras;
- solicitações;
- status de fechamento;
- indicadores;
- histórico;
- auditoria.

## PIER

PIER faz parte da arquitetura futura/integração real.

Objetivo:

PIER
→ solicitações
→ ERP Inteligência Contábil
→ processamento/análise
→ revisão humana
→ evidência
→ aprovação/finalização.

Não simular uma integração real como se estivesse operacional.

Quando não houver backend/API real, deixar isso claramente identificado.

## Questor

Questor é atualmente um sistema contábil de referência e futuro ponto de integração/importação/exportação.

O ERP deverá suportar progressivamente:

- plano de contas;
- centros de custos;
- lançamentos;
- balancete;
- razão;
- DRE;
- importações;
- layouts compatíveis;
- eventual integração por API quando tecnicamente disponível.

Não inventar endpoints ou funcionalidades da API Questor.

## Dados reais

Dados contábeis reais usados para validação não devem definir permanentemente a arquitetura.

Evitar adicionar novos dados sensíveis diretamente no código-fonte quando houver alternativa melhor.

Planejar migração gradual dos dados hardcoded atuais para armazenamento estruturado/backend.

## Estado técnico atual

Aplicação atual:
- React;
- TypeScript;
- TanStack;
- Vite;
- interface originada no Lovable.

GitHub é a fonte oficial do código.

Branch principal:
main

O build e o typecheck foram validados antes da criação deste arquivo:

- npm run build: OK
- npx tsc --noEmit: 0 erros

Existe grande quantidade de apontamentos de lint relacionados principalmente a CRLF/formatação.

Não realizar reforma global de lint/Prettier/CRLF sem solicitação explícita.

## Forma de trabalhar

Antes de alterações relevantes:

1. verificar git status;
2. compreender o código existente;
3. reutilizar funcionalidades existentes;
4. evitar duplicação;
5. identificar impacto;
6. alterar somente o necessário;
7. executar validações depois da mudança.

Nunca reconstruir módulos funcionais sem necessidade.

Nunca apagar funcionalidade existente para simplificar implementação sem autorização.

Não alterar regra contábil apenas para fazer teste passar.

Se houver dúvida entre regra técnica e regra contábil, parar e pedir decisão.

## Git

Não fazer push automaticamente sem autorização.

Antes de commit:
- build;
- typecheck;
- verificar git diff.

Commits devem ser pequenos, claros e relacionados a uma alteração lógica.

Lovable e Claude Code compartilham este repositório.

Evitar conflitos entre alterações simultâneas feitas pelo Lovable e Claude.

## Prioridade de arquitetura

A evolução deve caminhar de:

protótipo baseado em dados reais
→ motor contábil generalizado
→ persistência/backend
→ multiempresa real
→ importadores
→ integrações
→ automação contábil.

Não começar novamente do zero.

Preservar o conhecimento contábil já validado nas telas e dados existentes.
