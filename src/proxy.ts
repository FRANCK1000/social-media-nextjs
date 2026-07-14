// Middleware de protection des routes Next.js
// S'exécute sur chaque requête pour vérifier l'état d'authentification de l'utilisateur

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Clé secrète encodée pour 'jose'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aura_fallback_secret_key_for_jwt_auth_2026"
);

// Chemins publics qui ne nécessitent pas de connexion
const PUBLIC_PATHS = ["/login", "/register"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclure les ressources statiques, l'API d'authentification et les fichiers internes Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Récupérer le cookie de session
  const token = request.cookies.get("aura_session")?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      // Tenter de décoder le JWT
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      // Jeton invalide ou expiré
      isAuthenticated = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  // 1. Redirection ou retour 401 si l'utilisateur non authentifié tente d'accéder à une page privée
  if (!isAuthenticated && !isPublicPath) {
    // Si c'est une requête API, retourner une réponse JSON 401 directement
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    // Conserver l'URL de redirection pour après la connexion
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirection si l'utilisateur connecté tente d'accéder à une page de connexion/inscription
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configurer les chemins sur lesquels le middleware s'exécute
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
