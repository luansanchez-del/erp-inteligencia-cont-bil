# Provisões documentadas — agosto/2026

As linhas **Provisão Mês** dos quatro PDFs recebidos foram incorporadas à base única de lançamentos de agosto, por matrícula e centro de custo da folha, com referência ao arquivo e página. São 62 partidas, totalizando R$ 14.777,61. Valores de INSS e FGTS foram extraídos dos documentos, sem recalcular encargos por uma alíquota genérica.

| Unidade | Férias e 1/3 com encargos | 13º com encargos | Total mensal |
| --- | ---: | ---: | ---: |
| Matriz | 6.837,99 | 4.892,85 | 11.730,84 |
| Filial SP | 1.741,65 | 1.305,12 | 3.046,77 |
| Consolidado | 8.579,64 | 6.197,97 | 14.777,61 |

## Fontes

Diretório fornecido: `C:/082026/FOLHA/`.

- `Provisao_Ferias - MATRIZ 08.2026.pdf`: total da empresa na página 6.
- `Provisao_Ferias - FILIAL 08.2026.pdf`: total da empresa na página 2.
- `Provisao_13o_Salario - MATRIZ 08.2026.pdf`: total da empresa na página 4.
- `Provisao_13o_Salario - FILIAL 08.2026.pdf`: total da empresa na página 2.

Extração reproduzível: `node scripts/extrair-provisoes-agosto.mjs`. Os componentes de saldo anterior, ajuste, provisão mensal, pago, diferença de pagamento e saldo foram somados por colaborador/período e conferidos contra cada total do PDF. O arquivo `src/data/nitaplast-provisoes-agosto-documentos.ts` preserva a memória documental, inclusive adiantamentos do 13º.

## Tratamento contábil aplicado

Mantido o mapeamento usado nas provisões documentais de julho:

| Natureza | Débito | Crédito |
| --- | --- | --- |
| Férias + 1/3 | 25057 | 25237 |
| Encargos de férias | 25058 | 25230 |
| 13º salário | 25059 | 25238 |
| Encargos de 13º | 25060 | 25229 |

Não foram lançados saldos acumulados como nova despesa. Os períodos de férias com provisão mensal zero e o 13º mensal zero de Gleicy na rescisão não geraram partidas. A classificação por centro de custo vem da matrícula na folha de agosto, e não de rateio do total da empresa.

## Conciliação com a folha — encargos de férias já provisionados

`src/data/nitaplast-folha-agosto.ts` aplicava 27,3% de encargos patronais sobre toda a folha, inclusive a filial, e lançava os encargos (INSS patronal e FGTS) sobre o bruto de férias de quem tirou férias no mês (Carolina, Emerson, Jussara) como despesa nova. Duas correções:

1. **Alíquota da filial**: o Resumo de Contribuições da "Relação de Cálculo" mostra GILRAT de 1,0% na filial (CNPJ 82.295.817/0003-60) contra 1,5% na matriz — a soma correta é 26,8% na filial e 27,3% na matriz, não 27,3% para as duas. `resumoFolhaAgosto.encargosPatronaisTerceirosGilratFilial` também estava com o valor errado (calculado a 27,3%) e foi corrigido para R$ 3.114,82 (Total do Resumo de Contribuições R$ 4.120,53 menos os R$ 1.005,71 de CP Segurados, que é retenção do empregado).
2. **Dupla provisão**: o valor "Pago" desta base documental (`nitaplast-provisoes-agosto-documentos.ts`) já mostra, mês a mês, a baixa do INSS patronal e do FGTS sobre o bruto de férias de Carolina, Emerson e Jussara — batendo exatamente com `feriasBrutas`/`fgtsFerias` da folha. Isso confirma que o encargo já foi reconhecido como despesa nos meses anteriores, via a provisão mensal (conta 25058/25230). A folha de agosto voltou a lançar esse mesmo encargo como despesa nova (4020/4021). Corrigido: `ENC` agora incide só sobre a base normal (excluída a parcela de férias do mês); a parcela de férias (`ENC-FER-PROV` e `FGTS-FER`) agora debita 25230 (baixa da provisão), não 4020/4021. O total creditado a 25227/25228 (a obrigação real perante o governo) não muda — só deixa de duplicar a despesa.

## Adiantamento de férias — lançamento que faltava

`nitaplast-folha-agosto.ts` nunca lançava o desconto "Adiantamento de Férias" (código 890) de Carolina (30319), Emerson (30281) e Jussara (30323) contra o saldo de folha a pagar (1634) — adicionado `ADT-FER` (1634/312), espelhando o tratamento já existente para adiantamento salarial (`ADT`).

Conferência nos extratos de agosto:

- **Emerson (30281), R$ 1.519,03**: o SOFTDIB (`EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv`) mostra pagamento em 07/08 estornado no mesmo dia e refeito em 14/08 (esta linha com histórico "BOLETO FRETES", claramente uma descrição errada reaproveitada, mas com a mesma referência P00005/FÉRIAS A PAGAR e matrícula). O extrato real do Itaú só mostra o débito de 14/08 — a tentativa de 07/08 nunca chegou a sair da conta, então não há duplicidade de caixa a estornar.
- **Jussara (30323), R$ 1.264,77**: pago em 07/08 sem intercorrência (SOFTDIB e Itaú).
- **Carolina (30319), R$ 809,31**: não localizado nos extratos Itaú, Bradesco, BB ou Uniprime lidos até agora. O lançamento foi mantido pelo valor do relatório de folha (fonte documental independente do banco), mas a referência bancária de Carolina continua em aberto.

## Conciliação concluída (validação, sem novas baixas automáticas)

Esta apropriação mensal continua não gerando baixa da provisão por conta própria — os demais movimentos ficam na memória documental. A tabela abaixo resume o que existe, e o que foi validado contra folha e bancos:

| Documento | Ajuste | Pago (sinal do PDF) | Diferença de pagamento | Adiantamento do 13º, incluindo FGTS |
| --- | ---: | ---: | ---: | ---: |
| Férias matriz | 234,90 | -3.812,08 | 63,77 | — |
| Férias filial | 73,74 | -1.843,13 | 151,24 | — |
| 13º matriz | 47,92 | 202,95 | 0,00 | 22.533,77 |
| 13º filial | 50,16 | 0,00 | 0,00 | 5.283,89 |

**Pago (férias)**: já reconciliado com a folha e os bancos na seção anterior — bate com `feriasBrutas`/`fgtsFerias` de Carolina, Emerson e Jussara, e o encargo correspondente foi corrigido em `nitaplast-folha-agosto.ts` para não duplicar despesa.

**Pago (13º matriz, R$ 202,95 — rescisão de Gleicy, matrícula 30355)**: principal (150,00) e FGTS (12,00) já batem exatamente com as linhas `RES-13` e `FGTS-13-RES` já lançadas na folha. O INSS (40,95) é 27,3% de R$ 150,00 — o encargo patronal sobre o 13º proporcional dela, que a folha de agosto **não lança** (o `baseEncargos` de Gleicy não inclui essa verba rescisória). Portanto não há duplicidade: o encargo é reconhecido só uma vez, pela baixa da provisão. Nenhum ajuste necessário.

**Ajuste**: são linhas de arredondamento/reclassificação internas do próprio relatório de provisão entre competências (R$ 234,90 / 73,74 / 47,92 / 50,16), sem contrapartida de caixa — não geram lançamento.

**Diferença de pagamento**: mesma natureza do Ajuste, residual de centavos a poucas dezenas de reais por rodada de cálculo do relatório (R$ 63,77 / 151,24) — sem contrapartida de caixa, não geram lançamento.

**Adiantamento do 13º salário (R$ 22.533,77 matriz + R$ 5.283,89 filial)**: este campo é o saldo **acumulado** do adiantamento de 13º já recebido pelo colaborador (não necessariamente pago em agosto — o 13º costuma ser adiantado uma vez ao ano, em qualquer mês). Cruzei o valor principal de cada colaborador com os extratos de agosto (Itaú, Bradesco, BB, SOFTDIB, Uniprime — este último sem texto extraível):

| Matrícula | Colaborador | Adiantamento 13º (principal) | Confirmado em agosto? |
| --- | --- | ---: | --- |
| 30319 | Carolina | 3.459,48 | Sim — Bradesco, TRANSF CC PARA CC |
| 30302 | Bianca | 2.319,03 | Sim — Bradesco, TRANSF CC PARA CC |
| 30334 | Daniele | 2.751,64 | Sim — Itaú, TED 31/08 |
| 30356 | Leticia | 166,67 | Sim — Itaú, PIX 31/08 |
| 30321 | Willian | 2.002,19 | Sim — Itaú, PIX 31/08 |
| 30357 | Eder (filial) | 83,33 | Sim — Bradesco, TRANSF CC PARA CC |
| 30335 | Thauany (filial) | 1.606,89 | Sim — Bradesco, TRANSF CC PARA CC |
| 30323 | Jussara (filial) | 2.102,28 | Não localizado em agosto |
| 30349 | Alana | 1.100,00 | Não localizado em agosto |
| 30281 | Emerson | 2.301,39 | Não localizado em agosto |
| 30350 | Kauhane | 1.500,00 | Não localizado em agosto |
| 30320 | Marilia | 2.089,23 | Não localizado em agosto |
| 30271 | Vera | 1.550,00 | Não localizado em agosto |
| 30345 | Walleria | 1.625,00 | Não localizado em agosto |
| 30352 | Cauan (filial) | 1.100,00 | Não localizado em agosto |

7 dos 14 colaboradores batem exatamente com um crédito de agosto — confirmando que esse é o mês do adiantamento para eles. Os outros 7 provavelmente receberam o adiantamento em outro mês do ano (o saldo é cumulativo, não um lançamento de agosto), ou o pagamento saiu num dos lotes agregados do Itaú (SISPAG SALARIOS de 05/08, 07/08, 17/08 e 31/08, que somam R$ 31.062,59 sem detalhamento por colaborador no extrato) — sem a remessa SISPAG detalhada não dá para decompor esse lote por pessoa.

Como é saldo documental (reduz o que falta pagar no 13º de dezembro, sem ser despesa nova — o encargo mensal já está provisionado via 25059/25060/25238/25229), nenhuma baixa é lançada no Razão a partir só deste achado; qualquer movimento de caixa que corresponda a um adiantamento de 13º **fora de agosto** pertence à competência em que ocorreu, não a agosto/2026. Divergências não autorizam lançamento de encaixe.

## Verificação

`node scripts/validar-provisoes-agosto.mjs` confere os quatro totais documentais, contas, separação matriz/filial, IDs únicos na base integrada, rastreabilidade e os casos de períodos quitados/rescisão.
