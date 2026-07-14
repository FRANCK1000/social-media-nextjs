// API Route Next.js - Suggestions d'Abonnement
// Retourne des utilisateurs à suivre, en excluant l'utilisateur connecté et ceux qu'il suit déjà
// Calcule l'état de connexion (isOnline) sur le serveur pour éviter les décalages d'horloge client-serveur

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 1. Récupérer la liste des IDs des utilisateurs que l'utilisateur suit déjà
    const followedRelations = await db.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    });
    
    const followedIds = followedRelations.map((rel) => rel.followingId);

    // 2. Trouver 4 utilisateurs qui ne sont ni l'utilisateur connecté, ni déjà suivis
    const suggestions = await db.user.findMany({
      where: {
        AND: [
          { id: { not: currentUser.id } },
          { id: { notIn: followedIds } },
        ],
      },
      take: 4,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        lastActive: true,
      },
    });

    // 3. Formater les suggestions avec isOnline calculé sur le serveur
    const now = Date.now();
    const formattedSuggestions = suggestions.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isOnline: (now - new Date(user.lastActive).getTime()) < 15000,
    }));

    return NextResponse.json({ suggestions: formattedSuggestions });
  } catch (error) {
    console.error("Erreur Suggestions API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des suggestions." },
      { status: 500 }
    );
  }
}
