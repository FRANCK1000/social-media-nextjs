// Page de Détail d'une Publication - Aura
// Affiche une publication spécifique et gère les fils de discussion de commentaires imbriqués (réponses aux commentaires)
// Utilise les notifications Toasts personnalisées pour les retours utilisateurs

"use client";

import React, { useState, useEffect, use } from "react";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, MessageSquare, Send, Loader2, AlertCircle, CornerDownRight, Smile } from "lucide-react";
import EmojiPicker from "@/components/EmojiPicker";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

interface PostDetail {
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
  comments: Comment[];
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const toast = useToast();
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gestion des réponses aux commentaires
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showRootEmojiPicker, setShowRootEmojiPicker] = useState(false);
  const [replyEmojiPickerId, setReplyEmojiPickerId] = useState<string | null>(null);

  // Charger le détail du post et de ses commentaires
  const fetchPostDetail = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        const data = await res.json();
        setError(data.error || "Impossible de récupérer les détails de la publication.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  // Publier un commentaire principal (racine)
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setSubmittingComment(true);

    try {
      const res = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, content: newComment }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewComment("");
        toast.success("Commentaire publié !");
        
        // Ajouter à l'état local
        setPost((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [...prev.comments, data.comment],
          };
        });
      } else {
        toast.error(data.error || "Erreur de publication du commentaire.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Publier une réponse à un commentaire
  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !post) return;

    setSubmittingReply(true);

    try {
      const res = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, content: replyContent, parentId }),
      });

      const data = await res.json();

      if (res.ok) {
        setReplyContent("");
        setReplyingToId(null);
        toast.success("Réponse publiée !");

        // Ajouter à l'état local
        setPost((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [...prev.comments, data.comment],
          };
        });
      } else {
        toast.error(data.error || "Erreur de publication de la réponse.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion.");
    } finally {
      setSubmittingReply(false);
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

  // Séparer les commentaires racines des réponses
  const rootComments = post ? post.comments.filter((c) => !c.parentId) : [];
  const getReplies = (commentId: string) => post ? post.comments.filter((c) => c.parentId === commentId) : [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* En-tête avec bouton retour */}
      <header className="glass-header sticky top-0 z-10 px-6 py-4 flex items-center space-x-4">
        <Link
          href="/"
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Publication
        </h2>
      </header>

      {/* Contenu principal */}
      <div className="p-6 space-y-6 flex-1 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error || !post ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 glass-panel rounded-2xl border-white/5">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-400 text-sm">{error || "Publication introuvable."}</p>
            <Link
              href="/"
              className="px-4 py-2 bg-gradient-accent rounded-xl text-xs font-bold text-white shadow-md shadow-primary/10 cursor-pointer"
            >
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Le Post d'origine */}
            <PostCard post={post} />

            {/* Section Commentaires */}
            <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-6">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Discussion ({post.commentsCount})</span>
              </h3>

              {/* Formulaire de rédaction de commentaire racine */}
              {user && (
                <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-800"
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-4 pr-20 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                    />
                    
                    <div className="absolute right-1.5 top-1.5 flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowRootEmojiPicker((prev) => !prev)}
                        className={`p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors cursor-pointer ${
                          showRootEmojiPicker ? "text-primary bg-white/5" : ""
                        }`}
                        title="Ajouter un émoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="p-1.5 bg-gradient-accent rounded-lg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {showRootEmojiPicker && (
                      <div className="absolute bottom-12 right-0 z-50">
                        <EmojiPicker
                          onSelect={(emoji) => {
                            setNewComment((prev) => prev + emoji);
                          }}
                          onClose={() => setShowRootEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Liste des commentaires racines */}
              <div className="space-y-6 pt-2">
                {rootComments.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">
                    Soyez le premier à commenter cette publication !
                  </p>
                ) : (
                  <div className="space-y-6">
                    {rootComments.map((comment) => {
                      const replies = getReplies(comment.id);
                      const isReplying = replyingToId === comment.id;

                      return (
                        <div key={comment.id} className="space-y-4 text-left">
                          {/* Commentaire Racine */}
                          <div className="flex items-start space-x-3">
                            <Link href={`/profile/${comment.user.username}`}>
                              <img
                                src={comment.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.user.username}`}
                                alt={comment.user.name}
                                className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-800 cursor-pointer"
                              />
                            </Link>
                            
                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative">
                              <div className="flex items-center justify-between mb-1">
                                <Link
                                  href={`/profile/${comment.user.username}`}
                                  className="text-xs font-bold text-white hover:text-primary transition-colors cursor-pointer"
                                >
                                  {comment.user.name}{" "}
                                  <span className="text-[10px] font-normal text-gray-500">
                                    @{comment.user.username}
                                  </span>
                                </Link>
                                <span className="text-[9px] text-gray-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mb-3">
                                {comment.content}
                              </p>

                              {/* Action Répondre */}
                              {user && (
                                <button
                                  onClick={() => {
                                    setReplyingToId(isReplying ? null : comment.id);
                                    setReplyContent("");
                                  }}
                                  className="text-[10px] font-bold text-primary hover:text-secondary hover:underline cursor-pointer"
                                >
                                  Répondre
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Formulaire de réponse imbriqué */}
                          {isReplying && user && (
                            <form
                              onSubmit={(e) => handleReplySubmit(e, comment.id)}
                              className="ml-12 flex items-start space-x-3 animate-fade-in"
                            >
                              <img
                                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                                alt={user.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/10 bg-neutral-800"
                              />
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`Répondre à @${comment.user.username}...`}
                                  className="w-full bg-black/40 border border-white/5 rounded-xl pl-4 pr-20 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                                  autoFocus
                                />
                                
                                <div className="absolute right-1.5 top-1.5 flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setReplyEmojiPickerId(replyEmojiPickerId === comment.id ? null : comment.id)}
                                    className={`p-1 text-gray-400 hover:text-primary rounded-lg transition-colors cursor-pointer ${
                                      replyEmojiPickerId === comment.id ? "text-primary bg-white/5" : ""
                                    }`}
                                    title="Ajouter un émoji"
                                  >
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="submit"
                                    disabled={submittingReply || !replyContent.trim()}
                                    className="p-1 bg-gradient-accent rounded-lg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                  >
                                    {submittingReply ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {replyEmojiPickerId === comment.id && (
                                  <div className="absolute bottom-10 right-0 z-50">
                                    <EmojiPicker
                                      onSelect={(emoji) => {
                                        setReplyContent((prev) => prev + emoji);
                                      }}
                                      onClose={() => setReplyEmojiPickerId(null)}
                                    />
                                  </div>
                                )}
                              </div>
                            </form>
                          )}

                          {/* Liste des réponses (Replies) */}
                          {replies.length > 0 && (
                            <div className="ml-12 space-y-3 border-l-2 border-white/5 pl-4">
                              {replies.map((reply) => (
                                <div key={reply.id} className="flex items-start space-x-2">
                                  <CornerDownRight className="w-4 h-4 text-gray-600 shrink-0 mt-2.5" />
                                  
                                  <Link href={`/profile/${reply.user.username}`}>
                                    <img
                                      src={reply.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${reply.user.username}`}
                                      alt={reply.user.name}
                                      className="w-7.5 h-7.5 rounded-full object-cover border border-white/10 bg-neutral-800 cursor-pointer mt-1"
                                    />
                                  </Link>

                                  <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-2xl p-3.5">
                                    <div className="flex items-center justify-between mb-1">
                                      <Link
                                        href={`/profile/${reply.user.username}`}
                                        className="text-xs font-bold text-white hover:text-primary transition-colors cursor-pointer"
                                      >
                                        {reply.user.name}{" "}
                                        <span className="text-[9px] font-normal text-gray-500">
                                          @{reply.user.username}
                                        </span>
                                      </Link>
                                      <span className="text-[8px] text-gray-500">
                                        {formatDate(reply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
