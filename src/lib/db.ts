// Utilitaire d'instanciation du client Prisma avec support pour Prisma 7 et le driver pg
// Empêche d'instancier plusieurs instances de PrismaClient en mode développement.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let prisma: PrismaClient;

// Récupération de la chaîne de connexion
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable d'environnement DATABASE_URL n'est pas définie.");
}

// Configuration du pool pg
const pool = new pg.Pool({
  connectionString,
  // Configuration pour le développement local et la production
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Création de l'adaptateur Prisma pour PostgreSQL (nouveauté Prisma 7)
const adapter = new PrismaPg(pool);

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export const db = prisma;
