// API Route Next.js - Nombre de messages non lus
// GET: Retourne le nombre total de messages reçus et non lus (isRead: false) par l'utilisateur connecté

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

    // 2. Compter les messages non lus
    const unreadCount = await db.message.count({
      where: {
        receiverId: currentUser.id,
        isRead: false,
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Erreur Unread Messages Count API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des notifications." },
      { status: 500 }
    );
  }
}
