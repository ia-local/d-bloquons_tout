// Fichier : services/gee.js

const express = require('express');
const fsSync = require('fs'); // Nécessaire pour la lecture synchrone de la clé
const ee = require('@google/earthengine');
const path = require('path');

const router = express.Router();

// 🛑 Définition du chemin de la clé GEE (doit exister à la racine du projet)
const EE_PRIVATE_KEY_PATH = './private-key.json'; 
let EE_PRIVATE_KEY = null; 

// --- 1. FONCTION DE CHARGEMENT ET D'AUTHENTIFICATION (Exécutée au démarrage) ---

/**
 * Tente de lire la clé GEE et d'authentifier le service Earth Engine.
 */
async function authenticateEarthEngine() {
    
    // 1. Chargement synchrone de la clé
    try {
        EE_PRIVATE_KEY = JSON.parse(fsSync.readFileSync(EE_PRIVATE_KEY_PATH, 'utf8'));
    } catch (error) {
        console.error(`[FATAL] Impossible de lire la clé privée GEE à ${EE_PRIVATE_KEY_PATH}. L'authentification Earth Engine échouera.`);
    }
    
    if (!EE_PRIVATE_KEY || !EE_PRIVATE_KEY.private_key) {
        // Renvoie une erreur qui sera capturée par le bloc catch du serveur.js
        return Promise.reject(new Error("GEE Private Key n'a pas été chargée correctement. Vérifiez private-key.json."));
    }
    
    // 2. Processus d'authentification et d'initialisation
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            EE_PRIVATE_KEY,
            () => { 
                ee.initialize(null, null, resolve, (err) => reject(new Error(`Échec d'initialisation Earth Engine: ${err}`)));
            },
            (err) => reject(new Error(`Échec d'authentification Earth Engine: ${err}`))
        );
    });
}

// --- 2. ROUTE API POUR LA GÉNÉRATION DES TUILES (/api/gee/tiles/:id) ---

router.get('/tiles/:id', async (req, res) => {
    
    // VÉRIFICATION DE SÉCURITÉ
    if (!ee.data || !ee.data.getAssetAcl) {
        return res.status(503).json({ error: 'Le service Google Earth Engine n\'est pas initialisé.' });
    }
    
    // Tentative de réinitialisation pour la stabilité
    try { ee.reset(); } catch (e) { console.warn("[GEE WARNING] ee.reset() a échoué. Erreur: ", e.message); }
    
    const satelliteId = req.params.id;
    const bandsParam = req.query.bands; 
    const cloudPercentageParam = req.query.cloud_percentage; 
    
    // Configuration de la requête (extraite du serveur.js initial)
    let imageCollectionId = 'COPERNICUS/S2_SR_HARMONIZED'; 
    let bandsToSelect = bandsParam ? bandsParam.split(',') : ['B4', 'B3', 'B2'];
    let cloudFilterKey = 'CLOUDY_PIXEL_PERCENTAGE';
    const STABLE_VIS_PARAMS = { bands: bandsToSelect, min: 0, max: 3000, gamma: 1.2 };
    const cloudLimit = parseInt(cloudPercentageParam || 5); 
    const startDate = '2025-09-10'; 
    const endDate = '2025-09-18'; 
    const franceRoi = ee.Geometry.Rectangle([-5.14, 41.3, 9.56, 51.12]);

    try {
        let collection;
        let size = 0;
        let found = false;

        // T1, T2, T3: Logique de tentative d'escalade des filtres de nuages (inchangée)
        collection = ee.ImageCollection(imageCollectionId)
            .filterDate(startDate, endDate) 
            .filter(ee.Filter.lt(cloudFilterKey, cloudLimit)) 
            .filterBounds(franceRoi) 
            .sort('system:time_start', false); 
        size = await collection.size().getInfo();
        if (size === 0) {
             // T2: Nuageux 50%
             collection = ee.ImageCollection(imageCollectionId)
                 .filterDate(startDate, endDate) 
                 .filter(ee.Filter.lt(cloudFilterKey, 50))
                 .filterBounds(franceRoi)
                 .sort('system:time_start', false);
             size = await collection.size().getInfo();
        }
        if (size === 0) {
             // T3: Relaxation Totale du Nuageux
             collection = ee.ImageCollection(imageCollectionId)
                .filterDate(startDate, endDate)
                .filterBounds(franceRoi)
                .sort('system:time_start', false);
             size = await collection.size().getInfo();
        }
        
        if (size === 0) {
             return res.status(404).json({ error: `Échec GEE: Aucune image satellite trouvée après toutes les tentatives.` });
        }
        
        // Création de la mosaïque 
        const imageToDisplay = collection.mosaic()
            .select(bandsToSelect)
            .unmask(0)
            .toInt16();
        
        // GÉNÉRATION DES TUILES
        imageToDisplay.getMap({
            vis: STABLE_VIS_PARAMS,
        }, (map) => {
            if (!map || map.error || !map.mapid || !map.token) { 
                const errorDetail = map?.error ? (map.error.message || JSON.stringify(map.error)) : "Identifiants de tuile manquants.";
                console.error("Erreur GEE lors de getMap (serveur):", map?.error || "MapID/Token manquant.");
                return res.status(500).json({ error: `Échec du chargement satellite : ${errorDetail}` }); 
            }
            res.json({ mapid: map.mapid, token: map.token, satelliteName: imageCollectionId });
        });
    } catch (error) {
        const errorMessage = error.message || error.toString();
        console.error('Échec critique de la génération des tuiles GEE (Runtime):', errorMessage);
        res.status(500).json({ error: `Échec GEE (ID: ${imageCollectionId}): ${errorMessage}.` });
    }
});

module.exports = {
    authenticateEarthEngine, // Export de la fonction d'authentification pour le démarrage du serveur
    geeRouter: router        // Export du routeur pour app.use('/api/gee', ...)
};