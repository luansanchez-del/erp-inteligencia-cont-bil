# Reconciliação Contábil — Nitaplast — Competência 08/2026

Fonte: motor já existente em `src/components/nitaplast/contabil-agosto-completo.tsx`
(`calcularResultadoAgosto`, `categorizarDespesasAgosto`) rodado diretamente sobre o Razão
oficial de agosto (`lancamentosIntegradosAgosto`, 1.432 lançamentos).

> **Atualizado em 21/09/2026**: durante a reconciliação foi aprovada uma correção de
> classificação (15 contas de folha/materiais que misturavam CC real de mais de um
> departamento — ver seção 11 de
> [NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md](NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md)).
> **Nenhum total do DRE mudou** com essa correção — só a categoria de apresentação de
> cada pedaço de despesa. Os totais deste documento (Receita, CPV, Despesas
> Operacionais, Resultado) continuam válidos sem alteração.

## 1. Por que o fechamento está "muito diferente do normal"

Comparando o resultado de agosto com o de julho (via `calcularDreJulhoFinal`):

| Linha | Julho/2026 | Agosto/2026 | Δ (Ago − Jul) |
|---|---:|---:|---:|
| Receita Bruta | 4.138.549,72 | 4.080.701,07 | **-57.848,65** |
| Receita Líquida | 3.319.858,55 | 3.285.777,28 | -34.081,27 |
| CPV Total | 1.751.614,15 | 1.930.605,74 | **+178.991,59** |
| Despesas Operacionais | 1.429.333,42 | 1.620.086,16 | **+190.752,74** |
| Despesas Financeiras | 152.077,49 | 137.669,43 | -14.408,06 |
| Receitas Financeiras | 37.716,99 | 24.548,71 | -13.168,28 |
| **Resultado Final** | **128.172,33** | **-278.035,34** | **-406.207,67** |

A receita caiu pouco (-1,4%), mas **CPV e Despesas Operacionais juntos subiram ~R$
369.744,33**, o suficiente para virar um lucro em prejuízo. Não há indício de erro de
lançamento nessa queda — os itens 2 a 5 abaixo mostram que tudo concilia 100% com o
Razão; a diferença é composição real do mês (ver detalhamento por categoria no item 4).

## 2. Saídas (Vendas) — Receita Bruta

| Item | Valor (R$) |
|---|---:|
| Receita Venda Produção | 3.382.852,10 |
| Receita Revenda | 697.848,97 |
| **Receita Operacional Bruta** | **4.080.701,07** |
| (-) Deduções (ICMS/IPI/PIS/COFINS/devoluções) | 794.923,79 |
| **Receita Líquida** | **3.285.777,28** |

## 3. Entradas (Compras) → Estoque → CPV — ponte Matriz

| Item | Valor (R$) |
|---|---:|
| Estoque inicial — Matriz | 5.803.744,06 |
| (+) Entradas/Compras documentadas que compõem o custo | 2.091.277,88 |
| (-) Estoque final — Matriz | -5.744.762,11 |
| (=) Base de CPV via movimento de estoque | 2.150.259,83 |
| (+) Demais custos documentados no Razão (mão de obra, industrialização, frete etc.) | -376.759,11 |
| **(=) CPV Matriz** | **1.773.500,72** |

### CPV — Matriz x Filial

| | Valor (R$) |
|---|---:|
| CPV Matriz | 1.773.500,72 |
| CPV Filial SP | 157.105,02 |
| **CPV Total (concilia com o Razão)** | **1.930.605,74** |

## 4. Despesas Operacionais — todo o grupo (Matriz + Filial)

Categorização pelo CC real de cada movimento (mesma regra já documentada no motor —
CCs de Filial e as contas 25070/25938 são decididas por movimento, não pela conta
inteira, para não misturar Matriz/Filial/Exportação/Comercial/Produção numa conta só).

| Categoria | Valor (R$) |
|---|---:|
| Despesas Administrativas | 178.526,23 |
| Despesas com Serviço — NPLog | 210.781,35 |
| Despesas Comerciais | 349.093,44 |
| Despesas Produção | 279.191,47 |
| Despesas Veículos | 2.131,43 |
| Despesas com Imobilizado | 51.421,16 |
| Despesas com Industrialização | 446.165,71 |
| Despesas com Exportação — Matriz | 64.244,01 |
| Despesas comercial SP (Filial) | 38.531,36 |
| Outras despesas sem classificação gerencial | 0,00 |
| **TOTAL CATEGORIZADO** | **1.620.086,16** |
| **TOTAL Despesas Operacionais (Razão)** | **1.620.086,16** |
| **Diferença** | **0,00** |

100% do total de despesas operacionais do Razão está classificado — nenhum valor caiu
em "outras despesas sem classificação gerencial". Valores acima já incluem a correção
de 21/09/2026 (15 contas de folha/materiais reclassificadas por lançamento em vez de
por CC dominante da conta inteira — detalhe completo em
[NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md](NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md),
seção 11).

Maior variação vs. julho: **Despesas com Industrialização** é a maior categoria do mês
(R$ 446.165,71) e, junto com CPV, é a principal candidata a explicar a alta de custos —
recomendo checar essa categoria primeiro caso um "achado" precise ser aberto.

## 5. Despesas com Importação (conta 25070) — confirmação: entra em Comercial

A conta 25070 mistura, na prática, débitos de três áreas diferentes (fornecedor lança
despesas de comércio exterior sob o CC de quem usa o material/serviço). O motor já
decide isso **por movimento** (não pela conta inteira), então o valor se divide:

| CC de origem | Categoria de destino | Valor (R$) |
|---|---|---:|
| 201 (Comercial) | **Despesas Comerciais** | **41.781,59** |
| 206 (Exportação) | Despesas com Exportação — Matriz | 36.678,58 |
| 109 (Produção) | Despesas Produção | 5.211,76 |
| **Total conta 25070** | | **83.671,93** |

A parcela de CC Comercial (201) — R$ 41.781,59 — está corretamente dentro de
"Despesas Comerciais", como pedido. As outras duas parcelas são despesas de
comércio exterior de naturezas diferentes (exportação e produção) e ficam nas
categorias próprias, evitando misturar tudo como "importação" genérica — comportamento
já documentado no código (achado de 17/09/2026) e não alterado aqui.

### Composição completa de "Despesas Comerciais" (onde a importação entra)

Tabela detalhada com as 17 contas (pós-correção de 21/09/2026) está em
[NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md](NITAPLAST_COMPOSICAO_DESPESAS_OPERACIONAIS_08_2026.md#3-despesas-comerciais-inclui-a-parcela-comercial-da-importação--r-34909344-17-contas).
Total atual da categoria: **R$ 349.093,44**.

## 6. Conclusão

- Todos os totais acima **conciliam exatamente com o Razão** (diferença zero em CPV,
  em receita Matriz+Filial e em despesas operacionais).
- A queda de resultado de agosto (R$ 128.172,33 em julho → -R$ 278.035,34 em agosto)
  não é erro de reconciliação: é receita levemente menor + CPV e despesas operacionais
  reais mais altos (~R$ 370 mil a mais combinados).
- A regra "despesas com importação entram em Comercial" está implementada e validada:
  a parcela de CC 201 da conta 25070 aparece em "Despesas Comerciais".
- O resultado de -R$ 278.035,34 já inclui a reversão de uma provisão de julho não
  confirmada (+R$ 100.000,00, `JUL-PROV-CUSTO-CLIENTE-100K`, estorno solicitado pelo
  cliente em 27/08/2026). Sem esse estorno, o resultado operacional puro de agosto
  seria **-R$ 378.035,34**.
- Em 21/09/2026 foi aplicada, com aprovação do cliente, uma correção de classificação
  (15 contas de folha/materiais decididas por lançamento em vez de por CC dominante —
  ver seção 4). Essa correção **não muda nenhum total do DRE**, só a categoria de
  apresentação; totais e resultado deste relatório permanecem válidos.
