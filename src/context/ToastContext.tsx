// Contexte React pour le système de notifications (Toasts) personnalisé
// Permet d'afficher de magnifiques messages de succès ou d'erreur animés sans utiliser les alertes navigateur

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Supprimer une notification
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Ajouter une notification
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-suppression après 4 secondes
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}

      {/* Conteneur de Toasts flottant en bas à droite */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in-right ${
              toast.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-200"
                : toast.type === "error"
                ? "bg-red-950/80 border-red-500/20 text-red-200"
                : "bg-indigo-950/80 border-indigo-500/20 text-indigo-200"
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
              <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all ml-4 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook d'utilisation des Toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider.");
  }
  return context;
}
