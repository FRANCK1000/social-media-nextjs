// Composant PostCard - Affichage d'une publication
// Gère l'affichage des informations, les likes optimistes, l'édition en ligne du texte du post,
// la suppression du post par l'auteur et la copie du lien de partage.

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, MoreHorizontal, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

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
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // États pour l'édition et suppression
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Gérer le clic sur le Like avec mise à jour optimiste
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading) return;

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
        setLiked(!newLiked);
        setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error(error);
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

  // Éditer le texte de la publication
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) {
      toast.error("Le texte du post ne peut pas être vide.");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, image: post.image }),
      });

      if (res.ok) {
        post.content = editContent; // Mettre à jour l'instance locale
        setIsEditing(false);
        toast.success("Publication modifiée !");
      } else {
        const data = await res.json();
        toast.error(data.error || "Impossible de modifier la publication.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion.");
    } finally {
      setEditLoading(false);
    }
  };

  // Supprimer la publication
  const handleDeletePost = async () => {
    const isConfirm = window.confirm("Voulez-vous vraiment supprimer cette publication ?");
    if (!isConfirm) return;

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Publication supprimée !");
        setIsDeleted(true); // Supprime visuellement la carte du DOM
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/posts/")) {
          window.location.href = "/";
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Impossible de supprimer la publication.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
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

  // Si le post a été supprimé, on ne rend plus rien
  if (isDeleted) return null;

  return (
    <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-white/5 space-y-4 transition-all duration-300 animate-fade-in block relative overflow-hidden">
      
      {/* En-tête : Avatar, Nom de l'auteur et Menu Actions */}
      <div className="flex items-center justify-between relative">
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
            <h4 className="text-[15px] md:text-sm font-bold text-white leading-tight">{post.author.name}</h4>
            <p className="text-[13px] md:text-xs text-gray-500">@{post.author.username} • {formatDate(post.createdAt)}</p>
          </div>
        </Link>

        {/* Menu contextuel pour l'auteur du post */}
        {user && user.id === post.author.id && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                {/* Overlay invisible pour capter les clics à l'extérieur du menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                
                <div className="absolute right-0 mt-1 w-36 glass-panel border border-white/10 rounded-xl shadow-xl z-20 py-1 bg-neutral-950/90 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePost();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Corps : Contenu textuel (avec mode modification inline) */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[15px] md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/30 transition-all resize-none h-24"
            required
            autoFocus
          />
          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </button>
            
            <button
              type="submit"
              disabled={editLoading || !editContent.trim()}
              className="px-3 py-1.5 rounded-lg bg-gradient-accent text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <Link href={`/posts/${post.id}`} className="block group cursor-pointer">
          <p className="text-[15px] md:text-sm text-gray-200 leading-relaxed whitespace-pre-line group-hover:text-white transition-colors">
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
      )}

      {/* Pied de carte : Actions de feedback */}
      <div className="flex items-center space-x-6 pt-3 border-t border-white/5">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 text-[13px] md:text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
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
          className="flex items-center space-x-2 text-[13px] md:text-xs font-semibold py-1.5 px-3 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentsCount}</span>
        </Link>

        {/* Partager */}
        <button
          onClick={handleShare}
          className={`flex items-center space-x-2 text-[13px] md:text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
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
