// docs/item-map.js - Logique d'Interaction du Menu Radial (4 ITEMS FINAL)

// --- COEFFICIENTS ET ÉTATS CLIENT ---

const ACTION_COSTS = {
    ANALYZE_TARGET: 10, 
    // SCAN_SECTOR: 5,     <-- Supprimé
    RECHARGE_BASE: 50,
    AI_ANALYSIS: 25 
};

const COGNITIVE_AXES_VALUES = { 
    CONCENTRATION: 0.1, 
    STRATEGY: 0.25,     
    ANALYSIS: 0.18,     
};

const ACTION_COGNITIVE_MAP = {
    // 'scan': 'CONCENTRATION', <-- Supprimé
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

function calculateCognitiveBonus(actionName, baseReward) {
    const axisKey = ACTION_COGNITIVE_MAP[actionName];
    if (!axisKey) return baseReward;
    const utmiPerAxis = COGNITIVE_AXES_VALUES[axisKey] || 0;
    const totalReward = baseReward * (1 + utmiPerAxis); 
    if (window.APP_STATE?.LOG_LEVEL === 'debug') console.log(`[UTMI] Axe Cognitif Détecté: ${axisKey}. Total: ${totalReward.toFixed(2)} UTMi.`);
    return parseFloat(totalReward.toFixed(2));
}

// 🛑 Les fonctions d'exécution sont exposées globalement pour l'aiguillage depuis app.js
window.handleGamifiedAction = function(costKey, baseReward, actionName) {
    if (!window.AGENT_PROFILE || typeof window.updateProfileUI !== 'function' || typeof window.grantReward !== 'function') {
        console.error("[INTENT] Profil d'Agent ou fonctions de gamification non chargés.");
        return;
    }
    
    const cost = ACTION_COSTS[costKey];
    // NOTE : L'action 'scan' n'existe plus, donc pas de calcul cognitif pour elle ici.
    const finalReward = baseReward; 
    
    if (costKey === 'RECHARGE_BASE') {
        if (window.AGENT_PROFILE.utmiCredits >= cost) {
            window.AGENT_PROFILE.utmiCredits -= cost;
            window.AGENT_PROFILE.energy = window.AGENT_PROFILE.maxEnergy; 
            alert(`Recharge d'Énergie réussie ! -${cost} UTMi.`);
        } else {
            alert(`Échec de la recharge: ${cost} UTMi requis.`);
            return;
        }
    } else { // Si un autre coût est passé, mais ne devrait pas arriver avec cette config.
        alert(`Action inconnue ou non implémentée: ${actionName}`);
        return;
    }
    window.updateProfileUI(); 
}

window.requestAIAnalysis = async function(costKey, baseReward, actionName) {
    if (!window.AGENT_PROFILE || typeof window.fetchData !== 'function') {
        alert("Erreur: Profil ou service de données non disponible.");
        return;
    }
    
    const cost = ACTION_COSTS[costKey];
    
    if (window.AGENT_PROFILE.energy < cost) {
        alert(`Échec: ${cost} EA requis pour l'analyse IA.`);
        return;
    }

    window.AGENT_PROFILE.energy -= cost;
    window.updateProfileUI();
    
    alert(`Consommation: -${cost} EA. Requête d'analyse IA envoyée...`);

    try {
        const analysisData = await window.fetchData('/api/ai/analyze-sector', 'POST', { location: 'global', agentLevel: window.AGENT_PROFILE.level });
        
        if (analysisData && analysisData.utmiAwarded) {
            const finalReward = calculateCognitiveBonus(actionName, analysisData.utmiAwarded);
            window.grantReward(finalReward, 0); 
            alert(`✅ Analyse IA réussie ! Récompense: +${finalReward.toFixed(2)} UTMi.`);
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

window.toggleLeafletLayer = function(layerName) {
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

// 🛑 Fonction de configuration Mock (Version 4 items)
function getMockIntentConfig() {
    return {
        "map_items": [
            { "type": "layer", "value": "manifestations", "icon": "fas fa-bullhorn", "title": "Points de Ralliement" },
            { "type": "layer", "value": "gee-satellite", "icon": "fas fa-satellite", "title": "Tuiles Satellite" },
            { "type": "action", "value": "recharge", "icon": "fas fa-bolt", "title": "Recharge Énergie (50 UTMI)", "cost": ACTION_COSTS.RECHARGE_BASE, "reward": 0 },
            { "type": "action", "value": "ai_analyze", "icon": "fas fa-brain", "title": "Analyse IA (25 EA)", "cost": ACTION_COSTS.AI_ANALYSIS, "reward": 50 }
            // ITEM SCAN RETIRÉ
        ],
        "intent_map": {
             "recharge": { "function": "handleGamifiedAction", "args": [ "RECHARGE_BASE", 0, 'recharge' ] },
             "ai_analyze": { "function": "requestAIAnalysis", "args": [ "AI_ANALYSIS", 50, 'ai_analyze' ] },
             "manifestations": { "function": "toggleLeafletLayer" },
             "gee-satellite": { "function": "toggleLeafletLayer" }
        }
    };
}

async function loadIntentConfig() {
    INTENT_CONFIG = getMockIntentConfig();
    if (window.APP_STATE?.LOG_LEVEL === 'debug') console.log("[INTENT] Configuration dynamique de la carte chargée.");
}


function renderDynamicMenu() {
    const menuElement = document.getElementById(MAP_MENU_CONTAINER_ID);
    if (!menuElement || !INTENT_CONFIG || !INTENT_CONFIG.map_items) return;

    menuElement.innerHTML = '';
    
    INTENT_CONFIG.map_items.forEach(item => {
        const button = document.createElement('button');
        button.className = 'map-item';
        button.title = item.title;
        button.innerHTML = `<i class="${item.icon}"></i>`;
        
        if (item.type === 'action') {
            button.setAttribute('data-map-action', item.value);
        } else if (item.type === 'layer') {
            button.setAttribute('data-map-layer-toggle', item.value);
        }
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (item.type === 'action') {
                window.handleGlobalInteraction('map', 'action', item.value);
            } else if (item.type === 'layer') {
                window.handleGlobalInteraction('map', 'layer', item.value);
            }
        });
        
        menuElement.appendChild(button);
        
        if (item.type === 'layer') {
            updateButtonState(item.value, layerStates[item.value]);
        }
    });
}

// --- 2. INTERFACE GLOBALE (Appelée par app.js) ---
// ... (handleMapAction et toggleMapLayer restent inchangés) ...

window.handleMapAction = function(value) {
    const config = INTENT_CONFIG?.intent_map[value];
    if (!config) {
        if (window.APP_STATE?.LOG_LEVEL !== 'warn') console.warn(`[INTENT] Action de carte inconnue: ${value}`);
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
    const config = INTENT_CONFIG?.intent_map[value];
    if (!config) {
        if (window.APP_STATE?.LOG_LEVEL !== 'warn') console.warn(`[INTENT] Couche de carte inconnue: ${value}`);
        return;
    }
    
    const func = window[config.function];
    if (typeof func === 'function') {
        func(value); 
    } else {
        console.error(`[INTENT EXEC] Fonction ${config.function} non définie. (Erreur d'Exposition)`);
    }
};


// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async () => {
    await loadIntentConfig();
    renderDynamicMenu();
    
    const mapLayersToggle = document.getElementById('road-map'); 
    mapLayersToggle?.classList.remove('fab-open');
});