// Page de Connexion Client - Aura
// Offre une interface utilisateur de niveau supérieur avec split-screen, effets de lumière interactifs (mouse tracking) et design glassmorphic premium

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Zap, Globe } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coordonnées de la souris pour l'aura lumineuse interactive
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-[#030305] select-none text-left">
      
      {/* 1. Aura lumineuse interactive suivant le curseur (desktop uniquement) */}
      <div 
        className="pointer-events-none absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary/15 via-[#a78bfa]/10 to-secondary/5 blur-[120px] -z-10 hidden md:block transition-transform duration-300 ease-out"
        style={{
          left: `${mousePos.x - 300}px`,
          top: `${mousePos.y - 300}px`,
        }}
      />

      {/* Cercles de fond statiques de secours (mobile/tablette) */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] -z-20 md:hidden animate-pulse duration-4000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] -z-20 md:hidden animate-pulse duration-6000"></div>

      {/* Grille de fond subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-30" />

      {/* 2. Panneau de Gauche : Branding Aura (visible uniquement sur grand écran) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-white/5 relative overflow-hidden bg-black/20">
        {/* Lueur d'ambiance violette en haut à gauche */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[130px] -z-10 animate-pulse duration-8000"></div>
        
        {/* Logo Aura */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-wider">AURA</span>
        </div>

        {/* Message principal & Accroche */}
        <div className="space-y-6 max-w-md my-auto z-10 text-left">
          <h2 className="text-4xl xl:text-5xl font-black leading-tight text-white tracking-tight">
            Connectez-vous au réseau de <span className="text-gradient font-extrabold">demain</span>.
          </h2>
          <p className="text-gray-400 text-sm xl:text-base leading-relaxed">
            Partagez vos projets, discutez en temps réel avec des experts, publiez des stories éphémères et découvrez les innovations technologiques majeures.
          </p>

          {/* Avantages clés listés de manière pro */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-primary">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">Expérience en temps réel ultra-fluide</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-primary">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">Sécurité et cryptage des sessions de bout en bout</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-200">Réseau d'experts internationaux connectés</span>
            </div>
          </div>
        </div>

        {/* Pied de page du panneau gauche */}
        <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider z-10">
          Aura Corporation © 2026 — Plateforme social-media pro.
        </div>
      </div>

      {/* 3. Panneau de Droite : Formulaire de connexion */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl shadow-2xl border-white/10 animate-fade-in space-y-8 bg-neutral-950/40 relative">
          
          {/* Logo mobile */}
          <div className="flex lg:hidden justify-center items-center space-x-2 mb-2">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-accent flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-widest">AURA</span>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Connexion</h1>
            <p className="text-sm text-gray-400">Heureux de vous revoir. Saisissez vos identifiants pour continuer.</p>
          </div>

          {/* Message d'erreur personnalisé */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-200 text-sm text-center font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">
                Adresse Email
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/35 border border-white/5 rounded-2xl text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/5 transition-all group-hover:border-white/10"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">
                  Mot de passe
                </label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-black/35 border border-white/5 rounded-2xl text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/5 transition-all group-hover:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton Soumettre */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl text-white font-bold bg-gradient-accent glow-btn shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span className="text-sm uppercase tracking-wider font-extrabold">Chargement...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span className="text-sm uppercase tracking-wider font-extrabold">Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Lien redirection d'inscription */}
          <div className="text-center pt-6 border-t border-white/5">
            <p className="text-sm text-gray-500 leading-normal">
              Nouveau sur Aura ?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-secondary font-bold hover:underline transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
