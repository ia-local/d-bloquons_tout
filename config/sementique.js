// Fichier : services/iaSemanticEngine.js (Super Module d'Analyse Sémantique/Emoji)

const Groq = require('groq-sdk');
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialisation du client Groq
const groq = new Groq({ apiKey: GROQ_API_KEY });

// --- Dictionnaires de Tenseurs Emojis (Étendus) ---

/**
 * Dictionnaire étendu pour guider l'IA vers les symboles spécifiques au mouvement.
 * Les valeurs sont des emojis ou des chaînes de caractères.
 */
const TENSOR_DICTIONARY = {
  
};

/**
 * Analyse le texte utilisateur pour extraire des emojis pertinents basés sur trois catégories de tenseurs.
 * Le modèle Groq est contraint à produire une chaîne JSON pour une fiabilité maximale.
 * * @param {string} text Le texte pour lequel les emojis doivent être générés.
 * @returns {Promise<string>} Une chaîne d'emojis suggérés (ex: "💰📢🇫🇷").
 */
async function generateContextualEmoji(text) {
    if (!GROQ_API_KEY) {
        return '🔹'; // Emoji par défaut si API key manquante
    }

    const systemMessage = `
        Tu es l'unité de Tenseur Sémantique IA pour le projet Manifest.910-2025.
        Ton rôle est d'analyser le texte de l'utilisateur et d'identifier les emojis pertinents dans les quatre catégories suivantes (Activity, Object, Flag, Symbol).
        Tu DOIS retourner un objet JSON avec OBLIGATOIREMENT les quatre clés "activity", "object", "flag", et "symbol".
        Pour chaque clé, attribue l'emoji le PLUS pertinent de la catégorie, ou une chaîne vide "" si aucun n'est pertinent.
        Les emojis disponibles sont basés sur le dictionnaire étendu.

        Exemple de sortie JSON strict (OBLIGATOIRE):
        { "activity": "📢", "object": "💰", "flag": "", "symbol": "➡️" }
    `;
    
    // Contrainte du modèle pour qu'il utilise le dictionnaire
    const dictionaryPrompt = `Dictionnaire de Tenseurs: ${JSON.stringify(TENSOR_DICTIONARY)}.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage + dictionaryPrompt },
                { role: 'user', content: `Texte à analyser : "${text}"` }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: "json_object" }, // Clé pour forcer la sortie JSON
            temperature: 0.1, 
            max_tokens: 200 
        });

        const jsonResponse = JSON.parse(chatCompletion.choices[0].message.content);
        
        // Concaténer et nettoyer les résultats (maintenant avec 'symbol')
        const emojis = [
            jsonResponse.activity, 
            jsonResponse.object, 
            jsonResponse.flag,
            jsonResponse.symbol
        ].filter(e => e && e.length > 0).join('');
        
        return emojis || '💬';

    } catch (error) {
        console.error("Erreur critique de l'IA Sémantique (JSON Parse/API):", error.message);
        return '🔥'; 
    }
}

module.exports = {
    generateContextualEmoji,
    TENSOR_DICTIONARY,
};
