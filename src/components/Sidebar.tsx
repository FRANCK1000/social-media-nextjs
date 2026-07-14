// Composant Sidebar - Navigation Latérale & Responsive
// Affiche :
// - Sur Desktop (md+) : Une barre latérale gauche complète fixe
// - Sur Mobile (<md) : Un bandeau supérieur fixe et une barre de navigation inférieure fluide (Bottom Nav Bar)
// Intègre le choix dynamique de la langue (Français/Anglais) avec l'icône Globe

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Home, MessageSquare, User, LogOut, Sparkles, Palette, Globe } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger le nombre de messages non lus
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/messages/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages non lus :", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Polling toutes les 8 secondes pour rafraîchir le badge
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 8000);

    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { name: t("sidebar.home"), href: "/", icon: Home, key: "Messages" },
    { name: t("sidebar.messages"), href: "/messages", icon: MessageSquare, key: "Messages" },
    { name: t("sidebar.profile"), href: user ? `/profile/${user.username}` : "#", icon: User, key: "Profil" },
  ];

  return (
    <>
      {/* 1. LAYOUT DESKTOP (Affiché uniquement sur écrans moyens et grands) */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 p-4 border-r border-white/5 bg-black/20 justify-between select-none">
        <div className="space-y-8">
          {/* Logo Aura */}
          <div className="flex items-center space-x-2 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-wider">Aura</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              const isMessages = item.href === "/messages";
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? "bg-gradient-accent text-white shadow-lg shadow-primary/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="hidden md:inline">{item.name}</span>
                  
                  {/* Compteur numérique sur desktop */}
                  {isMessages && unreadCount > 0 && (
                    <span className="hidden md:flex ml-auto bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-md shadow-primary/20">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profil en bas */}
        {user && (
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer overflow-hidden"
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-white/10 object-cover bg-neutral-800"
              />
              <div className="hidden md:block overflow-hidden text-left">
                <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </Link>

            <div className="flex items-center space-x-0.5 shrink-0">
              {/* Bouton de basculement de langue (i18n) */}
              <button
                onClick={() => {
                  toggleLanguage();
                  toast.success(language === "fr" ? "Language set to English !" : "Langue configurée en Français !");
                }}
                title={t("sidebar.lang_switch")}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer relative"
              >
                <Globe className="w-4.5 h-4.5" />
                <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-black uppercase text-primary bg-primary/10 px-0.5 rounded border border-primary/20 scale-90">
                  {language}
                </span>
              </button>

              {/* Bouton de basculement de thème */}
              <button
                onClick={() => {
                  toggleTheme();
                  toast.success(theme === "dark" ? t("sidebar.theme_light") : t("sidebar.theme_dark"));
                }}
                title={theme === "dark" ? t("sidebar.theme_light") : t("sidebar.theme_dark")}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer"
              >
                <Palette className="w-4.5 h-4.5" />
              </button>

              {/* Bouton déconnexion */}
              <button
                onClick={logout}
                title={t("sidebar.logout")}
                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* 2. HEADER MOBILE (Affiché uniquement en haut sur mobile) */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 h-14 bg-neutral-950/80 [data-theme=light]:bg-white/80 border-b border-white/5 [data-theme=light]:border-black/5 backdrop-blur-md z-50 justify-between items-center px-4 select-none">
        {/* Logo Aura */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-7.5 h-7.5 rounded-lg bg-gradient-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black text-white [data-theme=light]:text-slate-900 tracking-wider">Aura</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-0.5">
          {/* Globe Switcher */}
          <button
            onClick={() => {
              toggleLanguage();
              toast.success(language === "fr" ? "Language set to English !" : "Langue configurée en Français !");
            }}
            title={t("sidebar.lang_switch")}
            className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer relative"
          >
            <Globe className="w-4.5 h-4.5" />
            <span className="absolute bottom-1 right-1 text-[7px] font-black uppercase text-primary bg-primary/10 px-0.5 rounded border border-primary/20 scale-90">
              {language}
            </span>
          </button>

          {/* Palette Switcher */}
          <button
            onClick={() => {
              toggleTheme();
              toast.success(theme === "dark" ? t("sidebar.theme_light") : t("sidebar.theme_dark"));
            }}
            title={theme === "dark" ? t("sidebar.theme_light") : t("sidebar.theme_dark")}
            className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer"
          >
            <Palette className="w-4.5 h-4.5" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title={t("sidebar.logout")}
            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION BAR MOBILE (Affiché uniquement en bas sur mobile) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950/80 [data-theme=light]:bg-white/80 border-t border-white/5 [data-theme=light]:border-black/5 backdrop-blur-md z-50 justify-around items-center px-4 select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const isMessages = item.href === "/messages";
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? "text-primary font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              {/* Badge de messages non lus mobile */}
              {isMessages && unreadCount > 0 && (
                <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
