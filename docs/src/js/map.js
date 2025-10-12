// Fichier : public/src/js/map.js (VERSION CORRIGÉE ET OPTIMISÉE)

import { initLayerMap } from './layerMap.js';
import { initLegend } from './layerLegend.js';
import { openBoycottageFormModal } from './boycottageForm.js';
import { initUserLayer } from './layerUser.js';
import { setGlobalDataCache } from './modalLegend.js'; 
import { initSatelliteModule } from './satellite.js'; 
// 🛑 Importez la nouvelle fonction d'injection
import { initActionsModule, setActionsData } from './modalActions.js'; 

let allData = {};
let legendConfig = {};

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[WARNING 404/Network] Fichier non trouvé ou erreur de chargement : ${url}`);
            return {}; 
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`[FATAL JSON ERROR] Le fichier ${url} est corrompu (JSON invalide ou tronqué).`, error);
        return {}; 
    }
}

export async function initMap() {
    try {
        const [
            // Fichiers de Configuration
            legendConfigData, 
            
            // Lieux & Manifestations
            elyseeData, mairiesData, prefecturesData, 
            manifestationPoints10Data, manifestationPoints18Data,manifestationPoints2Data,revendicativePoints15Data,revendicativePoints18Data,
            
            strategicLocationsData, manifestationsData, marcheClimatData, 
            
            // Chargement du fichier actions.json
            actionsData, // ⬅️ Ces données sont déjà chargées
            
            // Secteurs & Boycotts
            boycottsData, commerceData, financeData, industryData, syndicatsData,
            educData, impotsData,
            
            // Surveillance
            camerasPointsData, telecomsData, satellitesData, 

            // Organisations & Divers
            cnccfpPartisData, organisationData, ricData, petitionsData,
            
            // Réseaux Sociaux
            reseauData 
        ] = await Promise.all([
            fetchData('src/json/map/map.json'),
            
            fetchData('src/json/map/elysee.json'),
            fetchData('src/json/map/mairies.json'), 
            fetchData('src/json/map/prefectures.json'),
            
            fetchData('src/json/map/manifestation_points_10_septembre.json'), 
            fetchData('src/json/map/manifestation_points_18_septembre.json'), 
            fetchData('src/json/map/manifestation_points_2_octobre.json'),
            fetchData('src/json/map/manifestation_points_15_octobre.json'),
            fetchData('src/json/map/manifestation_points_18_octobre.json'),
            
            fetchData('src/json/map/strategic_locations.json'),
            fetchData('src/json/map/manifestations.json'), 
            fetchData('src/json/map/marche-climat.json'), 
            
            fetchData('src/json/map/actions.json'), 
            
            fetchData('src/json/map/boycotts.json'), 
            fetchData('src/json/map/commerce.json'), 
            fetchData('src/json/map/finance.json'), 
            fetchData('src/json/map/industry.json'),
            fetchData('src/json/map/syndicats.json'), 
            fetchData('src/json/map/educ.json'), 
            fetchData('src/json/map/impots.json'), 
            
            fetchData('src/json/map/cameras_points.json'), 
            fetchData('src/json/map/telecoms.json'), 
            fetchData('src/json/map/satellites.json'),
            
            fetchData('src/json/map/cnccfp.json'),
            fetchData('src/json/map/organisation.json'),
            fetchData('src/json/map/rics.json'),
            fetchData('src/json/map/petitions.json'),
            
            fetchData('src/json/map/reseau_sociaux.json')
        ]);
        
        // CONSOLIDATION
        allData = {
            mairies: mairiesData,elysee:elyseeData, prefectures: prefecturesData, strategic_locations: strategicLocationsData,
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
        
        legendConfig = legendConfigData;
        
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
    } catch (error) {
        console.error('Erreur fatale lors de l\'initialisation de initMap:', error);
    }
}

function attachMapEvents() {
    const openFormBtn = document.getElementById('open-boycott-modal-btn');
    if (openFormBtn) {
        openFormBtn.addEventListener('click', openBoycottageFormModal);
    }
}