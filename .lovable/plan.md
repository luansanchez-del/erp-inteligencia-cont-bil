# Diagnóstico do JCP de 07/2026 (R$ 275.800,87)

## Origem do valor

O valor exibido NÃO vem de um único cálculo. Ele é a soma de **dois cálculos independentes de JCP** que foram ambos incluídos no Razão de julho:

| Lançamento | Arquivo de origem | Débito → Crédito | Valor |
|---|---|---|---|
| JUL-JCP-RECON-072026 | `src/data/nitaplast-jcp-julho.ts` (usa `calculoJcpJulho`) | 25107 → 25253 | 139.977,93 |
| JUL-JCP-01 | `src/data/nitaplast-financeiro-julho.ts` (usa `jcpBrutoJulho`) | 25107 → 25253 | 135.822,94 |
| **Total debitado em 25107** | | | **275.800,87** |
| JUL-JCP-IRRF | `src/data/nitaplast-financeiro-julho.ts` | 25253 → 1546 | 23.769,01 |

Ambos entram em `lancamentosIntegradosJulhoFinal` (`nitaplast-razao-julho-final-v2.ts`), que concatena a base do razão (já com `lancamentosJcpJulho` do módulo de reconhecimento) com `lancamentosFinanceirosJulho`.

## Base exata de `calculoJcpJulho` (139.977,93)

Saldos de abertura de 07/2026 (= saldo 31/05 + movimento de junho). **Nenhuma das quatro contas teve qualquer movimento no Razão de junho** (0 débitos e 0 créditos em todas):

| Conta | Descrição | Saldo 31/05 | Mov. junho | Abertura 07/2026 |
|---|---|---|---|---|
| 2348 | Capital Social | 6.000.000,00 C | 0,00 | 6.000.000,00 C |
| 25239 | Reservas de Capital | 631,92 C | 0,00 | 631,92 C |
| 25240 | Reservas de Lucros | 2.895.507,23 C | 0,00 | 2.895.507,23 C |
| 2515 | Lucros Acumulados | 9.481.535,54 C | 0,00 | 9.481.535,54 C |

Base = 6.000.000,00 + 0 (25239 excluída por prudência) + 2.895.507,23 + 9.481.535,54 = **18.377.042,77**
TJLP mensal 0,7617% → 18.377.042,77 × 0,007617 = **139.977,93**
Limite de 50% de lucros/reservas = 6.188.521,39 (não restringe) → JCP = 139.977,93; IRRF potencial 17,5% = 24.496,14 (marcado como não contabilizado).

## Base do cálculo concorrente (135.822,94)

Contas: 2348, 25240, 2515 **mais as redutoras** 5747 (Ajuste de Exercício Anterior, 490,00 D) e 25241 (Distribuição de Lucros, 545.000,00 D):
18.377.042,77 − 631,92(não incluída) − 490,00 − 545.000,00 = **17.831.552,77** × 0,007617 = **135.822,94**; IRRF 17,5% = 23.769,01.

## Erros conceituais identificados

1. **Duplicidade**: dois lançamentos de JCP para a mesma competência, dobrando despesa financeira (25107) e passivo (25253) em 275.800,87 quando o correto é um único valor.
2. **Divergência de base entre os dois motores**: um ignora as redutoras 5747 e 25241 (490,00 + 545.000,00), o outro as deduz. A base tecnicamente correta deduz as redutoras → 17.831.552,77 (JCP 135.822,94).
3. **IRRF inconsistente**: `nitaplast-jcp-julho.ts` documenta "não contabilizar IRRF nesta etapa", mas `nitaplast-financeiro-julho.ts` lança IRRF de 23.769,01 (25253 → 1546) no mesmo Razão.
4. **Status contraditório**: `calculoJcpJulho` declara `entraNoRazao: false` / "não deliberado", porém o lançamento derivado dele está no Razão de julho.
5. **Resultado acumulado indevido**: NÃO há inflação por resultado do exercício corrente — a base usa apenas saldos de 31/05 sem movimento de junho; o lucro de junho/julho não entra. O que infla a base do cálculo de 139.977,93 são somente as redutoras não deduzidas (545.490,00 → 4.154,99 de JCP a mais).

## Correção sugerida (não executada)

Manter apenas um lançamento de JCP em julho, com base 17.831.552,77 e valor 135.822,94, definindo explicitamente se o IRRF de 23.769,01 é contabilizado ou fica como pendência tributária. Nenhum arquivo foi alterado nesta análise.
