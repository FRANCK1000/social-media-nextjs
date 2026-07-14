// API Route Next.js - Détail d'une Publication
// Récupère les données d'un post spécifique avec ses commentaires et son état actuel de like

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // 2. Awaiter les paramètres de route (nouveauté Next.js 15+)
    const { id } = await params;

    // 3. Récupérer le post et ses relations dans PostgreSQL via Prisma
    const post = await db.post.findUnique({
      where: { id },
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
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "La publication demandée n'existe pas." },
        { status: 404 }
      );
    }

    // 4. Formater la publication
    const isLiked = post.likes.some((like) => like.userId === currentUser.id);
    const formattedPost = {
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      author: post.author,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLiked,
      comments: post.comments,
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Erreur Post Detail API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement de la publication." },
      { status: 500 }
    );
  }
}
