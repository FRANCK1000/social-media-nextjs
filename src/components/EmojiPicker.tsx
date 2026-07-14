// Composant EmojiPicker - Sélecteur d'émojis ultra-premium
// Propose une recherche dynamique, des catégories d'émojis (Populaires, Visages, Tech/Pro)
// S'accorde parfaitement au style sombre et glassmorphic de l'application Aura

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Flame, Smile, Laptop, Heart } from "lucide-react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  id: string;
  icon: React.ReactNode;
  name: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "popular",
    icon: <Flame className="w-3.5 h-3.5" />,
    name: "Populaires",
    emojis: ["🔥", "✨", "💡", "🚀", "💻", "❤️", "😂", "👍", "🙌", "👀", "💯", "🎉"],
  },
  {
    id: "smileys",
    icon: <Smile className="w-3.5 h-3.5" />,
    name: "Visages & Émotions",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "😜",
      "😎", "🤓", "🧐", "😏", "😒", "😔", "🥺", "😢", "😭", "😤",
      "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱", "🤔", "🫣", "🤭"
    ],
  },
  {
    id: "work",
    icon: <Laptop className="w-3.5 h-3.5" />,
    name: "Tech & Professionnel",
    emojis: [
      "💻", "🖥️", "📱", "💾", "🚀", "💡", "🎯", "📈", "🛡️", "🔑",
      "☕", "📅", "📝", "📊", "🎨", "🔬", "⚙️", "🛠️", "💼", "✉️"
    ],
  },
  {
    id: "symbols",
    icon: <Heart className="w-3.5 h-3.5" />,
    name: "Symboles & Gestes",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "🤟", "🤘", "👌",
      "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️",
      "🖖", "👋", "🤙", "💪", "🙏", "👏", "🙌", "✍️", "❤️", "🧡"
    ],
  },
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("popular");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fermer le sélecteur si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Filtrer les émojis en fonction de la recherche
  const getFilteredEmojis = () => {
    if (!search.trim()) {
      return EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || [];
    }

    // Recherche globale de tous les émojis (une recherche simple par correspondance)
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    // Filtrer les doublons
    const uniqueEmojis = Array.from(new Set(allEmojis));
    return uniqueEmojis;
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 left-0 z-[500] w-64 bg-neutral-950/95 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-fade-in flex flex-col space-y-3 text-left"
    >
      {/* Zone de recherche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un émoji..."
          className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/40 transition-colors"
          autoFocus
        />
      </div>

      {/* Barre des catégories (masquée si recherche active) */}
      {!search && (
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Grille d'émojis */}
      <div className="h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {filteredEmojis.length === 0 ? (
          <p className="text-[10px] text-gray-500 text-center py-8">Aucun émoji trouvé</p>
        ) : (
          <div className="grid grid-cols-6 gap-1">
            {filteredEmojis.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  // Optionnel : ne pas fermer pour pouvoir en taper plusieurs d'affilée
                }}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
