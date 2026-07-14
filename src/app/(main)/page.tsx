// Page d'Accueil - Flux Principal de Publications (Feed)
// Gère l'affichage des onglets "Pour vous" et "Suivis", l'affichage des posts et l'ajout en direct

"use client";

import React, { useState, useEffect } from "react";
import ComposePost from "@/components/ComposePost";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
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
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedType, setFeedType] = useState<"all" | "following">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les publications selon l'onglet actif
  const fetchPosts = async (type: "all" | "following") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      } else {
        const data = await res.json();
        setError(data.error || t("feed.error_fetch"));
      }
    } catch (err) {
      console.error(err);
      setError(t("feed.error_server"));
    } finally {
      setLoading(false);
    }
  };

  // Effectuer le chargement sur changement d'onglet
  useEffect(() => {
    fetchPosts(feedType);
  }, [feedType]);

  // Ajouter instantanément le post créé en haut du feed
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
              onClick={() => fetchPosts(feedType)}
              className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
            >
              {t("feed.retry") || "Retry"}
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
          </div>
        )}
      </div>
    </div>
  );
}
