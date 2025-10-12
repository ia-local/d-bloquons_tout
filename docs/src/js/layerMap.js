// Fichier : public/src/js/layerMap.js (VERSION FINALE STABLE ET CORRIGÉE)

let mapInstance;
let markerLayers = {};
let allData = {};
let legendConfig = {};

/**
 * Fonction globalement exposée pour gérer le clic sur le bouton "Voir les détails"
 * dans le Pop-up Leaflet.
 */
window.handleModalOpenClick = function (id, type) {
    const currentMapInstance = getMapInstance();
    if (!currentMapInstance) {
        console.error("Erreur: mapInstance non initialisée.");
        return;
    }
    
    // 🛑 GESTION DE L'ACTION TACTIQUE
    if (type === 'Action Tactique') {
        window.openActionModal(id); 
        currentMapInstance.closePopup(); 
        return;
    }
    
    // Déclenche la fonction d'ouverture de modale (pour les Manifestations, Lieux, etc.)
    import('./layerModal.js').then(({ openLegendModal }) => {
        openLegendModal(id, type);
        currentMapInstance.closePopup(); 
    }).catch(error => console.error("Erreur critique: Impossible de charger openLegendModal", error));
};


/**
 * Initialise la carte Leaflet et ajoute les marqueurs.
 */
export function initLayerMap(allDataPassed, legendConfigPassed) {
    if (mapInstance) {
        mapInstance.remove();
    }
    
    console.log("--- DÉMARRAGE DE initLayerMap (FOND OSM ACTIF) ---\n");

    mapInstance = L.map('map').setView([46.603354, 1.888334], 7); 
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance);

    markerLayers = {};
    allData = allDataPassed;
    legendConfig = legendConfigPassed;
    
    const categorizedPoints = categorizeData(allData, legendConfig);

    console.log("Points catégorisés:", categorizedPoints);
    
    window.handleModalOpenClick = window.handleModalOpenClick;

    legendConfig.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;

        const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

        subcategories.forEach(subConfig => {
            const subcategoryName = subConfig.name;
            const points = categorizedPoints[categoryName] && categorizedPoints[categoryName][subcategoryName] ? categorizedPoints[categoryName][subcategoryName] : [];

            if (points.length > 0) {
                const layerGroup = L.layerGroup();
                
                points.forEach(point => {
                    const isActionTactique = point.type === 'Action Tactique';
                    
                    const iconPath = isActionTactique ? 'action-lancée-icon.png' : (point.iconKey || subConfig.icon); 
                    
                    const customIcon = L.icon({
                        iconUrl: `src/img/${iconPath}`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    });

                    // 🛑 CONTENU INITIAL DU POPUP AJUSTÉ
                    const popupContent = `
                        <b>${isActionTactique ? `Action ID ${point.id}` : point.name}</b><br>
                        <p>${isActionTactique ? point.name : (point.description || subcategoryName)}</p>
                        ${isActionTactique ? '<span style="color: var(--color-success); font-weight: bold;">[Action Lancée]</span><br>' : ''}
                        
                        <button class="open-modal-btn" 
                                data-id="${point.id}" 
                                data-type="${point.type || subcategoryName}"
                                style="background-color: #2563eb; color: white; padding: 5px 10px; border-radius: 4px; border: none; cursor: pointer; margin-top: 5px;"
                                onclick="handleModalOpenClick('${point.id}', '${point.type || subcategoryName}')">
                            ${isActionTactique ? '🧠 Voir Plan Tactique' : 'Voir les détails (Média)'}
                        </button>
                    `;
                    
                    if (point.lat && point.lon) {
                        const marker = L.marker([point.lat, point.lon], { icon: customIcon });
                        marker.bindPopup(popupContent);
                        layerGroup.addLayer(marker);
                        
                    } else {
                        console.warn(`Point ignoré : Coordonnées non valides pour ${point.name} (${subcategoryName}).`);
                    }
                });

                markerLayers[subcategoryName] = layerGroup;
            }
        });
    });
    
    return mapInstance;
}

export function getMapInstance() { return mapInstance; }
export function getMarkerLayers() { return markerLayers; }

/**
 * Catégorise les données brutes en fonction de la configuration de la légende.
 */
export function categorizeData(data, config) {
    const categorized = {};
    const categorizedItemKeys = new Map(); 

    const dedicatedSources = { /* ... */ }; 
    
    const getExpectedTypeForDataKey = (dataKey) => dedicatedSources[dataKey] || null;

    config.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        if (!categorized[categoryName]) { categorized[categoryName] = {}; }

        const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

        const itemsToProcess = [];
        const categoryDataKeys = categoryConfig.dataKeys || [];
        
        categoryDataKeys.forEach(dataKey => {
            let items = [];
            
            // GESTION SPÉCIFIQUE POUR 'actions.json'
            if (dataKey === 'actions' && data[dataKey] && data[dataKey].liste_actions_consolidee) {
                 items = data[dataKey].liste_actions_consolidee;
            } else {
                 items = data[dataKey] ? (Array.isArray(data[dataKey]) ? data[dataKey] : [data[dataKey]]) : [];
            }
            
            items.forEach((item, index) => {
                 if (!item || typeof item !== 'object') return; 
                 
                 const itemId = String(item.id || `temp_id_${dataKey}_${index}`); 
                 const uniqueKey = `${dataKey}_${itemId}`;
                 itemsToProcess.push({ item, dataKey, uniqueKey }); 
            });
        });

        subcategories.forEach(subConfig => {
            const subcategoryName = subConfig.name;
            const subTypeFilters = (subConfig.typeFilter || [])
                .map(f => (typeof f === 'string' ? f.trim() : f))
                .filter(f => f); 
            
            const subDataKeysToProcess = subConfig.dataKeys || categoryConfig.dataKeys || [];

            itemsToProcess.forEach(({ item, dataKey, uniqueKey }) => {
                const subcategoryKey = `${categoryName}_${subcategoryName}_${uniqueKey}`;
                if (categorizedItemKeys.has(subcategoryKey)) return; 
                if (!subDataKeysToProcess.includes(dataKey)) return;

                let shouldCategorize = false;
                
                let itemType = item.type || ''; 
                if (dataKey === 'actions' && item.type) {
                     // 🛑 itemType est maintenant la catégorie principale (Blocage, Économie, Symbole, etc.)
                     itemType = item.type.trim(); 
                }

                const expectedTypeForDataKey = getExpectedTypeForDataKey(dataKey);

                if (!itemType.trim() && expectedTypeForDataKey) { itemType = expectedTypeForDataKey; } 
                else if (itemType.trim()) { itemType = itemType.trim(); }

                const normalizedTypes = [itemType].concat(item.syndicats || []).flat()
                                        .map(t => (typeof t === 'string' && t) ? t.trim() : t) 
                                        .filter(t => t); 

                
                // **********************************************
                // LOGIQUE DE DÉCISION
                // **********************************************
                
                const hasActionCoords = dataKey === 'actions' && item.coordonnees_initiales && 
                                        item.coordonnees_initiales.latitude !== null && 
                                        item.coordonnees_initiales.longitude !== null;
                                        
                // 🛑 FILTRAGE CRITIQUE : Seules les actions LANCÉES s'affichent sur la carte.
                if (dataKey === 'actions' && !hasActionCoords) { return; }
                
                // Règle 3. Classification par filtre strict (inclut les actions)
                if (subTypeFilters.length > 0) {
                     // Vérifie si le type d'action est inclus dans les filtres
                     if (dataKey === 'actions') {
                          // itemType est maintenant juste "Blocage", "Symbole", etc.
                          shouldCategorize = subTypeFilters.includes(itemType);
                     } else {
                          shouldCategorize = subTypeFilters.some(filterType => normalizedTypes.includes(filterType));
                     }
                } else {
                    // Logique par défaut pour les autres sources sans filtre spécifique
                    shouldCategorize = subDataKeysToProcess.includes(dataKey);
                } 
                
                // **********************************************
                // FIN DE LA LOGIQUE DE DÉCISION
                // **********************************************


                if (shouldCategorize) {
                    if (!categorized[categoryName]) { categorized[categoryName] = {}; }
                    if (!categorized[categoryName][subcategoryName]) { categorized[categoryName][subcategoryName] = []; }
                    
                    let iconKey = item.iconKey || subConfig.icon; 
                    
                    if (dataKey === 'actions') { iconKey = 'action-lancée-icon.png'; }
                    // ... (Autres règles de déduction d'icône inchangées)

                    const finalName = item.action || item.name || item.title || item.parnom || item.city || item.department || dataKey;
                    
                    let pointId = String(item.id || item.name || item.city || finalName);
                    
                    
                    // 🛑 GESTION SPÉCIFIQUE DES COORDONNÉES POUR LES ACTIONS
                    let pointsToAdd = [];
                    if (dataKey === 'actions' && item.coordonnees_initiales) {
                        // On utilise les coordonnées fictives
                        pointsToAdd = [{ lat: item.coordonnees_initiales.latitude, lon: item.coordonnees_initiales.longitude, name: finalName }];
                    } else {
                        const hasDirectCoords = item.lat !== undefined && item.lon !== undefined;
                        pointsToAdd = hasDirectCoords ? [{lat: item.lat, lon: item.lon, name: finalName}] : 
                                            (item.locations && Array.isArray(item.locations) && item.locations.length > 0 ? item.locations : []);
                    }
                    
                    pointsToAdd.forEach(loc => {
                        const lat = parseFloat(loc.lat || item.lat);
                        const lon = parseFloat(loc.lon || item.lon);
                        
                        if (!isNaN(lat) && !isNaN(lon) && lat !== null && lon !== null && (lat !== 0 || lon !== 0)) { 
                            categorized[categoryName][subcategoryName].push({
                                id: pointId, 
                                name: loc.name || loc.city || finalName,
                                // 🛑 Type pour l'appel de la modale spécifique
                                type: dataKey === 'actions' ? 'Action Tactique' : (item.type || itemType || subcategoryName), 
                                description: item.action || item.description, // Utilise 'action' pour les actions
                                lat: lat,
                                lon: lon,
                                iconKey: iconKey 
                            });
                        }
                    });
                    
                    categorizedItemKeys.set(subcategoryKey, true);
                }
            });
        });
        
        // 🛑 DÉBOGAGE FINAL : Log les items non classés
        itemsToProcess.forEach(({ item, dataKey, uniqueKey }) => {
            if (categoryDataKeys.includes(dataKey) && !Object.values(categorized[categoryName] || {}).flat().some(p => String(p.id).startsWith(String(item.id || 'temp_id')))) {
                const itemName = item.action || item.name || item.title || item.parnom || item.city || item.department || 'Point Inconnu';
                const itemType = item.type || ''; 
                // console.warn(`[DEBUG LOG: FINAL FAIL] Point ignoré (non classé): ${itemName} (Source: ${dataKey}, Type: ${itemType}).`);
            }
        });
    });
    return categorized;
}