# 🌟 Aura — Réseau Social Ultramoderne & Responsive

**Aura** est une plateforme de réseau social professionnel conçue pour offrir une expérience utilisateur ultra-fluide, esthétique et performante. Développée avec les dernières technologies du Web moderne, l'application intègre un design haut de gamme orienté *Glassmorphism*, un support multilingue instantané, un statut d'activité en temps réel et une responsivité mobile avancée.

---

## 🚀 Fonctionnalités Clés

### 🎨 Design Glassmorphic Premium & Double Thème
* **Thèmes Intelligents :** Bascule instantanée entre **Aura Dark** (Obsidian nuit profonde) et **Aura Light** (Slate clair lumineux) via le bouton palette (🎨).
* **Zéro Flash Visuel :** Intégration côté serveur (SSR) pour charger directement le thème par défaut (Clair) sans flash sombre transitoire.
* **Typographie moderne :** Utilisation de la police *Plus Jakarta Sans* et de contrastes de textes améliorés pour une visibilité optimale sur fond clair.

### 🌐 Internationalisation (i18n) & Choix de Langue
* **Sélecteur de langue (Globe 🌐) :** Bascule instantanée de toute l'application entre le **Français** (FR) et l'**Anglais** (EN).
* **Persistance locale :** Sauvegarde automatique des préférences de l'utilisateur dans son `LocalStorage`.
* **Traductions exhaustives :** Saisie des publications, flux d'accueil, suggestions, messagerie et formulaires localisés.

### 🟢 Statut d'Activité "En Ligne" Intelligent (Anti-AFK / Veille)
* **Détection des interactions :** Analyse les événements DOM physiques (clics, touches de clavier, défilements tactiles) pour vérifier que l'utilisateur est actif.
* **Throttling performant :** Pings réguliers envoyés au serveur via une API légère (`/api/users/ping`) toutes les 10 secondes uniquement si l'utilisateur interagit, afin d'alléger la base de données.
* **Déconnexion automatique :** L'absence d'activité pendant plus de 10 secondes ou le passage de l'onglet en arrière-plan éteint instantanément la pastille verte de présence pour les autres membres.

### 📱 Responsivité Mobile Progressive (Bottom Navigation)
* **Design Hybride :** La barre latérale Desktop se transforme de manière fluide en une **Bottom Navigation Bar** sur écrans tactiles (< md), rendant les actions (Accueil, Messages, Profil) facilement accessibles au pouce.
* **Bandeau Supérieur Fixe :** Un en-tête mobile discret regroupe le logo, le basculeur de thèmes et le bouton de déconnexion.

### 💬 Messagerie Privée Split-Screen & Accusés de Lecture
* **Double Coche Dynamique (Read Receipts) :** Une coche grise unique (✓) indique que le message est envoyé, et une double coche bleue (✓✓) s'affiche dès que le destinataire ouvre le fil de discussion.
* **Polling temps réel :** Rafraîchissement asynchrone régulier pour des échanges fluides.

### 📝 Flux de Publications & Stories
* **Onglet "Pour vous" vs "Suivis" :** 
  - L'onglet *Pour vous* propose de découvrir toutes les publications globales de la plateforme.
  - L'onglet *Suivis* affiche de manière stricte uniquement les publications des comptes que vous suivez (vos propres posts y sont filtrés).
* **Interactif :** Système de likes instantanés (mise à jour optimiste côté client), partage de lien, commentaires imbriqués (réponses au fil) et sélecteur d'émojis glassmorphic.
* **Stories 24 heures :** Visionneuse interactive avec pause sur appui long, chronomètres segmentés et option de suppression.

---

## 🛠️ Pile Technologique (Tech Stack)

* **Framework :** Next.js 16.2 (App Router & Turbopack)
* **Bibliothèque UI :** React 19
* **Styles :** Tailwind CSS v4 (Vanilla CSS variables)
* **Base de données :** PostgreSQL (Local)
* **ORM :** Prisma 7.8 (Gestion des relations complexes et seeds de tests)
* **Stockage média :** Cloudinary SDK (Uploads d'images en base64)
* **Sécurité & Authentification :** Sessions JWT avec cookies HTTP-only sécurisés, hachage via `bcryptjs` et protection de requêtes `jose`.

---

## 🏁 Démarrage Rapide

1. **Cloner le projet :**
   ```bash
   git clone https://github.com/FRANCK1000/social-media-nextjs.git
   cd social-media-nextjs
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement (`.env`) :**
   ```env
   DATABASE_URL="postgresql://postgres:14803@localhost:5432/aura_db"
   JWT_SECRET="votre-secret-super-securise"
   CLOUDINARY_CLOUD_NAME="votre-cloud-name"
   CLOUDINARY_API_KEY="votre-api-key"
   CLOUDINARY_API_SECRET="votre-api-secret"
   ```

4. **Synchroniser la base de données :**
   ```bash
   npx prisma db push
   ```

5. **Lancer le serveur de développement :**
   ```bash
   npm run dev -- -p 5000
   ```
   *Rendez-vous sur [http://localhost:5000](http://localhost:5000)*
