// routes/revendicationsRouter.js

const express = require('express');
const router = express.Router();
// NOTE: Supposons que les fonctions et variables de revendications sont disponibles.

// ----------------------------------------------------------------------
// ROUTE : Retourne toutes les revendications par catégorie (TRIÉES)
// ----------------------------------------------------------------------
router.get('/data', async (req, res) => {
    await loadAllRevendications(); 
    
    const sortedData = {};

    for (const categoryKey in revendicationsData) {
        let items = [...revendicationsData[categoryKey]];

        items.sort((a, b) => {
            // CRITÈRE 1 : Total Score (le plus grand en premier)
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            // CRITÈRE 2 : Priorité pré-établie
            const prioA = PRIORITY_ORDER[a.priority] || 0;
            const prioB = PRIORITY_ORDER[b.priority] || 0;
            if (prioB !== prioA) {
                return prioB - prioA;
            }
            // CRITÈRE 3 : Ordre alphabétique
            return a.revendication.localeCompare(b.revendication);
        });

        sortedData[categoryKey] = items;
    }

    res.json(sortedData);
});

// ----------------------------------------------------------------------
// NOUVELLE ROUTE : Récupère une analyse générée par ID (pour l'affichage statique)
// ----------------------------------------------------------------------
router.get('/get-analysis-log/:itemId', async (req, res) => {
    const itemId = req.params.itemId;

    try {
        const logContent = await fs.readFile(ANALYSIS_LOG_PATH, 'utf-8');
        const currentAnalysisLog = JSON.parse(logContent);
        
        const latestEntry = currentAnalysisLog.find(entry => entry.itemId === itemId);

        if (latestEntry) {
            return res.json({ 
                found: true,
                detailHtml: latestEntry.detailHtml,
                solutionHtml: latestEntry.solutionHtml,
                mediaUrl: latestEntry.mediaUrl,
                fullModalContentHtml: latestEntry.fullModalContentHtml 
            });
        }

        res.json({ found: false, message: "Aucune analyse trouvée pour cet ID." });

    } catch (error) {
        console.error("Erreur lors de la lecture du log d'analyse:", error);
        res.status(200).json({ found: false, message: "Le fichier de log n'est pas accessible." });
    }
});


// ----------------------------------------------------------------------
// ROUTE : Analyse Complète + Visualisation (/full-analysis)
// ----------------------------------------------------------------------
router.get('/full-analysis', async (req, res) => {
    const topic = req.query.topic; 
    // ... (Logique complète de l'analyse IA Groq/Gemini ici) ...
    // NOTE: Pour la concision, cette logique est omise ici mais doit être tirée de l'ancien serveur.js.
    // L'implémentation réelle nécessite les dépendances (groq, genAI, retryApiCall, etc.)
    return res.status(501).json({ error: "Endpoint /full-analysis non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});


// ----------------------------------------------------------------------
// ROUTE : OPTIMISATION ET SOLUTIONS ENVISAGÉES (/optimise)
// ----------------------------------------------------------------------
router.get('/optimise', async (req, res) => {
    // ... (Logique complète d'optimisation Groq ici) ...
    return res.status(501).json({ error: "Endpoint /optimise non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});

// ----------------------------------------------------------------------
// ROUTE : Enregistrer les Analyses IA pour l'Historique (LOG)
// ----------------------------------------------------------------------
router.post('/log-analysis', async (req, res) => {
    // ... (Logique complète d'enregistrement du log) ...
    return res.status(501).json({ error: "Endpoint /log-analysis non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});

// ----------------------------------------------------------------------
// ROUTES DE VOTE
// ----------------------------------------------------------------------
router.post('/vote', async (req, res) => {
    const { id, voteType } = req.body;
    // ... (Logique complète de vote) ...
    return res.status(501).json({ error: "Endpoint /vote non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});

router.post('/vote-score', async (req, res) => {
    const { id, scoreChange } = req.body; 
    // ... (Logique complète de vote-score) ...
    return res.status(501).json({ error: "Endpoint /vote-score non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});

router.get('/stats', async (req, res) => {
    // ... (Logique complète de stats) ...
    return res.status(501).json({ error: "Endpoint /stats non complètement implémenté dans le routeur modulaire sans injection de dépendance." });
});


module.exports = router;