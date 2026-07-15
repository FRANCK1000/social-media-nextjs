// Composant Sidebar - Navigation Latérale & Responsive
// Affiche :
// - Sur Desktop (md+) : Une barre latérale gauche complète fixe
// - Sur Mobile (<md) : Un bandeau supérieur fixe et une barre de navigation inférieure fluide (Bottom Nav Bar)
// Design haut de gamme avec flous glassmorphes, capsules actives lumineuses, ombres portées et boutons flottants

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
    { name: t("sidebar.home"), href: "/", icon: Home },
    { name: t("sidebar.messages"), href: "/messages", icon: MessageSquare },
    { name: t("sidebar.profile"), href: user ? `/profile/${user.username}` : "#", icon: User },
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
            <span className="text-2xl font-black text-white [data-theme=light]:text-slate-900 tracking-wider">Aura</span>
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
                      : "text-gray-400 [data-theme=light]:text-slate-500 hover:text-white [data-theme=light]:hover:text-slate-900 hover:bg-white/5 [data-theme=light]:hover:bg-slate-100"
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
              className="flex items-center space-x-3 hover:opacity-85 transition-opacity cursor-pointer overflow-hidden"
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                alt={user.name}
                className="w-10 h-10 rounded-full border border-white/10 object-cover bg-neutral-800"
              />
              <div className="hidden md:block overflow-hidden text-left">
                <p className="text-sm font-bold text-white [data-theme=light]:text-slate-900 truncate leading-tight">{user.name}</p>
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
                className="p-2 rounded-xl text-gray-400 [data-theme=light]:text-slate-500 hover:text-primary [data-theme=light]:hover:text-primary hover:bg-white/5 [data-theme=light]:hover:bg-slate-100 transition-all cursor-pointer relative"
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
                className="p-2 rounded-xl text-gray-400 [data-theme=light]:text-slate-500 hover:text-primary [data-theme=light]:hover:text-primary hover:bg-white/5 [data-theme=light]:hover:bg-slate-100 transition-all cursor-pointer"
              >
                <Palette className="w-4.5 h-4.5" />
              </button>

              {/* Bouton déconnexion */}
              <button
                onClick={logout}
                title={t("sidebar.logout")}
                className="p-2 rounded-xl text-gray-400 [data-theme=light]:text-slate-500 hover:text-red-400 [data-theme=light]:hover:text-red-500 hover:bg-red-500/10 [data-theme=light]:hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* 2. HEADER MOBILE (Affiché uniquement en haut sur mobile) */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 h-[60px] bg-neutral-950/75 [data-theme=light]:bg-white/75 border-b border-white/5 [data-theme=light]:border-slate-100 backdrop-blur-lg z-50 justify-between items-center px-4 select-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.4)]">
        {/* Logo Aura */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent tracking-wider">Aura</span>
        </Link>

        {/* Action Buttons - Boutons flottants circulaires */}
        <div className="flex items-center space-x-1">
          {/* Globe Switcher */}
          <button
            onClick={() => {
              toggleLanguage();
              toast.success(language === "fr" ? "Language set to English !" : "Langue configurée en Français !");
            }}
            title={t("sidebar.lang_switch")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 [data-theme=light]:text-slate-600 hover:text-primary [data-theme=light]:hover:text-primary hover:bg-white/5 [data-theme=light]:hover:bg-slate-100 border border-transparent hover:border-white/5 [data-theme=light]:hover:border-slate-200 transition-all duration-300 cursor-pointer relative"
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
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 [data-theme=light]:text-slate-600 hover:text-primary [data-theme=light]:hover:text-primary hover:bg-white/5 [data-theme=light]:hover:bg-slate-100 border border-transparent hover:border-white/5 [data-theme=light]:hover:border-slate-200 transition-all duration-300 cursor-pointer"
          >
            <Palette className="w-4.5 h-4.5" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            title={t("sidebar.logout")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 [data-theme=light]:text-slate-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 [data-theme=light]:hover:border-red-500/10 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION BAR MOBILE (Affiché uniquement en bas sur mobile) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-neutral-950/75 [data-theme=light]:bg-white/75 border-t border-white/5 [data-theme=light]:border-slate-100 backdrop-blur-lg z-50 justify-around items-center px-4 select-none shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const isMessages = item.href === "/messages";
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 py-1 relative cursor-pointer"
            >
              <div className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center relative ${
                isActive
                  ? "bg-primary/10 text-primary scale-110 shadow-sm"
                  : "text-slate-500 [data-theme=light]:text-slate-500 hover:text-white [data-theme=light]:hover:text-slate-900 hover:bg-white/5 [data-theme=light]:hover:bg-slate-100"
              }`}>
                <Icon className="w-5.5 h-5.5 stroke-[2]" />
                
                {/* Badge de messages non lus mobile pulsant sur l'icône */}
                {isMessages && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-neutral-950 [data-theme=light]:border-white animate-pulse" />
                )}
              </div>
              <span className={`text-[9px] mt-1 transition-all duration-300 tracking-wide ${
                isActive
                  ? "text-primary font-black scale-105"
                  : "text-slate-500 [data-theme=light]:text-slate-400 font-medium"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
