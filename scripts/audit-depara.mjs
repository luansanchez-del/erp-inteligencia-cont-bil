import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { resumoPlanoDominio, vinculosContasDominio } = await vite.ssrLoadModule("/src/data/nitaplast-plano-dominio.ts");
  const { saldosImplantacao } = await vite.ssrLoadModule("/src/data/nitaplast-implantacao.ts");
  const { balanceteDominioMaio } = await vite.ssrLoadModule("/src/data/nitaplast-balancete-dominio-maio.ts");
  const { estruturaBalanceteNitaplast } = await vite.ssrLoadModule("/src/data/nitaplast-balancete-estrutura.ts");
  const { lancamentosIntegrados } = await vite.ssrLoadModule("/src/data/nitaplast-razao-integrado.ts");
  const { lancamentosIntegradosJulhoFinal } = await vite.ssrLoadModule("/src/data/nitaplast-razao-julho-final-v2.ts");
  const { calcularBalanceteDominio } = await vite.ssrLoadModule("/src/data/nitaplast-balancete-dominio-engine.ts");
  const mapa = new Map(vinculosContasDominio.map((item) => [item.contaAtual, item]));
  const codigosDominio = new Map();
  for (const item of balanceteDominioMaio.filter((item) => item.tipo === "A")) codigosDominio.set(item.conta, [...(codigosDominio.get(item.conta) ?? []), item]);
  console.log("DUPLICADOS DOMINIO", [...codigosDominio].filter(([, itens]) => itens.length > 1).map(([codigo, itens]) => [codigo, itens.map((item) => item.descricao)]));
  console.log("CONTAS RESULTADO 3", balanceteDominioMaio.filter((item) => item.tipo === "A" && item.classificacao.startsWith("3.")).map((item) => `${item.conta}:${item.classificacao}:${item.descricao}`).join(" | "));
  const normalizar = (valor) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/gi, " ").trim().toUpperCase();
  const palavras = (valor) => new Set(normalizar(valor).split(" ").filter((item) => item.length > 2));
  const similares = (descricao) => {
    const origem = palavras(descricao);
    return balanceteDominioMaio.filter((item) => item.tipo === "A").map((item) => {
      const destino = palavras(item.descricao);
      const comum = [...origem].filter((p) => destino.has(p)).length;
      return { conta: item.conta, descricao: item.descricao, score: comum / Math.max(1, new Set([...origem, ...destino]).size) };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
  };
  for (const termo of ["ADIANT", "HOSPED", "BRIND", "COMBUST", "ALIMENT", "TRANSIT", "PROFISSION", "TERCEIR", "IMOBILIZADO", "VENDAS", "COMPRAS", "IMPORT", "CREDOR", "FORNECEDOR", "PRODUTOS", "MERCADORIAS", "FATURAMENTO", "RECEITA", "RETID", "PROVIS"] ) {
    console.log("DOMINIO", termo, balanceteDominioMaio.filter((item) => item.tipo === "A" && normalizar(item.descricao).includes(termo)).map((item) => `${item.conta}:${item.descricao}`).join(" | "));
  }
  for (const [mes, lancamentos] of [["junho", lancamentosIntegrados], ["julho", lancamentosIntegradosJulhoFinal]]) {
    const usadas = [...new Set(lancamentos.flatMap((item) => [item.debitoCodigo, item.creditoCodigo]))];
    const pendentes = usadas.filter((conta) => !mapa.has(conta));
    console.log(mes, { lancamentos: lancamentos.length, usadas: usadas.length, vinculadas: usadas.length - pendentes.length, pendentes: pendentes.length, codigos: pendentes.join(",") });
    if (mes === "junho") for (const codigo of pendentes) {
      const conta = saldosImplantacao.find((item) => item.conta === codigo);
      console.log(codigo, conta?.descricao, similares(conta?.descricao ?? ""));
    }
    console.log("PENDENCIAS", mes, pendentes.map((codigo) => {
      const conta = saldosImplantacao.find((item) => item.conta === codigo) ?? estruturaBalanceteNitaplast.find((item) => item.conta === codigo);
      const debitos = lancamentos.filter((item) => item.debitoCodigo === codigo).reduce((total, item) => total + item.valor, 0);
      const creditos = lancamentos.filter((item) => item.creditoCodigo === codigo).reduce((total, item) => total + item.valor, 0);
      const exemplo = lancamentos.find((item) => item.debitoCodigo === codigo || item.creditoCodigo === codigo);
      const nomeLancamento = exemplo?.debitoCodigo === codigo ? exemplo.debito : exemplo?.credito;
      return { codigo, classificacao: conta?.classificacao, descricao: conta?.descricao ?? nomeLancamento, debitos, creditos, exemplo: exemplo?.historico };
    }));
  }
  console.log(resumoPlanoDominio);
  for (const [mes, resultado, lancamentos] of [
    ["junho", calcularBalanceteDominio(lancamentosIntegrados), lancamentosIntegrados],
    ["julho", calcularBalanceteDominio(lancamentosIntegrados, lancamentosIntegradosJulhoFinal), lancamentosIntegradosJulhoFinal],
  ]) {
    const raiz = resultado.linhas.filter((item) => item.classificacao === "1" || item.classificacao === "2" || item.classificacao === "3" || item.classificacao === "4");
    const pendD = resultado.pendencias.reduce((total, item) => total + item.debitos, 0);
    const pendC = resultado.pendencias.reduce((total, item) => total + item.creditos, 0);
    console.log("RECONCILIACAO", mes, {
      totalLancamentos: lancamentos.reduce((total, item) => total + item.valor, 0),
      pendenteDebito: pendD,
      pendenteCredito: pendC,
      diferencaPendente: Math.round((pendD - pendC) * 100) / 100,
      somaSaldosRaiz: Math.round(raiz.reduce((total, item) => total + item.saldoAtual, 0) * 100) / 100,
      debitosRaiz: Math.round(raiz.reduce((total, item) => total + item.debitos, 0) * 100) / 100,
      creditosRaiz: Math.round(raiz.reduce((total, item) => total + item.creditos, 0) * 100) / 100,
      raizes: raiz.map((item) => [item.classificacao, item.descricao, item.saldoAnterior, item.debitos, item.creditos, item.saldoAtual]),
    });
  }
} finally {
  await vite.close();
}
