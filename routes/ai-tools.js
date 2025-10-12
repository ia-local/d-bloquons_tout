// Fichier : routes/ai-tools.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { groq, genAI, getGroqChatResponse, categoryEmbeddings, GROQ_MODEL } = require('../services/ai'); 
const { cosineSimilarity } = require('../services/utils'); // Supposons que cette utilitaire existe
const { getDatabase, writeDatabaseFile, readJsonFile } = require('../services/data'); // Nécessaire pour journal/posts

const router = express.Router();

// --- ROUTE 1: CLASSIFICATION D'ENTRÉES PAR EMBEDDING (GEMINI) ---
router.post('/classify', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Le texte est manquant.' });
    }
    if (!genAI || categoryEmbeddings.length === 0) {
        return res.status(503).json({ error: 'Service Gemini ou embeddings non initialisé.' });
    }

    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
        const textEmbedding = (await embeddingModel.embedContent({ content: text })).embedding.values;

        let bestMatch = null;
        let highestSimilarity = -Infinity;

        categoryEmbeddings.forEach(category => {
            const similarity = cosineSimilarity(textEmbedding, category.embedding);
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = category.name;
            }
        });
        
        res.json({ classifiedCategory: bestMatch });

    } catch (error) {
        console.error('Erreur lors de la classification IA:', error);
        res.status(500).json({ error: 'Échec de la classification.' });
    }
});


// --- ROUTE 2: ANALYSE BOYCOTT PAR IA (GROQ) ---
router.post('/boycotts/submit-ai-analysis', async (req, res) => {
    const { text, image } = req.body;
    if (!text && !image) { return res.status(400).json({ error: 'Un texte ou une image est requis pour l\'analyse.' }); }
    if (!groq) { return res.status(503).json({ error: 'Service Groq non initialisé.' }); }

    try {
        let aiPrompt;
        let model = GROQ_MODEL; // Modèle de base
        let messages = [];

        if (text) {
            aiPrompt = `À partir de la phrase suivante, extrait les informations clés : le nom de l'enseigne, la ville, une description courte, et le type de commerce (parmi 'Distribution', 'Banque', 'Restauration', 'Habillement', 'Énergie'). Génère ensuite les coordonnées GPS précises (latitude et longitude) de la ville correspondante. Formatte ta réponse en un objet JSON, sans autre texte. Exemple: {"name": "Nom de l'enseigne", "city": "Nom de la ville", "lat": 48.8566, "lon": 2.3522, "type": "Distribution", "description": "Description de l'enseigne."}. Voici la phrase : "${text}"`;
            messages.push({ role: 'user', content: aiPrompt });
        } else if (image) {
            aiPrompt = `Analyse l'image du ticket de caisse et extrait le nom de l'enseigne, la ville et le montant total. Génère un objet JSON.`;
            // 🛑 Attention: Cette partie nécessite un modèle multimodal (comme Llama-4-Scout)
            model = "meta-llama/llama-4-scout-17b-16e-instruct"; 
            messages.push({ 
                role: 'user', 
                content: [{ type: 'text', text: aiPrompt }, { type: 'image_url', image_url: { "url": image } }] 
            });
        }
        
        const chatCompletion = await groq.chat.completions.create({ messages: messages, model: model, temperature: 0.2, stream: false });
        const generatedJson = JSON.parse(chatCompletion.choices[0].message.content);
        res.json(generatedJson);
    } catch (error) { 
        console.error('Échec de la génération des données via l\'IA:', error);
        res.status(500).json({ error: 'Échec de la génération des données via l\'IA. Vérifiez que la réponse est bien un JSON valide.' }); 
    }
});


// --- ROUTE 3: GÉNÉRATION D'ENTITÉS GÉO (GROQ) ---
router.post('/ai/generate-entity', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'La requête est vide.' });
    if (!groq) { return res.status(503).json({ error: 'Service Groq non initialisé.' }); }

    const aiPrompt = `À partir de la requête suivante, génère un objet JSON qui inclut le 'name' (nom), le 'type' (supermarché, banque, etc.), une 'description' et des coordonnées 'geo' (latitude et longitude) pour l'entité. Réponds uniquement avec l'objet JSON. Voici la requête: "${query}"`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: aiPrompt }, { role: 'user', content: query }], model: GROQ_MODEL, temperature: 0.1, stream: false });
        const responseContent = chatCompletion?.choices?.[0]?.message?.content;
        const jsonResponse = JSON.parse(responseContent);
        res.json(jsonResponse);
    } catch (error) { 
        console.error('Impossible de générer les données avec l\'IA:', error);
        res.status(500).json({ error: 'Impossible de générer les données avec l\'IA. Assurez-vous d\'une réponse JSON.' }); 
    }
});


// --- ROUTE 4: CHAT SIMPLE (GROQ) ---
router.post('/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { 
        const aiResponse = await getGroqChatResponse(message, GROQ_MODEL, "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement."); 
        res.json({ response: aiResponse }); 
    } catch (error) { 
        res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); 
    }
});

module.exports = router;