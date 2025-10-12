// Fichier : routes/chat.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getGroqChatResponse, GROQ_MODEL, AI_PERSONAS, groq } = require('../services/ai'); 
const { getChatHistory, writeChatHistoryFile } = require('../services/data'); 

const router = express.Router();

// Middleware pour vérifier la disponibilité de l'IA
router.use((req, res, next) => {
    if (!groq) {
        return res.status(503).json({ error: "Service Groq non initialisé. Clé API manquante." });
    }
    next();
});

// GET /api/chat/history
router.get('/history', (req, res) => { 
    res.json(getChatHistory()); 
});

// POST /api/chat/message
router.post('/message', async (req, res) => {
    const { message, persona } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    
    const chatHistory = getChatHistory();
    const systemMessage = AI_PERSONAS[persona] || AI_PERSONAS['generaliste'];

    const userMessage = { id: uuidv4(), role: 'user', content: message, persona: 'vous', timestamp: new Date().toISOString() };
    chatHistory.push(userMessage);

    try {
        const aiResponseContent = await getGroqChatResponse(message, GROQ_MODEL, systemMessage);

        const aiMessage = { 
            id: uuidv4(), 
            role: 'ai', 
            content: aiResponseContent, 
            persona: persona, 
            timestamp: new Date().toISOString() 
        };
        chatHistory.push(aiMessage);
        await writeChatHistoryFile();
        
        res.status(201).json(aiMessage);
    } catch (error) {
        console.error('Erreur lors de la génération de la réponse IA:', error);
        // Utiliser le middleware d'erreur centralisé si vous avez implémenté le wrapper async, 
        // sinon, gérez l'erreur ici.
        res.status(500).json({ error: 'Échec de la communication avec le modèle IA.' });
    }
});

// PUT /api/chat/message/:id
router.put('/message/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const chatHistory = getChatHistory();
    const message = chatHistory.find(m => m.id === id);
    
    if (!message) { return res.status(404).json({ error: 'Message non trouvé.' }); }
    message.content = content;
    await writeChatHistoryFile();
    res.json(message);
});

// DELETE /api/chat/message/:id
router.delete('/message/:id', async (req, res) => {
    const { id } = req.params;
    let chatHistory = getChatHistory();
    const initialLength = chatHistory.length;
    
    chatHistory = chatHistory.filter(m => m.id !== id);
    
    // Mettre à jour la variable globale dans le service de données si nécessaire, 
    // ou si getChatHistory() retourne une référence. 
    // Pour simplifier ici, on suppose que le filtre modifie la référence si c'est un tableau
    
    if (chatHistory.length < initialLength) {
        await writeChatHistoryFile();
        res.status(204).send();
    } else { 
        res.status(404).json({ error: 'Message non trouvé.' }); 
    }
});

module.exports = router;