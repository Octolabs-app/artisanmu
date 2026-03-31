# 🇲🇺 ArtisanMu – L'annuaire d'élite des artisans à l'Île Maurice

ArtisanMu est une plateforme moderne, sécurisée et bilingue qui connecte les citoyens mauriciens avec les meilleurs artisans de l'île. Conçue avec une approche "Premium First", elle privilégie la fiabilité grâce à une vérification stricte de l'identité et une interface utilisateur haut de gamme.

## ✨ Fonctionnalités Clés

- **🔍 Recherche Intuitive** : Filtrage par métier, ville ou expertise avec des résultats instantanés.
- **🛡️ Administration Sécurisée** : Panneau de contrôle protégé par SHA-256 pour valider les nouveaux profils et gérer la communauté.
- **🌍 Multi-langue (FR/EN)** : Basculement instantané entre le Français et l'Anglais pour une accessibilité maximale.
- **📍 Cartes Interactives** : Géolocalisation précise des ateliers via Leaflet.js et synchronisation Google Maps.
- **📸 Gestion de Portfolio** : Les artisans peuvent télécharger leur avatar et jusqu'à 3 photos de leurs réalisations.
- **💬 Mise en relation WhatsApp** : Boutons "Magic Direct" pour contacter un artisan en un clic sans friction.

## 🛠️ Stack Technique

- **Frontend** : Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+).
- **Backend-as-a-Service** : [Supabase](https://supabase.com/) (PostgreSQL & Storage).
- **Cartographie** : [Leaflet.js](https://leafletjs.com/) avec tuiles Voyager.
- **Notifications** : [EmailJS](https://www.emailjs.com/) pour les alertes administrateur en temps réel.
- **Sécurité** : Web Crypto API (Hachage client-side).

## 🚀 Installation & Déploiement

### 1. Configuration Supabase
Créez un projet Supabase et une table `artisans` avec ces colonnes :
- `id`: uuid (primary key)
- `nom`, `tel`, `nic`, `metier`, `ville`, `lien`, `gps`, `expertise`, `avatar` (text)
- `photos` (jsonb)
- `is_verified` (bool)
- `note_total` (int), `nombre_avis` (int)

Ajoutez un bucket nommé `portfolios` avec accès public.

### 2. Variables d'environnement
Modifiez les constantes au début du fichier `artisanmu-v3.html` :
```javascript
const SUPABASE_URL = 'VOTRE_URL';
const SUPABASE_KEY = 'VOTRE_CLÉ_ANON';
const EMAILJS_SERVICE = 'VOTRE_SERVICE_ID';
// ...
```

### 3. Déploiement
Le projet est un fichier unique (SPA). Vous pouvez l'héberger sur :
- **GitHub Pages** (Gratuit)
- **Vercel** (`npx vercel`)
- **Netlify** (Glissez-déposez le dossier)

## 📄 Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
© 2026 ArtisanMu. Développé pour le rayonnement de l'artisanat mauricien.
