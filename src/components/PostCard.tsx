// Composant PostCard - Affichage d'une publication
// Gère l'affichage des informations, les likes optimistes et la copie du lien de partage

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, CornerDownRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PostCardProps {
  post: {
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
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { t } = useLanguage();

  // Gérer le clic sur le Like avec mise à jour optimiste
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading) return;

    // Mise à jour optimiste
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    setLikeLoading(true);

    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!res.ok) {
        // En cas d'échec, annuler la mise à jour optimiste
        setLiked(!newLiked);
        setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error(error);
      // Annuler sur erreur
      setLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  // Copier le lien de partage
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Formater la date en français
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-white/5 space-y-4 transition-all duration-300 animate-fade-in block relative overflow-hidden">
      {/* En-tête : Avatar et Nom de l'auteur */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center space-x-3 hover:opacity-90 cursor-pointer"
        >
          <img
            src={post.author.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author.username}`}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover border border-white/10 bg-neutral-800"
          />
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">{post.author.name}</h4>
            <p className="text-xs text-gray-500">@{post.author.username} • {formatDate(post.createdAt)}</p>
          </div>
        </Link>
      </div>

      {/* Corps : Contenu textuel */}
      <Link href={`/posts/${post.id}`} className="block group cursor-pointer">
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line group-hover:text-white transition-colors">
          {post.content}
        </p>

        {/* Image du post */}
        {post.image && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/5 aspect-video relative max-h-96">
            <img
              src={post.image}
              alt="Illustration du post"
              className="w-full h-full object-cover group-hover:scale-101 transition-all duration-500"
            />
          </div>
        )}
      </Link>

      {/* Pied de carte : Actions de feedback */}
      <div className="flex items-center space-x-6 pt-3 border-t border-white/5">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
            liked
              ? "text-rose-400 bg-rose-500/10"
              : "text-gray-400 hover:text-rose-400 hover:bg-rose-500/5"
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform duration-200 ${liked ? "fill-rose-400 scale-110 animate-pulse" : ""}`} />
          <span>{likesCount}</span>
        </button>

        {/* Commentaire */}
        <Link
          href={`/posts/${post.id}`}
          className="flex items-center space-x-2 text-xs font-semibold py-1.5 px-3 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentsCount}</span>
        </Link>

        {/* Partager */}
        <button
          onClick={handleShare}
          className={`flex items-center space-x-2 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
            shareCopied
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-gray-400 hover:text-primary hover:bg-primary/5"
          }`}
        >
          {shareCopied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>{t("common.copied")}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>{t("common.share")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Icône de validation simple
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
