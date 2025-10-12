// Fichier : services/data.js

const fs = require("fs/promises");
const path = require('path');
// Import de tous les chemins de fichiers nécessaires
const { 
    DATABASE_FILE_PATH, 
    CHAT_HISTORY_FILE, 
    RICS_FILE_PATH, 
    BOYCOTT_FILE_PATH,
    ACTIONS_DATA_FILE_PATH,
    DASHBOARD_SUMMARY_OUTPUT 
} = require('../config'); 

// --- 1. ÉTAT GLOBAL CENTRALISÉ ---
let database = {};
let chatHistory = [];
let ricsData = [];
let boycottsData = {};
let actionsData = { liste_actions_consolidee: [] };
let isWriting = false;
let writeQueue = Promise.resolve();

// --- 2. FONCTIONS DE BASE ET UTILITAIRES (NÉCESSAIRE POUR INITIALIZE/LOAD) ---

async function readJsonFile(filePath, defaultValue = {}) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
            return defaultValue;
        }
        console.error(`Erreur de lecture du fichier ${filePath}:`, error);
        return defaultValue;
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}

async function writeDatabaseFile() {
    return new Promise((resolve) => {
        writeQueue.then(async () => {
            if (isWriting) return;
            isWriting = true;
            try {
                await fs.writeFile(DATABASE_FILE_PATH, JSON.stringify(database, null, 2), 'utf8');
                resolve();
            } finally {
                isWriting = false;
            }
        });
    });
}


// --- 3. FONCTIONS CRITIQUES D'INITIALISATION (Déplacées ici pour éviter ReferenceError) ---

/**
 * Charge ou crée la base de données principale (database.json).
 */
async function initializeDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        database = JSON.parse(data);
        
        // Logique de vérification/initialisation des structures internes (taxes, missions, etc.)
        if (!database.missions) { database.missions = []; await writeDatabaseFile(); }
        if (!database.taxes) { /* ... initialisation des taxes par défaut ... */ }
        
        console.log('🗄️ Base de données chargée avec succès.');
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            
            // Structure vide complète pour éviter le crash des routes
            database = { 
                financial_flows: [], affaires: { chronology: [] }, rics: [], boycotts: [], 
                taxes: [/* ... taxes par défaut ... */], 
                beneficiaries: [], missions: [], democratie_posts: [],
                caisse_manifestation: { solde: 0, transactions: [] }, blockchain: { transactions: [] },
                // ... (toutes les autres clés nécessaires) ...
            };
            await writeDatabaseFile();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            // Ne pas appeler process.exit ici, mais laisser le bootstrap gérer.
            throw error;
        }
    }
}


/**
 * Charge les données d'actions depuis le fichier actions.json.
 */
async function loadActionsData() {
    try {
        const data = await fs.readFile(ACTIONS_DATA_FILE_PATH, 'utf8');
        actionsData = JSON.parse(data); 
        console.log('👊 Données des actions tactiques chargées avec succès.');
        if (!actionsData.liste_actions_consolidee) {
             actionsData.liste_actions_consolidee = [];
             console.warn("Structure d'actions incomplète. La liste a été initialisée.");
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn("Le fichier actions.json n'existe pas. Création d'une structure vide.");
        } else if (error instanceof SyntaxError) {
            console.error("ERREUR CRITIQUE JSON: Le fichier actions.json est corrompu. Réinitialisation des données d'actions à vide.", error);
        } else {
            console.error("Erreur fatale de lecture/fichier d'actions:", error);
        }
        actionsData = { liste_actions_consolidee: [] }; 
    }
}

/**
 * Charge l'historique du chat.
 */
async function loadChatHistoryFile() {
    try {
        const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
        chatHistory = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            chatHistory = [];
            await fs.writeFile(CHAT_HISTORY_FILE, '[]', 'utf8');
        } else { console.error('Erreur de lecture de l\'historique du chat:', error); }
    }
}

// Fonction complémentaire pour l'écriture de l'historique du chat (utilisée dans routes/chat.js)
async function writeChatHistoryFile() {
    try { await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistory, null, 2), 'utf8'); } catch (error) { console.error('Erreur d\'écriture de l\'historique du chat:', error); }
}

// Fonction pour le chargement des RICS
async function readRicsFile() {
    try {
        const data = await fs.readFile(RICS_FILE_PATH, 'utf8');
        ricsData = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { ricsData = []; await writeRicsFile(); } else { console.error('Erreur fatale lors du chargement de rics.json:', error); throw error; }
    }
}

// Fonction pour l'écriture des RICS
async function writeRicsFile() {
    try { await fs.writeFile(RICS_FILE_PATH, JSON.stringify(ricsData, null, 2), 'utf8'); } catch (error) { console.error('Erreur lors de l\'écriture de rics.json:', error); }
}

// Fonction pour le chargement des Boycotts
async function loadBoycottData() {
    try { boycottsData = await readJsonFile(BOYCOTT_FILE_PATH, { boycotts: [] }); } catch (error) { boycottsData = { boycotts: [] }; }
}

async function updateDashboardSummary(summaryData) {
    try {
        // Écrit le fichier dashboard_summary.json directement dans docs/data/
        await writeJsonFile(DASHBOARD_SUMMARY_OUTPUT, summaryData);
        console.log("✅ Résumé du tableau de bord mis à jour dans le répertoire statique.");
    } catch (error) {
        console.error("Échec de l'écriture du résumé statique:", error);
    }
}
// --- 4. GETTERS (pour accéder à l'état depuis les routes) ---

function getDatabase() { return database; }
function getChatHistory() { return chatHistory; }
function getRicsData() { return ricsData; }
function getBoycottsData() { return boycottsData; }
function getActionsData() { return actionsData; }


// --- 5. EXPORTS DU MODULE ---
module.exports = {
    // Fonctions d'Initialisation et d'Écriture
    initializeDatabase,
    writeDatabaseFile,
    loadActionsData, 
    loadChatHistoryFile,
    writeChatHistoryFile,
    readRicsFile,
    writeRicsFile,
    loadBoycottData,
    updateDashboardSummary,
    // Getters de l'État
    getDatabase, 
    getChatHistory,
    getRicsData,
    getBoycottsData,
    getActionsData,

    // Utilitaires de base (si utilisés ailleurs)
    readJsonFile,
    writeJsonFile
};