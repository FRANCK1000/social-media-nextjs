// Page de Messagerie Directe - Aura
// Gère l'affichage des discussions, l'envoi de messages, le polling périodique pour simuler le temps réel
// Supporte les redirections avec paramètres d'URL (?username=...) pour démarrer des discussions directement depuis les profils
// Entièrement responsive sur mobile (affichage alternatif de la liste des contacts et de la fenêtre de chat active)

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare, Loader2, Sparkles, Smile, ArrowLeft, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  lastActive?: string | null;
}

interface Conversation {
  user: Contact;
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string;
  isRead?: boolean;
}

function MessagesContent() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const targetUsername = searchParams.get("username");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const isUserOnline = (lastActiveStr: string | null | undefined) => {
    if (!lastActiveStr) return false;
    const lastActive = new Date(lastActiveStr);
    const diff = (new Date().getTime() - lastActive.getTime()) / 1000;
    return diff < 15; // 15 secondes
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Erreur récupération conversations :", error);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // Charger les messages de la conversation active
  const fetchMessages = async (contactId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Erreur récupération messages :", error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Démarrer une conversation si un pseudo est passé en paramètre URL
  useEffect(() => {
    if (!targetUsername) return;

    const startConversationWithUser = async () => {
      try {
        const res = await fetch(`/api/users/${targetUsername}`);
        if (res.ok) {
          const data = await res.json();
          const target = {
            id: data.profile.id,
            name: data.profile.name,
            username: data.profile.username,
            avatar: data.profile.avatar,
          };
          
          setActiveContact(target);

          // Ajouter de manière optimiste à la liste des conversations
          setConversations((prev) => {
            const exists = prev.some((c) => c.user.id === target.id);
            if (exists) return prev;
            return [
              {
                user: target,
                lastMessage: {
                  content: "Nouvelle discussion lancée...",
                  createdAt: new Date().toISOString(),
                  isRead: true,
                  senderId: "",
                },
              },
              ...prev,
            ];
          });
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisation de la conversation :", err);
      }
    };

    startConversationWithUser();
  }, [targetUsername]);

  // Charger les conversations au montage
  useEffect(() => {
    fetchConversations();

    // Polling des conversations toutes les 8 secondes
    const convInterval = setInterval(() => {
      fetchConversations(true);
    }, 8000);

    return () => clearInterval(convInterval);
  }, []);

  // Polling des messages toutes les 3 secondes pour la discussion active
  useEffect(() => {
    if (!activeContact) return;

    fetchMessages(activeContact.id);

    const msgInterval = setInterval(() => {
      fetchMessages(activeContact.id, true);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeContact]);

  // Faire défiler vers le bas lors de la réception d'un message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    const contentToSend = newMessage;
    setNewMessage("");
    setSending(true);
    setShowEmojiPicker(false);

    // Ajout optimiste dans la liste locale des messages
    const optimisticMessage: Message = {
      id: Math.random().toString(),
      content: contentToSend,
      createdAt: new Date().toISOString(),
      senderId: currentUser?.id || "",
      receiverId: activeContact.id,
      isRead: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/messages/${activeContact.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      });

      if (res.ok) {
        fetchConversations(true); // Mettre à jour la liste des contacts à gauche
      } else {
        // Retrait optimiste en cas d'échec
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        setNewMessage(contentToSend);
        toast.error("Impossible d'envoyer le message.");
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(contentToSend);
      toast.error("Erreur de connexion.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark w-full">
      {/* 1. Panneau de Gauche : Liste des Conversations */}
      {/* Sur mobile, on le masque si un contact actif est sélectionné pour donner toute la place au chat */}
      <div 
        className={`w-full md:w-80 flex flex-col border-r border-white/5 h-full shrink-0 bg-[#070709]/40 ${
          activeContact ? "hidden md:flex" : "flex"
        }`}
      >
        <header className="glass-header px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Messages</span>
          </h2>
          <Sparkles className="w-5 h-5 text-primary" />
        </header>

        {/* Liste des discussions scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingConversations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-gray-600" />
              <p className="text-gray-500 text-xs leading-normal">
                Aucune conversation en cours. Allez sur le profil d'un membre pour lui envoyer un message privé.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeContact?.id === conv.user.id;
              const hasUnread = !conv.lastMessage.isRead && conv.lastMessage.senderId !== currentUser?.id;
              
              return (
                <button
                  key={conv.user.id}
                  onClick={() => {
                    setActiveContact(conv.user);
                    setMessages([]); // Réinitialisation des messages
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer text-left relative ${
                    isActive
                      ? "bg-gradient-accent text-white shadow-lg shadow-primary/10"
                      : "hover:bg-white/5 text-gray-300"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.user.username}`}
                      alt={conv.user.name}
                      className="w-10 h-10 rounded-full border border-white/10 object-cover bg-neutral-800"
                    />
                    {isUserOnline(conv.user.lastActive) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background-dark animate-pulse shadow-md shadow-emerald-500/50"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate text-white">
                        {conv.user.name}
                      </p>
                      <span className="text-[9px] text-gray-500 shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isActive ? "text-white/80" : "text-gray-400"} ${hasUnread ? "font-black text-white" : ""}`}>
                      {conv.lastMessage.content}
                    </p>
                  </div>

                  {/* Pastille de non-lu */}
                  {hasUnread && !isActive && (
                    <div className="absolute right-3 bottom-4 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Panneau de Droite : Fenêtre de Chat */}
      {/* Sur mobile, on l'affiche si un contact est sélectionné, sinon on le masque */}
      <div 
        className={`flex-1 flex flex-col h-full bg-[#030305]/20 ${
          activeContact ? "flex" : "hidden md:flex"
        }`}
      >
        {activeContact ? (
          <>
            {/* Header Chat */}
            <header className="glass-header px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                {/* Bouton retour sur mobile uniquement */}
                <button
                  onClick={() => setActiveContact(null)}
                  className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  title="Retour aux discussions"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <Link
                  href={`/profile/${activeContact.username}`}
                  className="flex items-center space-x-3 hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={activeContact.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeContact.username}`}
                      alt={activeContact.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 bg-neutral-800"
                    />
                    {isUserOnline(activeContact.lastActive) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background-dark animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white leading-tight flex items-center space-x-1.5">
                      <span>{activeContact.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-semibold flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline(activeContact.lastActive) ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
                      <span>{isUserOnline(activeContact.lastActive) ? "En ligne" : "Hors ligne"}</span>
                    </p>
                  </div>
                </Link>
              </div>
            </header>

            {/* Zone d'affichage des messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser?.id;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-left ${
                          isOwn
                            ? "bg-gradient-accent text-white rounded-tr-none shadow-md shadow-primary/10"
                            : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-end space-x-1.5 mt-1 opacity-70">
                          <span className="text-[8px] text-right block">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOwn && (
                            msg.isRead ? (
                              <span title="Lu"><CheckCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" /></span>
                            ) : (
                              <span title="Délivré"><Check className="w-3.5 h-3.5 text-white/50 shrink-0" /></span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone d'envoi de message */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-white/5 bg-black/20 flex items-center space-x-3 shrink-0"
            >
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
                />
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`absolute right-3.5 p-1 text-gray-400 hover:text-primary rounded-lg transition-colors cursor-pointer ${
                    showEmojiPicker ? "text-primary bg-white/5" : ""
                  }`}
                  title="Ajouter un émoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-14 right-0 z-50">
                    <EmojiPicker
                      onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-3 bg-gradient-accent rounded-xl text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-xl shadow-primary/15 animate-bounce">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Vos messages privés</h3>
              <p className="text-gray-500 text-xs mt-1 max-w-xs leading-normal">
                Sélectionnez une discussion existante à gauche pour commencer à discuter.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import EmojiPicker from "@/components/EmojiPicker";

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
