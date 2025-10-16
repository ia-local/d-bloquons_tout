const Groq = require('groq-sdk');
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialisation du client Groq
const groq = new Groq({ apiKey: GROQ_API_KEY });

// --- Dictionnaires de Tenseurs Emojis (Final et Unifié) ---

/**
 * Dictionnaire FINAL de Tenseurs, organisé par Catégorie d'Impact Sémantique.
 * Chaque entrée inclut le Concept Clé et la Sémantique Cognitive (W3C) pour affûter l'IA.
 */
const TENSOR_DICTIONARY = {
    // Catégorie 1: IMPACT (Statut, Ton, Urgence)
    IMPACT: {
        CRITICAL: { emoji: '🔥', concept: 'Crise/Urgence', semantic: 'Nécessite une attention immédiate ou signale un échec critique (systémique).' },
        URGENCY: { emoji: '🚨', concept: 'Alerte/Appel', semantic: 'Appel direct à la mobilisation. Fort verbe d\'action implicite.' },
        POSITIVE: { emoji: '✅', concept: 'Succès/Validation', semantic: 'Statut validé, objectif atteint, résultat positif.' },
        NEGATIVE: { emoji: '❌', concept: 'Échec/Refus', semantic: 'Opposition, résultat négatif, élément bloqué ou refusé.' },
        QUESTION: { emoji: '❓', concept: 'Interrogation/Doute', semantic: 'Demande d\'information ou expression de doute.' },
        IDEA: { emoji: '💡', concept: 'Suggestion', semantic: 'Nouvelle proposition, solution trouvée, brainstorming.' },
        CELEBRATION: { emoji: '🎉', concept: 'Événement/Récompense', semantic: 'Célébration, événement réussi ou récompense attribuée.' },
    },
    
    // Catégorie 2: ACTION (Domaine d'exécution Fonctionnel)
    ACTION: {
        FINANCE_FUND: { emoji: '💰', concept: 'Trésorerie/Budget', semantic: 'Domaine de la gestion monétaire, de la caisse ou de la distribution.' },
        LAW_DEBATE: { emoji: '⚖️', concept: 'Justice/Légalité', semantic: 'Domaine du droit, de la législation, de la destitution ou de la plainte.' },
        GOVERNANCE: { emoji: '🗳️', concept: 'Vote/Démocratie', semantic: 'Domaine du RIC, du vote, et de la prise de décision politique.' },
        TECH_DEVOPS: { emoji: '💻', concept: 'Développement/DevOps', semantic: 'Domaine de la programmation, de l\'infrastructure et de la maintenance (Ex: DEVOPS).' },
        AI_MODULE: { emoji: '🤖', concept: 'Intelligence Artificielle', semantic: 'Domaine des outils IA, des modèles Groq/Gemini et de l\'automatisation.' },
    },
    
    // Catégorie 3: FLUX (Progression, Ordre, Direction)
    FLUX: {
        ARROW_NEXT: { emoji: '➡️', concept: 'Suite/Direction', semantic: 'Indique une étape suivante, une redirection ou un lien.' },
        PROGRESS_UP: { emoji: '⬆️', concept: 'Hausse/Amélioration', semantic: 'Indique une croissance ou une amélioration d\'une métrique.' },
        PROGRESS_DOWN: { emoji: '⬇️', concept: 'Baisse/Régression', semantic: 'Indique une diminution ou une alerte à la baisse.' },
        ORDER_STEP: { emoji: '1️⃣', concept: 'Étape/Priorité', semantic: 'Indique un ordre, une numérotation ou une séquence d\'actions.' },
        CHECK_WAVE: { emoji: '〰️', concept: 'Vérification/Statut', semantic: 'Statut de progression, attente de confirmation, élément en mouvement.' },
    },
    
    // Catégorie 4: ENTITY (Acteurs et Organisation)
    ENTITY: {
        PERSON_AGENT: { emoji: '👤', concept: 'Agent/Individu', semantic: 'Contexte individuel, profil d\'utilisateur, contact personnel.' },
        GROUP_COMMUNITY: { emoji: '👥', concept: 'Communauté/Groupe', semantic: 'Contexte collectif, organisation d\'équipe, réseau.' },
    },

    // Catégorie 5: ACTIVITY (Tâche spécifique du Mouvement)
    ACTIVITY: {
        PROTEST: { emoji: '📢', concept: 'Manifestation', semantic: 'Tâche physique ou événement de mobilisation de masse.' },
        RESEARCH: { emoji: '🔍', concept: 'Veille/Analyse', semantic: 'Tâche d\'acquisition de données et d\'information (Rechercher, Scruter).' },
        BOYCOTT: { emoji: '🛒❌', concept: 'Boycott/Commerce', semantic: 'Tâche liée aux actions ciblées sur les enseignes commerciales.' },
        DEBATE: { emoji: '💬', concept: 'Discussion/Échange', semantic: 'Tâche de communication et d\'organisation interne.' },
    },

    // Catégorie 6: OBJECT (Concepts et Récompenses)
    OBJECT: {
        MAP_LOCATION: { emoji: '🗺️', concept: 'Carte/Localisation', semantic: 'Référence à la zone géographique ou aux points de ralliement.' },
        REWARD_TROPHY: { emoji: '🏆', concept: 'Récompense/Score', semantic: 'Référence au CVNU, à l\'UTMi ou à l\'accomplissement de mission.' },
        ALERT: { emoji: '⚠️', concept: 'Avertissement/Censure', semantic: 'Objet symbolisant un problème ou une alerte.' },
        DOCUMENT: { emoji: '📄', concept: 'Législation/Texte', semantic: 'Référence à un document légal, un manifeste ou un texte.' },
    },
    
    // Catégorie 7: FLAG (Géographie et Contexte)
    FLAG: {
        FRANCE_FLAG: { emoji: '🇫🇷', concept: 'Contexte National', semantic: 'Référence au pays, au gouvernement ou à la législation nationale.' },
        EUROPE_FLAG: { emoji: '🇪🇺', concept: 'Contexte Européen', semantic: 'Référence au contexte européen ou international.' },
        WORLD_GLOBE: { emoji: '🌍', concept: 'Monde/Global', semantic: 'Contexte mondial ou environnemental.' },
    },

    // Catégorie 8: SYMBOL (Caractères de progression simples)
    SYMBOL: {
        CHECK_MARK: { emoji: '✔️', concept: 'Marque/Vérifié', semantic: 'Confirmation simple, élément coché ou vérifié.' },
        LETTER_A: { emoji: '🅰️', concept: 'Option A', semantic: 'Désigne la première option ou un niveau de priorité A.' },
        LETTER_B: { emoji: '🅱️', concept: 'Option B', semantic: 'Désigne la deuxième option ou un niveau de priorité B.' },
        ARROW_UP_SIMPLE: { emoji: '🔼', concept: 'Minimal Up', semantic: 'Ascension ou direction positive minimale (pour les indicateurs).' },
        WAVE: { emoji: '〰️', concept: 'Mouvement/Non Linéaire', semantic: 'Représente le mouvement, l\'ambiguïté ou une progression non stable.' },
    },
};

/**
 * Analyse le texte utilisateur pour extraire des emojis pertinents basés sur les 8 catégories de tenseurs.
 * Le modèle Groq est contraint à produire une chaîne JSON avec les 8 clés OBLIGATOIRES.
 * @param {string} text Le texte pour lequel les emojis doivent être générés.
 * @param {boolean} [returnDetailedObject=false] Indique si la fonction doit retourner l'objet JSON complet au lieu de la chaîne concaténée.
 * @returns {Promise<string|object>} La chaîne d'emojis suggérés ou l'objet détaillé.
 */
async function generateContextualEmoji(text, returnDetailedObject = false) {
    if (!GROQ_API_KEY) {
        return '🔹';
    }

    // 🛑 NOUVEAU SYSTEM MESSAGE - Contraint l'IA à utiliser les 8 catégories sémantiques.
    const systemMessage = `
        Tu es l'unité de Tenseur Sémantique IA pour le projet Manifest.910-2025 (V5.1).
        Ton objectif est de garantir une analyse sémantique à 8 dimensions (IMPACT, ACTION, FLUX, ENTITY, ACTIVITY, OBJECT, FLAG, SYMBOL).
        
        Règles d'Analyse Cognitive :
        1. Pour chaque catégorie (clé), analyse le Concept Clé, le Verbe d'Action et la Sémantique W3C du dictionnaire.
        2. Sélectionne l'emoji le PLUS PERTINENT pour chaque catégorie, selon les données du dictionnaire.
        3. Sortie Stricte : Tu DOIS retourner un objet JSON avec OBLIGATOIREMENT les huit clés listées ci-dessous.

        Clés de Sortie Obligatoires : ["impact", "action", "flux", "entity", "activity", "object", "flag", "symbol"]
    `;
    
    // Prépare le dictionnaire pour le prompt Groq
    const simplifiedDictionary = {};
    for (const category in TENSOR_DICTIONARY) {
        simplifiedDictionary[category] = {};
        for (const key in TENSOR_DICTIONARY[category]) {
            const item = TENSOR_DICTIONARY[category][key];
            // L'IA n'a besoin que de l'emoji et du contexte sémantique pour choisir
            simplifiedDictionary[category][key] = { emoji: item.emoji, semantic: item.semantic };
        }
    }
    
    const dictionaryPrompt = `Dictionnaire de Tenseurs Affûtés: ${JSON.stringify(simplifiedDictionary)}.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage + dictionaryPrompt },
                { role: 'user', content: `Texte à analyser : "${text}"` }
            ],
            model: 'llama-3.1-8b-instant',
            response_format: { type: "json_object" }, 
            temperature: 0.1, 
            max_tokens: 200 
        });

        const jsonResponse = JSON.parse(chatCompletion.choices[0].message.content);
        
        if (returnDetailedObject) {
            return jsonResponse;
        }

        // Concaténer et nettoyer les résultats pour le retour standard
        const orderedKeys = ["impact", "action", "flux", "entity", "activity", "object", "flag", "symbol"];
        const emojis = orderedKeys
            .map(key => jsonResponse[key])
            .filter(e => e && e.length > 0)
            .join('');
        
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