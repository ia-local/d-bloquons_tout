## 🚀 Manifest.910-2025 - Plateforme Citoyenne de Mobilisation

Ce projet est une plateforme technologique visant à soutenir et organiser la Grève Générale du 10 Septembre 2025 et les mouvements pour la Justice Sociale en France.

<pre><code>  
  ╔═════════════════════════════════════════════════════════════════════════════════╗
  ║[📗 📕 📒]                  🔷   ASCII GRAPH (EXCEL)   🔷                        >║
  ╠═════════════════════════════════════════════════════════════════════════════════╣
  ║ [__] ║ + home           ║.                                                      ║
  ║ [__] ║ + dashboard      ║.                                                      ║
  ║ [__] ║ + democratie     ║.                                                      ║
  ║ [__] ║ + cvnu           ║.                                                      ║
  ║ [__] ║ + missions       ║.                                                      ║
  ║ [__] ║ + playground     ║.                                                      ║
  ║ [__] ║ + ric            ║.                                                      ║
  ║ [__] ║ + smartContract  ║.                                                      ║
  ║ [__] ║ + journal        ║.                                                      ║
  ║ [__] ║ + map            ║.                                                      ║
  ║ [__] ║ + treasury       ║.                                                      ║
  ║ [__] ║ + contacts       ║.                                                      ║
  ║ [__] ║ + reseau         ║.                                                      ║
  ║ [__] ║ + organisation   ║.                                                      ║
  ║ [__] ║ + parametre      ║.                                                      ║
  ╠═════════════════════════════════════════════════════════════════════════════════╣
  ║/💻.📡/<: ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 🛰 ║
  ╚═════════════════════════════════════════════════════════════════════════════════╝
</code></pre>

<pre><code>
#-------------------------------------------------------------------------
# TENSORS ASCII POUR LE RENDU TERMINAL
# -------------------------------------------------------------------------

# Tenseur par défaut pour les bordures complexes, les coins et les croisements
- tensorBoprders="╔╗╚╝═║╠╣╦╩╬";

# Tenseur pour les remplacements et les connexions (pour les menus repliés)
- tensorReplie = "'├┤┬┴┼╠╣╩'-";

# Tenseur de rendu général (shades, barres, points)
- tensorRendu =" '─│·:░▒▓█'";

# NOUVEAU : Tenseur pour la création de tableaux et de cadres simples. 
# Contient les doubles lignes (bordures) et les connexions simples (contenu interne).
- tensorTableau = "╔╗╚╝═║├┤┬┴┼"; 

# NOUVEAU : Tenseur pour la création de graphiques et de barres de progression
- tensorChart = " ─│·░▒▓█";
</code></pre>

### 🎯 Mission du Projet

Plateforme citoyenne pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale**. L'objectif est de :
* Mobiliser numériquement pour un **boycottage massif** des grandes enseignes (Leclerc, Carrefour, Lidl, Intermarché, etc.).
* Financer une **caisse de manifestation** où 100% des fonds seront réinjectés dans les revenus et salaires des citoyens (objectif : +500€ à +5000€).
* Démontrer l'illégalité des politiques économiques actuelles via un **modèle d'économie circulaire**.
* Promouvoir le **Référendum d'Initiative Citoyenne (RIC)** pour la Justice Climatique, Sociale et une nouvelle procédure de Destitution (Art. 68).

### ✨ Fonctionnalités Clés

* **🖥️ Application de Bureau (Electron)** : Interface complète pour la visualisation et la gestion.
* **🌐 Serveur API Backend (Node.js/Express)** : Gère la logique métier, les données (JSON) et les services externes.
* **🤖 Bot Telegram (Telegraf)** : Point d'accès mobile pour infos, notifications, et IA.
* **🧠 Outils IA (Groq & Gemini)** : Génération d'images (caricatures, visions) et analyse de texte.
* **🗺️ Cartographie Avancée (Leaflet & Google Earth Engine)** : Points de ralliement, données géographiques.
* **📊 Tableau de Bord** : Suivi des indicateurs clés (fonds, participants, actions).
* **⚡ Workflow Automatisé (`Makefile`)** : Versionning, commits, synchronisation des données, notifications.

---

## 🏗️ Architecture Technique et Contrat API

Le projet adopte une architecture client-serveur découplée. La cohérence est assurée par le contrat API défini dans **`api-docs/swagger.yaml`**.

### 1. Structure Client-Serveur

<pre><code>
╔═════════════════════════╦═════════════════════════════════════════════════════════════════════════════════════╗
║ Composant               │ Fichier Clé           │ Rôle                                                        ║
╠─────────────────────────┼───────────────────────┼─────────────────────────────────────────────────────────────╣
║ Backend API             │ app.js (Express)      │ Assemblage des routeurs Express et exposition de l'API.     ║
║ Frontend Logique        │ docs/app.js           │ Gestion de l'état, routage des pages, et actions complexes. ║
║ Bot Telegram            │ telegramRouter.js     │ Interface conversationnelle interagissant avec le serveur.  ║
║ Contrat API             │ api-docs/swagger.yaml ║ Source de Vérité Unique définissant tous les endpoints.     ║
╚═════════════════════════╩═══════════════════════╩═════════════════════════════════════════════════════════════╝
</code></pre>

### 2. ⚙️ Constantes Techniques ASCII (Tensors)

Ces chaînes de caractères (tensors) sont désormais centralisées dans le module **`utils/ascii.js`** pour une gestion propre et optimisée.

<pre><code># Référence pour les tensors (voir utils/ascii.js pour la définition complète)
- tensorBoprders: Bordures complexes (╔╗╚╝═║╠╣╦╩╬)
- tensorReplie: Connexions pour les menus repliés ('├┤┬┴┼╠╣╩'-)
- tensorTableau: Bordures doubles et connexions simples pour les tableaux.
- tensorChart: Caractères de remplissage pour les barres de progression.
</code></pre>

---

## 📝 Bilan des Dernières Itérations (V1.0.4)

Nous avons stabilisé l'application front-end et formalisé le contrat API.

<pre><code>### ✅ Itérations Récemment Complétées

╔═══════════════════╦═══════════════════════╦════════════════════════════════════════════════════════════════════════════════════╗
║ Module             Tâche                  ║ Description de l'Amélioration                                                      ║
╠───────────────────┼───────────────────────┼────────────────────────────────────────────────────────────────────────────────────╣
║ Frontend/Routage  │ Routage Centralisé    │ Consolidation complète de la logique d'affichage dans window.handleUserAction.     ║
║ Mission/CVNU (P1) │ Page Robuste          │ Finalisation de missions.html/missions.js et correction du chargement asynchrone.  ║
║ Bot Telegram      │ /manifeste & /caisse  │ Implémentation du contenu détaillé pour /manifeste. Commande /caisse implémentée.  ║
║ Documentation (P3)│ Swagger (API)         │ Mise à jour exhaustive de swagger.yaml documentant les 8 endpoints du Dashboard.   ║
║ UI/UX             │ Modal Responsive      │ Correction CSS pour #modal-box (max-height: 90vh et overflow-y: auto).             ║
╚═══════════════════╩═══════════════════════╩════════════════════════════════════════════════════════════════════════════════════╝
</code></pre>

### 🛠️ Prochaines Étapes Planifiées

1. **P3 - Finalisation Dashboard :** Correction des fonctions asynchrones de `dashboard.js` et `modalDashboard.js` pour une gestion optimale des 8 endpoints.
2. **P4 - Cartographie :** Développement du nouveau `layerMap.js` et intégration de la logique de modale associée.

### 🚀 Démarrage Rapide

1. **Prérequis** : Node.js (v18+), Git, npm.
2. **Installation** :
<pre><code>git clone https://github.com/ia-local/d-bloquons_tout.git
cd d-bloquons_tout
npm install</code></pre>
3. **Variables d'environnement** : Créez un fichier `.env` à la racine (Nécessaires pour le Bot Telegram et les outils IA).
<pre><code>TELEGRAM_API_KEY="VOTRE_CLÉ_TELEGRAM"
ORGANIZER_GROUP_ID_CHAT="ID_DE_VOTRE_GROUPE_TELEGRAM"
GROQ_API_KEY="VOTRE_CLÉ_GROQ"
GEMINI_API_KEY="VOTRE_CLÉ_GEMINI"
API_BASE_URL="http://localhost:3000/api/beneficiaries"</code></pre>
*⚠️ Ajoutez `.env` à `.gitignore` !*

### ⚙️ Guide d'Utilisation (`Makefile`)

* **Lancer le serveur** : `make serveur` (démarrage sur `http://localhost:3000`).
* **Lancer le serveur et Electron** : `npm start`.
* **Documentation API** : `make docs` (ouvrez `http://localhost:3000/api-docs`).

### 📜 Licence

Ce projet est distribué sous la **Licence GNU**.