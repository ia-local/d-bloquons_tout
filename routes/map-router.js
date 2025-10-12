// Fichier: routes/map-router.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// 🛑 Chemin vers les données réelles de manifestations (Basé sur votre structure)
const MANIFESTATIONS_FILE_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'manifestation_points.json'); 
// OU utilisez le fichier spécifique que vous voulez exposer, par exemple :
// const MANIFESTATIONS_FILE_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'manifestation_points_2_octobre.json');

// Fonction utilitaire pour lire le fichier (similaire à celle de serveur.js)
async function getMapDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
             // Utilisation d'un fichier par défaut pour garantir que l'API ne crash pas
            return []; 
        }
        throw error;
    }
}


/**
 * [GET] /map/data/manifestations
 * Renvoie les points de manifestations pour affichage sur la carte.
 */
router.get('/data/manifestations', async (req, res) => {
    try {
        // Nous allons utiliser un fichier générique pour l'exemple
        const manifestations = await getMapDataFile(MANIFESTATIONS_FILE_PATH);
        res.status(200).json(manifestations);
    } catch (error) {
        console.error("Erreur lors du chargement des données de manifestations:", error);
        res.status(500).json({ error: "Échec de la récupération des données de la carte." });
    }
});

// Ajoutez ici d'autres routes /map/... si nécessaire
// router.get('/data/cameras', ...);

module.exports = router;