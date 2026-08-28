import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Permissao } from "@/types/erp";

export interface PerfilAtual {
  nome: string;
  funcaoId: string | null;
  funcaoNome: string | null;
  permissoes: Permissao[];
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  justSignedIn: boolean;
  acknowledgeSignIn: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  perfil: PerfilAtual | null;
  perfilCarregando: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function carregarPerfil(userId: string): Promise<PerfilAtual | null> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, funcao_id")
    .eq("id", userId)
    .maybeSingle();
  if (!perfil) return null;
  if (!perfil.funcao_id) {
    return { nome: perfil.nome, funcaoId: null, funcaoNome: null, permissoes: [] };
  }
  const { data: funcao } = await supabase
    .from("funcoes")
    .select("nome, permissoes")
    .eq("id", perfil.funcao_id)
    .maybeSingle();
  return {
    nome: perfil.nome,
    funcaoId: perfil.funcao_id,
    funcaoNome: funcao?.nome ?? null,
    permissoes: (funcao?.permissoes as unknown as Permissao[] | null) ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Verdadeiro só entre uma chamada de signIn() bem-sucedida e a confirmação
  // da empresa — nunca numa sessão restaurada ao recarregar a página. Não dá
  // pra inferir isso pelo evento do onAuthStateChange: o Supabase também
  // dispara "SIGNED_IN" ao restaurar uma sessão já existente do storage.
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [perfil, setPerfil] = useState<PerfilAtual | null>(null);
  const [perfilCarregando, setPerfilCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: assinatura } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSession(novaSessao);
      setLoading(false);
      if (evento === "SIGNED_OUT") setJustSignedIn(false);
    });
    return () => {
      ativo = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setPerfil(null);
      setPerfilCarregando(false);
      return;
    }
    let ativo = true;
    setPerfilCarregando(true);
    carregarPerfil(userId).then((resultado) => {
      if (!ativo) return;
      setPerfil(resultado);
      setPerfilCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [session?.user.id]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setJustSignedIn(true);
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        justSignedIn,
        acknowledgeSignIn: () => setJustSignedIn(false),
        signIn,
        signOut,
        perfil,
        perfilCarregando,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
