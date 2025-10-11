// docs/app.js - Logique Principale, Mocks de Données et Navigation (CORRECTION ASYNCHRONISME FINALE)

// Exposer les variables globales pour que home.js puisse y accéder
window.MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

// --- 1. SIMULATION DES DONNÉES JSON (MOCK DATA) ---
window.MOCK_DATA = {
    // Données du Dashboard (Simulé)
    '/api/dashboard/summary': { 
        totalTransactions: 4528, activeAlerts: 12, caisseSolde: 154800.75, boycottCount: 56, ricCount: 3, beneficiaryCount: 1250, monthlyAllocation: 123.84, estimatedManifestantCount: 3400
    },
    '/api/dashboard/utmi-insights': { 
        totalUTMI: 8945.54, totalTaxAvoided: 5200.00, taxCollectionSummary: {} 
    },
    '/smartContract/api/dashboard-data': {
        totalRecettes: 154800.75, totalDepenses: 62500.00, nombreBeneficiaires: 500, tresorerie: 92300.75
    },
    // Données de la Carte (Simulé)
    '/map/data/manifestations': [
        { id: 'm-001', name: 'Rassemblement', city: 'Paris', lat: 48.8566, lon: 2.3522, type: 'Prefecture', count: 1200, video_link: "https://www.youtube.com/watch?v=mock_video_paris" },
        { id: 'm-002', name: 'Rond-Point', city: 'Lyon', lat: 45.7578, lon: 4.8320, type: 'Rassemblement', count: 500, video_link: null },
        { id: 'm-003', name: 'Blocage', city: 'Marseille', lat: 43.2965, lon: 5.3813, type: 'Blocage', count: 850, video_link: null },
        { id: 'm-004', name: 'Boycott Carrefour', city: 'Bordeaux', lat: 44.8378, lon: -0.5792, type: 'Boycott', count: 200, video_link: "https://www.youtube.com/watch?v=mock_video_bordeaux" }
    ],
    // Données GEE (Simulé)
    '/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED?bands=B4,B3,B2&cloud_percentage=5': {
        mapid: 'mock_mapid_gee',
        token: 'mock_token_gee_12345',
        satelliteName: 'COPERNICUS/S2_SR_HARMONIZED (Simulé)'
    }
};

// Données du Telegram Router (Simulé)
window.MOCK_TELEGRAM_DATA = {
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


// --- 2. FONCTION UTILITAIRE DE SIMULATION ---

window.fetchData = async function(url) {
    console.log(`[Statique Mode] Simulation de l'appel à l'API: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    const data = window.MOCK_DATA[url];
    if (data) {
        return data;
    } else {
        if (url.startsWith('/api/gee/tiles/')) {
            return window.MOCK_DATA['/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED?bands=B4,B3,B2&cloud_percentage=5'];
        }
        console.error(`[Erreur Statique] Aucune donnée de simulation trouvée pour l'URL: ${url}`);
        return {}; 
    }
};


// --- 3. LOGIQUE DE NAVIGATION (setupNavigation) ---
document.addEventListener('DOMContentLoaded', function() {
    
    const navLinks = document.querySelectorAll('[data-page]');

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

        // --- ÉTAPE 2: FORCER LE RAFRAÎCHISSEMENT VISUEL & LANCER LE RENDU (ASYNCHRONE FORCÉ) ---
        
        // Fonction Wrapper pour gérer les appels de rendu dans un try/catch général
        const safeRenderCall = (renderFunc) => {
            try {
                if (typeof renderFunc === 'function') {
                    renderFunc(); 
                }
            } catch (e) {
                console.error(`Erreur lors du rendu de la page ${pageName}:`, e);
            }
        };

        // Utiliser setTimeout(0) pour forcer le navigateur à traiter la suppression/ajout de classe
        setTimeout(() => {
            // HACK DE FLUIDITÉ: Forcer le navigateur à recalculer les styles
            // Ceci est critique pour que l'élément positionné absolument (page) soit correctement affiché.
            activePage.style.display = 'block'; // Assurer l'affichage initial
            activePage.classList.add('active');
            
            if (currentActivePage) {
                 currentActivePage.style.display = 'none'; // Cacher l'ancienne page après le changement
            }
            
            activePage.style.display = ''; // Revenir à la règle CSS normale (display: block via .active)

            console.log(`[AFFICHAGE OK] Page visible: #${targetPageId}`);
            
            if (pageName === 'map') {
                 safeRenderCall(() => {
                     window.initMap(); 
                     // Assure le redimensionnement Leaflet après l'affichage
                     setTimeout(() => { 
                        if (window.globalMap) window.globalMap.invalidateSize(); 
                     }, 50); 
                 });
            } else if (pageName === 'dashboard') {
                safeRenderCall(window.loadDashboardData);
            } else if (pageName === 'settings') {
                safeRenderCall(window.loadTelegramContent);
            } else if (pageName === 'home') {
                safeRenderCall(window.loadHomePageContent);
            }
        }, 0); 
    }

    // Attacher les écouteurs d'événements
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log(`Navigation détectée pour: ${link.getAttribute('data-page')}`);
            
            // Annuler la navigation par défaut
            e.preventDefault();
            
            const pageName = link.getAttribute('data-page');
            showPage(pageName);
        });
    });
    
    // Démarrer sur la page 'home' par défaut
    showPage('home'); 
});
