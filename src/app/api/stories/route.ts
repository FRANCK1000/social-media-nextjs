// API Route Next.js - Stories
// GET: Récupère les stories actives (non expirées) regroupées par utilisateur
// POST: Publie une nouvelle story avec une durée de validité de 24 heures

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

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

    const now = new Date();

    // 2. Récupérer toutes les stories non expirées, classées par date de création
    const activeStories = await db.story.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "asc",
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

    // 3. Regrouper les stories par utilisateur dans un Map en JavaScript
    const groupedStoriesMap = new Map();

    activeStories.forEach((story) => {
      if (!groupedStoriesMap.has(story.userId)) {
        groupedStoriesMap.set(story.userId, {
          user: story.user,
          stories: [],
        });
      }

      groupedStoriesMap.get(story.userId).stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        createdAt: story.createdAt,
      });
    });

    const groupedStories = Array.from(groupedStoriesMap.values());

    return NextResponse.json({ groupedStories });
  } catch (error) {
    console.error("Erreur Stories GET API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement des stories." },
      { status: 500 }
    );
  }
}

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

    // 2. Récupérer l'image Base64
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Veuillez fournir une image pour votre story." },
        { status: 400 }
      );
    }

    // 3. Charger l'image sur Cloudinary dans un dossier spécifique
    const mediaUrl = await uploadImage(image, "aura_stories");

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Impossible de charger l'image de la story." },
        { status: 500 }
      );
    }

    // 4. Calculer la date d'expiration (+24 heures)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 5. Créer l'enregistrement dans la base de données PostgreSQL
    const story = await db.story.create({
      data: {
        mediaUrl,
        expiresAt,
        userId: currentUser.id,
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
      message: "Story publiée avec succès !",
      story: {
        id: story.id,
        mediaUrl: story.mediaUrl,
        createdAt: story.createdAt,
        user: story.user,
      },
    });
  } catch (error) {
    console.error("Erreur Stories POST API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la publication de la story." },
      { status: 500 }
    );
  }
}
