import type { Empresa, GrupoEmpresa, Funcao, Usuario, Integracao } from "@/types/erp";

export const grupos: GrupoEmpresa[] = [
  { id: "g1", nome: "Grupo Aurora", responsavel: "Luan Sanchez", empresasIds: ["e1", "e2"] },
  { id: "g2", nome: "Grupo Meridiano", responsavel: "Equipe Contábil", empresasIds: ["e3"] },
];

export const empresas: Empresa[] = [
  {
    id: "e1",
    codigo: "0001",
    razaoSocial: "Aurora Comércio de Alimentos Ltda",
    nomeFantasia: "Aurora Alimentos",
    cnpj: "12.345.678/0001-90",
    uf: "SP",
    regime: "presumido",
    grupoId: "g1",
    ativa: true,
  },
  {
    id: "e2",
    codigo: "0002",
    razaoSocial: "Aurora Logística S.A.",
    nomeFantasia: "Aurora Log",
    cnpj: "12.345.678/0002-71",
    uf: "SP",
    regime: "real",
    grupoId: "g1",
    ativa: true,
  },
  {
    id: "e3",
    codigo: "0003",
    razaoSocial: "Meridiano Serviços Contábeis ME",
    nomeFantasia: "Meridiano",
    cnpj: "98.765.432/0001-10",
    uf: "PR",
    regime: "simples",
    grupoId: "g2",
    ativa: false,
  },
];

export const competenciasDisponiveis = [
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
