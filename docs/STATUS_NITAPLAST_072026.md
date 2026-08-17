# STATUS NITAPLAST — 07/2026

## Competência

- Empresa: NITAPLAST IND E COM DE PLASTICOS INDUSTRIAIS LTDA
- Matriz: 82.295.817/0001-07
- Filial SP: 82.295.817/0003-60
- Competência: 07/2026
- Situação: **em fechamento**

## Regra estrutural

O fechamento de julho repete a cadeia de junho:

**documentos/origens → normalização → lançamentos → Razão → Balancete → DRE/Balanço → evidências → fechamento**

Abertura gerencial ou valor de controle **não vira lançamento no Razão**. O Razão recebe somente fatos contábeis documentados. Nenhum valor de DRE pode alimentar a própria DRE calculada.

### Regra para arquivos do fiscal

Arquivos/relatórios de **validação do fiscal devem ser ignorados no fechamento contábil**. Erros e avisos desses relatórios não são achados contábeis da Nitaplast e não bloqueiam o fechamento.

Somente analisar a escrituração fiscal digital quando for fornecido o **arquivo TXT/SPED real**. PDF, impressão ou relatório de validação não substitui o TXT e não deve gerar pendência contábil.

## Itens que ficam fora nesta etapa

Por orientação do usuário, os itens abaixo serão lançados depois pela tela de Lançamentos e não entram automaticamente na montagem inicial de julho:

- JCP;
- depreciação — manter a mesma lógica de junho, porém sem lançar valor agora;
- juros ativos;
- juros passivos;
- variação cambial;
- demais componentes do resultado financeiro que dependam desses lançamentos manuais.

## Base documental recebida

### Fiscal

- entradas e saídas em CSV/PDF;
- ICMS matriz e filial;
- ICMS-ST;
- IPI;
- PIS;
- COFINS;
- devoluções;
- CT-e;
- impostos retidos;
- DANFEs canceladas;
- FCI.

Relatórios de validação EFD/EFD-Contribuições eventualmente enviados ficam fora da base contábil. Só entram como escrituração quando houver TXT/SPED real.

### Financeiro e patrimonial

- extratos Bradesco, Itaú, Banco do Brasil e Greencred/Uniprime;
- aplicações financeiras Bradesco, Itaú e Greencred;
- contratos de câmbio de importação e exportação;
- posição de clientes faturados até 31/07/2026;
- inventário atualizado em 31/07/2026;
- entradas por centro de custo do Softdib.

## Inventário oficial da matriz em 31/07/2026

| Conta | Grupo | Valor |
|---|---|---:|
| 25133 | Produto acabado | R$ 4.207.698,55 |
| 25134 | Refugo + retalho + lixo | R$ 39.464,14 |
| 25135 | Matéria-prima | R$ 1.443.376,19 |
| 25136 | Produtos em elaboração | R$ 107.919,59 |
| 25137 | Produto intermediário | R$ 5.285,59 |
|  | **Total** | **R$ 5.803.744,06** |

O inventário é **alvo patrimonial**. O ajuste contábil somente será calculado depois que as entradas, consumos/CPV, produção e demais fatos reais de julho estiverem no Razão, evitando dupla contagem.

## Receita fiscal preliminar

A receita abaixo foi reconstruída por CFOP/documentos, sem usar DRE como fonte e sem tratar transferências/remessas como receita:

- produção matriz: R$ 3.449.137,41;
- revenda matriz: R$ 173.371,51;
- produção/operação triangular filial: R$ 4.264,28;
- revenda filial: R$ 517.128,58;
- **receita bruta fiscal preliminar: R$ 4.143.901,78**.

Deduções fiscais preliminares:

- devoluções: R$ 38.407,22;
- ICMS: R$ 311.429,02;
- ICMS-ST: R$ 1.024,72;
- IPI: R$ 195.769,63;
- PIS sobre saídas: R$ 49.820,30;
- COFINS sobre saídas: R$ 229.476,68;
- **total preliminar de deduções: R$ 825.927,57**;
- **receita líquida preliminar: R$ 3.317.974,21**.

Esses valores ainda não representam a DRE final: CPV, folha, despesas, bancos, fornecedores e demais movimentos precisam passar pelo Razão.

## Centro de custo

Arquivo Softdib de julho:

- 597 documentos/linhas-fonte da competência por data de recepção;
- 103 combinações de conta gerencial + centro de custo;
- valor total nas contas gerenciais: R$ 4.209.811,76;
- valor distribuído por centro de custo: R$ 4.202.763,84;
- diferença sem centro de custo completo: **R$ 7.047,92**, em 9 documentos.

Essa diferença não será rateada automaticamente. Permanecerá como achado para classificação.

## PIS / COFINS — apuração

- PIS débito de saídas: R$ 49.820,30;
- PIS crédito de entradas: R$ 33.908,91;
- PIS devedor antes de retenções: R$ 15.911,39;
- COFINS débito de saídas: R$ 229.476,68;
- COFINS crédito de entradas: R$ 156.119,80;
- COFINS devedor antes de retenções: R$ 73.356,88.

## Próxima camada do fechamento

1. Normalizar as entradas de julho por conta contábil e centro de custo, reaproveitando os mapeamentos validados de junho.
2. Montar receitas/deduções fiscais no Razão sem transferências e remessas internas.
3. Reconciliar fornecedores/clientes e baixas bancárias.
4. Integrar bancos e aplicações sem lançar resultado financeiro automático.
5. Fechar estoque contra o inventário oficial somente depois dos movimentos reais do mês.
6. Formar Balancete e DRE calculada.
7. Receber pela tela de Lançamentos os itens manuais: JCP, depreciação, juros e variação cambial.
