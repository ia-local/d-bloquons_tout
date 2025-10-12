// config/leaflet.js - Définition de la classe de contrôle de légende et de l'initialisation de base.

// NOTE: Assurez-vous que normalizeManifestationData est défini globalement (dans map.js ou app.js)

if (typeof L !== 'undefined') {
    let currentActiveLayer = null; 

    // --- 1. LOGIQUE DU CONTRÔLE DE LÉGENDE (CATEGORIES & SOUS-CATEGORIES) ---
    
    // Fonction utilitaire pour charger map.json
    async function loadMapCategories() {
        try {
            const response = await fetch('map.json'); 
            if (!response.ok) {
                console.error("[LEGEND] Échec de la lecture de map.json:", `Erreur HTTP: ${response.status}`);
                return { categories: [] };
            }
            return await response.json();
        } catch (e) {
            console.error("[LEGEND] Échec du chargement de map.json:", e);
            return { categories: [] };
        }
    }

    /**
     * Classe principale du Contrôle Leaflet Personnalisé pour la Légende/Contrôle des Couches.
     */
    L.Control.CategoryLegend = L.Control.extend({
        options: {
            position: 'bottomright' 
        },

        onAdd: function (map) {
            this.map = map;
            this.categoriesData = null;
            this.allLayers = {};

            const container = L.DomUtil.create('div', 'leaflet-legend'); 
            
            // Empêche le défilement et le clic sur le contrôle de légende
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'contextmenu', L.DomEvent.stop);
            L.DomEvent.on(container, 'wheel', L.DomEvent.stopPropagation);

            // Chargement et rendu Asynchrone de la Légende
            loadMapCategories().then(data => {
                this.categoriesData = data.categories;
                this._renderLegend(container);
                this._loadAllData(data.categories); 
            }).catch(e => console.error("[LEGEND] Erreur critique lors du rendu de la légende:", e));

            return container;
        },

        // Utilise la fonction globale définie dans map.js
        _normalizeData: window.normalizeManifestationData,

        _renderLegend: function (container) {
            if (!this.categoriesData || this.categoriesData.length === 0) {
                 container.innerHTML = `<div class="legend-title"><h4>Légende non configurée.</h4></div>`;
                 return;
            }

            container.innerHTML = `<div class="legend-title"><h4>Contrôle des Couches et Légende</h4></div>`;
            const ul = L.DomUtil.create('ul', 'main-list', container);

            this.categoriesData.forEach(category => {
                const categoryEl = L.DomUtil.create('li', 'legend-category', ul);
                const header = L.DomUtil.create('div', 'legend-item-header', categoryEl);
                header.innerHTML = `
                    <div class="legend-icon" style="background-image: url('icons/${category.icon}');"></div>
                    <span class="legend-label">${category.name}</span>
                `;
                
                const arrow = L.DomUtil.create('span', 'category-arrow', categoryEl);
                arrow.textContent = '▼';
                
                const subList = L.DomUtil.create('ul', 'sub-list-items hidden', ul);
                categoryEl.dataset.expanded = 'false';

                L.DomEvent.on(categoryEl, 'click', () => {
                    const isExpanded = categoryEl.dataset.expanded === 'true';
                    if (isExpanded) {
                        subList.classList.add('hidden');
                        arrow.style.transform = 'rotate(0deg)';
                        categoryEl.dataset.expanded = 'false';
                    } else {
                        subList.classList.remove('hidden');
                        arrow.style.transform = 'rotate(-90deg)';
                        categoryEl.dataset.expanded = 'true';
                    }
                });

                (category.subcategories || []).forEach(sub => {
                    const subItemEl = L.DomUtil.create('li', 'legend-sub-item', subList);
                    const subItemContent = L.DomUtil.create('div', null, subItemEl);
                    subItemContent.innerHTML = `
                        <div class="legend-icon item-icon" style="background-image: url('icons/${sub.icon}');"></div>
                        <span class="legend-label">${sub.name}</span>
                    `;

                    L.DomEvent.on(subItemEl, 'click', (e) => {
                        L.DomEvent.stop(e); 
                        this._toggleLayer(subItemEl, sub);
                    });
                });
            });
        },

        _loadAllData: async function(categories) {
            const mockManifestationKey = '/map/data/manifestations';
            let geoJsonData = { type: "FeatureCollection", features: [] };

            try {
                const fetcher = window.fetchData || fetchData; 
                const rawData = await fetcher(mockManifestationKey); 
                
                const normalizedDataArray = this._normalizeData(rawData);
                
                if (Array.isArray(normalizedDataArray) && normalizedDataArray.length > 0) {
                     geoJsonData.features = normalizedDataArray.map(item => ({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [item.lon, item.lat] }, 
                        properties: { name: item.city, city: item.city, type: item.type || 'Manifestation', count: item.count } 
                     }));
                }
            } catch (e) {
                console.error("[LEGEND] Erreur construction GeoJSON:", e);
            }
            
            this.allLayers['base_manifestation_data'] = geoJsonData;
            
            console.log(`[DATA] Base de données de ${geoJsonData.features.length} points chargée.`);
        },

        _toggleLayer: function (subItemEl, subcategory) {
            const layerKey = 'base_manifestation_data'; 
            
            const isActive = subItemEl.classList.contains('active');
            
            if (currentActiveLayer) {
                this.map.removeLayer(currentActiveLayer.leafletLayer);
                currentActiveLayer.element.classList.remove('active');
                
                if (currentActiveLayer.element === subItemEl) {
                     currentActiveLayer = null;
                     return;
                }
            }

            const geoJsonData = this.allLayers[layerKey];

            if (!geoJsonData || geoJsonData.features.length === 0) {
                console.warn(`[LEGEND] Aucune donnée de base disponible pour le filtrage.`);
                return;
            }

            const filters = subcategory.typeFilter;
            let filteredFeatures = geoJsonData.features;
            
            if (filters && filters.length > 0) {
                 filteredFeatures = filteredFeatures.filter(f => 
                     filters.some(filter => f.properties.type && f.properties.type.includes(filter))
                 );
            }
            
            const filteredGeoJson = {
                type: "FeatureCollection",
                features: filteredFeatures
            };

            const newLayer = L.geoJson(filteredGeoJson, {
                pointToLayer: (feature, latlng) => {
                    const iconUrl = `icons/${subcategory.icon}`;
                    const customIcon = L.icon({
                        iconUrl: iconUrl,
                        iconSize: [25, 25],
                        iconAnchor: [12, 25],
                        popupAnchor: [0, -20]
                    });
                    return L.marker(latlng, { icon: customIcon });
                },
                onEachFeature: (feature, layer) => {
                    const count = feature.properties.count ? ` (${feature.properties.count})` : '';
                    layer.bindPopup(`<b>${feature.properties.name}${count}</b><br>Type: ${feature.properties.type}`);
                }
            });

            newLayer.addTo(this.map);
            subItemEl.classList.add('active');
            
            currentActiveLayer = {
                leafletLayer: newLayer,
                element: subItemEl
            };
            
            console.log(`[LEGEND] Couche activée: ${subcategory.name}. Points affichés: ${filteredFeatures.length}`);
        },
    });

    // Factory du contrôle Leaflet
    L.control.categoryLegend = function (options) {
        return new L.Control.CategoryLegend(options);
    };
} else {
    console.error("Erreur de Dépendance: La librairie Leaflet (L) n'est pas chargée pour définir les contrôles.");
}
