// Utilitaires de sécurité pour l'authentification (JWT et Hachage)
// Utilise 'jose' pour être compatible avec l'Edge Runtime de Next.js (Middleware)
// Utilise 'bcryptjs' pour le hachage sécurisé des mots de passe.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

// Clé secrète encodée pour 'jose'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aura_fallback_secret_key_for_jwt_auth_2026"
);

// Durée de la session (7 jours)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Hache un mot de passe en utilisant bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare un mot de passe en clair avec son hash
 */
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

/**
 * Signe un jeton JWT contenant les informations de l'utilisateur
 */
export async function signJWT(payload: { userId: string; email: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Vérifie et décode un jeton JWT
 */
export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; username: string };
  } catch (error) {
    return null;
  }
}

/**
 * Récupère l'utilisateur connecté actuel depuis le token stocké dans les cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("aura_session")?.value;

    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        cover: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return null;
  }
}

/**
 * Crée une session utilisateur en définissant le cookie HTTP-only
 */
export async function createSession(userId: string, email: string, username: string) {
  const token = await signJWT({ userId, email, username });
  const cookieStore = await cookies();
  
  cookieStore.set("aura_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION / 1000,
  });
}

/**
 * Supprime la session utilisateur en vidant le cookie
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("aura_session");
}
