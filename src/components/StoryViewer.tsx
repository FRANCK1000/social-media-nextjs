// Composant StoryViewer - Visionneuse de stories plein écran
// Intègre la suppression sécurisée des stories par l'auteur avec une boîte de confirmation intégrée à l'interface

"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface Story {
  id: string;
  mediaUrl: string;
  createdAt: string;
}

interface UserStories {
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  stories: Story[];
}

interface StoryViewerProps {
  userStoriesGroups: UserStories[];
  initialUserIndex: number;
  onClose: () => void;
  onStoryDeleted: (userId: string, storyId: string) => void;
}

export default function StoryViewer({
  userStoriesGroups,
  initialUserIndex,
  onClose,
  onStoryDeleted,
}: StoryViewerProps) {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // États de suppression
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeGroup = userStoriesGroups[userIndex];
  const activeStory = activeGroup?.stories[storyIndex];
  const storiesCount = activeGroup?.stories.length || 0;

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Déterminer si la story active appartient à l'utilisateur connecté
  const isOwnStory = currentUser && activeGroup && currentUser.id === activeGroup.user.id;

  // Réinitialiser la story et la progression si on change d'utilisateur
  useEffect(() => {
    setStoryIndex(0);
    setProgress(0);
    setShowConfirm(false);
  }, [userIndex]);

  // Gérer la progression de la story courante (5 secondes)
  useEffect(() => {
    if (!activeStory || isPaused || showConfirm) return;

    setProgress(0);
    const duration = 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [storyIndex, userIndex, isPaused, showConfirm]);

  // Passer à la story suivante
  const handleNext = () => {
    if (storyIndex < storiesCount - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (userIndex < userStoriesGroups.length - 1) {
      setUserIndex((prev) => prev + 1);
    } else {
      onClose(); // Fermer si c'était la dernière story de la liste
    }
  };

  // Revenir à la story précédente
  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (userIndex > 0) {
      setUserIndex((prev) => prev - 1);
      const prevGroup = userStoriesGroups[userIndex - 1];
      setTimeout(() => {
        setStoryIndex(prevGroup.stories.length - 1);
      }, 50);
    } else {
      setProgress(0);
    }
  };

  // Gérer l'action de suppression
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeStory || deleting) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/stories/${activeStory.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Story supprimée avec succès.");
        
        // Notifier le parent pour mettre à jour la barre de Stories
        onStoryDeleted(activeGroup.user.id, activeStory.id);

        // Gérer la transition après suppression
        if (storiesCount > 1) {
          // S'il reste des stories chez cet utilisateur, reculer d'index ou rester à 0
          setStoryIndex((prev) => (prev > 0 ? prev - 1 : 0));
          setProgress(0);
          setShowConfirm(false);
        } else {
          // Si c'était l'unique story de l'utilisateur
          if (userStoriesGroups.length > 1) {
            // Passer à l'utilisateur suivant/précédent
            setUserIndex((prev) => (prev > 0 ? prev - 1 : 0));
          } else {
            onClose(); // Fermer la visionneuse s'il n'y a plus aucune story globale
          }
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la suppression.");
        setShowConfirm(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur serveur.");
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleMouseDown = () => {
    if (!showConfirm) setIsPaused(true);
  };
  const handleMouseUp = () => {
    if (!showConfirm) setIsPaused(false);
  };

  if (!activeGroup || !activeStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      {/* Container Principal */}
      <div 
        className="relative w-full max-w-lg h-full md:h-[95vh] md:rounded-2xl overflow-hidden flex flex-col justify-between bg-zinc-950"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Barre de progression segmentée */}
        <div className="absolute top-3 left-3 right-3 z-30 flex space-x-1.5 px-1">
          {activeGroup.stories.map((_, idx) => {
            let width = "0%";
            if (idx < storyIndex) width = "100%";
            else if (idx === storyIndex) width = `${progress}%`;

            return (
              <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear" 
                  style={{ width, transitionDuration: "50ms" }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* En-tête : Infos utilisateur, Bouton Supprimer et Fermeture */}
        <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-3 pointer-events-auto">
            <img
              src={activeGroup.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeGroup.user.username}`}
              alt={activeGroup.user.name}
              className="w-9 h-9 rounded-full border border-white/25 object-cover bg-neutral-800"
            />
            <div className="text-left">
              <p className="text-xs font-black text-white">{activeGroup.user.name}</p>
              <p className="text-[9px] text-white/60">@{activeGroup.user.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Bouton de suppression visible uniquement pour sa propre story */}
            {isOwnStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                  setIsPaused(true);
                }}
                className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-red-400 hover:bg-black/60 transition-colors cursor-pointer"
                title="Supprimer la story"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Média principal */}
        <div className="flex-1 flex items-center justify-center relative w-full h-full">
          <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
          <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

          <img
            src={activeStory.mediaUrl}
            alt="Story content"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Fenêtre de confirmation de suppression intégrée à l'UI (Glassmorphic Overlay) */}
          {showConfirm && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-6 pointer-events-auto animate-fade-in">
              <div className="glass-panel p-6 rounded-2xl max-w-xs w-full text-center space-y-5 border-white/10 shadow-2xl">
                <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Supprimer la story ?</h4>
                  <p className="text-[11px] text-gray-400">Cette action est irréversible. Votre story ne sera plus visible.</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    disabled={deleting}
                    onClick={() => {
                      setShowConfirm(false);
                      setIsPaused(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-300 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={deleting}
                    onClick={handleDelete}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-red-600/15 cursor-pointer"
                  >
                    {deleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Supprimer</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Boutons Desktop */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hidden md:block cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hidden md:block cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
