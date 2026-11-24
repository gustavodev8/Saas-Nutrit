import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("nutrit-theme") as Theme | null;
      if (stored === "dark" || stored === "light") return stored;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // Persiste a preferência, mas NÃO aplica a classe aqui — a aplicação do
    // tema é escopada por rota em <ThemeScopeSync/> (dark só no workspace).
    try { localStorage.setItem("nutrit-theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Aplica a classe `dark` no <html> APENAS nas rotas do workspace.
 * O site público (/, /consultas, landing SaaS, etc.) fica sempre claro,
 * independente do prefers-color-scheme do visitante. Deve ser renderizado
 * dentro do <BrowserRouter>.
 */
export function ThemeScopeSync() {
  const { theme } = useTheme();
  const { pathname } = useLocation();

  useEffect(() => {
    const isWorkspace = pathname.startsWith("/workspace");
    const root = document.documentElement;
    if (isWorkspace && theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, pathname]);

  return null;
}
