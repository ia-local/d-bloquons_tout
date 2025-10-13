// Fichier : config/index.js

const path = require('path');

// --- VARIABLES D'ENVIRONNEMENT (Clés) ---
// Note : Le chargement de ces variables est implicite si vous utilisez `dotenv` ou si elles sont déjà dans l'environnement.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;
// 🛑 NOUVELLE CONSTANTE : Mapping du modèle haute performance
const DEEPSEEK_MODEL = 'deepseek-r1-distill-llama-70b';
// --- CHEMINS DE FICHIERS ---
const DATA_DIR = path.join(__dirname, '..', 'data'); 
// Chemin de base de la structure docs/
const DOCS_DIR = path.join(__dirname, '..', 'docs'); 

// Chemin où les données JSON mises à jour seront écrites
const DYNAMIC_JSON_DIR = path.join(DOCS_DIR, 'data'); 

// Exemple de chemin pour un fichier généré que vous voulez servir
const DASHBOARD_SUMMARY_OUTPUT = path.join(DYNAMIC_JSON_DIR, 'dashboard_summary.json');

const CHAT_HISTORY_FILE = path.join(DATA_DIR, 'chat_history.json');
const DATABASE_FILE_PATH = path.join(DATA_DIR, 'database.json');
const BOYCOTT_FILE_PATH = path.join(DATA_DIR, 'boycott.json');
const RICS_FILE_PATH = path.join(DATA_DIR, 'rics.json');
const SATELLITES_DATA_FILE = path.join(DATA_DIR, 'satellites.json');
const LOG_FILE_PATH = path.join(DATA_DIR, 'logs.json');
const EE_PRIVATE_KEY_PATH = './private-key.json'; // Clé GEE synchrone
const ACTIONS_DATA_FILE_PATH = path.join(__dirname, '..', 'docs', 'src', 'json', 'map', 'actions.json');

// --- CONFIGURATION AI ---
const GROQ_MODEL = "llama-3.1-8b-instant";
// --- DÉFINITIONS ---
// --- DÉFINITIONS ---
const AI_MODELS = {
    DEFAULT: 'llama-3.1-8b-instant',
    STRATEGIC: 'deepseek-r1-distill-llama-70b', // Utilisé pour l'analyse stratégique
    ENQUETEUR: 'deepseek-r1-distill-llama-70b',
    VISION: 'meta-llama/llama-4-scout-17b-16e-instruct"',
    AVOCAT: 'llama-3.1-8b-instant',
    CODING: 'deepseek-r1-distill-llama-70b',
    SECRETARY: 'llama-3.1-8b-instant',
    GENERATOR: 'deepseek-r1-distill-llama-70b'
};
const AI_PERSONAS = {
    'generaliste': 'Tu es un un assistant IA généraliste, utile et informatif. Tu es là pour aider l\'utilisateur dans le cadre du projet.',
    'enqueteur': 'Tu es un enquêteur IA spécialisé dans l\'analyse de dossiers de corruption. Ton ton est factuel, précis et basé sur des données. Tu as la persona d\'un enquêteur et tu réponds en te basant sur des faits.',
    'avocat': 'Tu es un avocat IA spécialisé dans la législation française. Tu réponds avec un ton formel et juridique, en citant des articles de loi ou des jurisprudences si nécessaire.',
    'assistant': 'Tu es un assistant IA de base. Tu aides l\'utilisateur à naviguer dans l\'application et tu réponds à des questions simples.',
    'codage': 'Tu es un assistant de codage IA. Tu génères du code, tu expliques des concepts de programmation et tu aides à déboguer. Ton ton est technique et précis.',
    'secretaire': 'Tu es une secrétaire IA. Tu aides à organiser des tâches, à rédiger des résumés et à gérer des informations. Ton ton est formel et efficace.',
    'generateur': 'Tu es un générateur IA. Tu crées du contenu sur demande, comme des articles, des descriptions ou des idées. Tu te concentres sur la génération créative et rapide.'
};
// Définitions de CATEGORIES_TO_CLASSIFY (déplacées de votre ancien serveur.js)
const CATEGORIES_TO_CLASSIFY = [
    { name: 'Manifestations & Actions', text: 'Rassemblement de personnes, grève, blocage, manifestation, opération de mobilisation' },
    { name: 'Lieux Stratégiques', text: 'Points de ronds-points, gares, aéroports, hôpitaux, universités, lieux de transport' },
    { name: 'Lieux Administratifs', text: 'Mairies, préfectures, bâtiments officiels, palais présidentiel' },
    { name: 'Secteurs d\'application', text: 'Agriculture, finance, banque, commerce, industrie, éducation, santé, télécommunications' },
    { name: 'Boycotts', text: 'Boycott d\'une enseigne, d\'une marque, d\'un produit' },
    { name: 'Surveillance & Réseaux', text: 'Caméras de surveillance, caméras fixes, agents de sécurité, tours de télécommunication, 5G' },
    { name: 'Organisations', text: 'Syndicats, partis politiques, associations' },
    { name: 'Pétitions', text: 'Pétitions en ligne, signatures, campagnes de soutien' },
    { name: 'Militants', text: 'Personnes, militants, citoyens, activistes, membres de l\'organisation' }
];
module.exports = {
    GROQ_API_KEY,
    GEMINI_API_KEY,
    PORT,
    CHAT_HISTORY_FILE,
    DATABASE_FILE_PATH,
    BOYCOTT_FILE_PATH,
    RICS_FILE_PATH,
    SATELLITES_DATA_FILE,
    LOG_FILE_PATH,
    EE_PRIVATE_KEY_PATH,
    GROQ_MODEL,
    AI_PERSONAS,
    ACTIONS_DATA_FILE_PATH,
    CATEGORIES_TO_CLASSIFY,
    DOCS_DIR,
    DYNAMIC_JSON_DIR,
    DASHBOARD_SUMMARY_OUTPUT,
    DEEPSEEK_MODEL // 🛑 EXPOSÉ
    // ... exportez toutes les autres constantes (CATEGORIES_TO_CLASSIFY, etc.)
};