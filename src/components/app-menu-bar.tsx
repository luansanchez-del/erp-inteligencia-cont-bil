import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  BookOpen,
  CalendarCheck,
  Scale,
  FileText,
  PieChart,
  GitCompare,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { navGroups, type NavGroup } from "@/config/navigation";
import { useCan, useFuncaoAtual } from "@/lib/permissions";
import { useErp } from "@/context/erp-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_fechamento: "Em fechamento",
  fechada: "Fechada",
};

function useThemeToggle() {
  const [dark, setDark] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("erp-tema", dark ? "dark" : "light");
    } catch {
      /* ignora */
    }
  }, [dark, pronto]);

  return { dark, alternar: () => setDark((d) => !d) };
}

const atalhosToolbar: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Lançamentos", to: "/contabil/lancamentos", icon: BookOpen },
  { label: "Fechamento", to: "/contabil/fechamento", icon: CalendarCheck },
  { label: "Balancete", to: "/contabil/balancete", icon: Scale },
  { label: "Razão", to: "/contabil/razao", icon: FileText },
  { label: "DRE", to: "/contabil/dre", icon: PieChart },
  { label: "Conciliação", to: "/contabil/conciliacao", icon: GitCompare },
  { label: "Importações", to: "/importacoes", icon: Upload },
];

function isRotaAtiva(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

function MenuGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const permitido = useCan(group.id);
  if (!permitido) return null;

  const itemClasses =
    "rounded px-2.5 py-1 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground";

  if (!group.items) {
    return (
      <Link
        to={group.to!}
        className={cn(itemClasses, isRotaAtiva(pathname, group.to!, group.exact) && "bg-accent text-accent-foreground")}
      >
        {group.label}
      </Link>
    );
  }

  const grupoAtivo = group.items.some((item) => isRotaAtiva(pathname, item.to));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(itemClasses, grupoAtivo && "text-primary")}>
        {group.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {group.items.map((item) => (
          <DropdownMenuItem
            key={item.to}
            asChild
            className={cn(isRotaAtiva(pathname, item.to) && "bg-accent text-accent-foreground")}
          >
            <Link to={item.to}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuFuturos({ futuros }: { futuros: NavGroup[] }) {
  if (futuros.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded px-2.5 py-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
        Módulos Futuros
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {futuros.map((group) => (
          <DropdownMenuItem key={group.id} asChild>
            <Link to={group.to!} className="flex items-center justify-between gap-2">
              <span>{group.label}</span>
              <span className="rounded border px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                em breve
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppMenuBar() {
  const { empresa, empresas, competencia, competencias, setEmpresaId, setCompetenciaId } = useErp();
  const { user, signOut } = useAuth();
  const { dark, alternar: alternarTema } = useThemeToggle();
  const funcao = useFuncaoAtual();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const principais = navGroups.filter((g) => !g.futuro);
  const futuros = navGroups.filter((g) => g.futuro);

  return (
    <header className="sticky top-0 z-30 border-b bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-1.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/branding/group-legacy-icon.png"
            alt="Group Legacy"
            className="size-7 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-tight">
            ERP Contábil <span className="font-normal text-muted-foreground">— Inteligência Contábil</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wide">{funcao}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {empresa.nomeFantasia} · {empresa.codigo}
            </p>
          </div>
          <button
            type="button"
            onClick={alternarTema}
            aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="grid size-8 shrink-0 place-items-center rounded-full bg-muted outline-none transition-colors hover:bg-accent data-[state=open]:bg-accent">
              <User className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {user?.email ?? "—"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-0.5 px-2 py-1">
        {principais.map((group) => (
          <MenuGroup key={group.id} group={group} pathname={pathname} />
        ))}
        <MenuFuturos futuros={futuros} />
      </nav>

      <div className="flex flex-wrap items-center gap-1 border-t bg-muted/20 px-2 py-1.5">
        <TooltipProvider delayDuration={200}>
          {atalhosToolbar.map((atalho) => (
            <Tooltip key={atalho.to}>
              <TooltipTrigger asChild>
                <Link
                  to={atalho.to}
                  aria-label={atalho.label}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-accent-foreground",
                    isRotaAtiva(pathname, atalho.to) && "border-border bg-accent text-accent-foreground",
                  )}
                >
                  <atalho.icon className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>{atalho.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative hidden min-w-0 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa, conta, lançamento…"
              className="h-9 w-[220px] pl-9"
              aria-label="Busca global"
            />
          </div>
          <Select value={empresa.id} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-9 w-[128px] sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.codigo} — {e.nomeFantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <select
            value={competencia.id}
            onChange={(event) => setCompetenciaId(event.target.value)}
            aria-label="Selecionar competência"
            className="h-9 w-[112px] cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {competencias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

export function AppStatusBar() {
  const { empresa, competencia } = useErp();

  return (
    <footer className="sticky bottom-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t bg-muted/40 px-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-xs font-medium">{empresa.razaoSocial}</span>
        <Badge variant="outline" className="hidden shrink-0 text-[10px] uppercase sm:inline-flex">
          {empresa.tipo === "matriz" ? "Matriz" : "Filial"}
        </Badge>
        <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
          {empresa.cnpj}
        </span>
        <span className="hidden truncate text-xs text-muted-foreground md:inline">
          {empresa.municipio ? `${empresa.municipio}/${empresa.uf}` : empresa.uf}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          Competência {competencia.label}
        </span>
        <Badge variant={competencia.status === "aberta" ? "secondary" : "outline"}>
          {statusLabel[competencia.status]}
        </Badge>
      </div>
    </footer>
  );
}
