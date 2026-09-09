import XLSX from "xlsx";

const arquivo = "LALUR_Nitaplast_01-07_2026.xlsx";
const moeda = '#,##0.00;[Red]-#,##0.00';
const formula = (f, v) => ({ t: "n", f, v });

const dados = {
  lucroJanJun: 707721.59,
  lucroJulho: 128172.33,
  adicoesJanJun: 13072.59,
  exclusoesJanJun: 23650.14,
  pagamentosIrpjAteJunho: 141538.07,
  pagamentosCsllAteJunho: 62742.96,
  irrfJanJun: 20747.94,
  irrfJulho: 555.38,
};

const linhasApuracao = [
  ["LALUR / LACS — Balanço de Suspensão ou Redução", null],
  ["Empresa", "Nitaplast Indústria e Comércio de Plásticos Industriais Ltda."],
  ["Período acumulado", "01/01/2026 a 31/07/2026"],
  ["Critério", "Lucro Real acumulado — valores extraídos do mesmo motor da DRE/LALUR"],
  [null, null],
  ["Lucro contábil acumulado janeiro a junho", dados.lucroJanJun],
  ["(+) Resultado contábil de julho", dados.lucroJulho],
  ["(=) Lucro contábil acumulado janeiro a julho", formula("B6+B7", 835893.92)],
  ["(+) Adições acumuladas janeiro a junho", dados.adicoesJanJun],
  ["(+) Adições de julho registradas no LALUR", 0],
  ["(-) Exclusões acumuladas janeiro a junho", dados.exclusoesJanJun],
  ["(-) Exclusões de julho registradas no LALUR", 0],
  ["(=) Lucro Real / Base IRPJ e CSLL", formula("B8+B9+B10-B11-B12", 825316.37)],
  [null, null],
  ["IRPJ normal — 15%", formula("MAX(0,B13*15%)", 123797.46)],
  ["Limite do adicional — R$ 20.000 × 7 meses", 140000],
  ["Base excedente do adicional", formula("MAX(0,B13-B16)", 685316.37)],
  ["Adicional de IRPJ — 10%", formula("B17*10%", 68531.64)],
  ["IRPJ devido acumulado", formula("B15+B18", 192329.10)],
  ["(-) Estimativas de IRPJ pagas até junho", dados.pagamentosIrpjAteJunho],
  ["(-) IRRF compensável janeiro a junho", dados.irrfJanJun],
  ["(-) IRRF compensável de julho", dados.irrfJulho],
  ["(=) IRPJ a pagar em julho", formula("MAX(0,B19-B20-B21-B22)", 29487.71)],
  [null, null],
  ["CSLL devida acumulada — 9%", formula("MAX(0,B13*9%)", 74278.47)],
  ["(-) Estimativas de CSLL pagas até junho", dados.pagamentosCsllAteJunho],
  ["(=) CSLL a pagar em julho", formula("MAX(0,B25-B26)", 11535.51)],
  [null, null],
  ["Total IRPJ + CSLL a pagar", formula("B23+B27", 41023.22)],
];

const linhasAjustes = [
  ["Ajustes do LALUR/LACS", "IRPJ", "CSLL", "Situação / fonte"],
  ["Adições acumuladas janeiro a junho", dados.adicoesJanJun, dados.adicoesJanJun, "Planilha do escritório — junho/2026"],
  ["Exclusões acumuladas janeiro a junho", dados.exclusoesJanJun, dados.exclusoesJanJun, "Planilha do escritório — junho/2026"],
  ["Adições formalmente registradas em julho", 0, 0, "Nenhum ajuste persistido no LALUR de julho"],
  ["Exclusões formalmente registradas em julho", 0, 0, "Nenhum ajuste persistido no LALUR de julho"],
  [null, null, null, null],
  ["CENÁRIO NÃO REGISTRADO — provisão de custos", 100000, 100000, "Candidato a adição; confirmar tratamento fiscal e documentação"],
  ["CENÁRIO NÃO REGISTRADO — donativo Pequeno Príncipe", 750, 750, "Candidato a adição; confirmar eventual incentivo/limite fiscal"],
  ["Total potencial de adições de julho", formula("B7+B8", 100750), formula("C7+C8", 100750), "Não integra a apuração oficial desta planilha"],
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(linhasApuracao);
ws["!cols"] = [{ wch: 58 }, { wch: 28 }];
ws["!freeze"] = { xSplit: 0, ySplit: 5 };
for (let linha = 6; linha <= linhasApuracao.length; linha += 1) {
  const celula = ws[`B${linha}`];
  if (celula && (celula.t === "n" || celula.f)) celula.z = moeda;
}
XLSX.utils.book_append_sheet(wb, ws, "Apuração Jan-Jul");

const wsAjustes = XLSX.utils.aoa_to_sheet(linhasAjustes);
wsAjustes["!cols"] = [{ wch: 52 }, { wch: 18 }, { wch: 18 }, { wch: 62 }];
for (let linha = 2; linha <= linhasAjustes.length; linha += 1) {
  for (const coluna of ["B", "C"]) {
    const celula = wsAjustes[`${coluna}${linha}`];
    if (celula && (celula.t === "n" || celula.f)) celula.z = moeda;
  }
}
XLSX.utils.book_append_sheet(wb, wsAjustes, "Adições e Exclusões");

const wsMemoria = XLSX.utils.aoa_to_sheet([
  ["Memória e conferência", "Valor"],
  ["Receita operacional bruta de julho", 4138549.72],
  ["Deduções da receita de julho", 818691.17],
  ["Receita líquida de julho", 3319858.55],
  ["CPV total de julho", 1751614.15],
  ["Despesas financeiras de julho", 152077.49],
  ["Receitas financeiras de julho", 37716.99],
  ["Provisão de custos no resultado", 100000],
  ["Resultado contábil de julho", dados.lucroJulho],
  ["Variação cambial ativa", 13096.86],
  ["Variação cambial passiva", 10696.99],
  ["Efeito cambial líquido positivo", 2399.87],
]);
wsMemoria["!cols"] = [{ wch: 48 }, { wch: 20 }];
for (let linha = 2; linha <= 12; linha += 1) wsMemoria[`B${linha}`].z = moeda;
XLSX.utils.book_append_sheet(wb, wsMemoria, "Memória DRE");

XLSX.writeFile(wb, arquivo, { compression: true });
console.log(arquivo);
