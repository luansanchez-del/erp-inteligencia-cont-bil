import { useEffect, useState } from "react";

/**
 * Mantém a tela paginada para desempenho, mas renderiza o conjunto completo
 * imediatamente antes da impressão/PDF do navegador.
 */
export function usePrintMode() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const beforePrint = () => setPrinting(true);
    const afterPrint = () => setPrinting(false);

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const printAll = () => {
    setPrinting(true);
    // Aguarda o React colocar todas as linhas no DOM antes de abrir o diálogo.
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };

  return { printing, printAll };
}
