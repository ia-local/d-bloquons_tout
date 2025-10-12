// Fichier : serveur.js (VERSION CORRIGÉE ET COMPLÈTE)

const fs = require("fs/promises");
const fsSync = require('fs'); // 🛑 IMPORT DU FS SYNCHRONE POUR LA CLÉ GEE
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const Web3 = require('web3'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); 
const cvnuRouter = require('./routes/cvnu.js');
const reformeRouter = require('./routes/reforme.js');
const missionsRouter = require('./routes/quests.js');
const mapRouter = require('./routes/map-router.js');
const smartContractRouter = require('./routes/smartContract.js');
const ee = require('@google/earthengine');
const cors = require('cors');
const sassMiddleware = require('node-sass-middleware');
const operator = require('./server_modules/operator.js');
const { calculateDashboardInsights, calculateUtmi } = require('./server_modules/utms_calculator.js');
const reseauRouter = require('./routes/reseauRouter.js');
const journalRouter = require('./routes/journalRouter.js');
const democratieRouter = require('./routes/democratie.js');
const telegramBot = require('./routes/telegramRouter.js'); 
const google = require('googleapis').google;
const writeQueue = Promise.resolve();
// --- Importation des Routeurs ---
const revendicationsRouter = require('./routes/revendicationsRouter');
const actionsRouter = require('./routes/actionsRouter');
let isWriting = false;

// --- DÉFINITIONS ---
const AI_MODELS = {
    DEFAULT: 'llama-3.1-8b-instant',
    ENQUETEUR: 'llama-3.1-8b-instant',
    AVOCAT: 'deepseek-r1-distill-llama-70b',
    CODING: 'llama-3.1-8b-instant',
    SECRETARY: 'llama-3.1-8b-instant',
    GENERATOR: 'llama-3.1-8b-instant'
};
const GROQ_MODEL ="llama-3.1-8b-instant"; 
const aiPersonas = {
    'generaliste': 'Tu es un un assistant IA généraliste, utile et informatif. Tu es là pour aider l\'utilisateur dans le cadre du projet.',
    'enqueteur': 'Tu es un enquêteur IA spécialisé dans l\'analyse de dossiers de corruption. Ton ton est factuel, précis et basé sur des données. Tu as la persona d\'un enquêteur et tu réponds en te basant sur des faits.',
    'avocat': 'Tu es un avocat IA spécialisé dans la législation française. Tu réponds avec un ton formel et juridique, en citant des articles de loi ou des jurisprudences si nécessaire.',
    'assistant': 'Tu es un assistant IA de base. Tu aides l\'utilisateur à naviguer dans l\'application et tu réponds à des questions simples.',
    'codage': 'Tu es un assistant de codage IA. Tu génères du code, tu expliques des concepts de programmation et tu aides à déboguer. Ton ton est technique et précis.',
    'secretaire': 'Tu es une secrétaire IA. Tu aides à organiser des tâches, à rédiger des résumés et à gérer des informations. Ton ton est formel et efficace.',
    'generateur': 'Tu es un générateur IA. Tu crées du contenu sur demande, comme des articles, des descriptions ou des idées. Tu te concentres sur la génération créative et rapide.'
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// 🛑 Initialisation conditionnelle pour éviter le plantage si la clé est absente
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : { chat: { completions: { create: async () => ({ choices: [{ message: { content: "Erreur: Clé Groq manquante." } }] }) } } };

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let chatHistory = [];

// --- CHEMINS DE BASE ---
const CHAT_HISTORY_FILE = path.join(__dirname, 'data', 'chat_history.json');
const DATABASE_FILE_PATH = path.join(__dirname, 'data', 'database.json');
const BOYCOTT_FILE_PATH = path.join(__dirname, 'data', 'boycott.json');
const RICS_FILE_PATH = path.join(__dirname, 'data', 'rics.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const SATELLITES_DATA_FILE = path.join(__dirname, 'data', 'satellites.json');
const LOG_FILE_PATH = path.join(__dirname, 'data', 'logs.json');

// ------------------------------------------------
// 2. GESTION DES DONNÉES ET FONCTIONS GLOBALES (Dépendances)
// ------------------------------------------------

let revendicationsData = {};
let actionsData = {}; 
const DATA_DIR = path.join(__dirname, 'docs', 'data'); 
const CATEGORY_MAP = {
    'demcratie': 'democratie', 
    'internationnal': 'international', 
};
const PRIORITY_ORDER = { 'Élevé': 3, 'Moyen': 2, 'Faible': 1 };
const RISK_ORDER = { 'crime': 5, 'très élevé': 4, 'élevé': 3, 'modéré': 2, 'faible': 1, 'nul': 0 };

// 🛑 CHEMIN SPÉCIFIQUE DES ACTIONS
const ACTIONS_DATA_FILE_PATH = path.join(__dirname, 'docs', 'src', 'json', 'map', 'actions.json');

const ANALYSIS_LOG_PATH = path.join(DATA_DIR, 'analysis_log.json');
let analysisLog = [];


// 🛑 CHARGEMENT SYNCHRONE DE LA CLÉ GEE (inchangé)
const EE_PRIVATE_KEY_PATH = './private-key.json';
let EE_PRIVATE_KEY = null;
try {
    EE_PRIVATE_KEY = JSON.parse(fsSync.readFileSync(EE_PRIVATE_KEY_PATH, 'utf8'));
} catch (error) {
    console.error(`[FATAL] Impossible de lire la clé privée GEE à ${EE_PRIVATE_KEY_PATH}. L'authentification Earth Engine échouera.`);
}

// 🛑 CHEMINS CRITIQUES POUR LA CARTE (UNIFIÉS) (inchangé)
const MANIF_2_OCTOBRE_PATH = path.join(__dirname, 'docs', 'src', 'json', 'map', 'manifestation_points_2_octobre.json');
const SOURCE_CONFIG_PATH = path.join(__dirname, 'docs', 'src', 'json', 'map', 'source.json');
const LIVE_DATA_TEMP_PATH = path.join(__dirname, 'docs', 'src', 'json', 'map', 'temp_live_data.json'); 


let database = {};
let boycottsData = {};
let ricsData = [];
// La variable satellitesData est retirée

// Définition des catégories de référence et de leurs textes (inchangé)
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

let categoryEmbeddings = [];


// --- FONCTIONS DE GESTION DES ACTIONS (Rendues GLOBALES pour le Routeur) ---


/**
 * Charge les données d'actions depuis le fichier actions.json.
 */
async function loadActionsData() {
    try {
        const data = await fs.readFile(ACTIONS_DATA_FILE_PATH, 'utf8');
        actionsData = JSON.parse(data); 
        console.log('👊 Données des actions tactiques chargées avec succès.');
        // Assurer que la liste est un tableau même si le fichier est corrompu ou vide
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
        // Assigner une structure vide pour éviter le crash dans le routeur
        actionsData = { liste_actions_consolidee: [] }; 
        global.actionsData = actionsData; 
    }
}

/**
 * Sauvegarde les données d'actions vers le fichier actions.json.
 */
async function saveActionsData() {
    try {
        await fs.writeFile(ACTIONS_DATA_FILE_PATH, JSON.stringify(actionsData, null, 2), 'utf8');
    } catch (error) {
        console.error("Erreur d'écriture d'actions.json:", error);
        throw error;
    }
}

/**
 * Fonction utilitaire de simulation pour l'API Groq (requise par actionsRouter.js).
 */
async function retryApiCall(apiCall) {
    try {
        return await apiCall();
    } catch (error) {
        console.error("Erreur dans retryApiCall:", error.message);
        throw error;
    }
}

// 🛑 REND LES FONCTIONS ET VARIABLES ACCESSIBLES GLOBALEMENT POUR LES ROUTEURS
global.actionsData = actionsData; 
global.loadActionsData = loadActionsData;
global.saveActionsData = saveActionsData;
global.retryApiCall = retryApiCall;
global.GROQ_MODEL = GROQ_MODEL; 
global.groq = groq; // Rendre l'objet Groq global
// --- FIN DES FONCTIONS POUR LE ROUTEUR ---


async function generateCategoryEmbeddings() {
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
        // 🛑 Capture l'erreur 500 de Gemini, empêchant le crash du serveur
        console.error("⚠️ Échec critique de la génération des embeddings IA (Gemini API 500 ou autre). La classification s'exécutera SANS embeddings.");
        console.error("Détails de l'erreur Gemini:", error.message);
        categoryEmbeddings = [];
    }
}

function cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        magnitude1 += v1[i] ** 2;
        magnitude2 += v2[i] ** 2;
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    return dotProduct / (magnitude1 * magnitude2);
}


// Nouvelle route API pour la classification
app.post('/api/classify', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Le texte est manquant.' });
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


// --- FONCTIONS UTILITAIRES ---
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
async function initializeDatabase() {
    try {
        const data = await fs.readFile(DATABASE_FILE_PATH, { encoding: 'utf8' });
        database = JSON.parse(data);
        if (!database.missions) { database.missions = []; }
        if (!database.taxes) {
            database.taxes = [
                { id: "tax_tfa", name: "Taxe sur les Transactions Financières (TFA)", description: "Taxe sur les flux financiers et les mouvements de capitaux.", rate: 0.2, applicable_to: "financial_flows" },
                { id: "tax_production", name: "Taxe sur les Facteurs de Production", description: "Taxe basée sur les coûts de production des entreprises.", rate: 0.05, applicable_to: "company_data" },
                { id: "tax_vat", name: "Taxe sur la Valeur Ajoutée", description: "Modélisation de l'impact de la TVA sur les transactions.", rate: 0.2, applicable_to: "transactions" },
                { id: "tax_campaign", name: "Taxe sur les Excédents de Comptes de Campagne", description: "Taxe sur les excédents de financement des partis politiques, d'après les données de la CNCCFP.FR.", rate: 0.5, applicable_to: "campaign_finance" }
            ];
        }
        console.log('🗄️ Base de données chargée avec succès.');
        if (!database.missions) { database.missions = []; await writeDatabaseFile(); }
        if (!database.democratie_posts) { database.democratie_posts = []; }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Le fichier database.json n\'existe pas, initialisation de la base de données vide.');
            database = {
                financial_flows: [], affaires: { chronology: [] }, rics: [], taxes: [], boycotts: [], entities: [],
                caisse_manifestation: { solde: 0, transactions: [] }, blockchain: { transactions: [] }, polls: [],
                affaires: { chronology: [] },
                organizers: [], beneficiaries: [], cv_contracts: [], cameras_points: [], journal_posts: [], missions: [],
                taxes: [
                    { id: "tax_tfa", name: "Taxe sur les Transactions Financières (TFA)", description: "Taxe sur les flux financiers et les mouvements de capitaux.", rate: 0.2, applicable_to: "financial_flows" },
                    { id: "tax_production", name: "Taxe sur les Facteurs de Production", description: "Taxe basée sur les coûts de production des entreprises.", rate: 0.05, applicable_to: "company_data" },
                    { id: "tax_vat", name: "Taxe sur la Valeur Ajoutée", description: "Modélisation de l'impact de la TVA sur les transactions.", rate: 0.2, applicable_to: "transactions" },
                    { id: "tax_campaign", name: "Taxe sur les Excédents de Comptes de Campagne", description: "Taxe sur les excédents de financement des partis politiques, d'après les données de la CNCCFP.FR.", rate: 0.5, applicable_to: "campaign_finance" }
                ],
                rics: [],
                boycotts: [],
                entities: [],
                blockchain: { transactions: [] },
                polls: [],
                organizers: [],
                beneficiaries: [],
                cv_contracts: [],
                cameras_points: [],
                journal_posts: [],
                missions: [],
                democratie_posts: [],
            };
            await writeDatabaseFile();
        } else {
            console.error('Erreur fatale lors du chargement de database.json:', error);
            process.exit(1);
        }
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
async function writeChatHistoryFile() {
    try { await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistory, null, 2), 'utf8'); } catch (error) { console.error('Erreur d\'écriture de l\'historique du chat:', error); }
}
async function readRicsFile() {
    try {
        const data = await fs.readFile(RICS_FILE_PATH, 'utf8');
        ricsData = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { ricsData = []; await writeRicsFile(); } else { console.error('Erreur fatale lors du chargement de rics.json:', error); process.exit(1); }
    }
}
async function writeRicsFile() {
    try { await fs.writeFile(RICS_FILE_PATH, JSON.stringify(ricsData, null, 2), 'utf8'); } catch (error) { console.error('Erreur lors de l\'écriture de rics.json:', error); }
}
async function loadBoycottData() {
    try { boycottsData = await readJsonFile(BOYCOTT_FILE_PATH, { boycotts: [] }); } catch (error) { boycottsData = { boycotts: [] }; }
}

async function setupGoogleAuth() {
    const CLIENT_SECRET_FILE = './client-key.json';
    try {
        const credentials = require(CLIENT_SECRET_FILE);
        const { client_secret, client_id, redirect_uris } = credentials.web;
        oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    } catch (error) {
        console.error('Erreur lors du chargement des identifiants client OAuth2:', error);
        process.exit(1);
    }
}

async function authenticateEarthEngine() {
    if (!EE_PRIVATE_KEY || !EE_PRIVATE_KEY.private_key) {
        return Promise.reject(new Error("GEE Private Key n'a pas été chargée correctement. Vérifiez private-key.json."));
    }
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
            EE_PRIVATE_KEY,
            () => { 
                ee.initialize(null, null, resolve, (err) => reject(new Error(`Échec d'initialisation Earth Engine: ${err}`)));
            },
            (err) => reject(new Error(`Échec d'authentification Earth Engine: ${err}`))
        );
    });
}
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        const chatCompletion = await groq.chat.completions.create({ messages: messages, model: model, temperature: 0.7, max_tokens: 2048 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`❌ Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.';
    }
}
function calculateTaxAmount(transaction, taxes) {
    let totalTax = 0;
    const applicableTaxes = taxes.filter(t => t.applicable_to === 'financial_flows');
    for (const tax of applicableTaxes) {
        if (tax.id === 'tax_vat' && transaction.isVatApplicable) {
            totalTax += transaction.amount * tax.rate;
        } else {
            totalTax += transaction.amount * tax.rate;
        }
    }
    return totalTax;
}

// 🛑 FONCTIONS DE SUPPORT POUR LA CARTE
async function getMapDataFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return filePath.includes('.json') ? [] : {}; 
        }
        console.error(`Erreur de lecture du fichier carte ${filePath}:`, error);
        return [];
    }
}

async function writeMapDataFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 🛑 IMPORT DU NOUVEAU SERVICE DE SCRAPING
const { runRealScrapingJob } = require('./server_modules/scrapingService.js');


/**
 * 🛑 FONCTION ENRICHISSEMENT IA (MISE À JOUR)
 */
function searchVideoForPoint(city, name, eventDate) {
    const query = `vidéo manifestation "${name}" "${city}" ${eventDate}`;
    console.log(`[IA Search Simulation] Tentative de recherche pour: ${query}`);
    if (city === 'Troyes') {
        return "https://www.youtube.com/watch?v=manifestation_troyes_live";
    }
    return null;
}


// --- MIDDLEWARES & ROUTES EXPRESS ---
app.use(express.json());
app.use(cors());
app.use(sassMiddleware({
    src: path.join(__dirname, 'docs', 'src', 'css'),
    dest: path.join(__dirname, 'docs', 'src', 'scss'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
}));
app.use(express.static(path.join(__dirname, 'docs')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

// Montage des routeurs spécifiques
app.use('/missions', missionsRouter);
app.use('/journal', journalRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter);
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);
app.use('/democratie', democratieRouter);
app.use('/reseau', reseauRouter);

// ------------------------------------------------
// 3. MONTAGE DES ROUTEURS MODULAIRES
// ------------------------------------------------

// Montage du routeur des revendications
app.use('/api', revendicationsRouter); 

// Montage du routeur des actions
app.use('/api/actions', actionsRouter);
app.use('/api/actions-data', actionsRouter); 
app.use('/api/plan_action', actionsRouter); 

// Documentation Swagger
const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
let swaggerDocument = {};
try {
    swaggerDocument = YAML.load(swaggerDocumentPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
    console.error('Erreur lors du chargement de la documentation Swagger:', error);
}

// Routes pour le Chatbot (inchangé)
app.get('/api/chat/history', (req, res) => { res.json(chatHistory); });
app.post('/api/chat/message', async (req, res) => {
    const { message, persona } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    const userMessage = { id: uuidv4(), role: 'user', content: message, persona: 'vous', timestamp: new Date().toISOString() };
    chatHistory.push(userMessage);
    const systemMessage = aiPersonas[persona] || aiPersonas['generaliste'];
    const aiResponse = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: message }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7
    });
    const aiMessage = { id: uuidv4(), role: 'ai', content: aiResponse.choices[0].message.content, persona: persona, timestamp: new Date().toISOString() };
    chatHistory.push(aiMessage);
    await writeChatHistoryFile();
    res.status(201).json(aiMessage);
});
app.put('/api/chat/message/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const message = chatHistory.find(m => m.id === id);
    if (!message) { return res.status(404).json({ error: 'Message non trouvé.' }); }
    message.content = content;
    await writeChatHistoryFile();
    res.json(message);
});
app.delete('/api/chat/message/:id', async (req, res) => {
    const { id } = req.params;
    const initialLength = chatHistory.length;
    chatHistory = chatHistory.filter(m => m.id !== id);
    if (chatHistory.length < initialLength) {
        await writeChatHistoryFile();
        res.status(204).send();
    } else { res.status(404).json({ error: 'Message non trouvé.' }); }
});

// 🛑 ROUTE POUR LES TUILES GEE (inchangé)
app.get('/api/gee/tiles/:id', async (req, res) => {
    
    // 1. VÉRIFICATION D'INITIALISATION
    if (!ee.data || !ee.data.getAssetAcl) {
        return res.status(503).json({ error: 'Le service Google Earth Engine n\'a pas pu être initialisé au démarrage du serveur. Vérifiez l\'authentification.' });
    }
    
    // Tentative de réinitialisation pour la stabilité
    try { ee.reset(); } catch (e) { console.warn("[GEE WARNING] ee.reset() a échoué. Erreur: ", e.message); }
    
    const satelliteId = req.params.id;
    const bandsParam = req.query.bands; 
    const cloudPercentageParam = req.query.cloud_percentage; 
    
    let imageCollectionId = 'COPERNICUS/S2_SR_HARMONIZED'; 
    let bandsToSelect = bandsParam ? bandsParam.split(',') : ['B4', 'B3', 'B2'];
    let cloudFilterKey = 'CLOUDY_PIXEL_PERCENTAGE';
    
    // 🛑 DÉFINITION DES PARAMÈTRES DE VISUALISATION (MIN/MAX fixes et stables)
    const STABLE_VIS_PARAMS = {
        bands: bandsToSelect,
        min: 0, 
        max: 3000, 
        gamma: 1.2
    };

    const cloudLimit = parseInt(cloudPercentageParam || 5); 
    
    // 🛑 DATES FIXES POUR L'ÉVÉNEMENT
    const startDate = '2025-09-10'; 
    const endDate = '2025-09-18'; 

    // 🛑 DÉFINITION DE LA RÉGION DE CALCUL (France métropolitaine complète)
    const franceRoi = ee.Geometry.Rectangle([
        -5.14, 41.3, 
        9.56, 51.12
    ]);

    try {
        let collection;
        let size = 0;
        let found = false;

        // --- TENTATIVE D'ESCALADE (Logique inchangée) ---
        // T1: Strict
        collection = ee.ImageCollection(imageCollectionId)
            .filterDate(startDate, endDate) 
            .filter(ee.Filter.lt(cloudFilterKey, cloudLimit)) 
            .filterBounds(franceRoi) 
            .sort('system:time_start', false); 
        size = await collection.size().getInfo();
        if (size > 0) found = true;
        
        // T2: Nuageux 50%
        if (!found) {
             collection = ee.ImageCollection(imageCollectionId)
                 .filterDate(startDate, endDate) 
                 .filter(ee.Filter.lt(cloudFilterKey, 50))
                 .filterBounds(franceRoi)
                 .sort('system:time_start', false);
             size = await collection.size().getInfo();
             if (size > 0) found = true;
        }

        // T3: Relaxation Totale du Nuageux
        if (!found) {
             collection = ee.ImageCollection(imageCollectionId)
                .filterDate(startDate, endDate)
                .filterBounds(franceRoi)
                .sort('system:time_start', false);
             size = await collection.size().getInfo();
             if (size > 0) found = true;
        }
        
        // 3. ÉVALUATION FINALE ET CRÉATION DE L'IMAGE
        if (size === 0) {
             return res.status(404).json({ error: `Échec GEE: Aucune image satellite n'a été trouvée pour la France entre ${startDate} et ${endDate} après toutes les tentatives de recherche.` });
        }
        
        // Création de la mosaïque 
        const imageToDisplay = collection.mosaic()
            .select(bandsToSelect)
            .unmask(0)
            .toInt16();
        
        // 4. GÉNÉRATION DES TUILES (Appel critique)
        imageToDisplay.getMap({
            vis: STABLE_VIS_PARAMS,
        }, (map) => {
            
            if (!map || map.error || !map.mapid || !map.token) { 
                
                const errorDetail = map?.error 
                    ? (map.error.message || JSON.stringify(map.error)) 
                    : "GEE n'a pas pu générer les identifiants de tuile (L'objet de carte retourné est invalide).";
                
                console.error("Erreur GEE lors de getMap (serveur):", map?.error || "MapID/Token manquant.");

                return res.status(500).json({ 
                    error: `Échec du chargement satellite : Erreur génération GEE: ${errorDetail}. La génération de tuile a échoué.`,
                    debug: map 
                }); 
            }
            res.json({ mapid: map.mapid, token: map.token, satelliteName: imageCollectionId });
        });
    } catch (error) {
        const errorMessage = error.message || error.toString();
        console.error('Échec critique de la génération des tuiles GEE (Runtime):', errorMessage);
        res.status(500).json({ error: `Échec GEE (ID: ${imageCollectionId}): ${errorMessage}. Erreur critique avant l'appel getMap.` });
    }
});

// Routes API pour le dashboard et les services (RÉINTÉGRATION COMPLÈTE)
app.get('/api/dashboard/utmi-insights', async (req, res) => {
    try {
        const logsData = await fs.readFile(LOG_FILE_PATH, 'utf8');
        const logs = JSON.parse(logsData);
        const taxSummary = {};
        (database.taxes || []).forEach(tax => { taxSummary[tax.id] = { name: tax.name, utmi_value: 0 }; });
        logs.forEach(log => {
            if (log.type === 'FINANCIAL_FLOW' && log.data?.taxAmount) {
                const taxId = log.data.taxId || 'tax_vat';
                if (taxSummary[taxId]) {
                    const utmiValue = log.data.taxAmount * (database.taxes.find(t => t.id === taxId)?.utmi_per_euro || 0);
                    taxSummary[taxId].utmi_value += utmiValue;
                }
            }
        });
        const insights = calculateDashboardInsights(logs, database);
        insights.taxCollectionSummary = taxSummary;
        res.json(insights);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération des insights UTMi.' }); }
});
app.get('/smartContract/api/dashboard-data', async (req, res) => {
    const db = await readJsonFile(DATABASE_FILE_PATH); // Assumer readJsonFile fonctionne pour DB
    const recettesFiscalesTotales = db.tresorerieCompteCampagne || 0;
    const depenses = db.citoyensSimules?.reduce((sum, citoyen) => sum + (citoyen.allocation || 0), 0) || 0;
    const distributionAllocation = db.citoyensSimules?.reduce((acc, citoyen) => {
        const tranche = Math.floor((citoyen.allocation || 0) / 1000) * 1000;
        acc[tranche] = (acc[tranche] || 0) + 1;
        return acc;
    }, {}) || {};
    res.json({
        totalRecettes: recettesFiscalesTotales,
        totalDepenses: depenses,
        recettesParSource: { TVA: recettesFiscalesTotales, Autres: 0 },
        nombreBeneficiaires: db.citoyensSimules?.length || 0,
        distributionAllocation,
        tresorerie: db.tresorerieCompteCampagne || 0,
    });
});
app.get('/api/operator/summary', async (req, res) => { try { const summary = await operator.generateSummary(); res.json({ summary }); } catch (error) { res.status(500).json({ error: 'Échec de la génération du résumé.' }); } });
app.get('/api/operator/plan', async (req, res) => { try { const plan = await operator.generateDevelopmentPlan(); res.json({ plan }); } catch (error) { res.status(500).json({ error: 'Échec de la génération du plan.' }); } });
app.post('/api/operator/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { const aiResponse = await operator.getGroqChatResponse(message); res.json({ response: aiResponse }); } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});
app.post('/api/boycotts/submit-ai-analysis', async (req, res) => {
    const { text, image } = req.body;
    if (!text && !image) { return res.status(400).json({ error: 'Un texte ou une image est requis pour l\'analyse.' }); }
    try {
        let aiPrompt;
        let aiResponse;
        if (text) {
            aiPrompt = `À partir de la phrase suivante, extrait les informations clés : le nom de l'enseigne, la ville, une description courte, et le type de commerce (parmi 'Distribution', 'Banque', 'Restauration', 'Habillement', 'Énergie'). Génère ensuite les coordonnées GPS précises (latitude et longitude) de la ville correspondante. Formatte ta réponse en un objet JSON, sans autre texte. Exemple: {"name": "Nom de l'enseigne", "city": "Nom de la ville", "lat": 48.8566, "lon": 2.3522, "type": "Distribution", "description": "Description de l'enseigne."}. Voici la phrase : "${text}"`;
            aiResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: aiPrompt }], model: 'llama-3.1-8b-instant', temperature: 0.2, stream: false });
        } else if (image) {
            aiPrompt = `Analyse l'image du ticket de caisse et extrait le nom de l'enseigne, la ville et le montant total. Génère un objet JSON.`;
            aiResponse = await groq.chat.completions.create({
                messages: [{ role: 'user', content: [{ type: 'text', text: aiPrompt }, { type: 'image_url', image_url: { "url": image } }] }],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                temperature: 0.2,
                stream: false
            });
        }
        const generatedJson = JSON.parse(aiResponse.choices[0].message.content);
        res.json(generatedJson);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération des données via l\'IA.' }); }
});
app.get('/api/prefectures', (req, res) => { res.json(database.prefectures || []); });
app.get('/api/mairies', (req, res) => { res.json(database.mairies || []); });
app.get('/api/roundabout-points', (req, res) => { res.json(database.roundabout_points || []); });
app.get('/api/porte-points', (req, res) => { res.json(database.porte_points || []); });
app.get('/api/strategic-locations', (req, res) => { res.json(database.strategic_locations || []); });
app.get('/api/syndicats', (req, res) => { res.json(database.syndicats || []); });
app.get('/api/telecoms', (req, res) => { res.json(database.telecoms || []); });
app.get('/api/satellites', async (req, res) => { try { const satellitesData = await readJsonFile(SATELLITES_DATA_FILE, []); res.json(satellitesData); } catch (error) { res.status(500).json({ error: 'Échec du chargement des données satellitaires.' }); } });
app.get('/api/telegram-sites', (req, res) => { res.json(database.telegram_groups || []); });
app.get('/api/docs-cameras', async (req, res) => { res.json(database.cameras_points || []); });
app.get('/journal/api/journal/posts', async (req, res) => { res.json(database.journal_posts || []); });
app.post('/journal/api/journal/posts', async (req, res) => {
    const { title, content, media } = req.body;
    if (!title || !content || !media) { return res.status(400).json({ error: 'Titre, contenu ou média manquant.' }); }
    await readJsonFile(DATABASE_FILE_PATH); // Utilisez readJsonFile ou initializeDatabase si nécessaire
    if (!database.journal_posts) { database.journal_posts = []; }
    const newPost = { id: uuidv4(), title: title, media: media, article: content, date: new Date().toISOString() };
    database.journal_posts.push(newPost);
    await writeDatabaseFile();
    res.status(201).json({ message: 'Article enregistré avec succès.', post: newPost });
});
app.get('/journal/api/journal/generate', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) { return res.status(400).json({ error: 'Le paramètre "topic" est manquant.' }); }
    try {
        const titleResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Génère un titre d'article de journal sur le thème : ${topic}, percutant. Ta réponses doit contenir uniquement le titre et Faire moins de 10 mots.` }], model: 'llama-3.1-8b-instant' });
        const title = titleResponse.choices[0].message.content;
        const contentResponse = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Rédige un une chronique politique de journal sur pour le mouvement "bloquons TOUT" '${topic}'. Utilise un style formel et pertinent pour l'actualité citoyenne. Le contenu doit être formaté en HTML.` }], model: 'llama-3.1-8b-instant' });
        const article = contentResponse.choices[0].message.content;
        let mediaUrl = 'https://ia-local.github.io/Manifest.910-2025/media/generated-image.jpg';
        if (genAI) {
            try {
                const imagePrompt = `Crée une image qui représente un concept clé de cet article de journal: '${title}'.`;
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
                const result = await model.generateContent(imagePrompt);
                const response = result.response;
                const parts = response.candidates[0].content.parts;
                for (const part of parts) { if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) { mediaUrl = `data:image/webp;base64,${part.inlineData.data}`; } }
            } catch (imageError) { console.error("Erreur lors de la génération de l'image:", imageError); }
        }
        const newPost = { id: uuidv4(), title: title, media: mediaUrl, article: article, date: new Date().toISOString() };
        res.json(newPost);
    } catch (error) { res.status(500).json({ error: 'Échec de la génération de l\'article.' }); }
});
app.post('/api/ai/generate-entity', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'La requête est vide.' });
    const aiPrompt = `À partir de la requête suivante, génère un objet JSON qui inclut le 'name' (nom), le 'type' (supermarché, banque, etc.), une 'description' et des coordonnées 'geo' (latitude et longitude) pour l'entité. Réponds uniquement avec l'objet JSON. Voici la requête: "${query}"`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: aiPrompt }, { role: 'user', content: query }], model: 'llama-3.1-8b-instant', temperature: 0.1, stream: false });
        const responseContent = chatCompletion?.choices?.[0]?.message?.content;
        const jsonResponse = JSON.parse(responseContent);
        res.json(jsonResponse);
    } catch (error) { res.status(500).json({ error: 'Impossible de générer les données avec l\'IA.' }); }
});
app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { const aiResponse = await getGroqChatResponse(message, 'llama-3.1-8b-instant', "Vous êtes un assistant utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement."); res.json({ response: aiResponse }); } catch (error) { res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); }
});
app.get('/api/financial-flows', (req, res) => res.json(database.financial_flows));
app.post('/api/financial-flows', async (req, res) => {
    const newFlow = { id: uuidv4(), ...req.body, timestamp: new Date().toISOString() };
    const isBoycotted = boycottsData.boycotts.some(boycott => boycott.name.toLowerCase() === newFlow.name.toLowerCase());
    const taxAmount = calculateTaxAmount(newFlow, database.taxes);
    const utmiResult = calculateUtmi({ type: 'financial_flow', data: { amount: newFlow.amount, isBoycotted, taxAmount } }, { userCvnuValue: 0.5 });
    newFlow.tax_amount = taxAmount;
    newFlow.utmi_value = utmiResult.utmi;
    if (isBoycotted) {
        const tvaAmount = newFlow.amount * (database.taxes.find(t => t.id === 'tax_vat')?.rate || 0);
        try {
            await axios.post(`http://localhost:${port}/api/blockchain/recevoir-fonds`, { amount: tvaAmount }, { headers: { 'Content-Type': 'application/json' } });
            newFlow.blockchain_status = 'TVA_AFFECTEE';
        } catch (error) { newFlow.blockchain_status = 'ECHEC_AFFECTATION'; }
    }
    database.financial_flows.push(newFlow);
    await writeDatabaseFile();
    res.status(201).json(newFlow);
});
app.put('/api/financial-flows/:id', async (req, res) => {
    const index = database.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    database.financial_flows[index] = { ...database.financial_flows[index], ...req.body };
    await writeDatabaseFile();
    res.json(database.financial_flows[index]);
});
app.delete('/api/financial-flows/:id', async (req, res) => {
    const index = database.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    database.financial_flows.splice(index, 1);
    await writeDatabaseFile();
    res.status(204).end();
});
app.get('/api/affaires', (req, res) => res.json(database.affaires));
app.post('/api/affaires/event', async (req, res) => {
    const newEvent = { id: uuidv4(), ...req.body };
    database.affaires.chronology.push(newEvent);
    await writeDatabaseFile();
    res.status(201).json(newEvent);
});
app.get('/api/rics', (req, res) => res.json(ricsData));
app.post('/api/rics', async (req, res) => {
    const { question, description, deadline, voteMethod, level, locations } = req.body;
    const newRic = { id: uuidv4(), question, description, deadline, voteMethod, level, locations, votes_for: 0, votes_against: 0, status: 'active' };
    ricsData.push(newRic);
    await writeRicsFile();
    res.status(201).json(newRic);
});
app.put('/api/rics/:id', async (req, res) => {
    const ricId = req.params.id;
    const { votes_for, votes_against } = req.body;
    const ric = ricsData.find(r => r.id === ricId);
    if (!ric) { return res.status(404).json({ error: 'Référendum non trouvé.' }); }
    if (typeof votes_for !== 'undefined') { ric.votes_for = votes_for; }
    if (typeof votes_against !== 'undefined') { ric.votes_against = votes_against; }
    await writeRicsFile();
    res.status(200).json(ric);
});
app.get('/api/taxes', (req, res) => res.json(database.taxes));
app.post('/api/taxes', async (req, res) => {
    const newTax = { id: uuidv4(), ...req.body };
    database.taxes.push(newTax);
    await writeDatabaseFile();
    res.status(201).json(newTax);
});
app.get('/api/entities', (req, res) => res.json(database.entities));
app.get('/api/boycotts', (req, res) => res.json(database.boycotts));
app.post('/api/boycotts', async (req, res) => {
    const newEntity = { id: `ent_${Date.now()}`, ...req.body };
    database.boycotts.push(newEntity);
    await writeDatabaseFile();
    res.status(201).json(newEntity);
});
app.put('/api/boycotts/:id', async (req, res) => {
    const { id } = req.params;
    const updatedEntity = req.body;
    const index = database.boycotts.findIndex(e => e.id === id);
    if (index !== -1) { database.boycotts[index] = { ...database.boycotts[index], ...updatedEntity }; await writeDatabaseFile(); res.json(database.boycotts[index]); } else { res.status(404).json({ message: "Entité non trouvée" }); }
});
app.delete('/api/boycotts/:id', async (req, res) => {
    const { id } = req.params;
    const initialLength = database.boycotts.length;
    database.boycotts = database.boycotts.filter(m => m.id !== id);
    if (database.boycotts.length < initialLength) { await writeDatabaseFile(); res.status(204).send(); } else { res.status(404).json({ message: "Entité non trouvée" }); }
});
app.get('/api/caisse-manifestation', (req, res) => res.json(database.caisse_manifestation));
app.post('/api/caisse-manifestation/transaction', async (req, res) => {
    const { type, montant, description } = req.body;
    const newTransaction = { id: uuidv4(), type, montant, description, date: new Date().toISOString() };
    database.caisse_manifestation.transactions.push(newTransaction);
    database.caisse_manifestation.solde += (type === 'entrée' ? montant : -montant);
    await writeDatabaseFile();
    res.status(201).json(newTransaction);
});
app.post('/api/blockchain/transaction', async (req, res) => {
    const newBlock = { id: uuidv4(), ...req.body, hash: '...', signature: '...', timestamp: new Date().toISOString() };
    database.blockchain.transactions.push(newBlock);
    await writeDatabaseFile();
    res.status(201).json(newBlock);
});
app.get('/api/dashboard/summary', (req, res) => {
    try {
        const totalTransactions = database.financial_flows?.length ?? 0;
        const activeAlerts = database.financial_flows?.filter(f => f.is_suspicious)?.length ?? 0;
        const riskyEntities = new Set(database.boycotts?.map(b => b.name))?.size ?? 0;
        const caisseSolde = database.caisse_manifestation?.solde ?? 0;
        const boycottCount = database.boycotts?.length ?? 0;
        const ricCount = database.rics?.length ?? 0;
        const beneficiaryCount = database.beneficiaries?.length ?? 0;
        const monthlyAllocation = beneficiaryCount > 0 ? (caisseSolde / beneficiaryCount) : 0;
        const prefectureCount = database.prefectures?.length ?? 0;
        const telegramGroupCount = database.telegram_groups?.length ?? 0;
        const mairiesCount = database.mairies?.length ?? 0;
        const roundaboutCount = database.roundabout_points?.length ?? 0;
        const carrefourCount = database.boycotts?.filter(b => b.name === 'Carrefour')?.length ?? 0;
        const universityCount = database.strategic_locations?.filter(l => l.type === 'Université')?.length ?? 0;
        const bankCount = database.boycotts?.filter(b => b.type === 'Banque')?.length ?? 0;
        const tvaCommerceCount = database.boycotts?.filter(b => b.tax_id === 'tax_vat')?.length ?? 0;
        let estimatedManifestantCount = 0;
        if (database.manifestation_points) {
            database.manifestation_points.forEach(point => {
                if (typeof point.count === 'number') { estimatedManifestantCount += point.count; } else if (typeof point.count === 'string') { const numberMatch = point.count.match(/\d+/); if (numberMatch) { estimatedManifestantCount += parseInt(numberMatch[0]); } else if (point.count.toLowerCase().includes('plusieurs milliers')) { estimatedManifestantCount += 2000; } } else if (typeof point.count === 'object' && point.count !== null) { for (const key in point.count) { if (typeof point.count[key] === 'number') { estimatedManifestantCount += point.count[key]; } } }
            });
        }
        res.json({ totalTransactions, activeAlerts, riskyEntities, caisseSolde, boycottCount, ricCount, beneficiaryCount, monthlyAllocation, prefectureCount, telegramGroupCount, estimatedManifestantCount, mairiesCount, roundaboutCount, universityCount, carrefourCount, bankCount, tvaCommerceCount });
    } catch (error) { res.status(500).json({ error: 'Erreur lors de la génération du résumé.' }); }
});
app.post('/api/blockchain/recevoir-fonds', async (req, res) => {
    const { amount } = req.body;
    if (!amount) { return res.status(400).json({ error: 'Montant manquant.' }); }
    database.blockchain.transactions.push({ id: uuidv4(), type: 'recevoirFonds', amount: amount, timestamp: new Date().toISOString() });
    database.caisse_manifestation.solde += amount;
    await writeDatabaseFile();
    res.status(200).json({ message: `Fonds de ${amount}€ reçus avec succès sur le smart contract (simulé).` });
});
app.post('/api/blockchain/decaisser-allocations', async (req, res) => { res.status(200).json({ message: 'Décaissement des allocations en cours...' }); });
app.post('/api/beneficiaries/register', async (req, res) => {
    const { name, email, cv_score } = req.body;
    if (!name || !email || cv_score === undefined) { return res.status(400).json({ error: 'Données manquantes pour l\'inscription.' }); }
    const existingBeneficiary = database.beneficiaries.find(b => b.email === email);
    if (existingBeneficiary) { return res.status(409).json({ error: 'Cet email est déjà enregistré.' }); }
    const newBeneficiary = { id: uuidv4(), name, email, cv_score: cv_score, registration_date: new Date().toISOString() };
    database.beneficiaries.push(newBeneficiary);
    await writeDatabaseFile();
    res.status(201).json({ message: 'Citoyen enregistré avec succès.', beneficiary: newBeneficiary });
});
app.get('/api/camera-points', (req, res) => res.json(database.cameras_points));
app.post('/api/camera-points', async (req, res) => {
    const { name, city, lat, lon, timestamp, video_link } = req.body;
    if (!name || !city || !lat || !lon) { return res.status(400).json({ error: 'Données manquantes pour le point de caméra.' }); }
    const newCameraPoint = { id: uuidv4(), name, city, lat, lon, timestamp: timestamp || new Date().toISOString(), video_link: video_link || null };
    database.cameras_points.push(newCameraPoint);
    await writeDatabaseFile();
    res.status(201).json(newCameraPoint);
});
app.get('/api/missions', (req, res) => { res.json(database.missions); });

// 🛑 FONCTIONS UTILITAIRES ET ROUTES D'INTÉGRATION DYNAMIQUE (inchangé)
app.post('/api/data-integration/trigger-real-scraping', async (req, res) => {
    try {
        const numCollected = await runRealScrapingJob(); 
        const collectedData = await getMapDataFile(LIVE_DATA_TEMP_PATH);

        res.status(200).json({ 
            message: `Scraping des sources terminé. ${numCollected} nouveaux éléments bruts trouvés.`,
            count: numCollected,
            collectedData: collectedData
        });
    } catch (error) {
        console.error('Échec lors du déclenchement du job de scraping:', error);
        res.status(500).json({ error: `Erreur serveur lors de l'exécution du scraping: ${error.message}` });
    }
});


app.post('/api/data-integration/validate-and-integrate', async (req, res) => {
    try {
        const tempData = await getMapDataFile(LIVE_DATA_TEMP_PATH);
        const stableData = await getMapDataFile(MANIF_2_OCTOBRE_PATH);
        const newPoints = [];
        let enrichedPointsCount = 0;
        let lastIdNum = stableData.length > 0 
            ? parseInt(stableData[stableData.length - 1].id.split('-')[2]) 
            : 0;
        
        for (const item of tempData) {
            
            const existingIndex = stableData.findIndex(stableItem => 
                stableItem.name === item.name && stableItem.city === item.city
            );

            if (existingIndex !== -1) {
                const existingItem = stableData[existingIndex];
                let wasEnriched = false;
                
                if (item.video_link && !existingItem.video_link) {
                    existingItem.video_link = item.video_link;
                    existingItem.source = item.source;
                    wasEnriched = true;
                }
                
                if (item.count && (item.count > existingItem.count || existingItem.count === 0)) {
                    existingItem.count = item.count;
                    wasEnriched = true;
                }

                if (wasEnriched) {
                    stableData[existingIndex] = existingItem;
                    enrichedPointsCount++;
                }

            } else {
                
                if (!item.lat || !item.lon) {
                    item.lat = item.lat || 48.8566; 
                    item.lon = item.lon || 2.3522;
                }
                
                lastIdNum++;
                item.id = `manif-02-${lastIdNum.toString().padStart(3, '0')}`; 
                item.type = item.type || 'Rassemblement'; 
                item.source = item.source || 'Dynamique - Collecteur'; 

                if (item.name && item.city && item.lat && item.lon) {
                    newPoints.push(item);
                }
            }
        }
        
        if (newPoints.length > 0 || enrichedPointsCount > 0) {
            stableData.push(...newPoints);
            await writeMapDataFile(MANIF_2_OCTOBRE_PATH, stableData);
            
            const sourceConfig = await getMapDataFile(SOURCE_CONFIG_PATH);
            sourceConfig.general_settings.last_update = new Date().toISOString();
            await writeMapDataFile(SOURCE_CONFIG_PATH, sourceConfig);
        }

        res.status(200).json({ 
            message: `Opération réussie. ${newPoints.length} nouveaux points intégrés et ${enrichedPointsCount} points existants enrichis.`, 
            integratedPoints: newPoints,
            enrichedCount: enrichedPointsCount,
            totalPoints: stableData.length
        });

    } catch (error) {
        console.error('Échec de l\'intégration des données dynamiques:', error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'intégration des données.' });
    }
});

app.post('/api/data-integration/enrich-videos', async (req, res) => {
    try {
        const stableData = await getMapDataFile(MANIF_2_OCTOBRE_PATH);
        let enrichedCount = 0;
        
        const eventDate = "2 octobre"; 

        for (const item of stableData) {
            if (!item.video_link) {
                
                const foundVideoLink = searchVideoForPoint(item.city, item.name, eventDate);
                
                if (foundVideoLink) {
                    item.video_link = foundVideoLink;
                    item.source = item.source ? `${item.source} & Media Auto` : 'Media Auto';
                    enrichedCount++;
                }
            }
        }

        if (enrichedCount > 0) {
            await writeMapDataFile(MANIF_2_OCTOBRE_PATH, stableData);
            
            const sourceConfig = await getMapDataFile(SOURCE_CONFIG_PATH);
            sourceConfig.general_settings.last_video_enrichment = new Date().toISOString();
            await writeMapDataFile(SOURCE_CONFIG_PATH, sourceConfig);
        }

        res.status(200).json({ 
            message: `${enrichedCount} points de manifestation ont été enrichis avec des liens vidéo.`, 
            enrichedCount: enrichedCount,
            totalPoints: stableData.length
        });

    } catch (error) {
        console.error('Échec de l\'enrichissement vidéo dynamique:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la recherche et l\'intégration vidéo.' });
    }
});

app.get('/api/data-quality/video-summary', async (req, res) => {
    try {
        const stableData = await getMapDataFile(MANIF_2_OCTOBRE_PATH);
        const totalPoints = stableData.length;
        
        const missingVideos = stableData.filter(item => !item.video_link);
        const missingCount = missingVideos.length;
        
        const missingList = missingVideos.slice(0, 20).map(item => ({
            id: item.id,
            name: item.name,
            city: item.city
        }));

        res.status(200).json({
            totalPoints: totalPoints,
            missingCount: missingCount,
            percentageMissing: (missingCount / totalPoints) * 100,
            missingList: missingList
        });

    } catch (error) {
        console.error('Échec de la génération du bilan vidéo:', error);
        res.status(500).json({ error: 'Erreur serveur lors du bilan de qualité des données.' });
    }
});


// --- LANCEMENT DU SERVEUR ET DU BOT ---

authenticateEarthEngine()
    .then(() => {
        console.log('🌍 Earth Engine authentifié et initialisé.');
        return initializeDatabase();
    })
    .then(() => {
        // 🛑 CHARGEMENT CRITIQUE DES DONNÉES D'ACTIONS AVANT LE DÉMARRAGE DU SERVEUR
        return loadActionsData(); 
    })
    .then(() => {
        readRicsFile();
        loadBoycottData();
        loadChatHistoryFile();
        generateCategoryEmbeddings(); 
        
        telegramBot.launch();
        console.log('🤖 Bot Telegram démarré.');
        
        app.listen(port, () => {
            console.log(`🌐 Serveur d'enquête parlementaire démarré sur http://localhost:${port}`);
            console.log(`📚 Documentation API Swagger UI disponible sur http://localhost:${port}/api-docs`);
            console.log(`✅ Serveur web de développement démarré.`);
    if (!process.env.GROQ_API_KEY) {
        console.warn("⚠️ AVERTISSEMENT: La variable d'environnement GROQ_API_KEY n'est pas définie. Les appels Groq échoueront.");
    }
        });
    })
    .catch(err => {
        console.error('ERREUR FATALE AU DÉMARRAGE DU SERVEUR :', err.message);
        // 🛑 AFFICHER LA SOURCE DE L'ERREUR POUR LE DÉBOGAGE
        if (err.message.includes("JSON d'actions invalide")) {
             console.error("Veuillez corriger le fichier actions.json (syntaxe).");
        }
        process.exit(1); 
    });