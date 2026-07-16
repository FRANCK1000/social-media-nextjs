// API Route Next.js - Détail, Modification et Suppression d'une Publication
// GET: Récupère les données d'un post spécifique avec ses commentaires
// PUT: Modifie le texte ou l'image d'un post (seulement pour l'auteur)
// DELETE: Supprime définitivement un post (seulement pour l'auteur)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

// 1. GET - Obtenir les détails du post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { id } = await params;

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
    console.error("Erreur Post Detail GET API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement." },
      { status: 500 }
    );
  }
}

// 2. PUT - Modifier la publication (seulement par l'auteur)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { content, image } = await request.json();
    const cleanContent = content ? content.trim() : "";

    // Récupérer le post d'origine
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, image: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "La publication n'existe pas." },
        { status: 404 }
      );
    }

    // Vérifier les droits d'auteur
    if (post.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: "Action non autorisée. Vous n'êtes pas l'auteur de ce post." },
        { status: 403 }
      );
    }

    // Traitement de l'image (si nouvelle ou supprimée)
    let imageUrl = post.image;
    if (image && image !== post.image) {
      // Nouvelle image base64
      if (image.startsWith("data:")) {
        imageUrl = await uploadImage(image, "aura_posts");
        if (!imageUrl) {
          return NextResponse.json(
            { error: "Impossible de stocker l'image sur Cloudinary." },
            { status: 500 }
          );
        }
      } else {
        imageUrl = image;
      }
    } else if (image === null) {
      imageUrl = null; // Image retirée
    }

    // Vérification finale : il doit rester soit du texte, soit une image !
    if (!cleanContent && !imageUrl) {
      return NextResponse.json(
        { error: "La publication doit contenir du texte ou une image." },
        { status: 400 }
      );
    }

    // Mettre à jour dans PostgreSQL
    const updatedPost = await db.post.update({
      where: { id },
      data: {
        content: cleanContent,
        image: imageUrl,
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
        likes: true,
        comments: {
          select: { id: true },
        },
      },
    });

    const isLiked = updatedPost.likes.some((like) => like.userId === currentUser.id);

    return NextResponse.json({
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
        image: updatedPost.image,
        createdAt: updatedPost.createdAt,
        author: updatedPost.author,
        likesCount: updatedPost.likes.length,
        commentsCount: updatedPost.comments.length,
        isLiked,
      },
    });
  } catch (error) {
    console.error("Erreur Post Edit PUT API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification." },
      { status: 500 }
    );
  }
}

// 3. DELETE - Supprimer la publication (seulement par l'auteur)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Récupérer le post pour vérifier l'auteur
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "La publication n'existe pas." },
        { status: 404 }
      );
    }

    // Vérifier les droits d'auteur
    if (post.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: "Action non autorisée. Vous n'êtes pas l'auteur de ce post." },
        { status: 403 }
      );
    }

    // Suppression en cascade automatique dans PostgreSQL (likes et comments configurés Cascade dans le Prisma Schema)
    await db.post.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Publication supprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur Post Delete API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la publication." },
      { status: 500 }
    );
  }
}
