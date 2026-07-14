// API Route Next.js - Suivre / Ne plus suivre
// Gère l'abonnement et le désabonnement entre utilisateurs dans PostgreSQL

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "ID de l'utilisateur cible manquant." },
        { status: 400 }
      );
    }

    // Empêcher de s'abonner à soi-même
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous abonner à vous-même." },
        { status: 400 }
      );
    }

    // 2. Vérifier si la relation de suivi existe déjà
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Si déjà suivi, supprimer la relation (désabonnement)
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });

      return NextResponse.json({ followed: false, message: "Désabonnement réussi." });
    } else {
      // Sinon, créer la relation (abonnement)
      await db.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });

      return NextResponse.json({ followed: true, message: "Abonnement réussi." });
    }
  } catch (error) {
    console.error("Erreur Follow API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'action d'abonnement." },
      { status: 500 }
    );
  }
}
