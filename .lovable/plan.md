# Separação Matriz / Filial SP na DRE de 07/2026

## Diagnóstico

A separação por estabelecimento **já foi escrita no projeto**, mas o app está exibindo uma versão antiga da tela porque o arquivo que monta o Razão final de julho está com erro de sintaxe:

`src/data/nitaplast-razao-julho-final-v2.ts` declara a mesma constante `lancamentosBaseCorrigidos` duas vezes (linha 148 e linha 229). Isso quebra a compilação desse módulo; o preview continua servindo o pacote anterior, anterior à segregação. Por isso a tela mostra PIS e COFINS inteiros na Matriz e R$ 0,00 na Filial SP.

O que já existe e está correto no código atual (confirmado na leitura dos arquivos):

- As apurações consolidadas `JUL-TAX-PIS` (49.820,30) e `JUL-TAX-COF` (229.476,68) são removidas do Razão pela lista `idsSubstituidosAuditoria`, ou seja, não há duplicidade.
- No lugar delas entram quatro partidas por estabelecimento, com CNPJ e CC de origem: PIS Matriz 43.082,61 / PIS Filial 6.737,69 e COFINS Matriz 198.442,47 / COFINS Filial 31.034,21 — soma idêntica aos consolidados.
- ICMS da Filial separado entre saída externa (81.047,03) e transferência interna (3.894,05, marcada para revisão, fora de dedução de vendas).
- Créditos de PIS/COFINS sobre transporte abertos entre Matriz e Filial.
- `src/data/nitaplast-dre-julho-final.ts` já tem validações que impedem o fechamento se a abertura Matriz/Filial não bater com o EFD.

## Correção proposta

1. Remover a declaração duplicada de `lancamentosBaseCorrigidos` em `src/data/nitaplast-razao-julho-final-v2.ts`, mantendo uma única definição posicionada antes do primeiro uso. Nenhum valor, conta, CC ou lançamento é alterado.
2. Rodar o build e o typecheck para confirmar que as validações de conciliação de `nitaplast-dre-julho-final.ts` passam (PIS e COFINS Matriz/Filial contra o EFD).
3. Abrir a DRE de 07/2026 no preview e conferir na tela que aparecem, separados: PIS Filial SP 6.737,69, COFINS Filial SP 31.034,21, CPV Matriz x CPV Filial SP, e despesas operacionais Matriz x Filial SP.

## Fora do escopo

- Junho/2026, JCP, regra dos retornos de R$ 1.110.176,82 e demais classificações permanecem intocados.
- Nenhum plug, rateio ou abertura gerencial será criado. Se após a correção alguma linha da Filial continuar em zero, isso será reportado como pendência de evidência documental, não preenchido por estimativa.
