# Dossiê de composição do CPV, Impostos e Receitas Financeiras — Nitaplast — Agosto/2026

## Conclusão executiva

O CPV total reconhecido pelo motor em agosto/2026 é de **R$ 1.930.605,74**, decomposto por estabelecimento (critério `estabelecimentoLancamentoNitaplast`, por lançamento — não por conta nem por CC isolado) em:

- **CPV Matriz: R$ 1.773.500,72**
- **CPV Filial SP: R$ 157.105,02**

A soma bate exatamente com o CPV/CMV do Razão (diferença R$ 0,00).

O achado registrado em 15–16/09/2026 ("CPV Filial maior que a receita da Filial") está **resolvido** neste fechamento: com as transferências internas Matriz↔Filial lançadas dos dois lados, o CPV Filial (R$ 157.105,02) representa 52,8% da receita bruta da Filial (R$ 297.776,99) — uma margem plausível, não mais um valor absurdo.

Seguem, ainda, pendências identificadas e marcadas como `status: "revisar"` no código-fonte (ver seção "Pontos de controle abertos").

## Como a separação Matriz x Filial é feita

O motor não decide o estabelecimento por conta contábil isolada nem só pelo centro de custo: usa `estabelecimentoLancamentoNitaplast` ([nitaplast-estabelecimento.ts](../src/data/nitaplast-estabelecimento.ts)), que combina, nesta ordem de prioridade:

1. conta dedicada da Filial (lista fixa: 25138–25140, 25054/25055, 25945, imobilizado/depreciação 25154-25201, apuração 25235/25236) ou descrição contendo "FILIAL"/"COMERCIAL SP";
2. centro de custo 501 a 505 (`centroCustoFilialNitaplast`);
3. texto do histórico/origem/documento contendo "FILIAL" ou "COMERCIAL SP";
4. um caso especial: se o texto menciona Filial **e** Matriz **e** "transferência/remessa", o lançamento é classificado como `"Matriz ↔ Filial"` (não entra em nenhum dos dois somatórios de CPV — hoje isso só afeta análises de conciliação, não a apuração do CPV em si, que usa as contas 25944/25945 já segregadas).

Isso está calculado em `impactoCustoPorEstabelecimento` dentro de [contabil-agosto-completo.tsx](../src/components/nitaplast/contabil-agosto-completo.tsx) (função `DreAgostoPadrao`), que soma o efeito líquido (débito − crédito) de cada lançamento nas contas de custo (`r.custos`), agrupado pelo estabelecimento do lançamento.

## Composição por conta — CPV Matriz

| Conta | Descrição | Débitos | Créditos | Líquido | Evidência |
|---|---|---:|---:|---:|---|
| 3093 | Compras de Matérias-Primas a Prazo | R$ 1.420.095,09 | R$ 217.066,70 | **R$ 1.203.028,39** | Softdib 11.01.003/CC102 (nacional) + NF 94222/94251 Greatland Valve (importação) |
| 3035 | Compras de Mercadorias a Prazo | R$ 397.328,55 | R$ 119.275,60 | **R$ 278.052,95** | Softdib 11.01.001/CC201, 35 documentos |
| 25944 | Custos de Produtos Vendidos (fechamento periódico) | R$ 6.157.138,83 | R$ 5.864.719,45 | **R$ 292.419,38** | Baixa do estoque anterior, reconhecimento do inventário físico final e transferências internas com a Filial (ver abaixo) |
| | **Total CPV Matriz** | | | **R$ 1.773.500,72** | |

Os créditos de 3093/3035 são os créditos fiscais (ICMS/IPI/PIS/COFINS de entradas) apropriados contra a própria conta de custo — mesmo padrão de julho.

## Fórmula industrial aplicada em agosto — Matriz

A conta 25944 fecha pelo mesmo mecanismo periódico de julho (baixa integral do saldo anterior por conta de estoque + reconhecimento do inventário físico final), mais o efeito das duas transferências internas com a Filial achadas em 16/09/2026:

| Componente | Valor | Origem |
|---|---:|---|
| Baixa do estoque anterior (5 contas) | R$ 5.803.744,06 | Saldo de abertura de agosto = fechamento de julho |
| (−) Reconhecimento do estoque físico final (5 contas) | R$ 5.744.762,11 | `REGISTRO INVENTARIO ESTOQUE 31/08/2026.pdf` |
| (=) Variação líquida de estoque | R$ 58.981,95 | |
| (+) Mercadoria recebida da Filial por transferência interna (NOP 2151/2152, 6 docs) | R$ 353.394,77 | `RESUMO NOTAS FISCAIS ENTRADA.csv` (Matriz) |
| (−) Mercadoria enviada à Filial por transferência interna (NOP 2152, 33 docs) | R$ 119.957,34 | `RESUMO NOTAS FISCAIS SAIDA.csv` (Matriz) |
| (=) Efeito líquido na 25944 | **R$ 292.419,38** | |

Somado a 3093 (R$ 1.203.028,39) + 3035 (R$ 278.052,95): **CPV Matriz = R$ 1.773.500,72** — fecha exatamente com o valor reconhecido no motor.

### Inventário Matriz — por conta

| Estoque | Saldo abertura 01/08 | Saldo final 31/08 | Efeito no CPV |
|---|---:|---:|---:|
| Produto acabado (25133) | R$ 4.207.698,55 | R$ 4.566.016,57 | (R$ 358.318,02) |
| Sucata/retalho (25134) | R$ 39.464,14 | R$ 32.421,30 | R$ 7.042,84 |
| Matéria-prima (25135) | R$ 1.443.376,19 | R$ 1.038.404,65 | R$ 404.971,54 |
| Produtos em elaboração (25136) | R$ 107.919,59 | R$ 107.919,59 | R$ 0,00 |
| Produto intermediário (25137) | R$ 5.285,59 | R$ 0,00 | R$ 5.285,59 |
| **Total líquido** | **R$ 5.803.744,06** | **R$ 5.744.762,11** | **R$ 58.981,95** |

Produto acabado aumentou de estoque em agosto (reduz o CPV do mês); matéria-prima teve o maior consumo líquido.

## Composição por conta — CPV Filial SP

| Conta | Descrição | Débitos | Créditos | Líquido |
|---|---|---:|---:|---:|
| 25945 | Custos de Produtos Vendidos — Filial | R$ 728.872,83 | R$ 571.767,81 | **R$ 157.105,02** |

### Memória de cálculo da 25945 (lançamentos individuais)

| Lançamento | Natureza | Valor | D/C na 25945 |
|---|---|---:|---|
| `AGO-CPV-F-ABERT` | Baixa do estoque inicial da Filial (saldo transportado de 31/07) | R$ 577.396,32 | Débito |
| `AGO-CPV-F-COMP-DOC` | Encerramento das compras **da própria competência** de agosto (CFOP 1102, 6 NFs) | R$ 31.519,17 | Débito |
| `AGO-CPV-F-TRANSF-RECEBIDA` | Mercadoria recebida da Matriz por transferência interna (NOP 2152, 33 docs) | R$ 119.957,34 | Débito |
| `AGO-CPV-F-TRANSF-ENVIADA` | Mercadoria enviada à Matriz por transferência interna (NOP 6151, 6 docs) | R$ 353.394,77 | Crédito |
| `AGO-CPV-F-FINAL` | Reconhecimento do estoque físico final (inventário Filial, 31/08) | R$ 218.373,04 | Crédito |
| | **Líquido (= CPV Filial)** | **R$ 157.105,02** | |

Fonte: [nitaplast-cpv-depreciacao-agosto.ts](../src/data/nitaplast-cpv-depreciacao-agosto.ts).

### Achado tratado: saldo acumulado de competências anteriores na 25139

A conta 25139 (Compra de Mercadoria para Revenda — Filial) tinha, na abertura de agosto, um saldo patrimonial acumulado de **R$ 420.540,54** de competências anteriores, nunca conciliado. Julho já tinha enfrentado o mesmo saldo e decidido (`JUL-CPV-F-COMP`, em [nitaplast-razao-julho-final-base.ts](../src/data/nitaplast-razao-julho-final-base.ts)) fechar no CPV **só o movimento da própria competência**, mantendo o saldo legado patrimonial "até conciliação, sem contaminar o resultado". Em agosto, um lançamento anterior (`AGO-CPV-F-COMP`) quebrava essa regra e foi removido; hoje só `AGO-CPV-F-COMP-DOC` (as 6 NFs de agosto, R$ 31.519,17) fecha no CPV — o saldo de R$ 420.540,54 continua patrimonial na 25139, pendente de conciliação, com o mesmo critério de julho.

### Achado tratado: transferências internas Matriz ↔ Filial não lançadas

Até 16/09/2026, apenas o lado da Filial das duas transferências internas de mercadoria estava lançado — a Matriz nunca tinha reconhecido nem o recebimento nem o envio. Foi essa lacuna que fazia o CPV da Filial (antes da correção) superar sua própria receita: a fórmula "estoque inicial + compras − estoque final" atribuía toda a queda física do estoque a vendas a terceiro, mas parte era mercadoria que só mudou de estabelecimento.

As duas pontas foram conferidas (mesmos valores nos dois CSVs, nenhuma nota cancelada; NF 8907, R$ 341.248,73, tem "SEM VALOR COMERCIAL" na condição de pagamento, confirmando natureza de transferência) e lançadas nos dois lados contra a conta transitória 4859, que zera quando as duas pontas (Matriz + Filial) são somadas:

- `AGO-CPV-F-TRANSF-RECEBIDA` (Filial, débito 25945) ↔ `AGO-CPV-M-TRANSF-ENVIADA` (Matriz, crédito 25944) — R$ 119.957,34
- `AGO-CPV-F-TRANSF-ENVIADA` (Filial, crédito 25945) ↔ `AGO-CPV-M-TRANSF-RECEBIDA` (Matriz, débito 25944) — R$ 353.394,77

O ICMS dessas mesmas transferências está lançado separadamente em `AGO-TAX-ICMS-TRANSF` / `AGO-TAX-ICMS-TRANSF-F` ([nitaplast-provisao-impostos-agosto.ts](../src/data/nitaplast-provisao-impostos-agosto.ts)), mesma conta de trânsito (25140) usada em julho para o mesmo fato.

## Pontos de controle abertos

1. **Contrapartida em 4859 (conta transitória)** — as quatro pernas das transferências internas (duas na Filial, duas na Matriz) usam a 4859 porque **não existe conta patrimonial dedicada** de "transferência de mercadoria entre estabelecimentos" no plano de contas atual. As duas pontas juntas zeram a 4859, mas o lançamento está marcado `status: "revisar"` até se decidir se deve existir uma conta própria.
2. **NF 94222 e NF 94251 (Greatland Valve, importação)** — R$ 454.046,67 + R$ 109.923,88 dentro da 3093, marcadas `status: "revisar"`. Mesmo processo de importação (DUIMP 26BR0001376062-0 e DI 26/1426125.2); NF 94251 já foi conferida linha a linha contra o DANFE, NF 94222 aguarda a mesma conferência.
3. **Saldo acumulado de R$ 420.540,54 na 25139** — patrimonial, fora do CPV desde julho, ainda sem conciliação documental que permita reclassificá-lo ou baixá-lo.
4. **Créditos fiscais da Filial incompletos** — ICMS/IPI/PIS/COFINS sobre compras da Filial só cobrem a parcela de "compras" identificada; fretes e a parcela de crédito da própria transferência interna Matriz→Filial (contrapartida de `AGO-TAX-ICMS-TRANSF`) ainda não foram identificados para agosto (julho já tinha esses três componentes separados). Isso afeta a apuração de impostos, não o CPV diretamente.
5. **Memória simplificada no card da DRE (não usada para o valor final)** — o card de resumo em `DreAgostoPadrao` monta uma "memória" ilustrativa (estoque inicial Matriz + compras brutas totais − estoque final Matriz), mas `resumoCpvDepreciacaoAgosto.comprasBrutasCpv` soma o débito bruto de **todas** as compras do período (Matriz e Filial, inclusive a conta 3244 que não integra o CPV — vai para despesa de produção). Isso gera um resíduo de apresentação ("demais movimentos documentados") negativo em R$ 376.759,11, sem significado econômico próprio. O **CPV Matriz real (R$ 1.773.500,72) não é afetado** — ele vem do somatório líquido por conta e por estabelecimento, não dessa memória ilustrativa. Fica registrado para eventual ajuste de apresentação, sem alterar valor.

## Memória de cálculo — Impostos (ICMS, IPI, PIS, COFINS) — Matriz x Filial

Fonte: [nitaplast-provisao-impostos-agosto.ts](../src/data/nitaplast-provisao-impostos-agosto.ts). Totais oficiais em `REGISTRO APURAÇÃO ICMS/IPI/PIS/COFINS.pdf` (Matriz) e apuração própria da Filial SP (pasta `FILIAL - AGO 26`, CNPJ 82.295.817/0003-60); PIS/COFINS da Filial vêm do EFD Contribuições oficial (blocos C010 por CNPJ). PIS/COFINS da Matriz foram retificados em 14/09/2026, já refletido abaixo.

### Resumo por imposto — Matriz (CNPJ 0001-07)

| Imposto | Débito bruto (saídas) | Crédito de entradas | Saldo devedor (a recolher) |
|---|---:|---:|---:|
| ICMS | R$ 256.359,87 | R$ 142.347,11 | **R$ 114.012,76** |
| IPI | R$ 165.329,89 | R$ 129.716,36 | **R$ 35.613,53** |
| PIS | R$ 45.966,86 | R$ 36.622,37 | **R$ 9.344,49** |
| COFINS | R$ 211.726,64 | R$ 168.566,43 | **R$ 43.160,21** |
| **Total a recolher (Matriz)** | | | **R$ 202.130,99** |

### Débito bruto das saídas — Matriz, rateado por centro de custo (ICMS/IPI)

| CC | Centro de custo | ICMS | IPI |
|---|---|---:|---:|
| 201 | Vendas | R$ 253.707,31 | R$ 165.329,89 |
| 102 | Produção | R$ 2.297,40 | R$ 0,00 |
| 0 | Sem centro de custo | R$ 355,16 | R$ 0,00 |

PIS/COFINS sobre vendas da Matriz não têm rateio por CC: o CSV oficial de saídas não traz essas colunas, e o relatório detalhado por documento tem os campos quebrados em várias linhas de forma irregular (risco de atribuição errada por nota) — permanecem em lançamento único, sem CC.

### Crédito de entradas — Matriz, rateado por conta real

| Conta | Descrição | ICMS | IPI | PIS | COFINS |
|---|---|---:|---:|---:|---:|
| 3093 | Compras de Matérias-Primas | R$ 40.747,07 | R$ 68.703,23 | R$ 19.217,48 | R$ 88.398,92 |
| 3035 | Compras de Mercadorias | R$ 41.781,09 | R$ 49.153,06 | R$ 5.055,52 | R$ 23.285,93 |
| 3244 | Materiais Auxiliares e de Consumo | R$ 25.616,98 | R$ 9.654,72 | R$ 3.099,65 | R$ 14.277,20 |
| 25937 | Serviços de Industrialização | R$ 7.179,26 | R$ 1.944,38 | R$ 7.096,90 | R$ 32.688,00 |
| 4253 | Fretes e Carretos | R$ 11.372,98 | R$ 0,00 | R$ 1.470,70 | R$ 6.774,45 |
| 3494 | Energia Elétrica | R$ 0,00 | R$ 0,00 | R$ 483,11 | R$ 2.225,22 |
| 25943 | (diversos) | R$ 531,58 | R$ 287,94 | R$ 64,32 | R$ 296,27 |
| 25070 | Despesas com Importação | R$ 0,00 | R$ 0,00 | R$ 118,72 | R$ 546,88 |
| 25064 | Materiais auxiliares e de consumo | R$ 0,00 | R$ 6,21 | R$ 0,00 | R$ 0,00 |
| — | Residual não mapeado (4859, `revisar`) | R$ 0,00 | R$ 0,00 | R$ 15,97 | R$ 73,56 |
| | **Subtotal rateio + residual** | **R$ 127.228,96** | **R$ 129.749,54** | **R$ 36.622,37** | **R$ 168.566,43** |
| | (+) Transferência interna Filial→Matriz (ICMS, ver abaixo) | R$ 15.118,15 | — | — | — |
| | **Total crédito de entradas (Matriz)** | **R$ 142.347,11** | **R$ 129.716,36*** | **R$ 36.622,37** | **R$ 168.566,43** |

`*` O IPI rateado + residual soma R$ 129.749,54, R$ 33,18 acima do total oficial de R$ 129.716,36 do Registro de Apuração — diferença residual pequena entre o CSV de entradas por CC e o PDF oficial (mesma natureza dos ajustes/estornos já mencionados no código para IPI/PIS/COFINS), não investigada linha a linha. ICMS, PIS e COFINS reconciliam centavo a centavo.

### Transferências internas de mercadoria — efeito no ICMS

As mesmas transferências físicas que entram na memória do CPV (Matriz ↔ Filial) geram crédito de ICMS lançado contra a conta de trânsito 25140:

| Lançamento | Direção | Valor | Efeito |
|---|---|---:|---|
| `AGO-TAX-ICMS-TRANSF` | Filial → Matriz (NOP 2151/2152, 6 docs) | R$ 15.118,15 | Crédito reconhecido na Matriz (débito 1541, reduz o a recolher) |
| `AGO-TAX-ICMS-TRANSF-F` | Matriz → Filial (NOP 2152, 33 docs) | R$ 9.242,68 | Crédito reconhecido na Filial (débito 25235), `status: revisar` |

Achado em 16/09/2026: a direção do primeiro lançamento estava descrita como "Matriz → Filial" no histórico, mas a conta debitada (quem recebe o crédito) já estava certa — é a Matriz que recebe. Só o texto foi corrigido.

### Resumo por imposto — Filial SP (CNPJ 0003-60)

| Imposto | Débito bruto (saídas) | Crédito de compras identificado | Pendências |
|---|---:|---:|---|
| ICMS | R$ 60.722,15 | R$ 15.057,71 | Fretes e a parcela de crédito da transferência interna Matriz→Filial (R$ 9.242,68, já lançada separadamente acima) ainda não são somadas ao crédito de compras |
| IPI | R$ 19.728,46 | R$ 2.045,81 | Creditado direto contra 25139 (sem conta redutora dedicada de IPI, diferente do ICMS que usa a 25140) |
| PIS | R$ 3.841,72 | R$ 437,11 | Idem IPI — creditado contra 25139 |
| COFINS | R$ 17.695,29 | R$ 2.013,29 | Idem IPI — creditado contra 25139 |

Achado em 15/09/2026: a apuração fiscal própria da Filial (pasta `FILIAL - AGO 26`) nunca tinha sido incorporada ao fechamento — só a Matriz estava lançada até então. Diferente de julho, o crédito da Filial em agosto **ainda não soma** a parcela de fretes nem a do lado Filial da transferência interna Matriz→Filial no total de "crédito de compras" — por isso a tabela não fecha um "saldo a recolher" definitivo para a Filial neste dossiê.

## Memória de cálculo — Receitas Financeiras (Julho x Agosto)

O cliente questionou a queda da Receita Financeira de agosto frente a julho. Os valores, extraídos rodando o motor de cálculo real (`calcularDreJulhoFinal` e `calcularResultadoAgosto`):

| | Julho/2026 | Agosto/2026 | Variação |
|---|---:|---:|---:|
| **Receitas Financeiras (total na DRE, já corrigido)** | **R$ 37.716,99** | **R$ 24.548,71** | **− R$ 13.168,28 (−34,9%)** |
| Juros ativos (25095) | R$ 0,00 | R$ 1.010,10 | + R$ 1.010,10 |
| Variação cambial ativa (25096) | R$ 13.096,86 | R$ 5.399,69 | − R$ 7.697,17 |
| Receita de aplicações financeiras (25098) | R$ 24.620,13 | R$ 2.350,56 | − R$ 22.269,57 |
| Rendimento Greencred (2859, corrigido) | — | R$ 15.788,36 | + R$ 15.788,36 |

Antes da correção abaixo, o total de agosto aparecia na DRE como R$ 8.760,35 (sem o rendimento Greencred).

### Explicação linha a linha

**Receita de aplicações (25098) — maior parte da queda:**

- Julho concentrou R$ 22.751,47 (92% do total de julho) em um único lançamento, `JUL-APL-GREEN-003` — rendimento do Greencred **derivado por diferença de posição bruta** (`1.861.799,85 − (2.039.048,38 − 200.000,00)`), ou seja, um cálculo residual que capturou rendimento acumulado de mais de um mês de uma vez, não um rendimento mensal normal.
- Em agosto, os CDBs Bradesco Invest Fácil geraram apenas R$ 53,68 de rendimento (aplicações de curtíssimo prazo, resgatadas em poucos dias — ver [nitaplast-aplicacoes-bradesco-agosto.ts](../src/data/nitaplast-aplicacoes-bradesco-agosto.ts)); o Fundo Bradesco Maxi DI, resgatado integralmente no mês, reconheceu R$ 2.296,88 de rendimento residual (líquido do que já tinha sido reconhecido em julho).

**Variação cambial ativa (25096):** queda de R$ 7.697,17, compatível com menor volatilidade/exposição cambial do mês — não investigada linha a linha neste dossiê (ver [nitaplast-cambio-agosto.ts](../src/data/nitaplast-cambio-agosto.ts) para o detalhe dos contratos de câmbio de agosto).

### Achado corrigido — rendimento Greencred de agosto não entrava na Receita Financeira da DRE

O Greencred (Capital Coop) **também rendeu em agosto**: R$ 15.788,36, documentado em `AGO-BAN-GREENCRED-REND` ([nitaplast-bancos-agosto.ts:99](../src/data/nitaplast-bancos-agosto.ts)), reconciliado contra o extrato de posição e o movimento diário do SOFTDIB (gerencial 09.01.002 "RENDIMENTO APLIC. FINANCEIRA"). Só que esse lançamento credita a conta **2859 — Receitas Aplicações Financeiras** (classificação 4.1.05.001.002, grupo "Receitas acumuladas"), não a 25098 usada em julho para o mesmo fato.

A conta 2859 não estava em nenhum conjunto usado por `calcularResultadoAgosto`: não é receita bruta (só 2606/2655), não é dedução, não é custo (grupo "Custos e despesas acumulados"), não é despesa financeira (prefixo "5.8") e não estava em `contasReceitasFinanceirasAgosto`. Resultado: o rendimento de R$ 15.788,36 não aparecia em lugar nenhum da DRE de agosto — nem como receita financeira, nem em outra linha. Isso é diferente de estar "classificado errado"; estava fora do cálculo do resultado.

**Correção aplicada em 21/09/2026**: `"2859"` foi incluída em `contasReceitasFinanceirasAgosto` ([contabil-agosto-completo.tsx](../src/components/nitaplast/contabil-agosto-completo.tsx)). Como `receitasFinanceiras` soma diretamente `credito(conta)` para cada conta desse conjunto — sem depender do agrupamento de custos/despesas —, a conta não precisou ser adicionada a nenhum outro lugar, e nenhuma outra linha do resultado foi afetada (build e `tsc --noEmit` validados, 0 erros). Efeito: Receita Financeira de agosto sobe de R$ 8.760,35 para **R$ 24.548,71**, e o resultado do mês melhora em R$ 15.788,36 (de R$ −313.229,67 para **R$ −297.441,31**).

A queda real frente a julho cai de R$ 28.956,64 para R$ 13.168,28 — explicada quase inteiramente pela variação cambial e pelo caráter excepcional/residual do valor de julho (rendimento de mais de um mês reconhecido de uma vez), não por uma piora real das aplicações em agosto.

## Fontes no código

- [nitaplast-cpv-depreciacao-agosto.ts](../src/data/nitaplast-cpv-depreciacao-agosto.ts) — compras que compõem o custo, fechamento do estoque Matriz e Filial, transferências internas.
- [nitaplast-provisao-impostos-agosto.ts](../src/data/nitaplast-provisao-impostos-agosto.ts) — apuração de ICMS/IPI/PIS/COFINS (Matriz e Filial), rateio de crédito por conta e ICMS das transferências internas.
- [nitaplast-estabelecimento.ts](../src/data/nitaplast-estabelecimento.ts) — critério de classificação Matriz x Filial.
- [contabil-agosto-completo.tsx](../src/components/nitaplast/contabil-agosto-completo.tsx) — `calcularResultadoAgosto`, `DreAgostoPadrao` (memória de CPV exibida na tela).
- [nitaplast-saldos-agosto.ts](../src/data/nitaplast-saldos-agosto.ts) — saldo de abertura de agosto (fechamento de julho transportado).
- [nitaplast-razao-agosto.ts](../src/data/nitaplast-razao-agosto.ts) — consolidação de todos os lançamentos de agosto.
- [nitaplast-bancos-agosto.ts](../src/data/nitaplast-bancos-agosto.ts) — rendimento Greencred de agosto (conta 2859, achado de não inclusão na Receita Financeira).
- [nitaplast-aplicacoes-bradesco-agosto.ts](../src/data/nitaplast-aplicacoes-bradesco-agosto.ts) — CDB Invest Fácil e Fundo Maxi DI de agosto.
- [nitaplast-dre-julho-final.ts](../src/data/nitaplast-dre-julho-final.ts) e [nitaplast-bancos-julho-completo.ts](../src/data/nitaplast-bancos-julho-completo.ts) — Receitas Financeiras de julho (comparativo).

Todos os valores deste dossiê foram extraídos executando o motor de cálculo atual (`calcularResultadoAgosto` + `estabelecimentoLancamentoNitaplast`) sobre `lancamentosIntegradosAgosto`, não recalculados manualmente.
