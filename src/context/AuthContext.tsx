// Contexte React d'Authentification Client
// Fournit l'état de l'utilisateur connecté, les fonctions de connexion et déconnexion à toute l'application
// Intègre un tracker d'activité utilisateur en temps réel pour maintenir le statut "En Ligne" de manière performante

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Interface représentant l'utilisateur connecté
interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  createdAt: string;
}

// Interface du contexte d'authentification
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fonction pour actualiser ou récupérer l'utilisateur connecté
  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la session :", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger la session à l'initialisation du composant
  useEffect(() => {
    refreshUser();
  }, []);

  // Rediriger vers /login si la session est introuvable ou a été supprimée
  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        if (pathname !== "/login" && pathname !== "/register") {
          router.push("/login");
        }
      }
    }
  }, [loading, user, router]);

  // Suivi d'activité client en temps réel pour le statut En Ligne
  // Envoie des pings réguliers à /api/users/ping uniquement si l'utilisateur interagit avec l'app
  useEffect(() => {
    if (!user) return;

    let isActive = true; // Par défaut actif au montage de la session

    // Callback pour enregistrer l'activité de l'utilisateur
    const handleActivity = () => {
      isActive = true;
    };

    // Écouter les interactions clés de la page
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Premier ping immédiat lors de la connexion
    fetch("/api/users/ping", { method: "POST" }).catch(() => {});

    // Définir un intervalle régulier de ping (toutes les 10 secondes)
    const pingInterval = setInterval(async () => {
      // Uniquement si l'utilisateur a interagi avec la page depuis le dernier ping
      if (isActive) {
        try {
          await fetch("/api/users/ping", { method: "POST" });
          isActive = false; // Réinitialiser le flag d'activité après envoi
        } catch (error) {
          console.warn("Échec du ping de présence :", error);
        }
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [user]);

  // Action de Connexion
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Une erreur est survenue lors de la connexion." };
      }
      setUser(data.user);
      router.push("/");
      router.refresh();
      return {};
    } catch (error) {
      return { error: "Impossible de se connecter au serveur." };
    }
  };

  // Action d'Inscription
  const register = async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Une erreur est survenue lors de l'inscription." };
      }
      setUser(data.user);
      router.push("/");
      router.refresh();
      return {};
    } catch (error) {
      return { error: "Impossible de se connecter au serveur." };
    }
  };

  // Action de Déconnexion
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser l'authentification dans les composants enfants
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }
  return context;
}
