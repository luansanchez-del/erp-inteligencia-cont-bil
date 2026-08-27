import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AppMenuBar, AppStatusBar } from "@/components/app-menu-bar";
import { PageShell } from "@/components/page-header";
import {
  BalanceteJulhoAjustavel,
  DiarioJulhoAjustavel,
  LancamentosJulhoAjustavel,
  RazaoJulhoAjustavel,
} from "@/components/nitaplast/contabil-julho-ajustavel";
import { DreJulhoCompleta } from "@/components/nitaplast/dre-julho-completa";
import { ErpProvider, useErp } from "@/context/erp-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ERP Contábil — Inteligência Contábil" },
      {
        name: "description",
        content:
          "Plataforma contábil própria: empresas, escrituração, importações, integrações e relatórios.",
      },
      { property: "og:title", content: "ERP Contábil — Inteligência Contábil" },
      {
        property: "og:description",
        content: "Plataforma contábil própria para escrituração, relatórios e integrações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('erp-tema')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErpProvider>
          <AuthenticatedApp />
        </ErpProvider>
      </AuthProvider>
      <div className="print:hidden">
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

function AuthSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <img src="/branding/group-legacy-icon.png" alt="" className="size-8 animate-pulse opacity-70" />
    </div>
  );
}

function AuthenticatedApp() {
  const { session, loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") {
      router.navigate({ to: "/login" });
    } else if (session && pathname === "/login") {
      router.navigate({ to: "/" });
    }
  }, [loading, session, pathname, router]);

  if (pathname === "/login") return <Outlet />;
  if (loading || !session) return <AuthSplash />;
  return <ErpApplication />;
}

function ConteudoCompetencia() {
  const { competencia } = useErp();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (competencia.id === "2026-07") {
    if (pathname === "/contabil/razao" || pathname === "/relatorios/razao") {
      return <PageShell><RazaoJulhoAjustavel /></PageShell>;
    }
    if (pathname === "/contabil/balancete") {
      return <PageShell><BalanceteJulhoAjustavel /></PageShell>;
    }
    if (pathname === "/contabil/diario" || pathname === "/relatorios/diario") {
      return <PageShell><DiarioJulhoAjustavel /></PageShell>;
    }
    if (pathname === "/contabil/lancamentos") {
      return <PageShell><LancamentosJulhoAjustavel /></PageShell>;
    }
    if (pathname === "/contabil/dre" || pathname === "/relatorios/dre") {
      return <PageShell><DreJulhoCompleta /></PageShell>;
    }
  }

  return <Outlet />;
}

function ErpApplication() {
  const { empresa, competencia } = useErp();
  const renderKey = `${empresa.id}:${competencia.id}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background print:block print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <AppMenuBar />
      </div>
      <main key={renderKey} className="min-w-0 flex-1 print:w-full print:min-w-0">
        {/* Ao trocar empresa/competência, remonta a visão. Julho usa sua própria camada contábil ajustável; junho permanece congelado nas rotas existentes. */}
        <ConteudoCompetencia />
      </main>
      <div className="print:hidden">
        <AppStatusBar />
      </div>
    </div>
  );
}
