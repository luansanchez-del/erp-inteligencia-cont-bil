import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { navGroups } from "@/config/navigation";
import { useCan } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const principais = navGroups.filter((g) => !g.futuro);
  const futuros = navGroups.filter((g) => g.futuro);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-3 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary font-semibold text-primary-foreground">
            C
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                ERP Contábil
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Inteligência Contábil
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {principais.map((group) => (
                <NavGroupItem
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  isActive={isActive}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Módulos futuros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {futuros.map((group) => (
                <SidebarMenuItem key={group.id}>
                  <SidebarMenuButton asChild isActive={isActive(group.to!)} tooltip={group.label}>
                    <Link to={group.to!} className="flex items-center gap-2">
                      <group.icon className="size-4 shrink-0" />
                      <span className="truncate">{group.label}</span>
                      {!collapsed && (
                        <span className="ml-auto rounded border px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          em breve
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroupItem({
  group,
  collapsed,
  isActive,
}: {
  group: (typeof navGroups)[number];
  collapsed: boolean;
  isActive: (to: string, exact?: boolean) => boolean;
}) {
  const permitido = useCan(group.id);
  if (!permitido) return null;

  if (!group.items) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive(group.to!, group.exact)}
          tooltip={group.label}
        >
          <Link to={group.to!} className="flex items-center gap-2">
            <group.icon className="size-4 shrink-0" />
            <span className="truncate">{group.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const grupoAtivo = group.items.some((i) => isActive(i.to));

  return (
    <Collapsible defaultOpen={grupoAtivo} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={grupoAtivo && collapsed} tooltip={group.label}>
            <group.icon className="size-4 shrink-0" />
            <span className="truncate">{group.label}</span>
            <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => (
              <SidebarMenuSubItem key={item.to}>
                <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to} className={cn("truncate")}>
                    {item.label}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
