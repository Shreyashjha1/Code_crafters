import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

export type Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function syncDocumentTheme() {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncDocumentTheme();
  }, []);

  const value = useMemo(
    () => ({
      theme: "light" as const,
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
