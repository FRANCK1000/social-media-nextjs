// API Route Next.js - Profil Utilisateur
// Récupère les données publiques d'un utilisateur par son nom d'utilisateur, incluant ses posts et son état de suivi

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
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

    // 2. Awaiter le paramètre username (Next.js 15+)
    const { username } = await params;

    // 3. Récupérer l'utilisateur ciblé avec ses posts, followers et following
    const userProfile = await db.user.findUnique({
      where: { username },
      include: {
        posts: {
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
              select: { id: true },
            },
          },
        },
        followers: true,
        following: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "Profil introuvable." },
        { status: 404 }
      );
    }

    // 4. Vérifier si l'utilisateur actuel suit ce profil
    const isFollowing = userProfile.followers.some(
      (follow) => follow.followerId === currentUser.id
    );

    // 5. Formater les publications du profil
    const formattedPosts = userProfile.posts.map((post) => {
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

    // 6. Retourner les informations formatées du profil
    return NextResponse.json({
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        bio: userProfile.bio,
        avatar: userProfile.avatar,
        cover: userProfile.cover,
        createdAt: userProfile.createdAt,
        lastActive: userProfile.lastActive,
        isOnline: (Date.now() - new Date(userProfile.lastActive).getTime()) < 15000,
        followersCount: userProfile.followers.length,
        followingCount: userProfile.following.length,
        isFollowing,
        isOwnProfile: currentUser.id === userProfile.id,
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error("Erreur Profil GET API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement du profil." },
      { status: 500 }
    );
  }
}
