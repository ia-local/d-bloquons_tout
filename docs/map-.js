// docs/map.js - VERSION FINALE STABILISÉE

const MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

let map = null; 
window.globalMap = map;

// --- 1. SIMULATION DES DONNÉES JSON (MOCK DATA) ---
const MOCK_DATA = {
    // Données de base (pour la compatibilité avec dashboard.js)
    '/api/dashboard/summary': { totalTransactions: 4528, activeAlerts: 12, caisseSolde: 154800.75, boycottCount: 56, ricCount: 3, beneficiaryCount: 1250, monthlyAllocation: 123.84, estimatedManifestantCount: 3400 },
    '/api/dashboard/utmi-insights': { totalUTMI: 8945.54, totalTaxAvoided: 5200.00, taxCollectionSummary: {} },
    '/smartContract/api/dashboard-data': { totalRecettes: 154800.75, totalDepenses: 62500.00, nombreBeneficiaires: 500, tresorerie: 92300.75 },
    
    // Données de la Carte (Simulé)
    '/map/data/manifestations': [
        // Points de démonstration pour le filtrage par type
        { "city": "Caen", "lat": 49.183333, "lon": -0.350000, "count": 6000, "type": "Manifestation" },
        { "city": "Rennes", "lat": 48.111979, "lon": -1.681864, "count": 15000, "type": "Rassemblement" },
        { "city": "Grenoble", "lat": 45.185, "lon": 5.725, "count": 30000, "type": "Manifestation" },
        { "city": "Marseille", "lat": 43.2961, "lon": 5.3699, "count": "Plusieurs milliers", "type": "Blocage" },
        { "city": "Bordeaux", "lat": 44.8378, "lon": -0.5792, "count": 200, "type": 'Boycott' }
    ],
    // MOCK SIMPLIFIÉ POUR LES ENDPOINTS HQ
    '/api/hq/finances': { caisseSolde: 154800.75, beneficiaryCount: 1250 },
    '/api/hq/revendications': { ricsActifs: 3, petitionsEnCours: 5 },
    '/api/hq/actions': { actionsTotales: 42, boycottsCommerce: 10 },
    '/api/hq/users': []
};
// --- 1.5. NOUVEAU: COÛT DES ACTIONS (LOGIQUE DE JEU) ---
const ACTION_COSTS = {
    ANALYZE_TARGET: 10, // Coût en Énergie d'Action pour analyser un point
    SCAN_SECTOR: 5,     // Coût pour changer le jeu de données (filtre) ou zoomer
    RECHARGE_BASE: 50   // Coût en UTMI pour recharger la moitié de l'énergie
};
// --- 2. FONCTIONS DE SIMULATION ET DE LA CARTE (Mode Statique) ---

// Fonction de simulation locale des appels API (utilisée lorsque window.fetchData n'existe pas)
async function fetchData(url) {
    console.log(`[Statique Mode] Simulation de l'appel à l'API: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (url.startsWith('/api/gee/tiles/')) {
        return { mapid: 'mock_map_id', token: 'mock_token', satelliteName: 'Sentinel-2 (MOCK)' };
    }

    const data = MOCK_DATA[url];
    if (data) {
        return data; 
    } 

    if (url.includes('/map/data/') || url.includes('/api/')) {
        return [];
    }
    
    console.error(`[Erreur Statique] Aucune donnée de simulation trouvée pour l'URL: ${url}`);
    throw new Error("Données de simulation non trouvées.");
}

// Fonction de normalisation (rendue globale pour la compatibilité avec app.js et config/leaflet.js)
function normalizeManifestationData(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'object' && data !== null && Array.isArray(data.manifestation_points)) {
        return data.manifestation_points;
    }
    return [];
}
window.normalizeManifestationData = normalizeManifestationData;


// --- 3. LOGIQUE DU CONTRÔLE DE LÉGENDE (Seulement les dépendances) ---

// Les classes L.Control.CategoryLegend et L.control.categoryLegend sont définis dans config/leaflet.js.
// Nous nous assurons ici que les autres fonctions nécessaires existent pour l'exécution.

// --- 4. FONCTIONS PRINCIPALES DE CARTE ET NAVIGATION ---

// Fonction Synchrone d'initialisation du DOM et des contrôles de Leaflet
function _initializeMapCore() {
    const mapElement = document.getElementById('map');
    
    // 🛑 VÉRIFICATION CRITIQUE DE LA DÉPENDANCE
    if (!mapElement || typeof L === 'undefined') {
        console.error("Échec de l'initialisation de la carte: #map ou Leaflet (L) est manquant.");
        return; 
    }

    if (map !== null) {
        return;
    }

    map = L.map('map', {
        center: MAP_CONFIG.DEFAULT_CENTER,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
    });
    window.globalMap = map; 

    // COUCHE FOND DE CARTE OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
    }).addTo(map);

    // 🛑 MARQUEUR DE RÉFÉRENCE (TEST) - AJOUT SYNCHRONE
    L.marker([48.8656, 2.3251]).addTo(map) // Place de la Concorde, Paris
        .bindPopup("<b>Marqueur Test: Place de la Concorde</b><br>Si vous voyez ceci, Leaflet fonctionne !").openPopup();

    // 🛑 AJOUT DU CONTRÔLE DE LÉGENDE - AJOUT SYNCHRONE
    if (L.control.categoryLegend) {
         L.control.categoryLegend({ position: 'bottomright' }).addTo(map); 
    } else {
         console.error("Le contrôle de légende n'a pas été défini. Vérifiez le chargement de config/leaflet.js.");
    }
}


_initializeMapCore

// Fonction pour ajouter les tuiles satellite
async function loadGeeTiles() {
    const alertsElement = document.getElementById('realtime-alerts');
    if (!alertsElement) return;
    
    alertsElement.textContent = "📡 Connexion à Google Earth Engine...";
    try {
        const fetcher = window.fetchData || fetchData;
        const geeData = await fetcher('/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED?bands=B4,B3,B2&cloud_percentage=5');
        
        if (geeData && geeData.mapid && geeData.token && window.globalMap) {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                opacity: 0.7, 
                zIndex: 10,
                maxNativeZoom: 17
            }).addTo(window.globalMap);
            alertsElement.textContent = `✅ Couche Satellite chargée (via Esri World Imagery Mock).`;
        } else {
            alertsElement.textContent = "⚠️ GEE : Réponse invalide (MOCK/API).";
        }
    } catch (error) {
        alertsElement.textContent = "❌ Échec de l'initialisation GEE (Réseau).";
        console.error("Échec de la connexion à l'API GEE:", error);
    }
}

// Fonction de chargement des points (appelée par home.js, utilise window.fetchData)
async function loadManifestationPoints() {
    try {
        const fetcher = window.fetchData || fetchData;
        const pointsData = await fetcher('/map/data/manifestations'); 
        
        const points = window.normalizeManifestationData(pointsData) || [];
        
        const currentAlert = document.getElementById('realtime-alerts');
            points.forEach(point => {
        // ... (Création du marqueur L.marker(lat, lon)) ...
        
        marker.on('click', () => {
            const success = analyzeTarget(point);
            if (success) {
                // Si l'analyse a réussi, l'afficher dans le popup
                marker.bindPopup(`**Analyse de Cible Réussie**<br>Ville: ${point.city}<br>Type: ${point.type}<br>Population: ${point.count}`).openPopup();
            } else {
                 marker.bindPopup(`**ANALYSE REFUSÉE**: Énergie d'Action Insuffisante.`).openPopup();
            }
        });
        
        // ... (Ajout du marqueur à la carte) ...
    });
        if(currentAlert) {
             currentAlert.textContent += ` | Anciens points chargés (désactivés si Légende active).`;
        }
    } catch (error) {
        console.error("Échec du chargement des points de manifestation:", error);
    }
}
// map.js - Nouvelle fonction d'action

/**
 * Simule l'analyse d'une cible (Manifestation Point), coûtant de l'énergie.
 */
function analyzeTarget(manifestationData) {
    if (!window.AGENT_PROFILE || !window.grantReward) {
        console.error("Erreur: Le profil d'Agent n'est pas chargé (app.js manquant).");
        return;
    }
    
    const cost = ACTION_COSTS.ANALYZE_TARGET;
    
    if (window.AGENT_PROFILE.energy < cost) {
        console.warn(`🚨 ENERGIE FAIBLE: Impossible d'analyser la cible. Coût: ${cost} EA, Disponible: ${window.AGENT_PROFILE.energy} EA.`);
        // Vous pouvez déclencher ici un message d'alerte UI
        return false; 
    }

    // 1. Consommation de l'énergie
    window.AGENT_PROFILE.energy -= cost;
    console.log(`🔋 ÉNERGIE CONSOMMÉE: Analyse de ${manifestationData.city}. Reste: ${window.AGENT_PROFILE.energy} EA.`);

    // 2. Récompense (si l'analyse est "réussie" ou pertinente)
    // Le gain d'XP peut être basé sur la 'count' ou le 'type'
    const baseReward = manifestationData.count >= 1000 ? 50 : 10;
    
    window.grantReward(baseReward, 5); // Gagne de l'XP et un peu d'énergie de retour
    
    console.log(`🌟 RÉCOMPENSE: +${baseReward} UTMI et +5 EA. Niveau actuel: ${window.AGENT_PROFILE.level}.`);
    
    // Mettre à jour l'UI (via app.js)
    if (window.updateProfileUI) {
        window.updateProfileUI();
    }
    
    return true; 
}
// docs/map.js - Logique de la Carte (Ajout de garde-fous pour la légende)
// ... (Reste du fichier map.js inchangé)
// Rendre la fonction accessible pour l'intégrer aux Popups
window.analyzeTarget = analyzeTarget;