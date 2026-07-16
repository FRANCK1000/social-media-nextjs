// Middleware / Proxy de protection des routes Next.js 16
// S'exécute sur le serveur pour chaque requête avant le rendu
// Redirige instantanément les utilisateurs non connectés vers /login sur le serveur, évitant tout flash de contenu client

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Clé secrète encodée pour 'jose'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aura_fallback_secret_key_for_jwt_auth_2026"
);

// Chemins publics accessibles sans authentification
const PUBLIC_PATHS = ["/login", "/register"];

// Note : Next.js 16 exige un export nommé "proxy" dans le fichier "proxy.ts"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclure les ressources statiques, l'API d'authentification et les fichiers de structure Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon.ico") ||
    pathname.includes("icon.svg") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Récupérer le cookie de session
  const token = request.cookies.get("aura_session")?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      // Tenter de décoder et vérifier le token JWT
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      // Jeton invalide, expiré ou corrompu
      isAuthenticated = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  // 1. Si l'utilisateur n'est pas connecté et tente d'accéder à une route privée
  if (!isAuthenticated && !isPublicPath) {
    // Si c'est une requête API, retourner directement une réponse JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    
    // Sinon rediriger instantanément vers la page de login sur le serveur
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname); // Conserver la destination initiale
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si l'utilisateur est connecté et tente d'accéder à une page publique (login/register)
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configuration du filtre d'exécution du middleware (tous les chemins sauf statiques et favicons)
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
