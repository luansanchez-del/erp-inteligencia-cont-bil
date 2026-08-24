import type { Empresa, GrupoEmpresa, Funcao, Usuario, Integracao } from "@/types/erp";

export const grupos: GrupoEmpresa[] = [
  {
    id: "g-nitaplast",
    nome: "NITAPLAST",
    responsavel: "Luan Sanchez",
    empresasIds: ["nitaplast-matriz", "nitaplast-sp"],
  },
];

export const empresas: Empresa[] = [
  {
    id: "nitaplast-matriz",
    codigo: "1184",
    razaoSocial: "NITAPLAST IND E COM DE PLASTICOS INDUSTRIAIS LTDA",
    nomeFantasia: "NITAPLAST — Matriz",
    cnpj: "82.295.817/0001-07",
    municipio: "Pinhais",
    uf: "PR",
    atividade: "Indústria",
    tipo: "matriz",
    responsavelLegal: { nome: "MARCOS VICTOR SIEDEL", cargo: "ADMINISTRADOR", cpf: "462.600.569-15" },
    responsavelContabil: { nome: "GILSON STRECHAR", registro: "CRC 036601/O-4", cpf: "859.770.809-30" },
    regimeConfirmado: false,
    grupoId: "g-nitaplast",
    ativa: true,
  },
  {
    id: "nitaplast-sp",
    codigo: "1184",
    razaoSocial: "NITAPLAST IND E COM DE PLASTICOS INDUSTRIAIS LTDA",
    nomeFantasia: "NITAPLAST — Filial SP",
    cnpj: "82.295.817/0003-60",
    municipio: "São Paulo",
    uf: "SP",
    tipo: "filial",
    responsavelLegal: { nome: "MARCOS VICTOR SIEDEL", cargo: "ADMINISTRADOR", cpf: "462.600.569-15" },
    responsavelContabil: { nome: "GILSON STRECHAR", registro: "CRC 036601/O-4", cpf: "859.770.809-30" },
    regimeConfirmado: false,
    grupoId: "g-nitaplast",
    ativa: true,
  },
];

export const competenciasDisponiveis = [
  { id: "2026-07", label: "07/2026", status: "em_fechamento" as const },
  { id: "2026-06", label: "06/2026", status: "fechada" as const },
  { id: "2026-05", label: "05/2026", status: "fechada" as const },
  { id: "2026-01", label: "01/2026", status: "aberta" as const },
  { id: "2025-12", label: "12/2025", status: "em_fechamento" as const },
  { id: "2025-11", label: "11/2025", status: "fechada" as const },
];

export const funcoes: Funcao[] = [
  {
    id: "f1",
    nome: "Administrador",
    descricao: "Acesso total a todos os módulos",
    permissoes: [],
  },
  {
    id: "f2",
    nome: "Contador",
    descricao: "Escrituração, relatórios e fechamento",
    permissoes: [],
  },
  {
    id: "f3",
    nome: "Consulta",
    descricao: "Somente leitura de relatórios",
    permissoes: [],
  },
];

export const usuarios: Usuario[] = [
  { id: "u1", nome: "Luan Sanchez", email: "luan@escritorio.com.br", funcaoId: "f1", ativo: true },
  { id: "u2", nome: "Ana Ribeiro", email: "ana@escritorio.com.br", funcaoId: "f2", ativo: true },
  { id: "u3", nome: "Carlos Dias", email: "carlos@escritorio.com.br", funcaoId: "f3", ativo: true },
];

export const integracoes: Integracao[] = [
  {
    id: "questor",
    nome: "Questor",
    descricao: "Conector de contingência para importar e devolver movimento contábil.",
    status: "nao_conectado",
  },
  {
    id: "bancos",
    nome: "Extratos bancários",
    descricao: "Coleta automática de extratos para conciliação.",
    status: "planejado",
  },
  {
    id: "erp-cliente",
    nome: "ERPs de clientes",
    descricao: "Recebimento de arquivos e APIs de sistemas de terceiros.",
    status: "planejado",
  },
];
