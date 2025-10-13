// docs/map.js - VERSION FINALE STABILISÉE ET GAMIFIÉE (Logique Leaflet Core)

const MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

let map = null; 
window.globalMap = map;

// --- VARIABLES GLOBALES DE COUCHES ---
let manifestationLayerGroup = null; 
let geeTileLayer = null; 
window.mapHasManifestations = false; 

// --- 1. SIMULATION DES DONNÉES JSON (MOCK DATA) ---
const MOCK_DATA = {
    // ... (MOCK_DATA inchangé) ...
    '/map/data/manifestations': [
        { "city": "Caen", "lat": 49.183333, "lon": -0.350000, "count": 6000, "type": "Manifestation" },
        { "city": "Rennes", "lat": 48.111979, "lon": -1.681864, "count": 15000, "type": "Rassemblement" },
        { "city": "Grenoble", "lat": 45.185, "lon": 5.725, "count": 30000, "type": "Manifestation" },
        { "city": "Marseille", "lat": 43.2961, "lon": 5.3699, "count": "Plusieurs milliers", "type": "Blocage" },
        { "city": "Bordeaux", "lat": 44.8378, "lon": -0.5792, "count": 200, "type": 'Boycott' }
    ],
    // ... (Autres MOCK_DATA inchangés) ...
};

// --- 1.5. COÛT DES ACTIONS (Pour analyzeTarget) ---
const ACTION_COSTS = {
    ANALYZE_TARGET: 10,
    SCAN_SECTOR: 5,     
    RECHARGE_BASE: 50   
};
// --- 2. FONCTIONS DE SIMULATION ET UTILITAIRES ---
// Assurez-vous que window.fetchData est définie dans app.js
async function fetchData(url) { 
    return MOCK_DATA[url] || {};
}
// Fonction de normalisation (rendue globale)
function normalizeManifestationData(data) { 
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.manifestation_points)) return data.manifestation_points;
    return []; 
}
window.normalizeManifestationData = normalizeManifestationData;


// --- 3. LOGIQUE D'ACTION DE TERRAIN GAMIFIÉE ---
function analyzeTarget(manifestationData) {
    if (!window.AGENT_PROFILE || typeof window.grantReward !== 'function') {
        console.error("Erreur: Le profil d'Agent ou grantReward n'est pas chargé.");
        return false;
    }
    const cost = ACTION_COSTS.ANALYZE_TARGET;
    if (window.AGENT_PROFILE.energy < cost) {
        console.warn(`🚨 ENERGIE FAIBLE: ${cost} EA requis.`);
        return false; 
    }
    window.AGENT_PROFILE.energy -= cost;
    const count = typeof manifestationData.count === 'string' ? parseInt(manifestationData.count.replace(/\D/g, ''), 10) || 10 : manifestationData.count;
    const baseReward = count >= 1000 ? 50 : 10;
    window.grantReward(baseReward, 5); 
    console.log(`🔋 ÉNERGIE CONSOMMÉE: Analyse de ${manifestationData.city}.`);
    return true; 
}
window.analyzeTarget = analyzeTarget; 


// --- 4. GESTION DES COUCHES LEAFLET (Interface avec map-item.js) ---

/**
 * 🛑 INTERFACE GLOBALE 🛑 : Bascule les couches Leaflet.
 * Appelée par map-item.js pour contrôler l'affichage.
 */
window.toggleMapLayerInMapJS = function(layerName) {
    if (map === null) {
        console.error("Carte non initialisée. Impossible de basculer la couche.");
        return false;
    }
    
    let isCurrentlyActive;
    
    switch (layerName) {
        case 'manifestations':
            if (manifestationLayerGroup === null) {
                // 1. Charger et initialiser le LayerGroup
                loadManifestationPoints(); 
                isCurrentlyActive = true; 
            } else if (map.hasLayer(manifestationLayerGroup)) {
                // 2. Retirer de la carte
                map.removeLayer(manifestationLayerGroup);
                isCurrentlyActive = false;
            } else {
                // 3. Ajouter à la carte
                map.addLayer(manifestationLayerGroup);
                isCurrentlyActive = true;
            }
            window.mapHasManifestations = isCurrentlyActive; 
            console.log(`[LEAFLET] Manifestations : ${isCurrentlyActive ? 'Affichées' : 'Masquées'}`);
            return true;
            
        case 'gee-satellite':
            if (geeTileLayer === null) {
                loadGeeTiles(); 
                isCurrentlyActive = true;
            } else if (map.hasLayer(geeTileLayer)) {
                map.removeLayer(geeTileLayer);
                isCurrentlyActive = false;
            } else {
                map.addLayer(geeTileLayer);
                isCurrentlyActive = true;
            }
            console.log(`[LEAFLET] GEE Satellite : ${isCurrentlyActive ? 'Affichées' : 'Masquées'}`);
            return true;
            
        default:
            console.warn(`Couche Leaflet inconnue: ${layerName}`);
            return false;
    }
};


// --- 5. INITIALISATION DE LA CARTE ---

function _initializeMapCore() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined' || map !== null) return; 

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
        .bindPopup("🎯 <b>Cible Test: Place de la Concorde</b>").openPopup();

    if (L.control.categoryLegend) {
         L.control.categoryLegend({ position: 'bottomright' }).addTo(map); 
    }
}

window.initMap = async function() {
    _initializeMapCore();
    if (map === null) return;
    
    // Invalidation de la taille (important pour les cartes masquées au chargement)
    setTimeout(() => { 
        if (map) map.invalidateSize(); 
    }, 50); 
}


// --- 6. FONCTIONS DE CHARGEMENT ASYNCHRONE ---

/**
 * Crée ou ajoute la couche de tuiles GEE (Mock).
 */
async function loadGeeTiles() {
    if (map === null) return;
    
    if (geeTileLayer) {
        if (!map.hasLayer(geeTileLayer)) map.addLayer(geeTileLayer);
        return; 
    }
    
    const MOCK_TILE_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'; 
    
    geeTileLayer = L.tileLayer(MOCK_TILE_URL, {
        attribution: 'OpenTopoMap'
    });
    
    geeTileLayer.addTo(map);
}

/**
 * Charge les données, crée le LayerGroup et attache les marqueurs.
 */
async function loadManifestationPoints() {
    if (map === null) return;
    
    if (manifestationLayerGroup) {
         if (!map.hasLayer(manifestationLayerGroup)) map.addLayer(manifestationLayerGroup);
         return;
    }

    try {
        const fetcher = window.fetchData || fetchData;
        const pointsData = await fetcher('/map/data/manifestations'); 
        const points = window.normalizeManifestationData(pointsData) || [];
        
        manifestationLayerGroup = L.layerGroup();
        manifestationLayerGroup.addTo(window.globalMap);
        
        points.forEach(point => {
            if (point.lat && point.lon) {
                const marker = L.marker([point.lat, point.lon]);
                
                // Attacher la logique de Gamification
                marker.on('click', () => {
                    const success = analyzeTarget(point);
                    if (window.updateProfileUI) window.updateProfileUI();
                    
                    if (success) {
                        marker.bindPopup(`**ANALYSE RÉUSSIE**`).openPopup();
                    } else {
                         marker.bindPopup(`**ANALYSE REFUSÉE**: Énergie Insuffisante.`).openPopup();
                    }
                });
                
                marker.addTo(manifestationLayerGroup); 
            }
        });

        const currentAlert = document.getElementById('realtime-alerts');
        if(currentAlert) {
             currentAlert.textContent += ` | ${points.length} points de ralliement tracés.`;
        }
    } catch (error) {
        console.error("Échec du chargement des points de manifestation:", error);
    }
}