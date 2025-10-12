// Fichier : public/src/js/layerLegend.js (Finalisé - AFFICHAGE DES LOGOS INDIVIDUELS ET UX CORRIGÉE)

import { openLegendModal } from './layerModal.js';
import { getMarkerLayers, getMapInstance, categorizeData } from './layerMap.js';

let legendConfig = {};
let allData = {};
let categorizedPoints = {};

export function initLegend(data, fetchedData) {
    legendConfig = data;
    allData = fetchedData;
    categorizedPoints = categorizeData(allData, legendConfig);
    renderCategories();
}

function renderCategories() {
    const legendCategories = document.getElementById('map-categories-legend');
    const legendItems = document.getElementById('map-items-legend');
    const legendListCategories = document.getElementById('legend-list-categories');
    
    if (!legendCategories || !legendItems || !legendListCategories) {
        console.error("Un conteneur de légende est manquant. Vérifiez map.html.");
        return;
    }

    legendItems.style.display = 'none';
    legendCategories.style.display = 'block';
    legendListCategories.innerHTML = '';
    
    legendConfig.categories.forEach(categoryConfig => {
        const categoryName = categoryConfig.name;
        const subcategoriesData = categorizedPoints[categoryName] || {};
        const itemCount = Object.values(subcategoriesData).flat().length; 
        
        const liCategory = document.createElement('li');
        liCategory.className = 'legend-category';
        liCategory.setAttribute('data-category', categoryName);
        const iconUrl = `src/img/${categoryConfig.icon}`;
        
        liCategory.innerHTML = `
            <span class="legend-icon" style="background-image: url('${iconUrl}')"></span>
            ${categoryName} (${itemCount})
        `;
        
        liCategory.addEventListener('click', () => {
            renderSublist(categoryConfig, subcategoriesData);
        });
        legendListCategories.appendChild(liCategory);
    });
}

function renderSublist(categoryConfig, subcategoriesData) {
    const map = getMapInstance();
    const markerLayers = getMarkerLayers();
    
    const legendCategories = document.getElementById('map-categories-legend');
    const legendItems = document.getElementById('map-items-legend');
    const legendListItems = document.getElementById('legend-list-items');
    
    legendCategories.style.display = 'none';
    legendItems.style.display = 'block';
    legendListItems.innerHTML = '';
    
    const backBtn = document.createElement('li');
    backBtn.className = 'legend-back-btn';
    const backBtnIconUrl = `src/img/${categoryConfig.icon}`;
    backBtn.innerHTML = `
        <span class="legend-icon" style="background-image: url('${backBtnIconUrl}')"></span> 
        Retour à ${categoryConfig.name}
    `;
    backBtn.addEventListener('click', () => {
        renderCategories();
    });
    legendListItems.appendChild(backBtn);
    
    const subcategories = categoryConfig.subcategories || [{ name: categoryConfig.name, icon: categoryConfig.icon }];

    subcategories.forEach(subConfig => {
        const subcategoryName = subConfig.name;
        const subcategoryPoints = subcategoriesData[subcategoryName] || [];
        const itemCount = subcategoryPoints.length;
        
        const layer = markerLayers[subcategoryName];
        const isVisible = layer ? map.hasLayer(layer) : false; 
        
        const showSubcategoryBtn = document.createElement('li');
        showSubcategoryBtn.className = `legend-item ${isVisible ? 'active' : ''}`;
        showSubcategoryBtn.setAttribute('data-category', categoryConfig.name);
        showSubcategoryBtn.setAttribute('data-subcategory', subcategoryName);

        const iconPath = `src/img/${subConfig.icon}`;
        
        showSubcategoryBtn.innerHTML = `
            <span class="layer-toggle-icon"></span>
            <span class="legend-icon" style="background-image: url('${iconPath}')"></span>
            ${subcategoryName} (${itemCount})
            <span class="dropdown-arrow">▼</span>
        `;
        
        const sublistContent = document.createElement('ul');
        sublistContent.className = 'sub-list-items';
        sublistContent.style.display = 'none'; 

        // Rendu de la liste détaillée des points
        if (itemCount > 0) { 
            const sortedPoints = subcategoryPoints.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            sortedPoints.forEach(item => {
                const liItem = document.createElement('li');
                liItem.className = 'legend-sub-item';
                
                // 🛑 CORRECTION CRITIQUE : Utilise item.iconKey si disponible pour l'icône du liItem
                const itemIconPath = `src/img/${item.iconKey || subConfig.icon}`; 

                liItem.innerHTML = `
                    <span class="legend-icon" style="background-image: url('${itemIconPath}')"></span>
                    ${item.name || item.city || item.title || item.department}
                `;
                
                liItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    
                    // 1. Zoome sur le point
                    map.setView([item.lat, item.lon], 15);
                    
                    // 2. Assure que la couche est visible avant d'ouvrir le popup
                    if (layer && !map.hasLayer(layer)) {
                        map.addLayer(layer);
                        showSubcategoryBtn.classList.add('active');
                    }
                    
                    // 3. Ouvre le popup du marqueur Leaflet
                    if (layer && map.hasLayer(layer)) {
                        layer.eachLayer(marker => {
                            if (marker.getLatLng().lat === item.lat && marker.getLatLng().lng === item.lon) {
                                marker.openPopup();
                            }
                        });
                    }
                    
                    // Modale retirée ici, elle est gérée par le bouton du popup.
                });
                sublistContent.appendChild(liItem);
            });
        }
        
        const toggleDropdown = () => {
            const isHidden = sublistContent.style.display === 'none';
            sublistContent.style.display = isHidden ? 'block' : 'none'; 
            showSubcategoryBtn.querySelector('.dropdown-arrow').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        showSubcategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            toggleDropdown();
            
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