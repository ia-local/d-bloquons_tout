// services/promptEngine.js - Gestion de la structure des messages IA (Prompt Engineering)

// 🛑 Les rôles sont définis comme dans l'API Groq/OpenAI
const ROLES = {
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant',
    TOOL: 'tool' // Pour la gestion future des appels de fonction
};

// 🛑 Modèle de structure d'instance pour chaque appel
const DEFAULT_INSTANCE = {
    role: ROLES.USER,
    name: null, // Nom de l'utilisateur ou de l'outil (si applicable)
    content: null, // Le contenu textuel du message
    tool_calls: null // Tableau pour les appels de fonctions futurs
};

/**
 * Construit un message structuré conforme aux spécifications de l'API Groq.
 * @param {string} role - Le rôle du message ('system', 'user', 'assistant').
 * @param {string} content - Le contenu textuel ou JSON du message.
 * @param {string} [name=null] - Le nom de l'utilisateur ou de l'outil.
 * @returns {object} Un objet message structuré.
 */
function buildMessage(role, content, name = null) {
    // Crée une copie du modèle par défaut
    const message = { ...DEFAULT_INSTANCE, role, content };
    
    // Ajoute le nom seulement s'il est pertinent (pour system ou user/tool)
    if (name) {
        message.name = name;
    } else {
        delete message.name;
    }
    
    // Supprime les champs inutilisés pour nettoyer l'objet
    delete message.tool_calls;
    
    return message;
}

/**
 * Génère l'instance complète du prompt (historique de conversation ou message unique)
 * en ajoutant le message système par défaut pour l'auto-complétion.
 * @param {string} systemContent - Le contenu du message système (persona).
 * @param {string} userContent - Le prompt de l'utilisateur.
 * @param {Array<object>} [history=[]] - Historique des messages précédents.
 * @returns {Array<object>} Le tableau final des messages pour l'API.
 */
function generateMessages(systemContent, userContent, history = []) {
    const messages = [];
    
    // 1. Message Système (Auto-complétion du rôle)
    if (systemContent) {
        messages.push(buildMessage(ROLES.SYSTEM, systemContent));
    }
    
    // 2. Ajout de l'historique (si l'historique n'est pas déjà structuré)
    if (history.length > 0) {
        // Dans une application réelle, on validerait la structure de l'historique ici
        messages.push(...history);
    }

    // 3. Message Utilisateur (La nouvelle requête)
    if (userContent) {
        messages.push(buildMessage(ROLES.USER, userContent));
    }
    
    return messages;
}


module.exports = {
    ROLES,
    buildMessage,
    generateMessages
};