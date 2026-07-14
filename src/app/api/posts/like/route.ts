// API Route Next.js - Aimer une publication (Like / Unlike)
// Gère l'ajout et le retrait de likes sur les posts

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

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "L'identifiant de la publication (postId) est obligatoire." },
        { status: 400 }
      );
    }

    // 2. Vérifier si le post existe
    const postExists = await db.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      return NextResponse.json(
        { error: "La publication demandée n'existe pas." },
        { status: 404 }
      );
    }

    // 3. Vérifier si l'utilisateur a déjà aimé ce post
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUser.id,
          postId,
        },
      },
    });

    if (existingLike) {
      // Si déjà aimé, supprimer le like
      await db.like.delete({
        where: {
          userId_postId: {
            userId: currentUser.id,
            postId,
          },
        },
      });

      return NextResponse.json({ liked: false, message: "Like retiré." });
    } else {
      // Sinon, ajouter le like
      await db.like.create({
        data: {
          userId: currentUser.id,
          postId,
        },
      });

      return NextResponse.json({ liked: true, message: "Publication aimée." });
    }
  } catch (error) {
    console.error("Erreur Like API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'action de like." },
      { status: 500 }
    );
  }
}
