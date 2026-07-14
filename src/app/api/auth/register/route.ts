// API Route Next.js - Inscription
// Gère la création de comptes utilisateurs dans la base de données PostgreSQL via Prisma

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, username, name } = await request.json();

    // 1. Validation de base des champs requis
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    // 2. Formatage et validation du format de l'username
    const formattedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (formattedUsername.length < 3) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur doit contenir au moins 3 caractères alphanumériques." },
        { status: 400 }
      );
    }

    // 3. Validation de la longueur du mot de passe
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // 4. Vérifier si l'email ou le nom d'utilisateur existe déjà
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: formattedUsername },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà enregistrée." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris." },
        { status: 400 }
      );
    }

    // 5. Hacher le mot de passe
    const hashedPassword = await hashPassword(password);

    // 6. Créer le nouvel utilisateur dans PostgreSQL
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        username: formattedUsername,
        name,
        // Avatars et couvertures par défaut de grande qualité graphique
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${formattedUsername}`,
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80", // Magnifique gradient abstrait dark
      },
    });

    // 7. Créer automatiquement la session JWT
    await createSession(user.id, user.email, user.username);

    // 8. Retourner l'utilisateur créé (sans le mot de passe pour la sécurité)
    return NextResponse.json(
      {
        message: "Inscription réussie.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur Inscription API :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
