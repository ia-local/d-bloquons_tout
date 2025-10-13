// routes/aiRouter.js - Gestion de la logique IA pour les actions de carte (FINAL AVEC RÔLES MÉTIER)

const express = require('express');
const router = express.Router();
const aiService = require('../services/ai'); 
const utmiCalculator = require('../server_modules/utms_calculator'); 
const { getGroqChatResponse, getVisionAnalysis } = aiService; 

// 🛑 CONSTANTES DE MODÈLE FORMELLES 🛑
const AI_MODELS = {
    // --- Modèles Textuels Généraux (pour les rôles légers) ---
    DEFAULT: 'llama-3.1-8b-instant',      // Modèle léger et rapide par défaut
    ENQUETEUR: 'llama-3.1-8b-instant',    // Modèle léger pour la recherche/résumé
    SECRETARY: 'llama-3.1-8b-instant',    // Modèle léger pour l'organisation

    // --- Modèles Haute Performance (pour les rôles de raisonnement et de génération) ---
    // 🛑 Modèle de raisonnement complexe et stratégique
    AVOCAT: 'deepseek-r1-distill-llama-70b', 
    STRATEGIC: 'deepseek-r1-distill-llama-70b', 
    // 🛑 Modèle pour la production de code et les tâches techniques
    CODING: 'deepseek-r1-distill-llama-70b', 
    // 🛑 Modèle pour la génération de contenu créatif ou structuré
    GENERATOR: 'deepseek-r1-distill-llama-70b',
    // 🛑 Modèle spécialisé dans l'analyse de l'infrastructure et de l'optimisation
    DEVOPS: 'deepseek-r1-distill-llama-70b', 

    // --- Modèles Spécialisés (Multi-Modal) ---
    // 🛑 Modèle de Vision AI (Corrigé : Suppression du guillemet excédentaire dans le nom du modèle)
    VISION: 'meta-llama/llama-4-scout-17b-16e-instruct'
};


// Endpoint: POST /api/ai/analyze-sector
router.post('/analyze-sector', async (req, res) => {
    
    const { location, agentLevel } = req.body;
    
    let insightContent = null;
    let modelUsed = AI_MODELS.AVOCAT; // Utilisation par défaut du modèle de raisonnement stratégique
    let base64Image = null;

    try {
        // --- ÉTAPE 1: ANALYSE MULTI-MODALE (Vision AI) ---
        
        // Simuler la récupération de l'image satellite. Utilise l'AVOCAT pour l'analyse visuelle.
        const visionResponse = (location !== 'global') ? await new Promise(resolve => resolve({ base64Image: 'MOCK_BASE64_IMAGE', satelliteDetails: 'Sentinel-2 (IR)' })) : null;

        if (visionResponse && visionResponse.base64Image) {
            base64Image = visionResponse.base64Image;
            modelUsed = AI_MODELS.VISION; // Modèle de Vision AI
            
            const visionPrompt = `Analyse cette image satellite du terrain pour établir des points de ralliement stratégiques. Décris la couverture végétale, la densité urbaine et les points d'accès potentiels.`;
            
            insightContent = await getVisionAnalysis(
                visionPrompt,
                base64Image,
                AI_MODELS.VISION, 
                `Vous êtes le module de perception visuelle tactique de l'agent de niveau ${agentLevel}.`
            );
            
        } else {
            // --- ÉTAPE 2: ANALYSE TEXTUELLE (Raisonnement Stratégique avec rôle AVOCAT) ---
            
            modelUsed = AI_MODELS.AVOCAT; 
            
            // 🛑 Utilisation d'un message système pour l'AVOCAT (raisonnement complexe)
            const systemMessage = `Vous êtes l'AVOCAT, un analyste stratégique expert et critique. Votre mission est d'évaluer le contexte et de recommander une zone d'action pour un agent de niveau ${agentLevel}. La réponse doit être concise (max 100 mots).`;
            const textPrompt = `L'agent est en mode exploration (${location}). Fournissez une analyse des risques et une recommandation de mission tactique immédiate.`;
            
            insightContent = await getGroqChatResponse(
                textPrompt,
                AI_MODELS.AVOCAT, // Modèle haute performance
                systemMessage
            );
        }

        // 3. Préparation des données pour le calcul UTMi
        const interaction = {
            type: utmiCalculator.COEFFICIENTS.LOG_TYPES.AI_RESPONSE,
            data: {
                text: insightContent,
                tokenCount: insightContent.split(' ').length * 1.5, 
                modelId: modelUsed, 
                relevance: base64Image ? 1.5 : 1.0, 
                coherence: 1.0, 
                isFiscalEconomicInsight: true 
            }
        };
        const context = { userCvnuValue: agentLevel * 0.1 };

        // 4. Calcul de la valeur UTMi
        const utmiResult = utmiCalculator.calculateUtmi(interaction, context);

        // 5. Réponse au client
        res.json({
            status: 'success',
            insight: insightContent,
            utmiAwarded: utmiResult.utmi,
            estimatedCost: utmiResult.estimatedCostUSD 
        });

    } catch (error) {
        console.error('Erreur critique lors de l\'analyse de secteur IA:', error);
        res.status(500).json({
            status: 'error',
            message: 'Échec de l\'analyse IA sur le serveur.',
            utmiAwarded: 0 
        });
    }
});

module.exports = router;