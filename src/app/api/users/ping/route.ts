// API Route Next.js - Ping de Présence
// POST: Met à jour la colonne lastActive de l'utilisateur connecté de manière performante

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Mise à jour de la date d'activité en une seule requête DB simple
    await db.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur Ping API :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
