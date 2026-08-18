import { dreJulhoFinal } from "../src/data/nitaplast-dre-julho-final.ts";
import { resumoFechamentoJulhoFinal } from "../src/data/nitaplast-razao-julho-final-v2.ts";
import { resumoFinanceiroJulho } from "../src/data/nitaplast-financeiro-julho.ts";
import { resumoProvisoesJulhoReais } from "../src/data/nitaplast-provisoes-julho-reais.ts";

console.log("NITAPLAST_JULHO_RESULTADO=" + JSON.stringify({
  dre: dreJulhoFinal,
  razao: resumoFechamentoJulhoFinal,
  financeiro: resumoFinanceiroJulho,
  provisoes: resumoProvisoesJulhoReais,
}, null, 2));
