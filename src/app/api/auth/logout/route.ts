// API Route Next.js - Déconnexion
// Détruit la session de l'utilisateur en supprimant le cookie JWT

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    // Supprimer le cookie de session
    await deleteSession();

    return NextResponse.json({ message: "Déconnexion réussie." });
  } catch (error) {
    console.error("Erreur Déconnexion API :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de la déconnexion." },
      { status: 500 }
    );
  }
}
