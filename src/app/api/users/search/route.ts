// API Route Next.js - Recherche d'utilisateurs
// GET: Filtre les utilisateurs dans la base de données selon une chaîne de recherche case-insensitive
// Calcule l'état de connexion (isOnline) sur le serveur pour éviter les décalages d'horloge client-serveur

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Récupérer le paramètre de recherche
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const now = Date.now();

    if (!query.trim()) {
      // Si la requête est vide, renvoyer les utilisateurs (sauf l'utilisateur connecté)
      const allUsers = await db.user.findMany({
        where: {
          NOT: {
            id: currentUser.id,
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          lastActive: true,
        },
        take: 8,
      });
      
      const formattedUsers = allUsers.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        isOnline: (now - new Date(user.lastActive).getTime()) < 15000,
      }));

      return NextResponse.json({ users: formattedUsers });
    }

    // 3. Rechercher les utilisateurs par nom ou pseudo (exclure l'utilisateur connecté)
    const matchedUsers = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
        NOT: {
          id: currentUser.id,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        lastActive: true,
      },
      take: 5, // Limiter à 5 résultats pour l'affichage du menu volant (dropdown)
    });

    const formattedMatchedUsers = matchedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isOnline: (now - new Date(user.lastActive).getTime()) < 15000,
    }));

    return NextResponse.json({ users: formattedMatchedUsers });
  } catch (error) {
    console.error("Erreur Search API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la recherche." },
      { status: 500 }
    );
  }
}
