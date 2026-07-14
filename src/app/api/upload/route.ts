// API Route Next.js - Téléchargement d'images
// Reçoit une image Base64, vérifie la session, et la charge sur Cloudinary de manière sécurisée

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification de l'utilisateur
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Parser le corps de la requête
    const { image, folder } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Aucune image fournie." },
        { status: 400 }
      );
    }

    // 3. Charger l'image sur Cloudinary
    const imageUrl = await uploadImage(image, folder || "aura_posts");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Impossible de charger l'image sur Cloudinary." },
        { status: 500 }
      );
    }

    // 4. Retourner l'URL sécurisée générée
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Erreur Upload API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'upload." },
      { status: 500 }
    );
  }
}
