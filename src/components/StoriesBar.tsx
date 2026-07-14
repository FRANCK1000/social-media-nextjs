// Composant StoriesBar - Barre de Stories horizontale
// Affiche l'option "Ajouter une story" et les stories actives des autres utilisateurs avec effet glassmorphic

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Plus, Loader2 } from "lucide-react";
import StoryViewer from "./StoryViewer";

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

export default function StoriesBar() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [groups, setGroups] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [activeViewerIdx, setActiveViewerIdx] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les stories actives
  const loadStories = async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groupedStories || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stories :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryDeleted = (deletedUserId: string, deletedStoryId: string) => {
    setGroups((prev) => {
      return prev
        .map((group) => {
          if (group.user.id === deletedUserId) {
            return {
              ...group,
              stories: group.stories.filter((s) => s.id !== deletedStoryId),
            };
          }
          return group;
        })
        .filter((group) => group.stories.length > 0);
    });
  };

  useEffect(() => {
    loadStories();
  }, []);

  // Publier une story
  const handlePublishStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image de la story est trop volumineuse (max 5 Mo).");
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result as string }),
        });

        if (res.ok) {
          toast.success("Story publiée avec succès ! Elle sera visible pendant 24h.");
          loadStories(); // Recharger les stories actives
        } else {
          const data = await res.json();
          toast.error(data.error || "Une erreur est survenue.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erreur de communication avec le serveur.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="w-full flex items-center space-x-4 overflow-x-auto pb-3 pt-1 scrollbar-none shrink-0 select-none">
      {/* 1. Bulle de création de Story pour l'utilisateur connecté */}
      <div className="flex flex-col items-center space-y-1.5 shrink-0">
        <div className="relative">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-14 h-14 rounded-full border border-white/10 p-0.5 bg-neutral-800 hover:scale-103 transition-transform cursor-pointer relative overflow-hidden flex items-center justify-center"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                alt="Ma story"
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1 rounded-full bg-gradient-accent text-white border-2 border-background-dark hover:scale-110 transition-transform cursor-pointer"
            title="Créer une story"
          >
            <Plus className="w-3 h-3" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePublishStory}
            accept="image/*"
            className="hidden"
          />
        </div>
        <span className="text-[10px] text-gray-400 font-semibold truncate w-14 text-center">Ma Story</span>
      </div>

      {/* 2. Affichage des bulles de stories actives */}
      {loading ? (
        <div className="flex items-center space-x-4">
          {[1, 2].map((n) => (
            <div key={n} className="flex flex-col items-center space-y-1.5 shrink-0 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/5"></div>
              <div className="h-2 bg-white/5 rounded w-10"></div>
            </div>
          ))}
        </div>
      ) : (
        groups.map((group, index) => (
          <div key={group.user.id} className="flex flex-col items-center space-y-1.5 shrink-0">
            <button
              onClick={() => setActiveViewerIdx(index)}
              className="w-14 h-14 rounded-full p-[2px] bg-gradient-accent hover:scale-103 transition-transform cursor-pointer relative overflow-hidden"
            >
              <div className="w-full h-full rounded-full bg-background-dark p-[2px] overflow-hidden">
                <img
                  src={group.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${group.user.username}`}
                  alt={group.user.name}
                  className="w-full h-full rounded-full object-cover bg-neutral-800"
                />
              </div>
            </button>
            <span className="text-[10px] text-gray-300 font-medium truncate w-14 text-center">
              {group.user.name}
            </span>
          </div>
        ))
      )}

      {/* Lecteur de stories modal */}
      {activeViewerIdx !== null && (
        <StoryViewer
          userStoriesGroups={groups}
          initialUserIndex={activeViewerIdx}
          onClose={() => setActiveViewerIdx(null)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </div>
  );
}
