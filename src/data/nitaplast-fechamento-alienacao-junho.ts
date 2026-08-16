import type { LancamentoIntegrado } from "./nitaplast-razao-base";

const RECEITA_BRUTA_ALIENACOES = 15000.00;
const CUSTO_BAIXA_AGREGADO = 7704.14;
const GANHO_LIQUIDO_ALIENACOES = 7295.86;
const COMPRESSOR_CUSTO_HISTORICO = 19120.98;
const COMPRESSOR_DEPRECIACAO_ACUMULADA = 19120.98;

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
 * Enquanto a ficha patrimonial individual da Saveiro não estiver aberta nesta base,
 * os R$ 7.704,14 ficam contra a 4859 - Conta Transitória. Isso NÃO altera o ganho:
 * registra D 4760 / C 4859 e deixa explícita a contrapartida patrimonial pendente,
 * sem inventar custo individual do veículo.
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

  // Valor contábil líquido agregado necessário para o ganho final validado.
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
      observacao: `Valor contábil líquido agregado validado pelo fechamento: R$ ${CUSTO_BAIXA_AGREGADO.toFixed(2)}. O compressor foi baixado separadamente com VCL zero. A 4859 mantém a parcela patrimonial ainda a abrir por bem, sem inventar o saldo individual da Saveiro.`,
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
