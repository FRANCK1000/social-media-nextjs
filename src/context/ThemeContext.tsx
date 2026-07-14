// Contexte React pour la gestion des thèmes graphiques - Aura
// Version sécurisée contre les erreurs d'hydratation Next.js
// Synchronise le data-theme de l'élément HTML ainsi que les classes .light / .dark. Par défaut : Thème Clair.

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // L'état initial doit obligatoirement être identique au serveur ("light" par défaut désormais)
  const [theme, setThemeState] = useState<Theme>("light");

  // Charger le thème depuis localStorage après le montage (côté client uniquement)
  useEffect(() => {
    const savedTheme = localStorage.getItem("aura_theme") as Theme;
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("light");
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    // 1. Définir l'attribut data-theme sur l'élément HTML
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // 2. Définir les classes globales pour une compatibilité d'override maximale
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("aura_theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider.");
  }
  return context;
}
