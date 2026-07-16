// API Route Next.js - Conversations de Messagerie
// Récupère la liste des utilisateurs avec qui l'utilisateur connecté a échangé des messages, classés par date du dernier message
// Calcule l'état de connexion (isOnline) sur le serveur pour éviter les décalages d'horloge client-serveur

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Trouver tous les messages envoyés ou reçus par l'utilisateur connecté
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true, lastActive: true },
        },
        receiver: {
          select: { id: true, name: true, username: true, avatar: true, lastActive: true },
        },
      },
    });

    // 3. Regrouper par contact unique sur le serveur et calculer l'état en ligne
    const conversationsMap = new Map();
    const now = Date.now();

    messages.forEach((msg) => {
      // Le contact est l'autre personne (pas l'utilisateur connecté)
      const otherUser = msg.senderId === currentUser.id ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(otherUser.id)) {
        const isOnline = (now - new Date(otherUser.lastActive).getTime()) < 15000;
        
        conversationsMap.set(otherUser.id, {
          user: {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            avatar: otherUser.avatar,
            isOnline,
            lastActive: otherUser.lastActive,
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            senderId: msg.senderId,
          },
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Erreur Conversations GET API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des conversations." },
      { status: 500 }
    );
  }
}
