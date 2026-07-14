// Script de Seeding pour le réseau social Aura
// Injecte 10 utilisateurs réalistes avec chacun au moins 5 publications
// Configure également des abonnements, des j'aime et des commentaires pour peupler l'interface

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Charger la variable DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable d'environnement DATABASE_URL n'est pas définie dans .env");
}

// Configurer le driver pg et l'adaptateur pour Prisma 7
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Début du seeding de la base de données Aura...");

  // 1. Nettoyer les anciennes données pour éviter les doublons
  await prisma.story.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Base de données nettoyée.");

  // 2. Hacher le mot de passe par défaut
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 3. Définir les 10 utilisateurs
  const usersData = [
    {
      name: "Alex Rivera",
      username: "alex_rivera",
      email: "alex@example.com",
      bio: "Lead Developer Advocate @Vercel | Spécialiste Next.js & React 19. Je partage mes astuces web dev au quotidien. 💻✨",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alex_rivera",
      cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80", // gradient dark
    },
    {
      name: "Sophia Chen",
      username: "sophia_chen",
      email: "sophia@example.com",
      bio: "UX Architect & Product Designer. Passionnée par le design d'interface minimalist, le glassmorphism et le prototypage rapide.🎨📐",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sophia_chen",
      cover: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=80",
    },
    {
      name: "Marcus Vance",
      username: "marcus_vance",
      email: "marcus@example.com",
      bio: "Cyber Security Analyst | PenTester. J'aide les entreprises à sécuriser leurs API et architectures serveurs. Lock picker amateur. 🛡️🔑",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=marcus_vance",
      cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
    },
    {
      name: "Elena Rostova",
      username: "elena_rostova",
      email: "elena@example.com",
      bio: "AI Research Scientist. Travaille sur le Deep Learning et le traitement du langage naturel (NLP). Rédactrice scientifique. 🧠🔬",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=elena_rostova",
      cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80",
    },
    {
      name: "Jordan Kross",
      username: "jordan_kross",
      email: "jordan@example.com",
      bio: "Senior Product Manager @Linear. Axé sur la vélocité des équipes, la simplicité produit et le design system moderne. 🚀🎯",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=jordan_kross",
      cover: "https://images.unsplash.com/photo-1634973357973-f2ed255753e1?w=1200&q=80",
    },
    {
      name: "Clara Mendez",
      username: "clara_mendez",
      email: "clara@example.com",
      bio: "Fullstack Developer (Node.js, Prisma, PostgreSQL). Amoureuse du code propre, de la programmation fonctionnelle et du café noir. ☕💻",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=clara_mendez",
      cover: "https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=1200&q=80",
    },
    {
      name: "David Kim",
      username: "david_kim",
      email: "david@example.com",
      bio: "Tech Lead @Stripe. Passionné par les systèmes distribués à grande échelle et les passerelles de paiement. Coach de carrière tech. 💳📈",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=david_kim",
      cover: "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1200&q=80",
    },
    {
      name: "Lucas Berger",
      username: "lucas_berger",
      email: "lucas@example.com",
      bio: "DevOps & Cloud Architect. Kubernetes, Terraform et CI/CD n'ont plus de secret pour moi. J'automatise le monde pour dormir plus. ☁️🐳",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=lucas_berger",
      cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",
    },
    {
      name: "Chloé Dupont",
      username: "chloe_dupont",
      email: "chloe@example.com",
      bio: "Growth Marketer & SEO Consultant. J'analyse les métriques pour propulser les SaaS de 0 à 1M$ de revenu annuel. 🚀📊",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=chloe_dupont",
      cover: "https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=1200&q=80",
    },
    {
      name: "Nathan Wood",
      username: "nathan_wood",
      email: "nathan@example.com",
      bio: "Cloud & Solutions Engineer @AWS. Passionné par l'architecture Serverless, l'Edge Computing et le running le weekend. 🏃‍♂️☁️",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nathan_wood",
      cover: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=80",
    },
  ];

  // 4. Insérer les utilisateurs dans PostgreSQL
  const users = [];
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  for (const u of usersData) {
    const createdUser = await prisma.user.create({
      data: {
        ...u,
        password: defaultPasswordHash,
        lastActive: twoHoursAgo,
      },
    });
    users.push(createdUser);
    console.log(`Utilisateur créé : @${createdUser.username}`);
  }

  // 5. Définir des publications réalistes pour chaque utilisateur (au moins 5 par personne)
  const postsTemplates = [
    // Alex Rivera (User 0)
    [
      {
        content: "Next.js 16 et React 19 sont maintenant en version stable ! Le nouveau React Compiler va radicalement changer notre façon de coder en éliminant le besoin de useMemo et useCallback. Qu'en pensez-vous ? 🔥",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80", // React code background
      },
      {
        content: "Hier, j'ai testé l'Edge Middleware de Next.js pour de l'authentification et de la géolocalisation dynamique. Les temps de réponse à la périphérie (edge) sont descendus à moins de 15ms. C'est le futur du web.",
      },
      {
        content: "Astuce du jour : Pour optimiser vos polices de caractères Google Font sur Next.js, utilisez le package next/font. Il télécharge automatiquement les fichiers au moment du build et les sert en local. Zéro impact SEO !",
      },
      {
        content: "Je prépare une vidéo tutorielle complète pour intégrer Prisma 7 et le driver natif PG dans une architecture Serverless. Stay tuned ! 🎥",
      },
      {
        content: "Mon setup de travail pour ce mois de juillet 2026. Minimaliste, écran incurvé, clavier mécanique et un bon café noir. Prêt à coder ! ☕⌨️",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", // setup
      },
    ],
    // Sophia Chen (User 1)
    [
      {
        content: "Le Glassmorphism est loin d'être mort en 2026. Avec Tailwind CSS v4, créer des bordures translucides avec filtre de flou d'arrière-plan (`backdrop-blur-md`) n'a jamais été aussi simple et propre. 🎨✨",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80", // abstract glass
      },
      {
        content: "Règle numéro 1 du design d'interface : L'espacement (white space) est aussi important que le contenu lui-même. Ne surchargez pas vos pages d'informations inutiles. Laissez respirer vos éléments.",
      },
      {
        content: "J'ai passé la journée à refondre le Design System de notre application. Les tokens CSS de la version 4 de Tailwind simplifient grandement la gestion du thème sombre par défaut.",
      },
      {
        content: "Recherche UX en cours : Préférez-vous une barre de navigation flottante sur le côté gauche ou une barre fixe en haut sur grand écran ? Partagez vos retours en commentaire !",
      },
      {
        content: "Inspirations graphiques du jour : les gradients néons doux combinés à des ombres portées diffuses. C'est l'essence du style 'Aura'. 😍🌈",
        image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&q=80", // neon gradient
      },
    ],
    // Marcus Vance (User 2)
    [
      {
        content: "Alerte de sécurité : Une faille majeure a été identifiée sur une bibliothèque populaire de gestion de JWT. Assurez-vous de toujours valider l'algorithme de signature (`alg: HS256`) sur vos serveurs pour éviter les contournements d'auth. 🛡️🚨",
      },
      {
        content: "Rappel amical : Ne stockez JAMAIS de tokens sensibles ou de clés d'API dans le stockage local du client (LocalStorage). Préférez toujours des cookies HTTP-Only cryptés et sécurisés.",
      },
      {
        content: "Aujourd'hui, j'ai configuré un script d'audit automatique qui s'exécute à chaque Pull Request pour scanner les dépendances obsolètes ou vulnérables (`npm audit`). Simple et efficace.",
      },
      {
        content: "Mon lab de piratage éthique local. 5 Raspberry Pi connectés en cluster pour tester des attaques par déni de service distribuées (DDoS). Sécurisons tout ça ! 🛡️",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", // cyber security network
      },
      {
        content: "Le hachage de mot de passe avec `bcrypt` reste un standard robuste, mais veillez à régler le nombre de rounds de salage (salt rounds) à au moins 10 ou 12 pour ralentir efficacement les attaques par force brute.",
      },
    ],
    // Elena Rostova (User 3)
    [
      {
        content: "Nous venons de publier nos travaux sur un nouveau modèle de traitement du langage naturel capable de tourner localement sur un smartphone avec des performances équivalentes à GPT-3.5. La décentralisation de l'IA est en marche. 🧠🤖",
      },
      {
        content: "L'Edge Computing révolutionne l'intégration de l'IA. Exécuter de petites inférences de réseaux neuronaux directement dans les Edge Workers permet d'éliminer les latences réseau. Le futur est instantané.",
      },
      {
        content: "Mon bureau de recherche ce matin. Des équations, beaucoup de caféine et du code Python qui compile (enfin). ☕📊",
        image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80", // abstract neon nodes
      },
      {
        content: "Est-ce que vous utilisez des assistants de code IA comme Github Copilot au quotidien ? Pour ma part, cela me permet de sauter la rédaction de code répétitif et de me concentrer sur l'architecture.",
      },
      {
        content: "Séminaire passionnant sur l'éthique de l'IA et la protection des données privées d'entraînement. C'est crucial pour l'avenir de notre secteur d'établir des normes transparentes.",
      },
    ],
    // Jordan Kross (User 4)
    [
      {
        content: "La vélocité d'une équipe tech ne dépend pas du nombre d'heures de code, mais de la clarté des spécifications fonctionnelles. Mieux vaut passer 2 heures à concevoir plutôt que 2 jours à réécrire. 🚀🎯",
      },
      {
        content: "Chez Linear, nous avons réduit de 40% le nombre de réunions hebdomadaires. Résultat : une équipe plus concentrée, des sprints mieux respectés et moins de fatigue mentale.",
      },
      {
        content: "Nouvelle maquette produit pour la gestion des notifications en temps réel. Notre but : une interface si simple qu'aucune explication n'est requise. 💡✨",
        image: "https://images.unsplash.com/photo-1634973357973-f2ed255753e1?w=800&q=80", // product design abstract
      },
      {
        content: "Quels outils de gestion de projet utilisez-vous dans votre entreprise ? Jira, Linear, Trello, Notion ? Et surtout, qu'est-ce qui vous frustre le plus dans votre flux actuel ?",
      },
      {
        content: "La règle produit ultime : Dites non aux fonctionnalités complexes que seulement 2% de vos utilisateurs utiliseront. Concentrez-vous sur l'excellence du noyau de votre application.",
      },
    ],
    // Clara Mendez (User 5)
    [
      {
        content: "L'optimisation des requêtes PostgreSQL est un art. L'utilisation intelligente d'index, de clés primaires composites et l'analyse avec `EXPLAIN ANALYZE` peuvent diviser par 100 le temps d'exécution. 📈💻",
      },
      {
        content: "Aujourd'hui, j'ai migré une base de données MySQL vers PostgreSQL en utilisant Prisma Migrate. La détection automatique des relations et la gestion du schéma facilitent grandement la transition.",
      },
      {
        content: "Le code propre (Clean Code), c'est écrire un code qui se lit comme un livre. Si vous devez ajouter des commentaires sur chaque ligne pour expliquer ce que fait le code, c'est qu'il doit être réécrit.",
      },
      {
        content: "Séance de code nocturne. J'adore le calme de la nuit pour me concentrer sur l'optimisation des structures complexes. ☕💻✨",
        image: "https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=800&q=80", // abstract dark lines
      },
      {
        content: "Question aux développeurs backend : Préférez-vous générer des UUID côté serveur (ex: uuid v4) ou laisser la base de données PostgreSQL générer elle-même les clés d'identification ?",
      },
    ],
    // David Kim (User 6)
    [
      {
        content: "Gérer des transactions financières à haute disponibilité nécessite des mécanismes de retry idempotents robustes. Une simple coupure réseau ne doit jamais provoquer un double débit chez un client. 💳⚙️",
      },
      {
        content: "Le rôle d'un Tech Lead n'est pas d'écrire tout le code complexe, mais de faire grandir l'équipe, de lever les obstacles techniques et d'assurer la cohérence de l'architecture logicielle.",
      },
      {
        content: "Notre tableau de bord de monitoring de production Stripe. 10 millions d'événements API traités par heure avec un taux de disponibilité de 99.999%. C'est beau. 📊💳",
        image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800&q=80", // colorful dynamic art
      },
      {
        content: "Si vous deviez recommander un livre pour un développeur junior souhaitant évoluer vers un poste de Lead, quel serait votre choix numéro un ? Pour moi, c'est 'The Staff Engineer's Path'.",
      },
      {
        content: "Le secret d'une API réussie : une documentation impeccable avec des exemples de code dans tous les langages majeurs, et un bac à sable (sandbox) fonctionnant instantanément.",
      },
    ],
    // Lucas Berger (User 7)
    [
      {
        content: "Docker et Kubernetes ont révolutionné le déploiement d'applications. Mais attention au syndrome de sur-ingénierie : un simple conteneur sur un VPS suffit amplement pour 90% des startups ! 🐳☁️",
      },
      {
        content: "Infrastructure as Code (IaC) : Terraform est indispensable. Pouvoir recréer l'intégralité d'un cluster AWS ou GCP en tapant une seule commande (`terraform apply`) est magique.",
      },
      {
        content: "Une vue sur la salle des serveurs de notre datacenter local. La climatisation fait du bruit, mais c'est ici que bat le cœur de nos applications. ❄️🖥️",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80", // green digital server matrix
      },
      {
        content: "Mon but ultime en tant qu'ingénieur DevOps : Créer un pipeline CI/CD si automatisé et fiable que les développeurs peuvent déployer en production le vendredi soir en toute sérénité. 😉",
      },
      {
        content: "Conseil du jour : Configurez toujours des limites de ressources (CPU & Mémoire) sur vos conteneurs Docker pour éviter qu'un bug de fuite de mémoire n'arrête tout le serveur hôte.",
      },
    ],
    // Chloé Dupont (User 8)
    [
      {
        content: "Le référencement naturel (SEO) n'est pas de la magie, c'est de l'expérience utilisateur et de la technique. Un site rapide, responsive, bien structuré et avec un contenu qualitatif plaira toujours à Google. 📈🔍",
      },
      {
        content: "L'analyse des données de conversion montre que réduire le temps de chargement d'un site e-commerce de 3 secondes à 1.5 secondes augmente le taux de conversion de 24%. La vitesse, c'est du chiffre d'affaires.",
      },
      {
        content: "Nouvelle stratégie marketing lancée ce matin pour propulser notre dernier produit SaaS. Des métriques claires à suivre pour la fin du mois. 🚀📊",
        image: "https://images.unsplash.com/photo-1618005198143-e528346d9a59?w=800&q=80", // marketing charts visual abstraction
      },
      {
        content: "Qu'est-ce qui selon vous fait la force d'un bon copywriter ? Être capable d'expliquer une idée complexe avec des mots simples et percutants qui poussent à l'action.",
      },
      {
        content: "Ne cherchez pas à plaire à tout le monde. Ciblez une niche précise, comprenez leur problème le plus douloureux et proposez la meilleure solution possible. C'est ça, le marketing de croissance.",
      },
    ],
    // Nathan Wood (User 9)
    [
      {
        content: "L'Edge Computing et le Serverless transforment l'architecture logicielle en 2026. Distribuer le calcul au plus près de l'utilisateur permet des performances inégalées sans maintenance de serveurs. ☁️⚡",
      },
      {
        content: "AWS CloudFront et Cloudflare Workers permettent de modifier les requêtes HTTP à la volée. Utile pour faire des tests A/B ou injecter des en-têtes de sécurité sans toucher au code principal.",
      },
      {
        content: "L'architecture Serverless n'est pas exempte de serveurs, elle libère simplement le développeur de la gestion de l'infrastructure hôte. C'est un gain de temps inestimable pour les startups.",
      },
      {
        content: "Session de formation AWS cet après-midi pour concevoir des architectures résilientes face aux pannes. La redondance multi-région est la clé du succès. ☁️💻",
        image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&q=80", // colorful shapes AWS cloud vibe
      },
      {
        content: "Prêt pour le running hebdomadaire du dimanche matin. Rien de tel pour se vider l'esprit après une longue semaine à configurer des VPC AWS ! 🏃‍♂️👟",
      },
    ],
  ];

  // 6. Insérer les posts pour chaque utilisateur
  const allCreatedPosts = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const templates = postsTemplates[i];

    for (const postData of templates) {
      const post = await prisma.post.create({
        data: {
          content: postData.content,
          image: postData.image || null,
          authorId: user.id,
        },
      });
      allCreatedPosts.push(post);
    }
  }

  console.log(`Seeding terminé : 50 publications insérées.`);

  // 7. Générer des abonnements entre les utilisateurs pour peupler le flux "Suivis"
  // Chaque utilisateur suivra les 3 utilisateurs suivants dans la liste circulaire
  console.log("Seeding des abonnements...");
  for (let i = 0; i < users.length; i++) {
    const follower = users[i];
    for (let j = 1; j <= 3; j++) {
      const followingIdx = (i + j) % users.length;
      const following = users[followingIdx];

      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: following.id,
        },
      });
    }
  }
  console.log("Abonnements insérés.");

  // 8. Générer des J'aime (Likes) aléatoires
  // Chaque post recevra entre 2 et 5 likes
  console.log("Seeding des likes...");
  for (const post of allCreatedPosts) {
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const likesCount = Math.floor(Math.random() * 4) + 2; // entre 2 et 5 likes

    for (let k = 0; k < likesCount; k++) {
      const user = shuffledUsers[k];
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });
    }
  }
  console.log("Likes insérés.");

  // 9. Générer des commentaires réalistes sur certaines publications
  console.log("Seeding des commentaires et des réponses...");
  const commentPhrases = [
    "C'est exactement ce que je pense ! Merci pour ce partage. 👏",
    "Est-ce que tu as des benchmarks ou des articles de blog à recommander sur ce sujet précis ?",
    "Impressionnant ! J'ai hâte de tester ça en production sur nos applications.",
    "Je ne suis pas tout à fait d'accord avec ce point. Il y a un impact non négligeable sur les performances.",
    "Excellent article, très clair et bien rédigé. Hâte de lire tes prochains posts ! 👍",
    "Merci pour l'astuce, cela va me faire gagner un temps précieux cette semaine.",
  ];

  // Commenter sur les 10 premières publications (posts à l'index 0 des utilisateurs)
  for (let i = 0; i < 15; i++) {
    const post = allCreatedPosts[i * 3]; // prendre quelques posts éparpillés
    if (!post) continue;

    // Ajouter 1 ou 2 commentaires racine
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    
    // Premier commentaire racine
    const comment1 = await prisma.comment.create({
      data: {
        content: commentPhrases[Math.floor(Math.random() * commentPhrases.length)],
        postId: post.id,
        userId: shuffledUsers[0].id,
      },
    });

    // Deuxième commentaire racine
    await prisma.comment.create({
      data: {
        content: "C'est super intéressant, je vais partager ça à mon équipe de développement !",
        postId: post.id,
        userId: shuffledUsers[1].id,
      },
    });

    // Ajouter une réponse imbriquée au premier commentaire (commenter un commentaire)
    await prisma.comment.create({
      data: {
        content: `D'accord avec toi @${shuffledUsers[0].username}, c'est effectivement crucial pour optimiser l'UX.`,
        postId: post.id,
        userId: shuffledUsers[2].id,
        parentId: comment1.id, // liaison de réponse
      },
    });
  }

  console.log("Commentaires et réponses imbriquées insérés.");

  // 10. Seeding de quelques Stories actives pour illustrer l'interface (Stories de moins de 24h)
  console.log("Seeding de quelques Stories actives...");
  const storyImages = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", // plage
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80", // gradient neon
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&q=80", // abstract glass
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80", // network server
  ];

  // Ajouter des stories pour les 4 premiers utilisateurs
  for (let i = 0; i < 4; i++) {
    const user = users[i];
    await prisma.story.create({
      data: {
        mediaUrl: storyImages[i],
        expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // Expirera dans 20 heures (donc active)
        userId: user.id,
      },
    });
  }
  console.log("Stories actives insérées.");

  console.log("\n==============================================");
  console.log("Seeding d'Aura complété avec succès ! 🎉");
  console.log("10 utilisateurs configurés avec le mot de passe : password123");
  console.log("==============================================");
}

main()
  .catch((e) => {
    console.error("Erreur durant le seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
