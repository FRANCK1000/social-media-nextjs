/**
 * Formate le statut d'activité d'un utilisateur sous forme de texte relatif (façon Facebook Messenger).
 * @param lastActiveDate La date de dernière activité (Date ou chaîne ISO)
 * @param isOnline L'état de connexion binaire
 * @param language La langue active ('fr' | 'en')
 */
export function formatPresenceStatus(
  lastActiveDate: Date | string | undefined | null,
  isOnline: boolean,
  language: "fr" | "en"
): string {
  if (isOnline) {
    return language === "fr" ? "En ligne" : "Active now";
  }

  if (!lastActiveDate) {
    return language === "fr" ? "Hors ligne" : "Offline";
  }

  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  const diffMs = now.getTime() - lastActive.getTime();
  
  // Si le décalage est invalide ou négatif (micro décalages horloge client-serveur)
  if (isNaN(diffMs) || diffMs < 0) {
    return language === "fr" ? "Actif(ve) il y a quelques secondes" : "Active seconds ago";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) {
    return language === "fr" ? "Actif(ve) il y a quelques secondes" : "Active seconds ago";
  }
  if (diffMin < 60) {
    return language === "fr" 
      ? `Actif(ve) il y a ${diffMin} min` 
      : `Active ${diffMin}m ago`;
  }
  if (diffHours < 24) {
    return language === "fr" 
      ? `Actif(ve) il y a ${diffHours} h` 
      : `Active ${diffHours}h ago`;
  }
  if (diffDays < 8) {
    return language === "fr" 
      ? `Actif(ve) il y a ${diffDays} j` 
      : `Active ${diffDays}d ago`;
  }

  // Au-delà d'une semaine
  return language === "fr" ? "Hors ligne" : "Offline";
}
