// docs/app.js - Logique Principale et Navigation (VERSION FINALE ET ROBUSTE)

// 🛑 Importation de la logique de Gamification depuis le composant dédié
import { updateProfileUI, grantReward, checkLevelUp, getNextLevelThreshold } from './modalProfile.js';

// --- NOUVEAU: GESTION DES MODES D'ÉTAT GLOBALES ---
window.APP_STATE = {
    MODE: '/session', 
    LOG_LEVEL: 'warn', 
    IS_DEV: false
};

window.setAppState = function(mode) {
    const validModes = ['/dev', '/focus', '/active', '/session'];
    if (!validModes.includes(mode)) {
        console.warn(`[STATE] Mode d'état inconnu: ${mode}. L'état n'a pas été modifié.`);
        return;
    }
    
    window.APP_STATE.MODE = mode;
    window.APP_STATE.IS_DEV = mode === '/dev';

    if (mode === '/dev') {
        window.APP_STATE.LOG_LEVEL = 'debug';
        console.log("🚦 Mode DEV activé: Logs détaillés.");
    } else if (mode === '/focus') {
        window.APP_STATE.LOG_LEVEL = 'info';
        console.log("🚦 Mode FOCUS activé: Concentré.");
    } else {
        window.APP_STATE.LOG_LEVEL = 'warn';
        console.log(`🚦 Mode SESSION activé: Logs de base.`);
    }
    
    if (window.initDevTools) {
        window.initDevTools(window.APP_STATE.IS_DEV);
    }
};

// Exposer les variables globales
window.MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

// Exposition globale des fonctions
window.updateProfileUI = updateProfileUI; 
window.grantReward = grantReward;
window.checkLevelUp = checkLevelUp; 
window.getNextLevelThreshold = getNextLevelThreshold;

// --- 1. DONNÉES STATIQUES (MAPPAGE API & PROFIL) ---
window.TELEGRAM_DATA = { /* ... */ };
const API_TO_FILE_MAP = {
    '/api/chronology/events': 'events',
    '/map/data/manifestations': 'manifestation_points_2_octobre',
    '/api/ric/data': 'ric_details',
    '/api/ric/active-list': 'rics', 
    '/api/ric/form-template': 'ric_form_template', 
    '/api/dashboard/summary': 'dashboard_summary',
    '/api/dashboard/utmi-insights': 'utmi_insights',
    '/smartContract/api/dashboard-data': 'smartcontract_data',
    '/api/hq/finances': 'finances',
    '/api/hq/revendications': 'revendications',
    '/api/hq/actions': 'actions',
    '/api/hq/users': 'users',
    '/api/chat/history': 'chat_history',
    '/api/chat/message': 'chat_response',
    '/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED': 'gee_mock_data'
};
window.AGENT_PROFILE = {
    level: 1, experience: 0, energy: 100, maxEnergy: 100, utmiCredits: 0, 
    missionsCompleted: 0, ricMissionSubmitted: false, dashboardVeilleCompleted: false 
};


// 🛑 FONCTION DE SECOURS: Tente de charger le JSON local (Correction du chemin relative)
async function attemptLocalFallback(originalUrl, originalMethod) {
    let data = null;
    
    if (originalMethod === 'GET') {
        const cleanUrl = originalUrl.includes('?') ? originalUrl.substring(0, originalUrl.indexOf('?')) : originalUrl;
        const fileNameRoot = API_TO_FILE_MAP[cleanUrl] || API_TO_FILE_MAP[originalUrl]; 

        if (fileNameRoot) {
            // 🛑 CHEMIN RELATIF SIMPLE (Le plus robuste pour les serveurs statiques)
            const localPath = `src/json/${fileNameRoot}.json`; 
            try {
                const localResponse = await fetch(localPath);
                
                if (localResponse.ok) {
                    data = await localResponse.json();
                    if (window.APP_STATE.LOG_LEVEL !== 'error') {
                        console.warn(`[MODE SECOURS SUCCÈS] Chargement réussi de : ${localPath}`);
                    }
                } else {
                     console.error(`[MODE SECOURS ÉCHEC FATAL] Fichier ${localPath} non trouvé (Statut: ${localResponse.status}).`);
                }
            } catch (localError) {
                console.error(`[MODE SECOURS ÉCHEC CRITIQUE] Erreur réseau lors du chargement local.`, localError);
            }
        }
    }
    return { data };
}


// --- 2. FONCTION UTILITAIRE DE RÉCUPÉRATION DE DONNÉES (Fetch Réel - Corrigé) ---

window.fetchData = async function(url, method = 'GET', body = null) {
    if (window.APP_STATE.LOG_LEVEL === 'debug') {
        console.log(`[Mode API] Tentative d'appel à l'API: ${url}`);
    }
    
    let data = null;
    const cleanUrlForListCheck = url.includes('?') ? url.substring(0, url.indexOf('?')) : url;
    const isListEndpoint = cleanUrlForListCheck.includes('/events') 
        || cleanUrlForListCheck.includes('/manifestations') 
        || cleanUrlForListCheck.includes('/api/rics') 
        || cleanUrlForListCheck.includes('/beneficiaries') 
        || cleanUrlForListCheck.includes('/api/chat/history')
        || cleanUrlForListCheck === '/api/ric/active-list';
    
    let apiFailed = false;

    // TENTATIVE DE FETCH RÉEL
    try {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
        if (body) { options.body = JSON.stringify(body); }

        const response = await fetch(url, options);

        if (response.ok) {
            data = await response.json();
        } else {
            apiFailed = true;
        }

    } catch (error) {
        console.error(`[Erreur Fetch] Échec lors de la requête API pour l'URL: ${url}`, error);
        apiFailed = true;
    }

    // --- LOGIQUE DE SECOURS ---
    if (apiFailed) {
        const fallbackResult = await attemptLocalFallback(url, method);
        data = fallbackResult.data;
    }
    
    // --- 🛑 LOGIQUE DE NORMALISATION ET DE VÉRIFICATION DE SÉCURITÉ UNIVERSELLE ---
    
    if (data) {
        if (cleanUrlForListCheck.includes('/map/data/manifestations') && !Array.isArray(data) && Array.isArray(data.manifestation_points)) {
            data = data.manifestation_points;
            if (window.APP_STATE.LOG_LEVEL !== 'warn') {
                 console.warn(`[NORMALISATION] Format manifestation_points extrait.`);
            }
        }
        
        if (isListEndpoint && !Array.isArray(data)) {
            console.error(`[SÉCURITÉ] L'endpoint ${url} a retourné un objet au lieu d'un tableau. Conversion forcée en tableau vide.`);
            return []; 
        }
        
        return data;
    }

    if (isListEndpoint) {
         if (window.APP_STATE.LOG_LEVEL !== 'error') {
            console.warn(`[STABILITÉ] Retour d'un tableau vide pour éviter le crash UI.`);
         }
        return []; 
    }

    return {}; 
};


// --- 3. LOGIQUE DE NAVIGATION (setupNavigation) ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 🛑 Utiliser /DEV ou /FOCUS au démarrage sur un environnement statique pour garantir le fallback.
    window.setAppState('/dev'); 
    
    const navLinks = document.querySelectorAll('[data-page]');
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    // 🛑 Fonction de gestion unifiée des interactions (Cerveau de l'IA)
    window.handleGlobalInteraction = function(context, type, value) {
        
        if (context === 'profile') {
            if (window.handleUserAction) {
                window.handleUserAction(value);
            } else {
                console.error(`[INTENT] handleUserAction non chargé pour l'action ${value}.`);
            }
        
        } else if (context === 'map') {
            if (type === 'action' && window.handleMapAction) {
                window.handleMapAction(value);
            } else if (type === 'layer' && window.toggleMapLayer) {
                window.toggleMapLayer(value);
            } else {
                 console.error(`[INTENT] Fonction de carte (${type}) non chargée pour l'action ${value}.`);
            }
        }
        
        // Fermeture des menus après interaction
        const mapLayersToggle = document.getElementById('road-map'); 
        const mapLayersMenu = document.getElementById('map-layers-menu'); 
        
        if (context === 'profile' && userMenuDropdown) {
             userMenuDropdown.classList.add('hidden'); 
        } else if (context === 'map' && mapLayersMenu) {
             mapLayersMenu.classList.add('hidden');
             if (mapLayersToggle) mapLayersToggle.classList.remove('fab-open');
        }
    }

    // --- 3.1 INITIALISATION DU MENU UTILISATEUR ---
    if (userMenuToggle && userMenuDropdown) { 
        userMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userMenuDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!userMenuDropdown.contains(e.target) && !userMenuToggle.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });
        userMenuDropdown.querySelectorAll('a').forEach(link => {
             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 e.stopPropagation(); 
                 const action = link.getAttribute('data-action');
                 window.handleGlobalInteraction('profile', 'action', action);
             });
        });
    }

    // --- 3.2 INITIALISATION DU MENU RADIAL DE LA CARTE ---
    const mapLayersToggle = document.getElementById('road-map'); 
    const mapLayersMenu = document.getElementById('map-layers-menu'); 
    
    if (mapLayersToggle && mapLayersMenu) {
        mapLayersToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            mapLayersMenu.classList.toggle('hidden');
            mapLayersToggle.classList.toggle('fab-open'); 
        });

        document.addEventListener('click', (e) => {
            if (!mapLayersMenu.contains(e.target) && !mapLayersToggle.contains(e.target)) {
                mapLayersMenu.classList.add('hidden');
                mapLayersToggle.classList.remove('fab-open'); 
            }
        });
    }

    // --- 3.3 LOGIQUE DE NAVIGATION PRINCIPALE ---
    window.showPage = function(pageName) {
        
        // Logique de mise à jour de la classe 'active' pour la navigation
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) link.classList.add('active');
        });

        const currentActivePage = document.querySelector('.page.active');
        if (currentActivePage) {
             currentActivePage.classList.remove('active');
        }

        const targetPageId = `${pageName}-page`;
        const activePage = document.getElementById(targetPageId);
        
        if (!activePage) {
            console.error(`Erreur critique: La page ${pageName} (${targetPageId}) n'a pas été trouvée dans le DOM.`);
            return;
        }

        activePage.classList.add('active');
        if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log(`[AFFICHAGE OK] Page visible: #${targetPageId}`);
        
        const safeRenderCall = (renderFunc) => {
            try {
                if (typeof renderFunc === 'function') {
                    renderFunc(); 
                }
            } catch (e) {
                console.error(`Erreur lors du rendu de la page ${pageName}:`, e);
            }
        };

        if (pageName === 'map') {
            safeRenderCall(() => {
                if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log("➡️ Entrée dans le **Module de Cartographie**.");
                if (window.initMap) {
                    window.initMap(); 
                    setTimeout(() => { 
                       if (window.globalMap) window.globalMap.invalidateSize(); 
                    }, 50); 
                }
            });
        } else if (pageName === 'dashboard') {
            safeRenderCall(window.loadDashboardData);
            if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log("➡️ Accès au **Tableau de Bord Stratégique**.");
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
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            window.showPage(pageName);
        });
    }); 
    window.showPage('home'); 
    
    if (window.updateProfileUI) {
        window.updateProfileUI();
    }
});