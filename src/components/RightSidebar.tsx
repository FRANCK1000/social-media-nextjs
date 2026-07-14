// Composant RightSidebar - Barre latérale droite
// Contient :
// 1. Barre de recherche universelle avec focus interactif sur clic de tendances
// 2. Section "Mes abonnements" (les profils suivis) avec option de désabonnement instantané
// 3. Tendances fonctionnelles et cliquables qui déclenchent automatiquement la recherche globale

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Flame, Loader2, Check, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FollowedUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
}

export default function RightSidebar() {
  const { t } = useLanguage();
  const [followingUsers, setFollowingUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // États de recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Charger les utilisateurs suivis (Mes abonnements)
  const fetchFollowingUsers = async () => {
    try {
      const res = await fetch("/api/users/following");
      if (res.ok) {
        const data = await res.json();
        setFollowingUsers(data.following || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des abonnements :", error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les abonnements au montage et rafraîchir toutes les 15s pour le statut en ligne
  useEffect(() => {
    fetchFollowingUsers();

    const interval = setInterval(() => {
      fetchFollowingUsers();
    }, 15000);

    return () => clearInterval(interval);
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

  // Fermer le dropdown de recherche si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Gérer l'action de désabonnement
  const handleUnfollow = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        // Retirer de la liste locale immédiatement
        setFollowingUsers((prev) => prev.filter((item) => item.id !== userId));
      }
    } catch (error) {
      console.error("Erreur désabonnement :", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Déclencher la recherche globale sur clic de tendance
  const handleTrendClick = (tag: string) => {
    setSearchQuery(tag);
    setShowDropdown(true);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const trends = [
    { tag: "#NextJS16", posts: "12.4K posts" },
    { tag: "#React19", posts: "8.2K posts" },
    { tag: "#TailwindV4", posts: "5.1K posts" },
    { tag: "#Prisma7", posts: "3.9K posts" },
  ];

  return (
    <aside className="w-80 hidden lg:flex flex-col h-screen sticky top-0 p-4 space-y-6 overflow-y-auto border-l border-white/5 bg-black/10 select-none">
      {/* 1. Zone de recherche */}
      <div ref={searchRef} className="relative z-30">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={t("rightSidebar.search_placeholder")}
          className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-all"
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

        {/* Dropdown volant de résultats de recherche */}
        {showDropdown && (
          <div className="absolute top-12 left-0 right-0 bg-neutral-950/95 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-fade-in flex flex-col space-y-2 text-left max-h-72 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-[10px] text-gray-500 text-center py-4">
                {searchLoading ? t("rightSidebar.searching") : t("rightSidebar.no_results")}
              </p>
            ) : (
              searchResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.username}`}
                  onClick={() => {
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img
                      src={item.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.username}`}
                      alt={item.name}
                      className="w-8.5 h-8.5 rounded-full object-cover border border-white/10 bg-neutral-800"
                    />
                    {item.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-background-dark animate-pulse shadow-md shadow-emerald-500/50" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">@{item.username}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Section Abonnements (Remplace les suggestions) */}
      <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
        <h3 className="font-extrabold text-white text-base">{t("rightSidebar.following_title")}</h3>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : followingUsers.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-2">{t("rightSidebar.no_following")}</p>
        ) : (
          <div className="space-y-4">
            {followingUsers.map((item) => {
              const isActionLoading = actionLoadingId === item.id;

              return (
                <div key={item.id} className="flex items-center justify-between">
                  <Link
                    href={`/profile/${item.username}`}
                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity overflow-hidden cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.username}`}
                        alt={item.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-800"
                      />
                      {item.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background-dark animate-pulse shadow-md shadow-emerald-500/50" />
                      )}
                    </div>
                    <div className="overflow-hidden text-left">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">@{item.username}</p>
                    </div>
                  </Link>

                  {/* Bouton de désabonnement avec effet Hover rouge */}
                  <button
                    disabled={isActionLoading}
                    onClick={() => handleUnfollow(item.id)}
                    title={t("rightSidebar.unfollow")}
                    className="p-1.5 rounded-lg flex items-center justify-center transition-all bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Section Tendances interactives */}
      <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4">
        <h3 className="font-extrabold text-white text-base">{t("rightSidebar.trends_title")}</h3>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div
              key={trend.tag}
              onClick={() => handleTrendClick(trend.tag)}
              className="group cursor-pointer text-left"
            >
              <p className="text-xs text-gray-500">{t("rightSidebar.trends_sub")}</p>
              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                {trend.tag}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{trend.posts}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
