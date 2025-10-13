// docs/item-map.js - Logique d'Interaction du Menu Radial (Dynamique & Asynchrone)

// --- COEFFICIENTS ET ÉTATS CLIENT (SYNCHRONISÉ AVEC utms_calculator.js) ---

const ACTION_COSTS = {
    ANALYZE_TARGET: 10, 
    SCAN_SECTOR: 5,     
    RECHARGE_BASE: 50,
    AI_ANALYSIS: 25 
};

// ... (COGNITIVE_AXES_VALUES, ACTION_COGNITIVE_MAP, layerStates inchangés) ...
const COGNITIVE_AXES_VALUES = { 
    CONCENTRATION: 0.1, 
    STRATEGY: 0.25,     
    ANALYSIS: 0.18,     
};

const ACTION_COGNITIVE_MAP = {
    'scan': 'CONCENTRATION', 
    'recharge': 'STRATEGY',
    'ai_analyze': 'ANALYSIS'
};

const layerStates = {
    'manifestations': false,
    'gee-satellite': false
};

let INTENT_CONFIG = null; 
const MAP_MENU_CONTAINER_ID = 'map-layers-menu';

// --- 0. Fonctions Utilitaires et de Chargement ---

/**
 * Simule le chargement de la configuration des intentions depuis l'API.
 * @returns {Promise<object>} Configuration des intentions.
 */
async function loadIntentConfig() {
    // 🛑 Simulation d'un appel API pour obtenir la configuration du menu et des intentions.
    // En production, cette route appellerait un endpoint: /api/map/config
    
    // Si fetchData est disponible, utilisez-le (avec un mock pour le développement)
    const configData = window.fetchData 
        ? await window.fetchData('/api/map/menu-config', 'GET') 
        : getMockIntentConfig(); // Fallback si fetchData n'est pas prêt

    INTENT_CONFIG = configData || getMockIntentConfig();
    
    if (window.APP_STATE?.LOG_LEVEL === 'debug') console.log("[INTENT] Configuration dynamique de la carte chargée.");
}

// 🛑 Fonction de configuration Mock (utilisée si l'API est absente)
function getMockIntentConfig() {
    return {
        "map_items": [
            { "type": "layer", "value": "manifestations", "icon": "fas fa-bullhorn", "title": "Points de Ralliement" },
            { "type": "layer", "value": "gee-satellite", "icon": "fas fa-satellite", "title": "Tuiles Satellite" },
            { "type": "action", "value": "recharge", "icon": "fas fa-bolt", "title": "Recharge Énergie (50 UTMI)", "cost": ACTION_COSTS.RECHARGE_BASE, "reward": 0 },
            { "type": "action", "value": "ai_analyze", "icon": "fas fa-brain", "title": "Analyse IA (25 EA)", "cost": ACTION_COSTS.AI_ANALYSIS, "reward": 50 },
            { "type": "action", "value": "scan", "icon": "fas fa-search-location", "title": "Scan Secteur (5 EA)", "cost": ACTION_COSTS.SCAN_SECTOR, "reward": 10 }
        ],
        "intent_map": {
             "scan": { "function": "handleGamifiedAction", "args": [ "SCAN_SECTOR", 10, 'scan' ] },
             "recharge": { "function": "handleGamifiedAction", "args": [ "RECHARGE_BASE", 0, 'recharge' ] },
             "ai_analyze": { "function": "requestAIAnalysis", "args": [ "AI_ANALYSIS", 50, 'ai_analyze' ] },
             "manifestations": { "function": "toggleLeafletLayer" },
             "gee-satellite": { "function": "toggleLeafletLayer" }
        }
    };
}


/**
 * 🛑 NOUVELLE FONCTION : Rend les boutons du menu radial et attache les écouteurs.
 */
function renderDynamicMenu() {
    const menuElement = document.getElementById(MAP_MENU_CONTAINER_ID);
    if (!menuElement || !INTENT_CONFIG || !INTENT_CONFIG.map_items) return;

    // 1. Vider le contenu existant
    menuElement.innerHTML = '';
    
    // 2. Construire les boutons dynamiquement
    INTENT_CONFIG.map_items.forEach(item => {
        const button = document.createElement('button');
        button.className = 'map-item';
        button.title = item.title;
        button.innerHTML = `<i class="${item.icon}"></i>`;
        
        // 3. Attacher les attributs d'intention
        if (item.type === 'action') {
            button.setAttribute('data-map-action', item.value);
        } else if (item.type === 'layer') {
            button.setAttribute('data-map-layer-toggle', item.value);
        }
        
        // 4. Ajouter l'écouteur
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 🛑 L'appel est le même que celui de app.js, mais centralisé ici
            if (item.type === 'action') {
                window.handleGlobalInteraction('map', 'action', item.value);
            } else if (item.type === 'layer') {
                window.handleGlobalInteraction('map', 'layer', item.value);
            }
        });
        
        menuElement.appendChild(button);
        
        // 5. Rétablir l'état visuel (pour les couches)
        if (item.type === 'layer') {
            updateButtonState(item.value, layerStates[item.value]);
        }
    });
}


function updateButtonState(layerName, isActive) {
    // ... (Logique updateButtonState inchangée) ...
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


// --- 1. LOGIQUE D'EXÉCUTION DES INTENTIONS (Les fonctions globales doivent exister pour l'aiguillage) ---

// --- 1. LOGIQUE D'EXÉCUTION DES INTENTIONS (Exposées Globalement) ---

function calculateCognitiveBonus(actionName, baseReward) {
    const axisKey = ACTION_COGNITIVE_MAP[actionName];
    if (!axisKey) return baseReward;

    const utmiPerAxis = COGNITIVE_AXES_VALUES[axisKey] || 0;
    
    const bonus = baseReward * utmiPerAxis;
    const totalReward = baseReward + bonus;
    
    if (window.APP_STATE?.LOG_LEVEL === 'debug') console.log(`[UTMI] Axe Cognitif Détecté: ${axisKey}. Bonus: +${bonus.toFixed(2)} UTMi.`);
    
    return parseFloat(totalReward.toFixed(2));
}


/** 🛑 FONCTION GLOBALE 🛑 Gère les actions simples de jeu (scan, recharge). */
window.handleGamifiedAction = function(costKey, baseReward, actionName) {
    // ... (Logique complète handleGamifiedAction inchangée) ...
    if (!window.AGENT_PROFILE || typeof window.updateProfileUI !== 'function' || typeof window.grantReward !== 'function') {
        console.error("[INTENT] Profil d'Agent ou fonctions de gamification non chargés.");
        return;
    }
    
    const cost = ACTION_COSTS[costKey];
    const finalReward = actionName === 'scan' ? calculateCognitiveBonus(actionName, baseReward) : baseReward;
    
    // ... (Logique de coût et alerte inchangée) ...
    if (costKey === 'RECHARGE_BASE') {
        if (window.AGENT_PROFILE.utmiCredits >= cost) {
            window.AGENT_PROFILE.utmiCredits -= cost;
            window.AGENT_PROFILE.energy = window.AGENT_PROFILE.maxEnergy; 
            alert(`Recharge d'Énergie réussie ! -${cost} UTMi.`);
        } else {
            alert(`Échec de la recharge: ${cost} UTMi requis.`);
            return;
        }
    } else { // Case: SCAN
        if (window.AGENT_PROFILE.energy >= cost) {
            window.AGENT_PROFILE.energy -= cost;
            if (finalReward > 0) {
                window.grantReward(finalReward, 0); 
            }
            alert(`Scan effectué. -${cost} EA, +${finalReward.toFixed(2)} UTMi (Cognitif).`);
        } else {
             alert(`Échec du scan: ${cost} EA requis.`);
             return;
        }
    }
    
    window.updateProfileUI(); 
}

/** 🛑 FONCTION GLOBALE 🛑 Appelle l'API backend pour l'analyse IA. */
window.requestAIAnalysis = async function(costKey, baseReward, actionName) {
    // ... (Logique complète requestAIAnalysis inchangée) ...
    if (!window.AGENT_PROFILE || typeof window.fetchData !== 'function') {
        alert("Erreur: Profil ou service de données non disponible.");
        return;
    }
    
    const cost = ACTION_COSTS[costKey];
    
    if (window.AGENT_PROFILE.energy < cost) {
        alert(`Échec: ${cost} EA requis pour l'analyse IA.`);
        return;
    }

    // ... (Déduction du coût et appel fetchData inchangés) ...
    window.AGENT_PROFILE.energy -= cost;
    window.updateProfileUI();
    
    alert(`Consommation: -${cost} EA. Requête d'analyse IA envoyée...`);

    try {
        const analysisData = await window.fetchData('/api/ai/analyze-sector', 'POST', {
            location: 'global', 
            agentLevel: window.AGENT_PROFILE.level 
        });
        
        if (analysisData && analysisData.utmiAwarded) {
            const finalReward = calculateCognitiveBonus(actionName, analysisData.utmiAwarded);
            window.grantReward(finalReward, 0); 
            alert(`✅ Analyse IA réussie ! Insights reçus. Récompense: +${finalReward.toFixed(2)} UTMi.`);
        } else {
             const finalReward = calculateCognitiveBonus(actionName, baseReward); 
             window.grantReward(finalReward, 0); 
             alert(`Analyse IA terminée (Aucune donnée critique). Récompense de base: +${finalReward.toFixed(2)} UTMi.`);
        }
    } catch (e) {
        console.error("Échec de l'appel à l'API IA :", e);
        alert("Erreur serveur lors de l'analyse IA. Réessayez plus tard.");
    } finally {
        window.updateProfileUI();
    }
}


/** 🛑 FONCTION GLOBALE 🛑 Bascule les couches Leaflet. */
window.toggleLeafletLayer = function(layerName) {
    // ... (Logique complète toggleLeafletLayer inchangée) ...
    if (typeof window.toggleMapLayerInMapJS !== 'function') {
         console.error("[INTENT] window.toggleMapLayerInMapJS (dans map.js) n'est pas défini.");
         return false;
    }
    
    const success = window.toggleMapLayerInMapJS(layerName);
    
    if (success) {
        layerStates[layerName] = !layerStates[layerName];
        updateButtonState(layerName, layerStates[layerName]);
        if (window.APP_STATE?.LOG_LEVEL !== 'warn') console.log(`[MENU] Couche ${layerName} basculée. État: ${layerStates[layerName] ? 'Actif' : 'Inactif'}.`);
    }
    return success;
}

// --- 2. INTERFACE GLOBALE (Appelée par app.js) ---
window.handleMapAction = function(value) {
    const config = INTENT_CONFIG?.intent_map[value]; // 🛑 CHANGEMENT DE NOM DE CLÉ
    if (!config) {
        console.warn(`[INTENT] Action de carte inconnue: ${value}`);
        return;
    }
    
    const func = window[config.function];
    if (typeof func === 'function') {
        func(...config.args); 
    } else {
        console.error(`[INTENT EXEC] Fonction ${config.function} non définie. (Erreur d'Exposition)`);
    }
};

window.toggleMapLayer = function(value) {
    const config = INTENT_CONFIG?.intent_map[value]; // 🛑 CHANGEMENT DE NOM DE CLÉ
    if (!config) {
        console.warn(`[INTENT] Couche de carte inconnue: ${value}`);
        return;
    }
    
    const func = window[config.function];
    if (typeof func === 'function') {
        func(value); 
    } else {
        console.error(`[INTENT EXEC] Fonction ${config.function} non définie. (Erreur d'Exposition)`);
    }
};


// 🛑 MODIFICATION DU BLOC D'INITIALISATION
document.addEventListener('DOMContentLoaded', async () => {
    // Charger la configuration de manière asynchrone
    await loadIntentConfig();
    
    // Rendre le menu une fois la configuration chargée
    renderDynamicMenu();
    
    // Rétablir l'état du bouton principal (le FAB) au démarrage
    const mapLayersToggle = document.getElementById('road-map'); 
    mapLayersToggle?.classList.remove('fab-open');

    // Aucune mise à jour de l'état des boutons n'est nécessaire ici, 
    // car renderDynamicMenu le fait déjà.
});