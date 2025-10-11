// docs/map.js - VERSION COMPLÈTE AVEC SIMULATION TÉLÉGRAM (Mode Statique)

const MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

let map = null; 

// --- 1. SIMULATION DES DONNÉES JSON (MOCK DATA) ---

const MOCK_DATA = {
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
    ]
};

// Données du Telegram Router (Simulé)
const MOCK_TELEGRAM_DATA = {
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
        { cmd: '/galerie', desc: 'Accéder à la galerie des images générées.' },
        { cmd: '/stats', desc: 'Afficher les statistiques d\'utilisation du bot.' },
        { cmd: '/help', desc: 'Afficher toutes les commandes.' },
    ]
};

// --- 2. FONCTIONS DE SIMULATION ET DE LA CARTE ---

async function fetchData(url) {
    console.log(`[Statique Mode] Simulation de l'appel à l'API: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    const data = MOCK_DATA[url];
    if (data) {
        return data;
    } else {
        // Logique pour les données simulées qui n'ont pas une clé directe (e.g., GEE)
        if (url.startsWith('/api/gee/tiles/')) {
            return MOCK_DATA['/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED?bands=B4,B3,B2&cloud_percentage=5'];
        }
        console.error(`[Erreur Statique] Aucune donnée de simulation trouvée pour l'URL: ${url}`);
        throw new Error("Données de simulation non trouvées.");
    }
}

// (Les fonctions initMap, loadGeeTiles, loadManifestationPoints restent inchangées 
// et utilisent fetchData ci-dessus. Voir la réponse précédente pour leur contenu.)

async function initMap() { /* ... Contenu inchangé de la réponse précédente ... */ }
async function loadGeeTiles() { /* ... Contenu inchangé de la réponse précédente ... */ }
async function loadManifestationPoints() { /* ... Contenu inchangé de la réponse précédente ... */ }
async function loadDashboardData() { /* ... Contenu inchangé de la réponse précédente ... */ }


// --- 3. RENDU DE LA PAGE TÉLÉGRAM (NOUVEAU) ---
// Partie à mettre à jour dans votre fichier map.js
function loadTelegramContent() {
    const container = document.getElementById('telegram-content-container');
    if (container.hasLoaded) return; 

    // Données des topics (inchangées)
    const topicHtml = `
        <div class="content quick-start" style="transform: none;">
            <h3 class="font-yellow">🔗 Salons de Discussion Telegram (TOPICS)</h3>
            <p>Accès direct aux salons de discussion dédiés à l'organisation du mouvement.</p>
            <div class="feature-grid" style="margin-top: 15px;">
                ${Object.entries(MOCK_TELEGRAM_DATA.topicLinks).map(([label, url]) => `
                    <div class="feature-card" style="transform: none; text-align: center; background: #f9e25b; color: #1a1a1a;">
                        <h4>${label}</h4>
                        <a href="${url}" target="_blank" class="btn btn-primary" style="margin-top: 10px; padding: 5px 10px;">Accéder au Salon</a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Structure HTML pour la pagination des commandes
    const commandsHtmlStructure = `
        <div class="content quick-start" style="transform: none; margin-top: 30px;">
            <h3 class="font-red">🤖 Commandes de l'Assistant Bot (Simulation Pagination)</h3>
            <p>Liste paginée des commandes IA et d'information disponibles.</p>
            <table>
                <thead>
                    <tr><th>Commande</th><th>Description</th></tr>
                </thead>
                <tbody id="commands-list-body">
                    </tbody>
            </table>
            <div id="commands-pagination-controls" style="text-align: center; margin-top: 15px;">
                </div>
        </div>
    `;

    container.innerHTML = topicHtml + commandsHtmlStructure;

    // --- LOGIQUE DE PAGINATION ---

    const listContainer = document.getElementById('commands-list-body');
    const controlsContainer = document.getElementById('commands-pagination-controls');

    // Fonction de rendu d'un élément de commande (correspond au <tbody>)
    const commandRenderer = (item) => {
        return `
            <tr>
                <td class="font-yellow break-word" style="font-weight: bold;">${item.cmd}</td>
                <td>${item.desc}</td>
            </tr>
        `;
    };

    // Appel de la fonction globale de pagination
    // Assurez-vous que la fonction window.initializePagination est définie par pagination.js
    if (window.initializePagination) {
        window.initializePagination(
            MOCK_TELEGRAM_DATA.commands,
            listContainer,
            controlsContainer,
            commandRenderer
        );
    } else {
        // Fallback si le script de pagination n'est pas chargé
        listContainer.innerHTML = '<tr><td colspan="2" class="font-red">Erreur: Script de pagination non chargé.</td></tr>';
    }

    container.hasLoaded = true;
}


// --- 4. NAVIGATION (MISE À JOUR) ---

function setupNavigation() {
    const navLinks = document.querySelectorAll('#bottom-navigation-menu a');
    
    function showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => { page.classList.remove('active'); });
        const activePage = document.getElementById(`${pageName}-page`);
        if (activePage) activePage.classList.add('active');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) link.classList.add('active');
        });
        
        if (pageName === 'map') {
             initMap();
             setTimeout(() => { map && map.invalidateSize(); }, 50); 
        } else if (pageName === 'dashboard') {
            loadDashboardData();
        } else if (pageName === 'settings') { // Appel de la nouvelle fonction
            loadTelegramContent(); 
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            showPage(pageName);
        });
    });
    
    showPage('map');
}

document.addEventListener('DOMContentLoaded', setupNavigation);