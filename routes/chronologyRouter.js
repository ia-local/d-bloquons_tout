// Fichier: routes/chronologyRouter.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Le fichier de données de chronologie se trouve dans data/database.json selon votre structure
// Cependant, vos mocks dans app.js suggèrent une structure simple :
const CHRONOLOGY_DATA_FILE_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'chronology.json');

// --- Fonction de lecture (à réutiliser ou adapter) ---
async function readChronologyFile() {
    try {
        // Dans votre structure, le fichier semble être sous docs/src/json/map/chronology.json
        const data = await fs.readFile(CHRONOLOGY_DATA_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.error(`Chronology file error (${error.code}): Falling back to empty array.`);
            return []; // Retourne un tableau vide en cas d'erreur
        }
        throw error;
    }
}

/**
 * [GET] /api/chronology/events
 * Renvoie tous les événements chronologiques.
 */
router.get('/events', async (req, res) => {
    try {
        // NOTE: Si vous voulez utiliser les mocks dans le backend, vous pourriez les lire ici.
        // Mais nous allons lire le fichier JSON réel pour le moment.
        const events = await readChronologyFile();
        res.status(200).json(events);
    } catch (error) {
        console.error("Erreur lors de la récupération des événements de chronologie:", error);
        res.status(500).json({ error: "Échec de la récupération des données chronologiques." });
    }
});

module.exports = router;