// routes/actionsRouter.js

const express = require('express');
const router = express.Router(); 

// NOTE: Les variables et fonctions (actionsData, loadActionsData, saveActionsData, retryApiCall, GROQ_MODEL, groq) 
// sont rendues globales par serveur.js, nous les utilisons directement via 'global.'.

// ----------------------------------------------------------------------
// CRUD ACTIONS TACTIQUES (/api/actions) - Corps des fonctions omis pour la concision
// ----------------------------------------------------------------------

// CREATE
router.post('/', async (req, res) => {
    // ... (Logique CRUD post)
});

// READ
router.get('/data', async (req, res) => {
    try {
        await global.loadActionsData();
        if (!global.actionsData || !global.actionsData.liste_actions_consolidee) {
            return res.status(500).json({ error: "Structure de données d'actions invalide après chargement." });
        }
        res.json(global.actionsData);
    } catch (error) {
         console.error("ERREUR 500: Échec critique lors de la lecture des données d'actions:", error);
         res.status(500).json({ error: "Échec de la lecture des données d'actions sur le serveur.", details: error.message });
    }
});

// UPDATE
router.put('/:id', async (req, res) => {
    // ... (Logique CRUD put)
});

// DELETE
router.delete('/:id', async (req, res) => {
    // ... (Logique CRUD delete)
});

// 🛑 GENERATE (Génération du plan tactique) 🛑
router.get('/plan_action', async (req, res) => {
    const actionId = parseInt(req.query.actionId);
    
    // Assurer que les données d'actions sont chargées (sécurité)
    try {
        await global.loadActionsData();
    } catch (e) {
        console.warn("Avertissement: Échec du rechargement des données d'actions avant l'appel IA.");
    }

    if (!actionId) {
        return res.status(400).json({ error: "Le paramètre 'actionId' est manquant." });
    }

    const action = global.actionsData?.liste_actions_consolidee?.find(a => a.id === actionId);

    if (!action) {
        // Retourne 404 si l'action n'est pas dans la liste (liste vide ou ID erroné)
        return res.status(404).json({ error: `Action avec l'ID '${actionId}' non trouvée dans la liste consolidée.` });
    }
    
    // ------------------------------------------------------------------
    // 🛑 NOUVELLE LOGIQUE : Utilise 'description' ou 'action' en priorité
    // ------------------------------------------------------------------
    let actionDescriptionForAI = action.description || action.action || action.titre || 'Action inconnue.';

    // Nettoyer les caractères spéciaux et les emojis/Markdown pour l'IA
    actionDescriptionForAI = actionDescriptionForAI
        .replace(/\*\*/g, '') // Supprime les **gras**
        .replace(/⚠️/g, '') // Supprime les symboles
        .replace(/🔥/g, '')
        .trim();

    // ------------------------------------------------------------------
    
    // 🛑 Construction du prompt utilisant actionDescriptionForAI
    const prompt = `
        En tant qu'expert en activisme tactique et analyse juridique, vous allez générer un plan stratégique et pratique pour l'action suivante :
        
        Action : "${actionDescriptionForAI}"
        Catégorie : ${action.type}
        Risque légal associé : ${action.risque}
        Conséquences juridiques maximales : ${action.consequences_juridiques}
        
        Votre réponse doit fournir un "Plan d'Optimisation Tactique" structuré :
        1. **Objectifs Clairs** : Quel est l'impact réel et mesurable de cette action ?
        2. **Préparation (Avant)** : Matériel, reconnaissance du terrain, timing optimal.
        3. **Exécution (Pendant)** : Étapes précises pour maximiser la perturbation ou le message.
        4. **Atténuation du Risque (Légal)** : Conseils pour rester dans la catégorie de risque indiquée et éviter la requalification en délit plus grave.
        
        INSTRUCTIONS DE FORMATAGE CRUCIALE : La réponse doit être enveloppée dans une seule balise <div> avec la classe 'ia-output'. Utilisez les balises <h3> pour les titres de section et des listes (<ul> ou <ol>) pour la structure.
    `;

    try {
        const apiCall = async () => global.groq.chat.completions.create({
            messages: [
                { role: "system", content: "Vous êtes un analyste tactique spécialisé dans l'activisme non-violent, fournissant des plans structurés en HTML. Le plan doit toujours respecter le niveau de risque légal fourni." },
                { role: "user", content: prompt },
            ],
            model: global.GROQ_MODEL,
            temperature: 0.7,
        });

        const chatCompletion = await global.retryApiCall(apiCall);

        res.json({
            action_id: actionId,
            action_description: action.action, // Renvoie la description originale non nettoyée pour le front-end
            tactical_plan: chatCompletion.choices[0]?.message?.content || `<div class="error-message">❌ Pas de plan généré.</div>`
        });

    } catch (error) {
        console.error(`Erreur Groq lors de la génération du plan pour l'action ${actionId}:`, error.message);
        res.status(500).json({ error: `Échec de la génération du plan IA. Détails: ${error.message}` });
    }
});


module.exports = router;