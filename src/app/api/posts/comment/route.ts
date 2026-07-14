// API Route Next.js - Commenter une publication (Comment / Reply)
// Gère la création de commentaires et de réponses imbriquées sur les posts

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

    const { postId, content, parentId } = await request.json();

    if (!postId || !content) {
      return NextResponse.json(
        { error: "L'identifiant du post (postId) et le contenu (content) sont obligatoires." },
        { status: 400 }
      );
    }

    // 2. Vérifier si le post existe
    const postExists = await db.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      return NextResponse.json(
        { error: "La publication cible n'existe pas." },
        { status: 404 }
      );
    }

    // 3. Créer le commentaire dans PostgreSQL
    const comment = await db.comment.create({
      data: {
        content,
        postId,
        userId: currentUser.id,
        parentId: parentId || null,
      },
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
    });

    return NextResponse.json({
      message: "Commentaire publié avec succès.",
      comment,
    });
  } catch (error) {
    console.error("Erreur Comment API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la publication du commentaire." },
      { status: 500 }
    );
  }
}
