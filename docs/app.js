// docs/app.js - Logique Principale et Navigation (VERSION DYNAMIQUE)
// L'intégralité des données est désormais chargée via l'API, avec un mode de secours pour les fichiers JSON locaux.

// Exposer les variables globales pour que home.js puisse y accéder
window.MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

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

// Mappage des URLs API vers les noms de fichiers JSON locaux (sans l'extension)
const API_TO_FILE_MAP = {
    '/api/chronology/events': 'events',
    '/map/data/manifestations': 'manifestation_points_2_octobre',
    '/api/ric/data': 'ric_details',
    '/api/dashboard/summary': 'dashboard_summary',
    '/api/dashboard/utmi-insights': 'utmi_insights',
    '/smartContract/api/dashboard-data': 'smartcontract_data',
    // Ajoutez ici d'autres mappings si nécessaire
};

// --- 2. FONCTION UTILITAIRE DE RÉCUPÉRATION DE DONNÉES (Fetch Réel) ---

/**
 * Fonction pour faire des appels API réels au serveur.
 * Gère les erreurs et fournit un mode de secours local pour la phase de transition.
 */
window.fetchData = async function(url, method = 'GET', body = null) {
    console.log(`[Mode API] Tentative d'appel à l'API: ${url}`);
    
    // Identifie les endpoints qui doivent retourner un tableau (pour les fonctions .sort() et .forEach())
    const isListEndpoint = url.includes('/events') || url.includes('/manifestations') || url.includes('/api/rics') || url.includes('/beneficiaries');
    let data;

    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) { options.body = JSON.stringify(body); }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Erreur réseau ou format de réponse invalide.' }));
            throw new Error(`Erreur HTTP ${response.status}: ${errorBody.error || errorBody.message} pour ${url}`);
        }

        data = await response.json();
        return data;
        
    } catch (error) {
        console.error(`[Erreur Fetch] Échec de la récupération des données pour l'URL: ${url}`, error);
        
        // --- TENTATIVE DE MODE DE SECOURS LOCAL ---
        if (method === 'GET') {
            
            // Cherche le nom de fichier correspondant dans la map, en ignorant les query params
            const cleanUrl = url.split('?')[0]; 
            const fileNameRoot = API_TO_FILE_MAP[cleanUrl]; 

            if (fileNameRoot) {
                const localPath = `src/json/${fileNameRoot}.json`;
                try {
                    const localResponse = await fetch(localPath);
                    if (localResponse.ok) {
                        data = await localResponse.json();
                        console.warn(`[MODE SECOURS] Chargement réussi du fichier local : ${localPath}`);
                        return data;
                    }
                } catch (localError) {
                    console.error(`[MODE SECOURS ÉCHEC] Le fichier local ${localPath} n'a pas pu être chargé.`, localError);
                }
            }
        }

        // --- RETOUR DE STABILITÉ CRITIQUE ---
        // Si tout échoue, renvoie le type de structure attendu.
        if (isListEndpoint) {
             console.warn(`[STABILITÉ] Retour d'un tableau vide pour éviter le crash UI (e.g. .sort() échoue).`);
            return []; 
        }

        // Pour les objets uniques (dashboards, GEE, RIC data, etc.), retourne un objet vide.
        return {}; 
    }
};


// --- 3. LOGIQUE DE NAVIGATION (setupNavigation) ---
document.addEventListener('DOMContentLoaded', function() {
    
    const navLinks = document.querySelectorAll('[data-page]');
    
    // 🛑 ÉLÉMENTS DU MENU UTILISATEUR
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    // 🛑 LOGIQUE D'AFFICHAGE DU MENU UTILISATEUR
    if (userMenuToggle && userMenuDropdown) {
        userMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userMenuDropdown.classList.toggle('hidden');
        });

        // Fermer le menu si l'utilisateur clique n'importe où ailleurs
        document.addEventListener('click', (e) => {
            if (!userMenuDropdown.contains(e.target) && !userMenuToggle.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });

        // Gestion des actions du menu (gamification)
        userMenuDropdown.querySelectorAll('a').forEach(link => {
             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 const action = link.getAttribute('data-action');
                 
                 // CONSOLE LOG DE CONTRÔLE 
                 console.log(`Action Utilisateur demandée: ${action}`); 
                 
                 userMenuDropdown.classList.add('hidden'); 
                 
                 // Appel de la modale (logique dans modalGestion.js)
                 if (window.handleUserAction) {
                     window.handleUserAction(action);
                 } else {
                     // Alerte de sécurité si le fichier modalGestion.js n'est pas chargé
                     console.error(`Erreur: La fonction handleUserAction n'est pas chargée. Impossible de gérer l'action ${action}.`);
                 }
             });
        });
    }

    // --- LOGIQUE DE NAVIGATION DE BASE (MISE À JOUR) ---

    function showPage(pageName) {
        // 1. Gérer les liens actifs (Footer et Aside) - Doit être synchrone
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) link.classList.add('active');
        });

        // Trouver la page active actuelle et la retirer
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

        // Simplification: On applique la classe 'active' directement (CSS gère l'affichage)
        activePage.classList.add('active');

        console.log(`[AFFICHAGE OK] Page visible: #${targetPageId}`);
        
        // Fonction Wrapper pour gérer les appels de rendu
        const safeRenderCall = (renderFunc) => {
            try {
                if (typeof renderFunc === 'function') {
                    // On appelle la fonction de rendu sans délai pour la fluidité
                    renderFunc(); 
                }
            } catch (e) {
                console.error(`Erreur lors du rendu de la page ${pageName}:`, e);
            }
        };

        // --- DÉCLENCHEMENT DU RENDU SPÉCIFIQUE ---
        
        if (pageName === 'map') {
            safeRenderCall(() => {
                window.initMap(); 
                // Le invalidateSize doit conserver un petit délai pour Leaflet
                setTimeout(() => { 
                   if (window.globalMap) window.globalMap.invalidateSize(); 
                }, 50); 
            });
        } else if (pageName === 'dashboard') {
            safeRenderCall(window.loadDashboardData);
        } else if (pageName === 'settings') {
            safeRenderCall(window.loadTelegramContent);
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
            showPage(pageName);
        });
    });
    
    // Démarrer sur la page 'home' par défaut
    showPage('home'); 
});
