// API Route Next.js - Liste des Abonnements
// GET: Retourne les profils des utilisateurs que l'utilisateur connecté suit déjà, avec statut de présence calculé sur le serveur

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Vérifier l'authentification
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Trouver tous les abonnements de l'utilisateur connecté
    const followedRelations = await db.follow.findMany({
      where: { followerId: currentUser.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            lastActive: true,
          },
        },
      },
    });

    // 3. Formater les utilisateurs et calculer la présence
    const now = Date.now();
    const followingUsers = followedRelations.map((rel) => {
      const u = rel.following;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        isOnline: (now - new Date(u.lastActive).getTime()) < 15000,
        lastActive: u.lastActive,
      };
    });

    return NextResponse.json({ following: followingUsers });
  } catch (error) {
    console.error("Erreur GET API Abonnements :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des abonnements." },
      { status: 500 }
    );
  }
}
