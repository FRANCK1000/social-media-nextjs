// API Route Next.js - Publications (Posts)
// Gère la récupération des flux (Général / Abonnements) et la création de publications avec images

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

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

    // 2. Récupérer le type de flux (all ou following)
    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get("type") || "all";

    let postsWhereClause = {};

    // 3. Filtrer par abonnements si demandé
    if (feedType === "following") {
      const followedRelations = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });
      
      const followedIds = followedRelations.map((rel) => rel.followingId);

      // Inclure uniquement les posts des personnes suivies
      postsWhereClause = {
        authorId: {
          in: followedIds,
        },
      };
    }

    // 4. Récupérer les publications dans PostgreSQL via Prisma
    const posts = await db.post.findMany({
      where: postsWhereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        likes: true,
        comments: {
          select: { id: true }, // Seulement l'id pour compter le nombre de commentaires
        },
      },
    });

    // 5. Formater la réponse pour inclure l'état du "Like" de l'utilisateur actuel
    const formattedPosts = posts.map((post) => {
      const isLiked = post.likes.some((like) => like.userId === currentUser.id);
      
      return {
        id: post.id,
        content: post.content,
        image: post.image,
        createdAt: post.createdAt,
        author: post.author,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked,
      };
    });

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Erreur Récupération Posts API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des publications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Récupérer les données
    const { content, image } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Le contenu de la publication ne peut pas être vide." },
        { status: 400 }
      );
    }

    // 3. Si une image Base64 est fournie, la charger sur Cloudinary
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await uploadImage(image, "aura_posts");
      if (!imageUrl) {
        return NextResponse.json(
          { error: "Impossible de stocker l'image. Veuillez réessayer." },
          { status: 500 }
        );
      }
    }

    // 4. Enregistrer la publication dans PostgreSQL
    const newPost = await db.post.create({
      data: {
        content,
        image: imageUrl,
        authorId: currentUser.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // 5. Retourner l'objet post complet avec des compteurs à zéro
    return NextResponse.json({
      post: {
        id: newPost.id,
        content: newPost.content,
        image: newPost.image,
        createdAt: newPost.createdAt,
        author: newPost.author,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
      },
    });
  } catch (error) {
    console.error("Erreur Création Post API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la publication." },
      { status: 500 }
    );
  }
}
