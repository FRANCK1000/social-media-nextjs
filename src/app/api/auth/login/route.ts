// API Route Next.js - Connexion
// Gère la vérification des identifiants et l'initialisation de la session JWT

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Validation de base des champs requis
    if (!email || !password) {
      return NextResponse.json(
        { error: "Veuillez fournir un email et un mot de passe." },
        { status: 400 }
      );
    }

    // 2. Recherche de l'utilisateur par son email dans la base de données
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants de connexion invalides." },
        { status: 401 }
      );
    }

    // 3. Comparer les mots de passe
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Identifiants de connexion invalides." },
        { status: 401 }
      );
    }

    // 4. Créer la session JWT (définit le cookie HTTP-only)
    await createSession(user.id, user.email, user.username);

    // 5. Réponse de succès
    return NextResponse.json({
      message: "Connexion réussie.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Erreur Connexion API :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de la connexion." },
      { status: 500 }
    );
  }
}
