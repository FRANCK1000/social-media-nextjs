// Page de Recherche / Exploration - Aura
// Spécifiquement conçue pour le Mobile (Bottom Nav) et le Desktop
// Permet de :
// 1. Rechercher des utilisateurs en temps réel (avec affichage de leur présence relative Messenger)
// 2. Afficher les abonnés en ligne (statut vert Messenger)
// 3. Explorer les tendances populaires calculées dynamiquement depuis la base de données

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X, Loader2, Sparkles, Flame, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPresenceStatus } from "@/lib/presence";

interface UserResult {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
  lastActive?: string;
}

interface Trend {
  tag: string;
  posts: string;
}

export default function SearchPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // États de secours / Explore (quand vide)
  const [onlineFollowed, setOnlineFollowed] = useState<UserResult[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  // Charger les données d'exploration (tendances et abonnés)
  const loadExploreData = async () => {
    setLoadingExplore(true);
    try {
      // Charger les abonnés en parallèle pour extraire ceux qui sont en ligne
      const followingRes = await fetch("/api/users/following");
      const trendsRes = await fetch("/api/posts/trends");

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        // Filtrer uniquement les abonnés qui sont en ligne (ou récemment actifs)
        const online = (followingData.following || []).filter(
          (u: UserResult) => u.isOnline
        );
        setOnlineFollowed(online);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData.trends || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données exploration :", error);
    } finally {
      setLoadingExplore(false);
    }
  };

  useEffect(() => {
    loadExploreData();
  }, []);

  // Détection de recherche avec Debounce (300ms)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Clic sur une tendance : redirige vers l'accueil pour filtrer les posts
  const handleTrendClick = (tag: string) => {
    router.push(`/?search=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* En-tête de la page fixe glassmorphic */}
      <header className="glass-header sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <span>{language === "en" ? "Explore & Search" : "Explorer & Rechercher"}</span>
        </h2>
        <Sparkles className="w-5 h-5 text-primary" />
      </header>

      {/* Contenu principal */}
      <div className="p-6 space-y-6 flex-1 max-w-2xl mx-auto w-full text-left">
        {/* 1. Zone de recherche principale */}
        <div className="relative z-10 w-full">
          <SearchIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("rightSidebar.search_placeholder") || "Rechercher un profil..."}
            className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
              title="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Affichage des résultats s'il y a une saisie */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">
              {language === "en" ? "Profiles Found" : "Profils Trouvés"}
            </h3>

            {searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="glass-panel p-8 text-center text-gray-500 rounded-2xl border-white/5 text-sm">
                {t("rightSidebar.no_results") || "Aucun utilisateur trouvé"}
              </div>
            ) : (
              <div className="grid gap-3">
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/profile/${item.username}`}
                    className="flex items-center space-x-4 p-3.5 rounded-2xl glass-panel glass-panel-hover border-white/5 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.username}`}
                        alt={item.name}
                        className="w-11 h-11 rounded-full object-cover border border-white/10 bg-neutral-800"
                      />
                      {item.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background-dark animate-pulse shadow-md shadow-emerald-500/50" />
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-bold text-white truncate leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">@{item.username}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-semibold px-2 py-1 rounded bg-white/5 border border-white/5">
                      {formatPresenceStatus(item.lastActive, item.isOnline, language)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 3. Mode Exploration par défaut (si aucun texte recherché) */
          <div className="space-y-6">
            {/* Sous-section : Amis actuellement en ligne */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">
                {language === "en" ? "Contacts Online" : "Abonnements en ligne"}
              </h3>
              
              {loadingExplore ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : onlineFollowed.length === 0 ? (
                <p className="text-gray-500 text-xs py-2">
                  {language === "en" 
                    ? "None of your following accounts are currently online."
                    : "Aucun abonnement en ligne pour le moment."}
                </p>
              ) : (
                <div className="flex space-x-4 overflow-x-auto py-2 scrollbar-none select-none">
                  {onlineFollowed.map((item) => (
                    <Link
                      key={item.id}
                      href={`/profile/${item.username}`}
                      className="flex flex-col items-center space-y-1.5 shrink-0 hover:opacity-85 transition-opacity"
                    >
                      <div className="relative">
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.username}`}
                          alt={item.name}
                          className="w-12 h-12 rounded-full object-cover border border-primary/20 bg-neutral-800"
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950 [data-theme=light]:border-white animate-pulse" />
                      </div>
                      <span className="text-[10px] font-bold text-white max-w-[65px] truncate">
                        {item.name.split(" ")[0]}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sous-section : Tendances */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">
                {t("rightSidebar.trends_title") || "Tendances pour vous"}
              </h3>
              
              {loadingExplore ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : trends.length === 0 ? (
                <p className="text-gray-500 text-xs">Aucune tendance pour le moment.</p>
              ) : (
                <div className="grid gap-3.5">
                  {trends.map((trend) => (
                    <div
                      key={trend.tag}
                      onClick={() => handleTrendClick(trend.tag)}
                      className="p-4 rounded-2xl glass-panel glass-panel-hover border-white/5 cursor-pointer flex justify-between items-center group"
                    >
                      <div className="text-left">
                        <p className="text-xs text-gray-500">{t("rightSidebar.trends_sub") || "Tendances"}</p>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors mt-0.5">
                          {trend.tag}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">{trend.posts}</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Flame className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
