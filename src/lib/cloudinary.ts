// Utilitaire d'intégration avec le service Cloudinary
// Permet de charger des images (avatars, photos de posts) depuis le serveur.

import { v2 as cloudinary } from "cloudinary";

// Configuration de Cloudinary avec les variables d'environnement
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Charge une image encodée en base64 vers Cloudinary.
 * @param base64Image L'image en format data URI (ex: data:image/png;base64,...)
 * @param folder Le dossier cible dans votre espace Cloudinary
 * @returns L'URL sécurisée de l'image stockée ou null en cas d'erreur
 */
export async function uploadImage(base64Image: string, folder: string = "aura_social"): Promise<string | null> {
  try {
    if (!base64Image) return null;
    
    // Cloudinary accepte directement les chaînes Base64 avec leur préfixe
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: "auto",
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Erreur lors de l'upload Cloudinary :", error);
    return null;
  }
}
