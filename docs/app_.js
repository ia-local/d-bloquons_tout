// docs/app.js - Logique Principale et Navigation (VERSION DYNAMIQUE STABILISÉE)

// 🛑 Importation de la logique de Gamification depuis le composant dédié
import { updateProfileUI, grantReward, checkLevelUp, getNextLevelThreshold } from './modalProfile.js';

// Exposer les variables globales pour que home.js puisse y accéder
window.MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

// Exposition globale des fonctions pour la rétrocompatibilité
window.updateProfileUI = updateProfileUI; 
window.grantReward = grantReward;
window.checkLevelUp = checkLevelUp; 
window.getNextLevelThreshold = getNextLevelThreshold;

// --- 1. DONNÉES STATIQUES (TELEGRAM) ---
// Ces données sont conservées en front-end pour la configuration du bot/télégramme.
window.TELEGRAM_DATA = {
    topicLinks: {
        '🎨 Studio (Création)': 'https://t.me/c/2803900118/1232',
        '📝 Revendication (Détails)': 'https://t.me/c/2803900118/3',
        '🗳️ RIC (Référendum)': 'https://t.me/c/2803900118/329',
        '👥 Organisation (Planning)': 'https://t.me/c/2803900118/2',
        '🗺️ Cartes (Ralliement)': 'https://t.me/c/2803900118/991',
        '📄 Documents (Législation)': 'https://t.me/c/2803900118/13',
        '📞 Contacts (Presse/Élus)': 'https://t.me/c/2803900118/8',
        '⚖️ Auditions Libres': 'https://t.me/c/2803900118/491'
    },
    commands: [
        { cmd: '/start', desc: 'Revenir au menu principal du Bot.' },
        { cmd: '/topics', desc: 'Accéder directement aux salons de discussion Telegram.' },
        { cmd: '/manifeste', desc: 'Lire un extrait du manifeste du mouvement.' },
        { cmd: '/ric', desc: 'Tout savoir sur le Référendum d\'Initiative Citoyenne.' },
        { cmd: '/destitution', desc: 'Comprendre la procédure de destitution (Art. 68).' },
        { cmd: '/greve', desc: 'Infos pratiques sur la Grève du 10 Septembre 2025.' },
        { cmd: '/imagine [desc]', desc: 'Générer une image libre via l\'IA (Simulé).' },
        { cmd: '/caricature [desc]', desc: 'Générer une caricature politique via l\'IA (Simulé).' },
        { cmd: '/caricature_plainte', desc: 'Caricature automatisée sur la Plainte Pénale.' },
        { cmd: '/ai_vision', desc: 'Générer la vision IA de la Plainte Pénale.' },
        { cmd: '/galerie', desc: 'Accéder à la galerie des images générées.' },
        { cmd: '/stats', desc: 'Afficher les statistiques d\'utilisation du bot.' },
        { cmd: '/help', desc: 'Afficher toutes les commandes.' },
        { cmd: '/petition', desc: 'Lancer une nouvelle pétition citoyenne.' },
        { cmd: '/inviter', desc: 'Générer un lien d\'invitation.' }
    ]
};
// 🛑 Mappage des URLs API vers les noms de fichiers JSON locaux (sans l'extension)
const API_TO_FILE_MAP = {
    '/api/chronology/events': 'events',
    '/map/data/manifestations': 'manifestation_points_2_octobre',
    
    '/api/ric/data': 'ric_details',
    // 🛑 AJOUT N°1 : Mapping pour la liste active des RICs
    '/api/ric/active-list': 'rics', 
    // 🛑 AJOUT N°2 : Mapping pour le template de formulaire (si vous le chargez via fetchData)
    '/api/ric/form-template': 'ric_form_template', 
    
    '/api/dashboard/summary': 'dashboard_summary',
    '/api/dashboard/utmi-insights': 'utmi_insights',
    '/smartContract/api/dashboard-data': 'smartcontract_data',
    '/api/hq/finances': 'hq_finances',
    '/api/hq/revendications': 'hq_revendications',
    '/api/hq/actions': 'hq_actions',
    '/api/hq/users': 'hq_users',
    '/api/chat/history': 'chat_history',
    '/api/chat/message': 'chat_response',
    '/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED': 'gee_mock_data'
};

// --- 1.5. NOUVEAU: PROFIL D'AGENT (LOGIQUE DE JEU) ---
window.AGENT_PROFILE = {
    level: 1, 
    experience: 0, 
    energy: 100, 
    maxEnergy: 100,
    utmiCredits: 0, 
    missionsCompleted: 0,
    ricMissionSubmitted: false,
    dashboardVeilleCompleted: false 
};

// --- 2. FONCTION UTILITAIRE DE RÉCUPÉRATION DE DONNÉES (Fetch Réel) ---

window.fetchData = async function(url, method = 'GET', body = null) {
    console.log(`[Mode API] Tentative d'appel à l'API: ${url}`);
    
    const cleanUrlForListCheck = url.includes('?') ? url.substring(0, url.indexOf('?')) : url;

    // 🛑 CORRECTION : Ajout de '/api/ric/active-list' à la liste des endpoints qui DOIVENT retourner un tableau.
    const isListEndpoint = cleanUrlForListCheck.includes('/events') 
        || cleanUrlForListCheck.includes('/manifestations') 
        || cleanUrlForListCheck.includes('/api/rics') 
        || cleanUrlForListCheck.includes('/beneficiaries') 
        || cleanUrlForListCheck.includes('/api/chat/history')
        || cleanUrlForListCheck === '/api/ric/active-list' // <--- NOUVEAU
        || cleanUrlForListCheck === '/api/hq/users'; 

    let data;
    let fallbackUsed = false;

    try {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
        if (body) { options.body = JSON.stringify(body); }

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Erreur réseau ou format de réponse invalide.' }));
            throw new Error(`Erreur HTTP ${response.status}: ${errorBody.error || errorBody.message} pour ${url}`);
        }
        data = await response.json();
        
    } catch (error) {
        console.error(`[Erreur Fetch] Échec de la récupération des données pour l'URL: ${url}`, error);
        
        // --- TENTATIVE DE MODE DE SECOURS LOCAL ---
        if (method === 'GET') {
            const cleanUrl = url.includes('?') ? url.substring(0, url.indexOf('?')) : url;
            const fileNameRoot = API_TO_FILE_MAP[cleanUrl] || API_TO_FILE_MAP[url]; 

            if (fileNameRoot) {
                const localPath = `src/json/${fileNameRoot}.json`;
                try {
                    const localResponse = await fetch(localPath);
                    if (localResponse.ok) {
                        data = await localResponse.json();
                        fallbackUsed = true;
                        console.warn(`[MODE SECOURS] Chargement réussi du fichier local : ${localPath}`);
                    }
                } catch (localError) {
                    console.error(`[MODE SECOURS ÉCHEC] Le fichier local ${localPath} n'a pas pu être chargé.`, localError);
                }
            }
        }
    }
    
    // --- 🛑 LOGIQUE DE NORMALISATION ET DE VÉRIFICATION DE SÉCURITÉ UNIVERSELLE ---
    
    if (data) {
        if (cleanUrlForListCheck.includes('/map/data/manifestations') && !Array.isArray(data) && Array.isArray(data.manifestation_points)) {
            data = data.manifestation_points;
            console.warn(`[NORMALISATION] Format manifestation_points extrait de la réponse ${fallbackUsed ? 'de secours' : 'API'}.`);
        }
        
        // VÉRIFICATION DE SÉCURITÉ FINALE : Assure que les listes sont bien des tableaux.
        if (isListEndpoint && !Array.isArray(data)) {
            console.error(`[SÉCURITÉ] L'endpoint ${url} a retourné un objet au lieu d'un tableau. Conversion forcée en tableau vide.`);
            return []; 
        }
        
        return data;
    }

    // --- RETOUR DE STABILITÉ CRITIQUE FINAL ---
    if (isListEndpoint) {
         console.warn(`[STABILITÉ] Retour d'un tableau vide pour éviter le crash UI.`);
        return []; 
    }

    return {}; 
};


// --- 3. LOGIQUE DE NAVIGATION (setupNavigation) ---
document.addEventListener('DOMContentLoaded', function() {
    
    const navLinks = document.querySelectorAll('[data-page]');
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    if (userMenuToggle && userMenuDropdown) { /* ... (Logique inchangée) ... */ }

    // Exposer showPage globalement (utile pour missions.js)
    window.showPage = function(pageName) {
        // ... (Logique de navigation et safeRenderCall inchangée) ...

    // Logique du menu utilisateur (inchangée)
    if (userMenuToggle && userMenuDropdown) { 
        userMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userMenuDropdown.classList.toggle('hidden');
        });
        // ... (Gestion de la fermeture du menu utilisateur inchangée) ...
        userMenuDropdown.querySelectorAll('a').forEach(link => {
             // ... (Gestion des actions utilisateur inchangée) ...
        });
    }

    // 🛑 NOUVEAU BLOC : Logique pour le menu radial des couches de la carte
    const mapLayersToggle = document.getElementById('road-map');
    const mapLayersMenu = document.getElementById('map-layers-menu'); 
    
    if (mapLayersToggle && mapLayersMenu) {
        mapLayersToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            // 🛑 Bascule de la classe 'hidden' pour afficher/masquer le menu radial
            mapLayersMenu.classList.toggle('hidden');
        });

        // Fermer le menu si l'utilisateur clique n'importe où ailleurs
        document.addEventListener('click', (e) => {
            if (!mapLayersMenu.contains(e.target) && !mapLayersToggle.contains(e.target)) {
                mapLayersMenu.classList.add('hidden');
            }
        });

        // 🛑 Gestion des actions/bascules dans le menu des couches (boutons du menu radial)
        mapLayersMenu.querySelectorAll('button').forEach(button => {
             button.addEventListener('click', (e) => {
                 e.preventDefault();
                 e.stopPropagation(); 
                 
                 const action = button.getAttribute('data-map-action');
                 const layerToggle = button.getAttribute('data-map-layer-toggle');
                 
                 // Fermer le menu après une action
                 mapLayersMenu.classList.add('hidden'); 
                 
                 if (action && window.handleMapAction) {
                     // Gère les actions gamifiées (recharge, scan) définies dans map.js
                     window.handleMapAction(action);
                 } else if (layerToggle && window.toggleMapLayer) {
                     // Gère la bascule des couches (manifestations, gee-satellite) définies dans map.js
                     window.toggleMapLayer(layerToggle);
                     
                     // 💡 Mise à jour de l'état visuel du bouton de bascule
                     button.classList.toggle('active-layer');
                 } else {
                     console.error(`Erreur: Fonction handleMapAction ou toggleMapLayer manquante.`);
                 }
             });
        });
    }


        const safeRenderCall = (renderFunc) => {
            try {
                if (typeof renderFunc === 'function') {
                    renderFunc(); 
                }
            } catch (e) {
                console.error(`Erreur lors du rendu de la page ${pageName}:`, e);
            }
        };

        // --- DÉCLENCHEMENT DU RENDU SPÉCIFIQUE ---
        
        if (pageName === 'map') {
            safeRenderCall(() => {
                console.log("➡️ Entrée dans le **Module de Cartographie**. Lancement du Scan du Terrain.");
                if (window.initMap) {
                    window.initMap(); 
                    setTimeout(() => { 
                       if (window.globalMap) window.globalMap.invalidateSize(); 
                    }, 50); 
                }
            });
        } else if (pageName === 'dashboard') {
            safeRenderCall(window.loadDashboardData);
            console.log("➡️ Accès au **Tableau de Bord Stratégique**. Vérification des Finances et Statistiques de Ralliement.");
        } else if (pageName === 'settings') {
            safeRenderCall(window.loadMissionsContent); 
        } else if (pageName === 'ric') {
            safeRenderCall(window.loadRICContent);
        } else if (pageName === 'home') {
            safeRenderCall(window.loadHomePageContent);
        }
    }

    // Attacher les écouteurs d'événements
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log(`Navigation détectée pour: ${link.getAttribute('data-page')}`);
            
            e.preventDefault();
            
            const pageName = link.getAttribute('data-page');
            window.showPage(pageName);
        });
    });
    
    // Démarrer sur la page 'home' par défaut
    window.showPage('home'); 
    
    // 🛑 Initialisation de l'affichage du profil au démarrage (via la fonction importée)
    if (window.updateProfileUI) {
        window.updateProfileUI();
    }
});