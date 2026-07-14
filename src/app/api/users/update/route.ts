// API Route Next.js - Mise à jour du Profil
// Met à jour le nom, la biographie, l'avatar ou la couverture de l'utilisateur connecté

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function PATCH(request: Request) {
  try {
    // 1. Vérifier la session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    // 2. Parser les données reçues
    const { name, bio, avatar, cover } = await request.json();

    let avatarUrl = avatar;
    let coverUrl = cover;

    // 3. Charger l'avatar sur Cloudinary si c'est une nouvelle image Base64
    if (avatar && avatar.startsWith("data:image")) {
      const uploadedAvatar = await uploadImage(avatar, "aura_avatars");
      if (uploadedAvatar) {
        avatarUrl = uploadedAvatar;
      } else {
        return NextResponse.json(
          { error: "Impossible de mettre à jour l'image de profil." },
          { status: 500 }
        );
      }
    }

    // 4. Charger la couverture sur Cloudinary si c'est une nouvelle image Base64
    if (cover && cover.startsWith("data:image")) {
      const uploadedCover = await uploadImage(cover, "aura_covers");
      if (uploadedCover) {
        coverUrl = uploadedCover;
      } else {
        return NextResponse.json(
          { error: "Impossible de mettre à jour la photo de couverture." },
          { status: 500 }
        );
      }
    }

    // 5. Mettre à jour l'utilisateur dans PostgreSQL
    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: {
        name: name || undefined,
        bio: bio !== undefined ? bio : undefined,
        avatar: avatarUrl || undefined,
        cover: coverUrl || undefined,
      },
    });

    // 6. Retourner l'utilisateur mis à jour
    return NextResponse.json({
      message: "Profil mis à jour avec succès.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        cover: updatedUser.cover,
      },
    });
  } catch (error) {
    console.error("Erreur Mise à jour Profil API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du profil." },
      { status: 500 }
    );
  }
}
