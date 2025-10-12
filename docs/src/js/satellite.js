// Fichier : public/src/js/satellite.js (MODULE CORRIGÉ AVEC GESTION OSM & STABILITÉ)

let currentMapInstance = null;
let satelliteLayer = null;
let isSatelliteActive = false;
let initialBaseLayer = null; 

/**
 * Initialise le module en lui passant l'instance de la carte (Leaflet/Mapbox).
 */
export function initSatelliteModule(mapInstance) {
    currentMapInstance = mapInstance;
    
    currentMapInstance.eachLayer(layer => {
        if (layer instanceof L.TileLayer && !initialBaseLayer) {
            initialBaseLayer = layer;
        }
    });

    const toggleButton = document.getElementById('toggle-satellite-view-btn');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleSatelliteView);
    }
    console.log("Module Satellite initialisé.");
}

/**
 * Fonction pour réinitialiser l'état du bouton en cas d'erreur ou d'échec.
 */
function resetToggleError(errorMsg) {
    const toggleButton = document.getElementById('toggle-satellite-view-btn');
    toggleButton.textContent = '❌ Échec chargement';
    toggleButton.setAttribute('data-state', 'error');
    console.error(`[Satellite Error] ${errorMsg}`);
    
    // Rétablit le bouton après 5 secondes pour permettre un nouvel essai
    setTimeout(() => {
        toggleButton.textContent = '🛰️ Affichage Satellite';
        toggleButton.setAttribute('data-state', 'off');
    }, 5000); 

    // 🛑 CORRECTION: SUPPRESSION DE alert() qui est bloquant et doit être évité.
    console.error(`Impossible de charger la vue satellite: ${errorMsg}`); 
    
    // Réaffiche la couche de base si l'erreur survient 
    if (initialBaseLayer && currentMapInstance) {
        if (!currentMapInstance.hasLayer(initialBaseLayer)) {
            initialBaseLayer.addTo(currentMapInstance);
        }
    }
}


/**
 * Charge les identifiants de tuile GEE depuis le serveur.
 */
async function loadGeeTiles() {
    const rawSatelliteId = 'COPERNICUS/S2_SR_HARMONIZED'; 
    const bands = 'B4,B3,B2'; 
    const cloudPercentage = 5; 

    const satelliteId = encodeURIComponent(rawSatelliteId); 
    
    const url = `/api/gee/tiles/${satelliteId}?bands=${bands}&cloud_percentage=${cloudPercentage}`;
    const toggleButton = document.getElementById('toggle-satellite-view-btn');

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            let errorMessage = `Erreur HTTP: ${response.status} (${response.statusText || 'Échec de la requête'})`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.warn("Réponse non-JSON reçue (erreur de routage ou serveur non conforme).");
            }

            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!data.mapid || !data.token || !currentMapInstance) {
            throw new Error("Réponse de l'API GEE incomplète (mapid ou token manquants).");
        }
        
        // CRÉATION DE LA COUCHE DE TUILES (LOGIQUE LEAFLET)
        const tileUrl = `https://earthengine.googleapis.com/v1/projects/earthengine-public/maps/${data.mapid}/tiles/{z}/{x}/{y}?token=${data.token}`;
            
        if (satelliteLayer) {
            currentMapInstance.removeLayer(satelliteLayer);
        }
        
        // 🛑 CORRECTION CRITIQUE: Tuilage standard
        satelliteLayer = L.tileLayer(tileUrl, { 
            maxZoom: 16, 
            tileSize: 256, 
            maxNativeZoom: 14, 
            attribution: `Google Earth Engine (${data.satelliteName})` 
        });
        satelliteLayer.addTo(currentMapInstance);
        
        // RETIRER LA COUCHE OSM INITIALE
        if (initialBaseLayer && currentMapInstance.hasLayer(initialBaseLayer)) {
             currentMapInstance.removeLayer(initialBaseLayer);
        }
        
        isSatelliteActive = true;
        toggleButton.textContent = '❌ Masquer Satellite';
        toggleButton.setAttribute('data-state', 'on');
        console.log(`Tuiles GEE chargées pour ${data.satelliteName}`);

    } catch (error) {
        resetToggleError(error.message);
    }
}


/**
 * Fonction principale pour activer ou désactiver la vue satellite.
 */
function toggleSatelliteView() {
    const toggleButton = document.getElementById('toggle-satellite-view-btn');
    
    if (isSatelliteActive) {
        // Désactivation
        if (satelliteLayer && currentMapInstance && currentMapInstance.hasLayer(satelliteLayer)) {
            currentMapInstance.removeLayer(satelliteLayer);
            satelliteLayer = null;
        }
        
        // RÉTABLIR LA COUCHE OSM INITIALE
        if (initialBaseLayer) {
            initialBaseLayer.addTo(currentMapInstance);
        }

        isSatelliteActive = false;
        toggleButton.textContent = '🛰️ Affichage Satellite';
        toggleButton.setAttribute('data-state', 'off');
        console.log("Vue Satellite désactivée.");
    } else {
        // Activation
        toggleButton.textContent = '... Chargement Satellite ...';
        toggleButton.setAttribute('data-state', 'loading');
        console.log("Tentative de chargement de la Vue Satellite...");
        
        loadGeeTiles();
    }
}