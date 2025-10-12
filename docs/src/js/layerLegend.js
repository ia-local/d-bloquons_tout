// Fichier : public/src/js/layerLegend.js (Finalisé - L.control et Logique de Menu)

import { getMarkerLayers, getMapInstance, categorizeData } from './layerMap.js';

let legendConfig = {};
let allData = {};
let categorizedPoints = {};
let legendControl = null; 

export function initLegend(data, fetchedData) {
    const mapInstance = getMapInstance();
    if (!mapInstance) {
        console.error("Erreur: Instance de carte (globalMap) non trouvée pour initialiser la légende.");
        return;
    }

    legendConfig = data;
    allData = fetchedData;
    // Recatégorise les données ici pour que layerLegend les ait à jour
    categorizedPoints = categorizeData(allData, legendConfig);

    if (legendControl) {
        mapInstance.removeControl(legendControl);
    }

    // 1. Crée le contrôle de légende Leaflet (position: bottomright)
    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function (map) {
        // Crée le conteneur principal DIV avec la classe leaflet-legend (pour le CSS)
        const div = L.DomUtil.create('div', 'info leaflet-legend');
        div.innerHTML = `
            <div id="legend-main-content">
                <ul id="legend-list-categories">
                    <p class="legend-loading-message">Chargement des catégories...</p>
                </ul>
                <ul id="legend-list-items" style="display: none;"></ul>
            </div>
        `;
        
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        // Au chargement, on peuple l'état initial
        setTimeout(() => {
            renderCategories(div);
        }, 0);

        return div;
    };

    legendControl.addTo(mapInstance);
    console.log("✅ Contrôle de Légende Leaflet ajouté en bas à droite.");
}

/**
 * Affiche la liste des catégories principales.
 */
function renderCategories(containerDiv) {
    const legendListCategories = containerDiv.querySelector('#legend-list-categories');
    const legendListItems = containerDiv.querySelector('#legend-list-items');
    
    // Bascule la vue
    legendListItems.style.display = 'none';
    legendListCategories.style.display = 'block';
    legendListCategories.innerHTML = '';
    
    // Ajoute le titre
    const titleLi = document.createElement('li');
    titleLi.className = 'legend-title';
    titleLi.innerHTML = '<h4>Catégories (Layers)</h4>';
    legendListCategories.appendChild(titleLi);

    legendConfig.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        const subcategoriesData = categorizedPoints[categoryName] || {};
        
        // Calcule le nombre total de points sous cette catégorie
        const itemCount = Object.values(subcategoriesData).flat().length; 
        
        const liCategory = document.createElement('li');
        liCategory.className = 'legend-category';
        liCategory.setAttribute('data-category', categoryName);
        
        // 🛑 CHEMIN CORRIGÉ pour l'icône de la catégorie principale
        const iconUrl = `./src/img/${categoryConfig.icon}`; 
        
        liCategory.innerHTML = `
            <span class="legend-icon" style="background-image: url('${iconUrl}')"></span>
            ${categoryName} <span class="category-count">(${itemCount})</span>
            <span class="category-arrow">►</span>
        `;
        
        liCategory.addEventListener('click', () => {
            renderSublist(categoryConfig, subcategoriesData, containerDiv);
        });
        legendListCategories.appendChild(liCategory);
    });
}

/**
 * Affiche la liste des sous-catégories et des points à l'intérieur d'une catégorie.
 */
function renderSublist(categoryConfig, subcategoriesData, containerDiv) {
    const map = getMapInstance();
    const markerLayers = getMarkerLayers();
    
    const legendListCategories = containerDiv.querySelector('#legend-list-categories');
    const legendListItems = containerDiv.querySelector('#legend-list-items');
    
    legendListCategories.style.display = 'none';
    legendListItems.style.display = 'block';
    legendListItems.innerHTML = '';
    
    // --- 1. BOUTON RETOUR ---
    const backBtn = document.createElement('li');
    backBtn.className = 'legend-back-btn';
    backBtn.innerHTML = `
        <span class="legend-icon back-arrow">←</span> 
        Retour Catégories
    `;
    backBtn.addEventListener('click', () => {
        renderCategories(containerDiv); 
    });
    legendListItems.appendChild(backBtn);
    
    // --- 2. LISTE DES SOUS-CATÉGORIES (Couches à basculer) ---
    const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

    subcategories.forEach(subConfig => {
        const subcategoryName = subConfig.name;
        const subcategoryPoints = subcategoriesData[subcategoryName] || [];
        const itemCount = subcategoryPoints.length;
        
        const layer = markerLayers[subcategoryName];
        const isVisible = layer && map ? map.hasLayer(layer) : false; 
        
        const showSubcategoryBtn = document.createElement('li');
        showSubcategoryBtn.className = `legend-item sub-category ${isVisible ? 'active' : ''}`;
        
        const iconPath = `./src/img/${subConfig.icon}`; // 🛑 CHEMIN CORRIGÉ
        
        showSubcategoryBtn.innerHTML = `
            <span class="layer-toggle-icon"></span>
            <span class="legend-icon" style="background-image: url('${iconPath}')"></span>
            ${subcategoryName} <span class="category-count">(${itemCount})</span>
            <span class="dropdown-arrow">▼</span>
        `;
        
        const sublistContent = document.createElement('ul');
        sublistContent.className = 'sub-list-items';
        sublistContent.style.display = 'none'; 

        // Rendu de la liste détaillée des points (pour le zoom)
        if (itemCount > 0) { 
            const sortedPoints = subcategoryPoints.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            sortedPoints.forEach(item => {
                const liItem = document.createElement('li');
                liItem.className = 'legend-sub-item';
                
                const itemIconPath = `./src/img/${item.iconKey || subConfig.icon}`; // 🛑 CHEMIN CORRIGÉ

                liItem.innerHTML = `
                    <span class="legend-icon item-icon" style="background-image: url('${itemIconPath}')"></span>
                    ${item.name || item.city || item.title || item.department}
                `;
                
                liItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    
                    if (layer && map) {
                        map.setView([item.lat, item.lon], 15);
                        if (!map.hasLayer(layer)) {
                            map.addLayer(layer);
                            showSubcategoryBtn.classList.add('active');
                        }
                        layer.eachLayer(marker => {
                            if (marker.getLatLng().lat === item.lat && marker.getLatLng().lng === item.lon) {
                                marker.openPopup();
                            }
                        });
                    }
                });
                sublistContent.appendChild(liItem);
            });
        }
        
        const toggleDropdown = () => {
            const isHidden = sublistContent.style.display === 'none';
            sublistContent.style.display = isHidden ? 'block' : 'none'; 
            showSubcategoryBtn.querySelector('.dropdown-arrow').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        // Empêche le clic sur la flèche de basculer la couche
        if(showSubcategoryBtn.querySelector('.dropdown-arrow')) {
            showSubcategoryBtn.querySelector('.dropdown-arrow').addEventListener('click', (e) => {
                 e.stopPropagation(); 
                 toggleDropdown();
            });
        }


        // Bascule la couche lorsque l'on clique sur le nom (pas la flèche)
        showSubcategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Bascule la visibilité de la couche
            if (layer && itemCount > 0) { 
                const isVisibleNow = map.hasLayer(layer);
                if (isVisibleNow) {
                    map.removeLayer(layer);
                    showSubcategoryBtn.classList.remove('active');
                } else {
                    map.addLayer(layer);
                    showSubcategoryBtn.classList.add('active');
                }
            }
        });

        legendListItems.appendChild(showSubcategoryBtn);
        legendListItems.appendChild(sublistContent);
    });
}