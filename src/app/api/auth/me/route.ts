// API Route Next.js - Session Actuelle
// Retourne les données de l'utilisateur connecté actuellement (basé sur le cookie JWT)

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user) {
      // Mettre à jour lastActive de manière asynchrone
      db.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      }).catch(err => console.error("Erreur update lastActive :", err));
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erreur Session Me API :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de la session." },
      { status: 500 }
    );
  }
}
