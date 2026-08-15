# Revisão da DRE — o que ficou pela metade

Auditoria dos dados já existentes no projeto (nenhum arquivo foi alterado). Boa notícia: a DRE **não está quebrada**. A aritmética fecha; o que falta é classificação contábil de alguns valores.

## O que está correto

- Todos os subtotais da DRE (receita, deduções, custos, lucro bruto, despesas, resultado operacional, lucro líquido) batem com a soma das suas linhas — diferença zero.
- A abertura conta a conta bate com a linha da DRE em todos os grupos abertos.
- 140 linhas de composição, sem duplicidades, sem TODO, sem texto de placeholder.

## O que realmente falta (4 pendências)

1. **6 diferenças sem conta** — R$ -40.933,85 líquidos, distribuídos em: Administrativas (-37.353,50), Produção (-49.770,60), Veículos (+41.772,69), Barracão (+3.304,32), Comerciais (+3.205,48), Comercial SP (-2.092,14). Estão marcadas como "a distribuir" de propósito — o sistema não inventa conta.
2. **Receita de Alienação de Imobilizado — R$ 7.295,86** sem nenhuma conta contábil vinculada (aparece como "Conta não localizada").
3. **Depreciação com duas versões divergentes**: a tabela da tela da DRE tem 5 contas (R$ 54.315,40), enquanto o razão integrado tem 12 contas (R$ 57.861,02). O total previsto é R$ 58.153,32 — sobra um resíduo de R$ 292,30 mesmo usando a versão mais detalhada.
4. **Receita financeira com sinal invertido**: a linha da DRE guarda -44.915,98 e a composição guarda +44.915,98. A DRE fecha assim, mas qualquer relatório novo que some a composição vai errar esse ponto.

## Correções possíveis sem dados novos

- Unificar a depreciação: usar as 12 contas do razão integrado como fonte única na tela da DRE, deixando o resíduo de R$ 292,30 explícito em vez do atual R$ 3.837,92.
- Normalizar o sinal da receita financeira e documentar a convenção, para a composição somar igual à linha.

## O que só você (ou o cliente) pode resolver

As 6 diferenças e a alienação de imobilizado dependem de documento de origem. Para fechar de fato preciso da planilha "JUN 26" / relatórios de origem, com a indicação da conta contábil de cada valor. Sem isso, o correto é manter como pendência visível — não atribuir conta genérica.

## Detalhes técnicos

Arquivos envolvidos: `src/data/nitaplast-dre-completa.ts` (linhas e totais), `src/data/nitaplast-dre-contas.ts` (composição, `depreciacaoContaAConta`, `totalDepreciacaoPrevisto`), `src/data/nitaplast-razao-integrado.ts` (array `depreciacoes`, 12 itens), `src/routes/contabil.dre.tsx` (render e cálculo de `diferencaDepreciacao`). Nenhuma mudança de motor contábil está prevista; as correções são de dados e apresentação.
