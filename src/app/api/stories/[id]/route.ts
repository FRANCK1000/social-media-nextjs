// API Route Next.js - Suppression de Story
// DELETE: Supprime une story spécifique après s'être assuré que l'utilisateur connecté en est bien le propriétaire

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
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

    // 2. Récupérer l'ID de la story à supprimer (Next.js 15+)
    const { id } = await params;

    // 3. Trouver la story en base de données
    const story = await db.story.findUnique({
      where: { id },
    });

    if (!story) {
      return NextResponse.json(
        { error: "La story demandée n'existe pas." },
        { status: 404 }
      );
    }

    // 4. Sécurité : Vérifier que l'utilisateur connecté est bien l'auteur de la story
    if (story.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Action non autorisée. Vous pouvez uniquement supprimer vos propres stories." },
        { status: 403 }
      );
    }

    // 5. Supprimer la story de PostgreSQL
    await db.story.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Story supprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur Story DELETE API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la story." },
      { status: 500 }
    );
  }
}
