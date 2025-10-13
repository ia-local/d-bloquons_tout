// docs/map-item.js - Logique d'Interaction du Menu Radial de la Carte et des Actions Gamifiées

const ACTION_COSTS = {
    ANALYZE_TARGET: 10, 
    SCAN_SECTOR: 5,     
    RECHARGE_BASE: 50   
};

const layerStates = {
    'manifestations': false,
    'gee-satellite': false
};

/**
 * Met à jour l'état visuel du bouton dans le menu radial (classe 'active-layer').
 */
function updateButtonState(layerName, isActive) {
    const selector = `button[data-map-layer-toggle="${layerName}"]`;
    const button = document.querySelector(selector);
    if (button) {
        if (isActive) {
            button.classList.add('active-layer');
        } else {
            button.classList.remove('active-layer');
        }
    }
}

// --- 1. GESTION DES COUCHES ---

/**
 * 🛑 INTERFACE GLOBALE 🛑 : Appelé par app.js.
 * Déclenche la bascule Leaflet et met à jour l'état UI.
 */
window.toggleMapLayer = function(layerName) {
    // Vérifie si la fonction Leaflet de map.js existe
    if (typeof window.toggleMapLayerInMapJS !== 'function') {
         console.error("Erreur: window.toggleMapLayerInMapJS (dans map.js) n'est pas défini.");
         return;
    }
    
    const success = window.toggleMapLayerInMapJS(layerName);
    
    if (success) {
        layerStates[layerName] = !layerStates[layerName];
        updateButtonState(layerName, layerStates[layerName]);
        console.log(`[MENU] Couche ${layerName} basculée. État: ${layerStates[layerName] ? 'Actif' : 'Inactif'}.`);
    } 
};


// --- 2. GESTION DES ACTIONS GAMIFIÉES ---

/**
 * 🛑 INTERFACE GLOBALE 🛑 : Gère les actions du menu (recharge, scan).
 */
window.handleMapAction = function(action) {
    if (!window.AGENT_PROFILE || typeof window.updateProfileUI !== 'function' || typeof window.grantReward !== 'function') {
        console.error("Erreur: Profil ou fonctions de gamification non chargées.");
        return;
    }
    
    let cost = 0;
    
    switch (action) {
        case 'recharge':
            cost = ACTION_COSTS.RECHARGE_BASE;
            if (window.AGENT_PROFILE.utmiCredits >= cost) {
                window.AGENT_PROFILE.utmiCredits -= cost;
                window.AGENT_PROFILE.energy = window.AGENT_PROFILE.maxEnergy; 
                console.log(`✅ RECHARGE ÉNERGIE réussie.`);
                alert(`Recharge d'Énergie réussie ! -${cost} UTMi.`);
            } else {
                alert(`Échec: ${cost} UTMi requis.`);
            }
            break;
            
        case 'scan':
            cost = ACTION_COSTS.SCAN_SECTOR;
            if (window.AGENT_PROFILE.energy >= cost) {
                window.AGENT_PROFILE.energy -= cost;
                window.grantReward(10, 0); // Récompense fixe de 10 UTMi pour le scan
                console.log(`📡 SCAN SECTEUR effectué.`);
                alert(`Scan de Secteur effectué. -${cost} EA, +10 UTMi.`);
                // 💡 Ici vous pourriez appeler une fonction pour 'dévoiler' de nouveaux points
            } else {
                 alert(`Échec du scan: ${cost} EA requis.`);
            }
            break;
    }
    
    window.updateProfileUI(); 
};