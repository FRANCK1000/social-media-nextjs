// Layout Principal - Aura
// Structure la grille de l'application en 3 colonnes responsive (Sidebar Gauche, Contenu Central, Sidebar Droite)

import React from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row min-h-screen relative">
      {/* Colonne Gauche - Navigation latérale */}
      <Sidebar />

      {/* Colonne Centrale - Contenu principal fluide */}
      <main className="flex-1 border-r border-white/5 min-h-screen bg-black/5 pt-14 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>

      {/* Colonne Droite - Tendances et suggestions */}
      <RightSidebar />
    </div>
  );
}
