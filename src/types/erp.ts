// Modelo de referência do ERP Contábil.
// Nenhuma persistência nesta etapa — apenas contratos para a fase seguinte.

export type RegimeTributario = "simples" | "presumido" | "real" | "imune";

export interface GrupoEmpresa {
  id: string;
  nome: string;
  responsavel: string;
  empresasIds: string[];
}

export type TipoEstabelecimento = "matriz" | "filial";

export interface Empresa {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  municipio?: string;
  uf: string;
  /** Ausente quando ainda não confirmado com o cliente — não presumir. */
  regime?: RegimeTributario;
  regimeConfirmado?: boolean;
  atividade?: string;
  tipo: TipoEstabelecimento;
  grupoId?: string;
  responsavelLegal?: { nome: string; cargo: string; cpf?: string };
  responsavelContabil?: { nome: string; registro: string; cpf?: string };
  ativa: boolean;
}

export type StatusCompetencia = "aberta" | "em_fechamento" | "fechada";

export interface Competencia {
  id: string;
  empresaId: string;
  ano: number;
  mes: number;
  status: StatusCompetencia;
}

export type NaturezaConta = "ativo" | "passivo" | "patrimonio" | "receita" | "despesa" | "resultado";

export interface ContaContabil {
  id: string;
  codigo: string;
  descricao: string;
  nivel: number;
  paiId?: string;
  natureza: NaturezaConta;
  aceitaLancamento: boolean;
}

export interface CentroDeCusto {
  id: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export interface HistoricoPadrao {
  id: string;
  codigo: string;
  descricao: string;
  complementoLivre: boolean;
}

export type OrigemLote = "manual" | "importacao" | "integracao";
export type StatusLote = "rascunho" | "validado" | "efetivado";

export interface Lote {
  id: string;
  numero: string;
  empresaId: string;
  competenciaId: string;
  origem: OrigemLote;
  status: StatusLote;
  quantidadeLancamentos: number;
  valorTotal: number;
}

export interface PartidaLancamento {
  id: string;
  contaId: string;
  centroCustoId?: string;
  tipo: "debito" | "credito";
  valor: number;
}

export interface Lancamento {
  id: string;
  numero: string;
  data: string;
  loteId?: string;
  historicoId?: string;
  complemento?: string;
  valor: number;
  partidas: PartidaLancamento[];
}

export interface Rateio {
  id: string;
  codigo: string;
  descricao: string;
  criterio: "percentual" | "valor" | "quantidade";
  linhas: { centroCustoId: string; percentual: number }[];
}

export interface ConciliacaoItem {
  id: string;
  contaId: string;
  data: string;
  descricao: string;
  valor: number;
  status: "pendente" | "conciliado" | "divergente";
}

export interface FechamentoPeriodo {
  id: string;
  competenciaId: string;
  etapa: "validacao" | "apuracao" | "revisao" | "encerrado";
  responsavel?: string;
  concluidoEm?: string;
}

export type ModuloId =
  | "dashboard"
  | "empresas"
  | "grupos"
  | "contabil"
  | "importacoes"
  | "integracoes"
  | "relatorios"
  | "administracao"
  | "fiscal"
  | "patrimonio"
  | "ecd_ecf"
  | "obrigacoes";

export type AcaoPermissao = "ver" | "criar" | "editar" | "excluir" | "efetivar";

export interface Permissao {
  modulo: ModuloId;
  acoes: AcaoPermissao[];
}

export interface Funcao {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcaoId: string;
  ativo: boolean;
}

export type FormatoImportacao = "TXT" | "SPED" | "CSV" | "XLSX" | "OFX" | "PDF" | "XML" | "API";

export interface ImportacaoJob {
  id: string;
  formato: FormatoImportacao;
  arquivo: string;
  empresaId: string;
  competenciaId: string;
  status: "aguardando" | "processando" | "concluido" | "erro";
  criadoEm: string;
}

export type FluxoImportacao = "implantacao" | "recorrencia";
export type CategoriaFonteImportacao =
  | "ecd" | "plano_contas" | "saldos_abertura" | "saldos_auxiliares"
  | "fiscal_entradas" | "fiscal_saidas" | "bancos" | "folha" | "tributos"
  | "estoque" | "imobilizado" | "aplicacoes" | "outros_documentos"
  | "relatorio_conferencia";
export type StatusDossieImportacao = "aguardando_conferencia" | "aprovado" | "duplicado" | "rejeitado";

/** Evidência importada. Aprovar o item não o transforma em fato contábil. */
export interface ItemDossieImportacao {
  id: string;
  empresaId: string;
  competenciaId: string;
  fluxo: FluxoImportacao;
  categoria: CategoriaFonteImportacao;
  formato: FormatoImportacao;
  arquivo: string;
  tamanho: number;
  tipoMime: string;
  hash: string;
  ultimaModificacao: number;
  finalidade: "fonte" | "conferencia";
  podeGerarLancamento: boolean;
  status: StatusDossieImportacao;
  criadoEm: string;
  aprovadoEm?: string;
}

export interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  status: "nao_conectado" | "conectado" | "planejado";
}
