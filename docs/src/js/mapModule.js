// Fichier : public/src/js/mapModule.js (Logique d'initialisation de la carte)

// L'ancienne fonction fetchData du root map.js n'est PLUS nécessaire ici, 
// car le fetchData global est défini dans app.js et priorise l'API.

import { initLayerMap } from './layerMap.js';
import { initLegend } from './layerLegend.js';
import { openBoycottageFormModal } from './boycottageForm.js';
import { initUserLayer } from './layerUser.js';
import { setGlobalDataCache } from './modalLegend.js'; 
import { initSatelliteModule } from './satellite.js'; 
import { initActionsModule, setActionsData } from './modalActions.js'; 

let allData = {};
let legendConfig = {};

// NOTE: Le fetchData global (API-first) est utilisé depuis window.fetchData

/**
 * Fonction asynchrone pour charger toutes les données JSON nécessaires à la carte.
 * Utilise le fetchData global de l'application (défini dans app.js).
 */
async function loadAllMapData() {
     // NOTE: window.fetchData est désormais la fonction unifiée (API ou Mock)
     const fetchData = window.fetchData; 
     
     // 🛑 Définition des promesses de chargement
     // L'ordre est CRITIQUE car il correspond à l'extraction dans initMapModule!
     return Promise.all([
        fetchData('src/json/map/map.json'), // 0: legendConfig
        fetchData('src/json/map/elysee.json'), // 1
        fetchData('src/json/map/mairies.json'), // 2
        fetchData('src/json/map/prefectures.json'), // 3
        fetchData('src/json/map/manifestation_points_10_septembre.json'), // 4
        fetchData('src/json/map/manifestation_points_18_septembre.json'), // 5
        fetchData('src/json/map/manifestation_points_2_octobre.json'), // 6
        fetchData('src/json/map/manifestation_points_15_octobre.json'), // 7
        fetchData('src/json/map/manifestation_points_18_octobre.json'), // 8
        fetchData('src/json/map/strategic_locations.json'), // 9
        // 💡 FICHIERS AJOUTÉS: Les données des ronds-points et portes
        fetchData('src/json/map/roundabout_points.json'), // 10
        fetchData('src/json/map/porte_points.json'),      // 11
        // -----------------------------------------------------------------
        fetchData('src/json/map/manifestations.json'), // 12
        fetchData('src/json/map/marche-climat.json'), // 13
        fetchData('src/json/map/actions.json'), // 14
        fetchData('src/json/map/boycotts.json'), // 15
        fetchData('src/json/map/commerce.json'), // 16
        fetchData('src/json/map/finance.json'), // 17
        fetchData('src/json/map/industry.json'), // 18
        fetchData('src/json/map/syndicats.json'), // 19
        fetchData('src/json/map/educ.json'), // 20
        fetchData('src/json/map/impots.json'), // 21
        fetchData('src/json/map/cameras_points.json'), // 22
        fetchData('src/json/map/telecoms.json'), // 23
        fetchData('src/json/map/satellites.json'), // 24
        fetchData('src/json/map/cnccfp.json'), // 25
        fetchData('src/json/map/organisation.json'), // 26
        fetchData('src/json/map/rics.json'), // 27
        fetchData('src/json/map/petitions.json'), // 28
        fetchData('src/json/map/reseau_sociaux.json') // 29
    ]);
}


export async function initMapModule() {
    try {
        const dataArray = await loadAllMapData();
        
        // 🛑 Extraction et Consolidation des données (Basé sur l'ordre de loadAllMapData)
        // Simplification de l'extraction car l'ordre de Promise.all est fixe
        legendConfig = dataArray[0];
        
        const [
            // [1] - [8] Manifestations/Lieux
            elyseeData, mairiesData, prefecturesData, 
            manifestationPoints10Data, manifestationPoints18Data,manifestationPoints2Data,
            revendicativePoints15Data,revendicativePoints18Data,
            strategicLocationsData, 
            // 💡 NOUVELLES DONNÉES EXTRAITES
            roundaboutPointsData,
            portePointsData,
            // --------------------------------
            manifestationsData, marcheClimatData, 
            
            // [9] Actions
            actionsData, 
            
            // [10] - [16] Secteurs & Boycotts
            boycottsData, commerceData, financeData, industryData, syndicatsData,
            educData, impotsData,
            
            // [17] - [19] Surveillance
            camerasPointsData, telecomsData, satellitesData, 

            // [20] - [23] Organisations & Divers
            cnccfpPartisData, organisationData, ricData, petitionsData,
            
            // [24] Réseaux Sociaux
            reseauData
        ] = dataArray.slice(1);


        allData = {
            mairies: mairiesData,elysee:elyseeData, prefectures: prefecturesData, 
            strategic_locations: strategicLocationsData,
            // 💡 AJOUT DES NOUVELLES CLÉS
            roundabout_points: roundaboutPointsData,
            porte_points: portePointsData,
            // --------------------------
            manifestation_points_10_septembre: manifestationPoints10Data,
            manifestation_points_18_septembre: manifestationPoints18Data,
            manifestation_points_2_octobre: manifestationPoints2Data,
            manifestation_points_15_octobre: revendicativePoints15Data,
            manifestation_points_18_octobre: revendicativePoints18Data,
            manifestations: manifestationsData,
            marche_climat: marcheClimatData, 
            actions:actionsData, 
            boycotts: boycottsData, commerce: commerceData, finance: financeData, industry: industryData,
            syndicats: syndicatsData?.syndicats || syndicatsData, 
            educ: educData, 
            taxes: impotsData,
            cameras_points: camerasPointsData, telecoms: telecomsData, satellites: satellitesData,
            cnccfp_partis: cnccfpPartisData, organisation: organisationData,
            rics: ricData, petitions: petitionsData,
            reseau: reseauData
        };
        
        setGlobalDataCache(allData); 

        // 🛑 INJECTION CRITIQUE: Transfère les données chargées directement au module Modal
        initActionsModule(); 
        setActionsData(actionsData);
        
        const mapInstance = initLayerMap(allData, legendConfig);
        initLegend(legendConfig, allData);
        initUserLayer();
        
        if (mapInstance) {
            initSatelliteModule(mapInstance);
        }

        attachMapEvents();
        console.log("Carte et légende initialisées avec les données asynchrones.");
        
        return mapInstance; // Retourne l'instance de carte
    } catch (error) {
        console.error('Erreur fatale lors de l\'initialisation de initMapModule:', error);
        return null;
    }
}

function attachMapEvents() {
    const openFormBtn = document.getElementById('open-boycott-modal-btn');
    if (openFormBtn) {
        openFormBtn.addEventListener('click', openBoycottageFormModal);
    }
}