// Contexte React pour la gestion des langues (localisation i18n) - Aura
// Permet de basculer dynamiquement entre le Français (fr) et l'Anglais (en)
// Sauvegarde les préférences dans le LocalStorage

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Langue par défaut : Français (fr)
  const [language, setLanguageState] = useState<Language>("fr");

  // Charger la langue depuis le localStorage après le montage client
  useEffect(() => {
    const savedLang = localStorage.getItem("aura_language") as Language;
    if (savedLang === "fr" || savedLang === "en") {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("aura_language", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  // Helper de traduction acceptant des chemins à points (ex: "sidebar.home")
  const t = (keyPath: string): string => {
    const keys = keyPath.split(".");
    let result: any = translations[language];
    
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        // En cas de clé manquante, renvoie la clé elle-même
        console.warn(`Translation key missing: "${keyPath}" for language "${language}"`);
        return keyPath;
      }
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage doit être utilisé à l'intérieur d'un LanguageProvider.");
  }
  return context;
}
