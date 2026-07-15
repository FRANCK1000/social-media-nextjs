// Page du Flux d'Accueil - Aura
// Gère le flux global ("Pour vous") et le flux d'abonnements ("Suivis")
// Intègre :
// 1. Un moteur de recherche de publications en temps réel (avec Debounce 300ms)
// 2. Un système de défilement infini (Infinite Scroll) basé sur l'Intersection Observer API et pagination par curseur

"use client";

import React, { useState, useEffect, useRef } from "react";
import ComposePost from "@/components/ComposePost";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import { Loader2, Sparkles, AlertCircle, Search, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Post {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export default function FeedPage() {
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedType, setFeedType] = useState<"all" | "following">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche de posts
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // États pour le scroll infini (Cursor pagination)
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Gestion du Debounce sur la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Charger les publications de la première page
  const fetchPosts = async (type: "all" | "following", search: string) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        type,
        limit: "8",
      });
      if (search.trim()) {
        queryParams.append("search", search);
      }

      const res = await fetch(`/api/posts?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setNextCursor(data.nextCursor);
      } else {
        const data = await res.json();
        setError(data.error || t("feed.error_fetch") || "Impossible de récupérer le flux.");
      }
    } catch (err) {
      console.error(err);
      setError(t("feed.error_server") || "Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Charger les publications suivantes (Infinite Scroll)
  const fetchMorePosts = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const queryParams = new URLSearchParams({
        type: feedType,
        limit: "8",
        cursor: nextCursor,
      });
      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch);
      }

      const res = await fetch(`/api/posts?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error("Erreur lors du scroll infini :", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Déclencher le chargement initial lors de la bascule d'onglet ou de la saisie d'un filtre de recherche
  useEffect(() => {
    fetchPosts(feedType, debouncedSearch);
  }, [feedType, debouncedSearch]);

  // Observer l'élément sentinel en bas de page pour le scroll infini
  useEffect(() => {
    if (!nextCursor || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Déclencher le chargement dès que la sentinelle entre dans la marge de 250px
        if (entries[0].isIntersecting && !loadingMore) {
          fetchMorePosts();
        }
      },
      { rootMargin: "250px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [nextCursor, loadingMore, loading, feedType, debouncedSearch]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* En-tête de la page fixe glassmorphic */}
      <header className="glass-header sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <span>{t("feed.title")}</span>
        </h2>
        <Sparkles className="w-5 h-5 text-primary" />
      </header>

      {/* Zone de contenu défilante */}
      <div className="p-6 space-y-6 flex-1 max-w-2xl mx-auto w-full">
        {/* Barre de Recherche de Posts */}
        <div className="relative z-10 w-full mb-6">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "en" ? "Search posts..." : "Rechercher des publications..."}
            className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
              title="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Barre de Stories */}
        <StoriesBar />

        {/* Éditeur de post rapide */}
        <ComposePost onPostCreated={handlePostCreated} />

        {/* Sélecteur d'onglets (Flux Global vs Abonnements) */}
        <div className="flex border-b border-white/5 pb-2">
          <button
            onClick={() => setFeedType("all")}
            className={`flex-1 text-center py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              feedType === "all"
                ? "border-primary text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {t("feed.tab_all")}
          </button>
          
          <button
            onClick={() => setFeedType("following")}
            className={`flex-1 text-center py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              feedType === "following"
                ? "border-primary text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {t("feed.tab_following")}
          </button>
        </div>

        {/* Liste des publications */}
        {loading ? (
          <div className="space-y-4">
            {/* Squelettes de chargement (Skeletons) */}
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/5"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-white/10 rounded w-1/4"></div>
                    <div className="h-2 bg-white/5 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-white/5 rounded w-full"></div>
                  <div className="h-3 bg-white/5 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 glass-panel rounded-2xl border-white/5">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => fetchPosts(feedType, debouncedSearch)}
              className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
            >
              {t("feed.retry") || "Réessayer"}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <p className="text-gray-500 text-sm">{t("feed.no_posts")}</p>
            {feedType === "following" && (
              <p className="text-gray-600 text-xs">
                {t("feed.empty_following")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Sentinelle d'intersection de scroll infini */}
            {nextCursor && (
              <div ref={sentinelRef} className="py-6 flex justify-center">
                {loadingMore ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
