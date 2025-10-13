// Fichier : services/ai.js (INTEGRATION DU PROMPT ENGINE ET VISION AI)

const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🛑 Importation du Prompt Engine (Gestion de la structure des messages)
const promptEngine = require('./promptEngine'); 

// 🛑 UNE SEULE IMPORTATION DE CONFIGURATION EST NÉCESSAIRE :
const { GROQ_API_KEY, GEMINI_API_KEY, GROQ_MODEL, AI_PERSONAS, CATEGORIES_TO_CLASSIFY } = require('../config');

// Assurez-vous que services/utils.js contient bien la fonction cosineSimilarity
// const { cosineSimilarity } = require('./utils'); 

// 🛑 SIMULATION DE L'IMPORTATION DES CONSTANTES DE MODÈLE (pour référence)
const AI_MODELS = {
    DEFAULT: 'llama-3.1-8b-instant',
    AVOCAT: 'deepseek-r1-distill-llama-70b', 
    VISION: 'meta-llama/llama-4-scout-17b-16e-instruct' 
};


// --- 1. INITIALISATION DES CLIENTS ET GESTION DES CLÉS ---

// Initialisation du client Groq 
const groq = GROQ_API_KEY 
    ? new Groq({ apiKey: GROQ_API_KEY }) 
    // Fallback: Objet simulé
    : { chat: { completions: { create: async () => ({ choices: [{ message: { content: "Erreur: Clé Groq manquante." } }] }) } } }; 

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Variables pour les embeddings
let categoryEmbeddings = [];


// --- 2. FONCTIONS PUBLIQUES ---

/**
 * Obtient une réponse de l'API Groq (requête textuelle).
 */
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    if (!GROQ_API_KEY) { 
        console.error("❌ Erreur: Tentative d'appel Groq sans clé API.");
        return (await groq.chat.completions.create({})).choices[0].message.content; 
    }

    try {
        // 🛑 Utilisation du Prompt Engine pour structurer les messages
        const messages = promptEngine.generateMessages(systemMessageContent, promptInput);
        
        const chatCompletion = await groq.chat.completions.create({ 
            messages: messages, 
            model: model, 
            temperature: 0.7, 
            max_tokens: 2048 
        });
        
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`❌ Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        throw new Error('Échec lors du traitement de la demande Groq.');
    }
}

/**
 * Obtient une réponse de l'API Groq pour une requête multi-modale (texte et image).
 */
async function getVisionAnalysis(textPrompt, base64Image, model, systemMessageContent) {
    if (!GROQ_API_KEY) { 
        throw new Error("❌ Clé Groq manquante pour l'analyse visuelle.");
    }

    try {
        const messages = [];
        
        // 🛑 1. Message Système (Auto-complétion du rôle)
        if (systemMessageContent) {
            messages.push(promptEngine.buildMessage(promptEngine.ROLES.SYSTEM, systemMessageContent));
        }
        
        // 🛑 2. Message Utilisateur Multi-modal
        const userMessage = {
            "role": promptEngine.ROLES.USER,
            "content": [
                { "type": "text", "text": textPrompt },
                {
                    "type": "image_url",
                    "image_url": { "url": `data:image/jpeg;base64,${base64Image}` }
                }
            ]
        };
        messages.push(userMessage);

        const chatCompletion = await groq.chat.completions.create({
            messages: messages, // Tableau de messages structuré
            model: model, 
            temperature: 0.7,
            max_tokens: 1024
        });
        
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`❌ Erreur lors de l'analyse visuelle (Groq model: ${model}):`, error);
        throw new Error('Échec lors du traitement de la demande Groq Vision AI.');
    }
}


/**
 * Génère les embeddings pour les catégories de classification en utilisant Gemini.
 */
async function generateCategoryEmbeddings() {
    if (!genAI) {
        console.error("⚠️ Gemini non disponible. Classification IA par embedding désactivée.");
        categoryEmbeddings = [];
        return;
    }
    
    try {
        // ... (Logique de génération d'embeddings inchangée) ...
        console.log("📡 Tentative de génération des embeddings pour les catégories via Gemini...");
        
        const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
        
        const results = await Promise.all(
            CATEGORIES_TO_CLASSIFY.map(cat => 
                embeddingModel.embedContent({ 
                    content: { parts: [{ text: cat.text }] }
                })
            )
        );
        
        categoryEmbeddings = results.map((res, i) => ({
            name: CATEGORIES_TO_CLASSIFY[i].name,
            embedding: res.embedding.values
        }));
        
        console.log("🗞️ Embeddings des catégories générés et stockés.");
        
    } catch (error) {
        console.error("⚠️ Échec critique de la génération des embeddings IA (Gemini).", error.message);
        categoryEmbeddings = [];
    }
}

// --- 3. EXPORTS DU MODULE ---
module.exports = {
    // Clients
    groq,
    genAI,
    
    // Constantes et État
    GROQ_MODEL,
    AI_PERSONAS,
    categoryEmbeddings,
    
    // Fonctions
    getGroqChatResponse,
    getVisionAnalysis, // 🛑 NOUVELLE FONCTION EXPORTÉE
    generateCategoryEmbeddings,
    
    // Utilitaires
    AI_MODELS // Exporter les modèles pour être utilisés dans les routes
};