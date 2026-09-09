import { balanceteDominioMaio } from "../src/data/nitaplast-balancete-dominio-maio";

console.log(JSON.stringify(
  balanceteDominioMaio.filter((linha) =>
    linha.classificacao.startsWith("4.1.01.12") && linha.tipo === "A"
  ),
  null,
  2,
));
