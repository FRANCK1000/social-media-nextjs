// API Route Next.js - Tendances Populaires (Trends)
// GET: Analyse les dernières publications pour en extraire les hashtags (#) les plus utilisés
// Renvoie les tendances calculées dynamiquement pour le RightSidebar

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

    // 2. Récupérer les 200 dernières publications en base de données
    const recentPosts = await db.post.findMany({
      take: 200,
      select: { content: true },
      orderBy: { createdAt: "desc" },
    });

    const hashtagCounts: { [key: string]: number } = {};

    // 3. Extraire et compter les hashtags (#mot)
    recentPosts.forEach((post) => {
      const hashtags = post.content.match(/#[a-zA-Z0-9_]+/g);
      if (hashtags) {
        hashtags.forEach((tag) => {
          const normalized = tag.trim();
          hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
        });
      }
    });

    // 4. Trier les hashtags par nombre d'occurrences décroissant
    const sortedTrends = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({
        tag,
        postsCount: count,
      }))
      .sort((a, b) => b.postsCount - a.postsCount)
      .slice(0, 4);

    // 5. Tendances par défaut (fallbacks) si la base contient peu ou pas de hashtags
    const fallbackTrends = [
      { tag: "#NextJS16", postsCount: 14 },
      { tag: "#React19", postsCount: 11 },
      { tag: "#TailwindV4", postsCount: 7 },
      { tag: "#Prisma7", postsCount: 4 },
    ];

    // Compléter la liste pour avoir toujours 4 tendances
    const finalTrends = [...sortedTrends];
    fallbackTrends.forEach((fallback) => {
      if (
        finalTrends.length < 4 && 
        !finalTrends.some((t) => t.tag.toLowerCase() === fallback.tag.toLowerCase())
      ) {
        finalTrends.push(fallback);
      }
    });

    // 6. Formater le texte du nombre de publications (ex: "3 publications")
    const formattedTrends = finalTrends.map((trend) => ({
      tag: trend.tag,
      posts: `${trend.postsCount} ${trend.postsCount > 1 ? "publications" : "publication"}`,
    }));

    return NextResponse.json({ trends: formattedTrends });
  } catch (error) {
    console.error("Erreur Récupération Trends API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du calcul des tendances." },
      { status: 500 }
    );
  }
}
