// Page de Profil - Aura
// Permet d'afficher les informations d'un utilisateur, ses posts, de s'abonner et de modifier son profil

"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import PostCard from "@/components/PostCard";
import { 
  Calendar, Users, Edit3, Camera, X, Loader2, AlertCircle, Sparkles, UserCheck, UserPlus, MessageSquare
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

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

interface ProfileData {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  posts: Post[];
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser, refreshUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  // États pour l'édition de profil
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Charger le profil
  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        // Initialiser les champs d'édition
        setEditName(data.profile.name);
        setEditBio(data.profile.bio || "");
        setEditAvatar(data.profile.avatar);
        setEditCover(data.profile.cover);
      } else {
        const data = await res.json();
        setError(data.error || "Impossible de charger le profil.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // S'abonner / Se désabonner
  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);

    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isFollowing: data.followed,
            followersCount: data.followed ? prev.followersCount + 1 : prev.followersCount - 1,
          };
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Convertir et lire un fichier image en Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "avatar") setEditAvatar(reader.result as string);
      if (type === "cover") setEditCover(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Soumettre l'édition de profil
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);

    try {
      const res = await fetch("/api/users/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          avatar: editAvatar,
          cover: editCover,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditOpen(false);
        toast.success("Profil mis à jour !");
        await refreshUser(); // Actualiser la session globale du client
        fetchProfile(); // Recharger les infos locales du profil
      } else {
        toast.error(data.error || "Erreur de mise à jour.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Formater la date d'inscription
  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {loading ? (
        <div className="flex justify-center py-12 flex-1 items-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error || !profile ? (
        <div className="p-6">
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 glass-panel rounded-2xl border-white/5">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-400 text-sm">{error || "Profil introuvable."}</p>
            <Link
              href="/"
              className="px-4 py-2 bg-gradient-accent rounded-xl text-xs font-bold text-white shadow-md shadow-primary/10 cursor-pointer"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 pb-12">
          {/* Photo de Couverture */}
          <div className="h-48 md:h-64 w-full bg-neutral-900 relative overflow-hidden">
            <img
              src={profile.cover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80"}
              alt="Photo de couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Profil Infos Container */}
          <div className="px-6 relative -mt-16 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
              {/* Photo de Profil */}
              <div className="relative">
                <img
                  src={profile.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`}
                  alt={profile.name}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-background-dark object-cover bg-neutral-800"
                />
              </div>

              {/* Boutons d'Action (Abonner ou Éditer) */}
              <div>
                {profile.isOwnProfile ? (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier le profil</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                        profile.isFollowing
                          ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30"
                          : "bg-gradient-accent glow-btn shadow-primary/20"
                      }`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profile.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Abonné</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Suivre</span>
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`/messages?username=${profile.username}`}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Infos textuelles */}
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-2xl font-black text-white">{profile.name}</h3>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-300 max-w-lg leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              {/* Stats & Dates */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-400 pt-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {formatJoinDate(profile.createdAt)}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-white">{profile.followingCount}</span>
                    <span className="text-gray-500">abonnements</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-white">{profile.followersCount}</span>
                    <span className="text-gray-500">abonnés</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onglet Publications */}
          <div className="border-t border-white/5 pt-6 px-6 max-w-2xl mx-auto w-full">
            <h3 className="font-extrabold text-white text-base mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Publications ({profile.posts.length})</span>
            </h3>

            {profile.posts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">
                Aucune publication rédigée par cet utilisateur.
              </p>
            ) : (
              <div className="space-y-4">
                {profile.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'Édition du Profil */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border-white/10 animate-fade-in space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Modifier le profil</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Édition Couverture */}
              <div className="relative h-32 rounded-xl bg-neutral-800 overflow-hidden border border-white/5">
                <img
                  src={editCover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80"}
                  alt="Aperçu couverture"
                  className="w-full h-full object-cover opacity-60"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
                  title="Changer la couverture"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={(e) => handleFileChange(e, "cover")}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Édition Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-neutral-800">
                  <img
                    src={editAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.username}`}
                    alt="Aperçu avatar"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
                    title="Changer la photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={(e) => handleFileChange(e, "avatar")}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Photo de profil</p>
                  <p className="text-[10px] text-gray-500">Sélectionnez une image carrée de max 5 Mo</p>
                </div>
              </div>

              {/* Édition Nom */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              {/* Édition Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Biographie
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 resize-none transition-all"
                />
              </div>

              {/* Bouton de sauvegarde */}
              <button
                type="submit"
                disabled={editSubmitting}
                className="w-full py-3 rounded-xl text-white font-bold bg-gradient-accent glow-btn shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <span>Enregistrer les modifications</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
