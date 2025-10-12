// Fichier : routes/static-data.js

const express = require('express');
const { getDatabase, readJsonFile } = require('../services/data');
const { SATELLITES_DATA_FILE } = require('../config');

const router = express.Router();

// --- DATA DASHBOARD BASIQUE ---

router.get('/prefectures', (req, res) => res.json(getDatabase().prefectures || []));
router.get('/mairies', (req, res) => res.json(getDatabase().mairies || []));
router.get('/roundabout-points', (req, res) => res.json(getDatabase().roundabout_points || []));
router.get('/porte-points', (req, res) => res.json(getDatabase().porte_points || []));
router.get('/strategic-locations', (req, res) => res.json(getDatabase().strategic_locations || []));
router.get('/syndicats', (req, res) => res.json(getDatabase().syndicats || []));
router.get('/telecoms', (req, res) => res.json(getDatabase().telecoms || []));
router.get('/telegram-sites', (req, res) => res.json(getDatabase().telegram_groups || []));
router.get('/docs-cameras', (req, res) => res.json(getDatabase().cameras_points || []));
router.get('/missions', (req, res) => res.json(getDatabase().missions || []));

// --- DATA SPÉCIFIQUE (Satellites nécessite readJsonFile) ---
router.get('/satellites', async (req, res) => { 
    try { 
        // Note : readJsonFile doit être rendu disponible par services/data.js
        const satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []); 
        res.json(satellitesData); 
    } catch (error) { 
        res.status(500).json({ error: 'Échec du chargement des données satellitaires.' }); 
    } 
});

// --- CRUD Camera Points (simulé ici comme données statiques) ---
router.post('/camera-points', async (req, res) => {
    const db = getDatabase();
    const { name, city, lat, lon, timestamp, video_link } = req.body;
    if (!name || !city || !lat || !lon) { return res.status(400).json({ error: 'Données manquantes.' }); }
    
    db.cameras_points = db.cameras_points || [];
    const newCameraPoint = { id: uuidv4(), name, city, lat, lon, timestamp: timestamp || new Date().toISOString(), video_link: video_link || null };
    db.cameras_points.push(newCameraPoint);
    await writeDatabaseFile(); // Supposons que writeDatabaseFile est exporté de services/data.js
    
    res.status(201).json(newCameraPoint);
});


module.exports = router;