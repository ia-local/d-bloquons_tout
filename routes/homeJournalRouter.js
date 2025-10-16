// Fichier : routes/journalRouter.js (Routage du Journal du Quotidien)

const express = require('express');
const router = express.Router();
// Assurez-vous que votre service de données exporte getJournalEntries et getJournalEntryById
const dataService = require('../services/data.js'); 

// GET /journal/entries - Récupère toutes les entrées pour la liste et le teaser
router.get('/entries', (req, res) => {
    try {
        const entries = dataService.getJournalEntries();
        // Le frontend attend un tableau (même vide)
        res.json(entries || []);
    } catch (error) {
        console.error("Erreur HQ lors de la récupération des entrées de journal:", error);
        res.status(500).json({ error: 'Échec de la récupération des entrées de journal.' });
    }
});

// GET /journal/entry/:id - Récupère les détails d'une seule entrée (pour la modale)
router.get('/entry/:id', (req, res) => {
    const entryId = req.params.id;
    try {
        const entry = dataService.getJournalEntryById(entryId);
        if (entry) {
            res.json(entry);
        } else {
            res.status(404).json({ error: `Entrée de journal ${entryId} non trouvée.` });
        }
    } catch (error) {
        console.error("Erreur HQ lors de la récupération de l'entrée journal:", error);
        res.status(500).json({ error: 'Échec de la récupération de l\'entrée de journal.' });
    }
});

module.exports = router;