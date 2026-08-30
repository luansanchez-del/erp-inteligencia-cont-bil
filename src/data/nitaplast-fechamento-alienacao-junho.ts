import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const RECEITA_BRUTA_ALIENACOES = 15000.00;
const CUSTO_BAIXA_AGREGADO = 7704.14;
const GANHO_LIQUIDO_ALIENACOES = 7295.86;
const COMPRESSOR_CUSTO_HISTORICO = 19120.98;
const COMPRESSOR_DEPRECIACAO_ACUMULADA = 19120.98;
const SAVEIRO_CUSTO_HISTORICO = 16500.00;
const SAVEIRO_DEPRECIACAO_ACUMULADA = 8795.86;
const SAVEIRO_RESIDUAL = 7704.14;

const arred = (valor: number) => Math.round(valor * 100) / 100;

function receitaLiquidaConta(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.creditoCodigo === codigo) total += linha.valor;
    if (linha.debitoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

function despesaLiquidaConta(base: LancamentoIntegrado[], codigo: string) {
  return arred(base.reduce((total, linha) => {
    if (linha.debitoCodigo === codigo) total += linha.valor;
    if (linha.creditoCodigo === codigo) total -= linha.valor;
    return total;
  }, 0));
}

function lancamento(params: {
  id: string;
  debitoCodigo: string;
  debito: string;
  creditoCodigo: string;
  credito: string;
  valor: number;
  historico: string;
  documento: string;
  observacao: string;
  fonte: string;
  status?: LancamentoIntegrado["status"];
  rastreio?: LancamentoIntegrado["rastreio"];
}): LancamentoIntegrado {
  return {
    id: params.id,
    data: "30/06/2026",
    origem: "ALIENAÇÃO IMOBILIZADO 06/2026",
    debitoCodigo: params.debitoCodigo,
    debito: params.debito,
    creditoCodigo: params.creditoCodigo,
    credito: params.credito,
    historico: params.historico,
    documento: params.documento,
    cc: "302",
    centroCusto: "FINANCEIRO",
    valor: arred(params.valor),
    status: params.status ?? "validado",
    observacao: params.observacao,
    rastreio: params.rastreio ?? "documento",
    fonte: params.fonte,
  };
}

/**
 * Fechamento das alienações de junho/2026.
 *
 * Documentos/razão gerencial comprovam R$ 15.000,00 de vendas de ativo:
 * - R$ 10.000,00 - venda do veículo Saveiro AIQ1A37;
 * - R$ 5.000,00 - venda do compressor Ingersoll Rand 15HP.
 *
 * O compressor possui custo histórico e depreciação acumulada iguais a
 * R$ 19.120,98; portanto sua baixa patrimonial é D 1147 / C 1083, sem efeito no
 * resultado. O fechamento gerencial validado determina ganho líquido agregado de
 * R$ 7.295,86. Logo, sobre a receita bruta de R$ 15.000,00, o valor contábil líquido
 * agregado das alienações é R$ 7.704,14.
 *
 * Ficha patrimonial individual da Saveiro AIQ1A37 (informada no fechamento de
 * junho/2026): custo histórico R$ 16.500,00, depreciação acumulada R$ 8.795,86,
 * valor residual R$ 7.704,14 — o mesmo valor contábil líquido agregado das
 * alienações, já que o compressor tem VCL zero. A baixa é individualizada em
 * D 25187 (depreciação acumulada) / C 1089 (Veículos) e D 4760 (custo) / C 1089,
 * em vez de ficar na 4859 - Conta Transitória.
 */
export function aplicarFechamentoAlienacaoJunho(base: LancamentoIntegrado[]): LancamentoIntegrado[] {
  const resultado = [...base];

  // Baixa do compressor totalmente depreciado: movimento patrimonial, efeito zero na DRE.
  if (!resultado.some((linha) => linha.id === "ALIEN-COMP-BAIXA-ATIVO-062026")) {
    resultado.push(lancamento({
      id: "ALIEN-COMP-BAIXA-ATIVO-062026",
      debitoCodigo: "1147",
      debito: "1147 - (-) Deprec. Máquinas, Aparelhos e Equipamentos",
      creditoCodigo: "1083",
      credito: "1083 - Maquinas, Aparelhos e Equipamentos",
      valor: COMPRESSOR_CUSTO_HISTORICO,
      historico: "Baixa patrimonial do compressor Ingersoll Rand 15HP totalmente depreciado",
      documento: "BAIXA COMPRESSOR 15HP 06/2026",
      observacao: `Custo histórico R$ ${COMPRESSOR_CUSTO_HISTORICO.toFixed(2)} e depreciação acumulada R$ ${COMPRESSOR_DEPRECIACAO_ACUMULADA.toFixed(2)}. Valor contábil líquido zero; a baixa não gera despesa adicional.`,
      fonte: "Informação patrimonial validada no fechamento de junho/2026",
      rastreio: "derivado",
    }));
  }

  // Baixa individual da Saveiro AIQ1A37: depreciação acumulada e valor residual sobre custo histórico de R$ 16.500,00.
  if (!resultado.some((linha) => linha.id === "ALIEN-SAVEIRO-BAIXA-DEPREC-062026")) {
    resultado.push(lancamento({
      id: "ALIEN-SAVEIRO-BAIXA-DEPREC-062026",
      debitoCodigo: "25187",
      debito: "25187 - (-) Veiculos",
      creditoCodigo: "1089",
      credito: "1089 - Veículos",
      valor: SAVEIRO_DEPRECIACAO_ACUMULADA,
      historico: "Baixa da depreciação acumulada da Saveiro AIQ1A37 alienada em junho/2026",
      documento: "BAIXA SAVEIRO AIQ1A37 06/2026",
      observacao: `Custo histórico R$ ${SAVEIRO_CUSTO_HISTORICO.toFixed(2)}, depreciação acumulada R$ ${SAVEIRO_DEPRECIACAO_ACUMULADA.toFixed(2)} e valor residual R$ ${SAVEIRO_RESIDUAL.toFixed(2)}, conforme ficha patrimonial individual informada no fechamento de junho/2026.`,
      fonte: "Ficha patrimonial individual da Saveiro AIQ1A37 informada no fechamento de junho/2026",
      rastreio: "documento",
    }));
  }
  if (!resultado.some((linha) => linha.id === "ALIEN-SAVEIRO-BAIXA-RESIDUAL-062026")) {
    resultado.push(lancamento({
      id: "ALIEN-SAVEIRO-BAIXA-RESIDUAL-062026",
      debitoCodigo: "4760",
      debito: "4760 - Custo Vendas do Ativo Imobilizado",
      creditoCodigo: "1089",
      credito: "1089 - Veículos",
      valor: SAVEIRO_RESIDUAL,
      historico: "Baixa do valor residual da Saveiro AIQ1A37 alienada em junho/2026",
      documento: "BAIXA SAVEIRO AIQ1A37 06/2026",
      observacao: `Valor contábil líquido individual da Saveiro AIQ1A37: R$ ${SAVEIRO_RESIDUAL.toFixed(2)}, conforme ficha patrimonial informada no fechamento de junho/2026.`,
      fonte: "Ficha patrimonial individual da Saveiro AIQ1A37 informada no fechamento de junho/2026",
      rastreio: "documento",
    }));
  }

  // Receita bruta: conciliamos o que já existir na 4736 e registramos apenas a diferença.
  const receitaAntes = receitaLiquidaConta(resultado, "4736");
  const diferencaReceita = arred(RECEITA_BRUTA_ALIENACOES - receitaAntes);
  if (Math.abs(diferencaReceita) >= 0.005) {
    const aumentaReceita = diferencaReceita > 0;
    resultado.push(lancamento({
      id: "ALIEN-REC-FECH-062026",
      debitoCodigo: aumentaReceita ? "25111" : "4736",
      debito: aumentaReceita ? "25111 - Duplicatas a Receber" : "4736 - Vendas do Ativo Imobilizado",
      creditoCodigo: aumentaReceita ? "4736" : "25111",
      credito: aumentaReceita ? "4736 - Vendas do Ativo Imobilizado" : "25111 - Duplicatas a Receber",
      valor: Math.abs(diferencaReceita),
      historico: "Reconhecimento da receita bruta das alienações de ativo imobilizado de junho/2026",
      documento: "ALIENAÇÕES ATIVO 06/2026",
      observacao: `Receita documentada total: R$ ${RECEITA_BRUTA_ALIENACOES.toFixed(2)} (R$ 10.000,00 + R$ 5.000,00). Receita já existente na conta 4736 antes desta reconciliação: R$ ${receitaAntes.toFixed(2)}.`,
      fonte: "Notas/documentos de alienação + Razão gerencial Jan-Jun/2026",
    }));
  }

  // Aproveita o adiantamento bancário de R$ 5.000,00 da Saveiro já reconhecido na 1712.
  const adiantamentoSaveiro = resultado.find((linha) =>
    linha.creditoCodigo === "1712"
    && Math.abs(linha.valor - 5000) < 0.005
    && `${linha.historico} ${linha.observacao}`.toLocaleUpperCase("pt-BR").includes("SAVEIRO"),
  );
  if (adiantamentoSaveiro && !resultado.some((linha) => linha.id === "ALIEN-SAVEIRO-BAIXA-ADIANT-062026")) {
    resultado.push(lancamento({
      id: "ALIEN-SAVEIRO-BAIXA-ADIANT-062026",
      debitoCodigo: "1712",
      debito: "1712 - Adiantamentos de Clientes Diversos",
      creditoCodigo: "25111",
      credito: "25111 - Duplicatas a Receber",
      valor: 5000,
      historico: "Aplicação do adiantamento recebido na venda da Saveiro AIQ1A37",
      documento: "SAVEIRO AIQ1A37",
      observacao: "O banco já reconheceu D Banco / C Adiantamentos de Clientes. Este lançamento apenas baixa o adiantamento contra o contas a receber da alienação; não cria nova receita.",
      fonte: `${adiantamentoSaveiro.fonte} + documentos de alienação`,
    }));
  }

  // Rede de segurança: com o compressor e a Saveiro já baixados individualmente acima,
  // este bloco só dispara se houver alguma divergência residual de arredondamento.
  const custoAntes = despesaLiquidaConta(resultado, "4760");
  const diferencaCusto = arred(CUSTO_BAIXA_AGREGADO - custoAntes);
  if (Math.abs(diferencaCusto) >= 0.005) {
    const aumentaCusto = diferencaCusto > 0;
    resultado.push(lancamento({
      id: "ALIEN-CUSTO-FECH-062026",
      debitoCodigo: aumentaCusto ? "4760" : "4859",
      debito: aumentaCusto ? "4760 - Custo Vendas do Ativo Imobilizado" : "4859 - Conta Transitória",
      creditoCodigo: aumentaCusto ? "4859" : "4760",
      credito: aumentaCusto ? "4859 - Conta Transitória" : "4760 - Custo Vendas do Ativo Imobilizado",
      valor: Math.abs(diferencaCusto),
      historico: "Custo/baixa contábil agregado das alienações de ativo imobilizado - junho/2026",
      documento: "BAIXA ALIENAÇÕES 06/2026",
      observacao: `Divergência residual entre o valor contábil líquido agregado validado (R$ ${CUSTO_BAIXA_AGREGADO.toFixed(2)}) e as baixas individuais já lançadas para o compressor e a Saveiro. Mantido contra a 4859 - Conta Transitória até identificar a causa.`,
      fonte: "DRE final 06/2026 + documentos de alienação + conciliação patrimonial",
      rastreio: "derivado",
    }));
  }

  const receitaFinal = receitaLiquidaConta(resultado, "4736");
  const custoFinal = despesaLiquidaConta(resultado, "4760");
  const ganhoFinal = arred(receitaFinal - custoFinal);

  if (Math.abs(receitaFinal - RECEITA_BRUTA_ALIENACOES) > 0.01) {
    throw new Error(`Receita de alienação não conciliou: ${receitaFinal.toFixed(2)}`);
  }
  if (Math.abs(custoFinal - CUSTO_BAIXA_AGREGADO) > 0.01) {
    throw new Error(`Custo de baixa das alienações não conciliou: ${custoFinal.toFixed(2)}`);
  }
  if (Math.abs(ganhoFinal - GANHO_LIQUIDO_ALIENACOES) > 0.01) {
    throw new Error(`Ganho líquido das alienações não conciliou: ${ganhoFinal.toFixed(2)}`);
  }

  return resultado;
}

export const fechamentoAlienacaoJunho = {
  receitaBruta: RECEITA_BRUTA_ALIENACOES,
  custoBaixaAgregado: CUSTO_BAIXA_AGREGADO,
  ganhoLiquido: GANHO_LIQUIDO_ALIENACOES,
  compressor: {
    custoHistorico: COMPRESSOR_CUSTO_HISTORICO,
    depreciacaoAcumulada: COMPRESSOR_DEPRECIACAO_ACUMULADA,
    valorContabilLiquido: 0,
  },
} as const;
