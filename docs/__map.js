// docs/map.js - VERSION FINALE STABILISÉE ET GAMIFIÉE (CORRIGÉE)

const MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

let map = null; 
window.globalMap = map;

// --- 1. SIMULATION DES DONNÉES JSON (MOCK DATA) ---
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
    SCAN_SECTOR: 5,     
    RECHARGE_BASE: 50   
};
// --- 2. FONCTIONS DE SIMULATION ET UTILITAIRES ---

// Fonction de simulation locale (inchangée)
async function fetchData(url) {
    // ... (Logique fetchData inchangée) ...
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

// Fonction de normalisation (rendue globale)
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


// --- 3. LOGIQUE D'ACTION DE TERRAIN GAMIFIÉE ---
/**
 * Simule l'analyse d'une cible (Manifestation Point), coûtant de l'énergie.
 */
function analyzeTarget(manifestationData) {
    if (!window.AGENT_PROFILE || typeof window.grantReward !== 'function') {
        console.error("Erreur: Le profil d'Agent n'est pas chargé (Dépendances manquantes).");
        return false;
    }
    
    const cost = ACTION_COSTS.ANALYZE_TARGET;
    
    if (window.AGENT_PROFILE.energy < cost) {
        console.warn(`🚨 ENERGIE FAIBLE: Impossible d'analyser la cible. Coût: ${cost} EA, Disponible: ${window.AGENT_PROFILE.energy} EA.`);
        return false; 
    }

    window.AGENT_PROFILE.energy -= cost;
    console.log(`🔋 ÉNERGIE CONSOMMÉE: Analyse de ${manifestationData.city}. Reste: ${window.AGENT_PROFILE.energy} EA.`);

    const count = typeof manifestationData.count === 'string' ? parseInt(manifestationData.count.replace(/\D/g, ''), 10) || 10 : manifestationData.count;
    const baseReward = count >= 1000 ? 50 : 10;
    
    window.grantReward(baseReward, 5); // Gagne de l'XP/UTMi et 5 EA de retour
    
    console.log(`🌟 RÉCOMPENSE: +${baseReward} UTMI et +5 EA. Niveau actuel: ${window.AGENT_PROFILE.level}.`);
    
    return true; 
}
window.analyzeTarget = analyzeTarget; 


// --- 4. FONCTIONS PRINCIPALES DE CARTE ET NAVIGATION ---

// 🛑 NOUVEAU : DÉFINITION DE BASE DU CONTRÔLE DE LÉGENDE SI LE FICHIER EXTERNE MANQUE
if (typeof L !== 'undefined' && typeof L.Control.CategoryLegend === 'undefined') {
    L.Control.CategoryLegend = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-legend-mock');
            container.innerHTML = 'Légende (Mock)';
            return container;
        },
        onRemove: function (map) {}
    });
    L.control.categoryLegend = function (options) {
        return new L.Control.CategoryLegend(options);
    };
}
// Fonction Synchrone d'initialisation du DOM et des contrôles de Leaflet
function _initializeMapCore() {
    const mapElement = document.getElementById('map');
    
    // 🛑 STABILISATION : Le contrôle de légende est soit le vrai, soit le mock. L'avertissement est désactivé.
    if (L.control.categoryLegend) {
         L.control.categoryLegend({ position: 'bottomright' }).addTo(map); 
    }
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
    }).addTo(map);

    L.marker([48.8656, 2.3251]).addTo(map) 
        .bindPopup("🎯 <b>Cible Test: Place de la Concorde</b><br>L'interface de scan est validée !").openPopup();

    // 🛑 CORRECTION : Stabilisation du contrôle de légende (transforme l'erreur critique en avertissement non bloquant)
    if (typeof L.control.categoryLegend !== 'undefined' && L.control.categoryLegend) {
         L.control.categoryLegend({ position: 'bottomright' }).addTo(map); 
    } else {
         console.warn("⚠️ Contrôle de légende manquant (L.control.categoryLegend). Vérifiez config/leaflet.js.");
    }
}

// 🛑 FONCTION window.initMap (Appelée par app.js)
window.initMap = async function() {
    // 1. Exécution synchrone de la création de la carte et des contrôles
    _initializeMapCore();

    if (map === null) return;
    
    // 2. Exécution Asynchrone des appels de données
    setTimeout(async () => {
        try {
            await loadGeeTiles(); // Charge les tuiles satellite
            await loadManifestationPoints(); // Charge et dessine les marqueurs
        } catch (e) {
            console.error("Erreur lors de l'appel initial aux données de carte (non bloquant):", e);
        }
    }, 0);
    
    // 3. Invalidation de la taille
    setTimeout(() => { 
        if (map) {
            map.invalidateSize(); 
        }
    }, 50); 
}


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

// Fonction de chargement des points
async function loadManifestationPoints() {
    try {
        const fetcher = window.fetchData || fetchData;
        const pointsData = await fetcher('/map/data/manifestations'); 
        
        const points = window.normalizeManifestationData(pointsData) || [];
        
        const currentAlert = document.getElementById('realtime-alerts');
        
        points.forEach(point => {
            if (point.lat && point.lon) {
                const marker = L.marker([point.lat, point.lon]).addTo(window.globalMap);
                
                // Attacher la logique de gamification au clic
                marker.on('click', () => {
                    const success = analyzeTarget(point);
                    if (success) {
                        marker.bindPopup(`**ANALYSE DE CIBLE RÉUSSIE**<br>Ville: ${point.city}<br>Type: ${point.type}<br>Population: ${point.count}`).openPopup();
                    } else {
                         marker.bindPopup(`**ANALYSE REFUSÉE**: Énergie d'Action Insuffisante. (Coût: ${ACTION_COSTS.ANALYZE_TARGET} EA)`).openPopup();
                    }
                    if (window.updateProfileUI) {
                        window.updateProfileUI(); // Force la mise à jour de l'UI
                    }
                });
            }
        });

        if(currentAlert) {
             currentAlert.textContent += ` | ${points.length} points de ralliement tracés.`;
        }
    } catch (error) {
        console.error("Échec du chargement des points de manifestation:", error);
    }
}