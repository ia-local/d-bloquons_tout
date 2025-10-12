// Fichier : routes/map-router.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Defining the correct path to the data files (pour référence future)
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');

/**
 * 🛑 Cette route a été retirée car la logique de catégorisation
 * et le chargement des fichiers JSON est géré directement par
 * le client (fichier public/src/js/map.js) via fetch/Promise.all.
 * * Si vous voulez ajouter une API dynamique plus tard, utilisez ce fichier:
 * * router.get('/api/custom-map-query', async (req, res) => {
 * // Logique d'API serveur ici
 * res.json({ message: "API Map customisée" });
 * });
 */

// Route de base (ne fait rien d'autre que d'être un point de montage)
router.get('/', (req, res) => {
    // Peut rediriger ou renvoyer un message d'API simple
    res.status(200).json({ status: "OK", message: "Map router is active, but core data is loaded client-side." });
});

module.exports = router;