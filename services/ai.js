// Fichier : services/ai.js

const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🛑 UNE SEULE IMPORTATION DE CONFIGURATION EST NÉCESSAIRE :
const { GROQ_API_KEY, GEMINI_API_KEY, GROQ_MODEL, AI_PERSONAS, CATEGORIES_TO_CLASSIFY } = require('../config');

// Assurez-vous que services/utils.js contient bien la fonction cosineSimilarity
const { cosineSimilarity } = require('./utils'); 

// --- 1. INITIALISATION DES CLIENTS ET GESTION DES CLÉS ---

// 🛑 Initialisation du client Groq : Utiliser la logique de "fausse réponse" si la clé est absente
const groq = GROQ_API_KEY 
    ? new Groq({ apiKey: GROQ_API_KEY }) 
    // Fallback: Objet simulé qui renvoie une erreur pour éviter le plantage lors de l'appel
    : { chat: { completions: { create: async () => ({ choices: [{ message: { content: "Erreur: Clé Groq manquante." } }] }) } } }; 

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Variables pour les embeddings
let categoryEmbeddings = [];


// --- 2. FONCTIONS PUBLIQUES (Déclarées avant l'export) ---

/**
 * Obtient une réponse de l'API Groq.
 */
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    // Si groq est l'objet Fallback (clé manquante), cela lancera l'erreur.
    if (!GROQ_API_KEY) { 
        console.error("❌ Erreur: Tentative d'appel Groq sans clé API.");
        // Utiliser la structure de réponse simulée
        return (await groq.chat.completions.create({})).choices[0].message.content; 
    }

    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        
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
 * Génère les embeddings pour les catégories de classification en utilisant Gemini.
 */
async function generateCategoryEmbeddings() {
    if (!genAI) {
        console.error("⚠️ Gemini non disponible. Classification IA par embedding désactivée.");
        categoryEmbeddings = [];
        return;
    }
    
    try {
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
        // L'erreur est capturée ici, ce qui empêche le crash du serveur.
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
    generateCategoryEmbeddings,
};