// Composant ComposePost - Éditeur de publications
// Gère la rédaction d'un post, l'ajout d'une image avec prévisualisation (encodée en Base64) et la soumission

"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Image, Smile, Send, X, Loader2 } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

interface ComposePostProps {
  onPostCreated?: (newPost: any) => void;
}

export default function ComposePost({ onPostCreated }: ComposePostProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Gérer la sélection de l'image et sa conversion en Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Déclencher le clic sur le file input masqué
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Supprimer l'image sélectionnée
  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Soumettre la publication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image }),
      });

      const data = await res.json();

      if (res.ok) {
        setContent("");
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast.success("Publication mise en ligne !");
        // Notifier le composant parent du nouveau post
        if (onPostCreated) {
          onPostCreated(data.post);
        }
      } else {
        toast.error(data.error || "Une erreur est survenue lors de la publication.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border-white/5 space-y-4 mb-6">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
          alt={user.name}
          className="w-11 h-11 rounded-full object-cover border border-white/10 bg-neutral-800"
        />

        {/* Zone de texte */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("feed.compose_placeholder")}
            rows={3}
            className="w-full bg-transparent border-0 text-white placeholder-gray-500 resize-none text-base focus:outline-none focus:ring-0 p-1"
          />

          {/* Prévisualisation de l'image sélectionnée */}
          {image && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-white/5 group aspect-video">
              <img
                src={image}
                alt="Aperçu du chargement"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-red-400 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center space-x-2">
          {/* Input d'image masqué */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={triggerFileInput}
            className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer"
            title="Ajouter une image"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              className={`p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer ${
                showEmojiPicker ? "text-primary bg-white/5" : ""
              }`}
              title="Ajouter un émoji"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => setContent((prev) => prev + emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Bouton Publier */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !image)}
          className="px-5 py-2.5 rounded-xl text-white font-bold bg-gradient-accent glow-btn shadow-lg shadow-primary/10 flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("feed.button_publishing")}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t("feed.button_publish")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
