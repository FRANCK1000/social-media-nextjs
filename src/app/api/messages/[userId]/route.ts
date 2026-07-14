// API Route Next.js - Messages d'une Conversation
// GET: Récupère les messages d'un fil de discussion et marque les messages entrants comme lus
// POST: Envoie un nouveau message privé à un utilisateur ciblé

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // 2. Récupérer tous les messages échangés entre les deux utilisateurs
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: userId },
          { senderId: userId, receiverId: currentUser.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Mettre à jour tous les messages non lus reçus comme lus (isRead: true)
    await db.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erreur Messages GET API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des messages." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Le contenu du message ne peut pas être vide." },
        { status: 400 }
      );
    }

    // 2. Enregistrer le message dans PostgreSQL
    const message = await db.message.create({
      data: {
        content,
        senderId: currentUser.id,
        receiverId: userId,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Erreur Envoi Message API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi du message." },
      { status: 500 }
    );
  }
}
