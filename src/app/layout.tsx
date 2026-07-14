// Layout Principal Global de l'application Next.js
// Configure la police de caractères globale et injecte le fournisseur d'authentification (AuthProvider)

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

// Charger la police Google Font Plus Jakarta Sans pour un look moderne et technologique
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Aura — Réseau Social Ultramoderne",
  description: "Un réseau social professionnel fluide, esthétique et performant pour 2026.",
  authors: [{ name: "Aura Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} h-full antialiased light`} data-theme="light">
      <body className="min-h-full flex flex-col bg-background-dark text-foreground">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
