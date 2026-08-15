import {
  LayoutDashboard,
  Building2,
  Boxes,
  BookOpen,
  Upload,
  Plug,
  FileBarChart,
  Settings,
  Receipt,
  Landmark,
  FileSpreadsheet,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import type { ModuloId } from "@/types/erp";

export interface NavItem {
  label: string;
  to: string;
  exact?: boolean;
}

export interface NavGroup {
  id: ModuloId;
  label: string;
  icon: LucideIcon;
  to?: string;
  exact?: boolean;
  items?: NavItem[];
  futuro?: boolean;
}

export const navGroups: NavGroup[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/", exact: true },
  { id: "empresas", label: "Empresas", icon: Building2, to: "/empresas" },
  { id: "grupos", label: "Grupos de Empresas", icon: Boxes, to: "/grupos" },
  {
    id: "contabil",
    label: "Contábil",
    icon: BookOpen,
    items: [
      { label: "Competências", to: "/contabil/competencias" },
      { label: "Plano de Contas", to: "/contabil/plano-de-contas" },
      { label: "Centros de Custo", to: "/contabil/centros-de-custo" },
      { label: "Históricos Contábeis", to: "/contabil/historicos" },
      { label: "Lançamentos", to: "/contabil/lancamentos" },
      { label: "Lotes", to: "/contabil/lotes" },
      { label: "Rateios", to: "/contabil/rateios" },
      { label: "Conciliação", to: "/contabil/conciliacao" },
      { label: "Fechamento", to: "/contabil/fechamento" },
      { label: "Nitaplast 06/2026", to: "/contabil/fechamento-assistido" },
      { label: "Encerramento", to: "/contabil/encerramento" },
      { label: "Razão", to: "/contabil/razao" },
      { label: "Diário", to: "/contabil/diario" },
      { label: "Balancete", to: "/contabil/balancete" },
      { label: "DRE", to: "/contabil/dre" },
      { label: "Balanço Patrimonial", to: "/contabil/balanco-patrimonial" },
    ],
  },
  { id: "importacoes", label: "Importações", icon: Upload, to: "/importacoes" },
  { id: "integracoes", label: "Integrações", icon: Plug, to: "/integracoes" },
  { id: "relatorios", label: "Relatórios", icon: FileBarChart, to: "/relatorios" },
  { id: "administracao", label: "Administração", icon: Settings, to: "/administracao" },
  { id: "fiscal", label: "Fiscal", icon: Receipt, to: "/fiscal", futuro: true },
  { id: "patrimonio", label: "Patrimônio", icon: Landmark, to: "/patrimonio", futuro: true },
  { id: "ecd_ecf", label: "ECD / ECF", icon: FileSpreadsheet, to: "/ecd-ecf", futuro: true },
  {
    id: "obrigacoes",
    label: "Obrigações Acessórias",
    icon: CalendarCheck,
    to: "/obrigacoes",
    futuro: true,
  },
];
