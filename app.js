// Fichier : app.js (CONFIGURATEUR EXPRESS COMPLET ET MODULAIRE)

const express = require('express');
const path = require('path');
const cors = require('cors');
const sassMiddleware = require('node-sass-middleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
// Import des fonctions de service pour l'initialisation
const { initializeDatabase, loadActionsData, readRicsFile, loadBoycottData,loadChatHistoryFile, getDatabase } = require('./services/data.js');
const { generateCategoryEmbeddings } = require('./services/ai.js'); 
const dashboardRouter = require('./routes/dashboard.js'); // 👈 NOUVEL IMPORT
// --- 1. IMPORT DES ROUTEURS MODULAIRES ---
// Routeurs déjà existants (qui sont déjà modulaires)
const missionsRouter = require('./routes/quests.js');
const mapRouter = require('./routes/map-router.js');
const smartContractRouter = require('./routes/smartContract.js');
const cvnuRouter = require('./routes/cvnu.js');
const reformeRouter = require('./routes/reforme.js');
const reseauRouter = require('./routes/reseauRouter.js');
const journalRouter = require('./routes/journalRouter.js');
const democratieRouter = require('./routes/democratie.js');
const chronologyRouter = require('./routes/chronologyRouter.js');
const mediaRouter = require('./routes/mediaRouter.js'); 
const revendicationsRouter = require('./routes/revendicationsRouter.js');
const actionsRouter = require('./routes/actionsRouter.js');
const homeJournalRouter = require('./routes/homeJournalRouter.js');
// Routeurs récemment créés (extraits du monolithique)
const geeRouter = require('./services/gee.js').geeRouter;       // 🌍 GEE
const chatRouter = require('./routes/chat.js');               // 💬 Chatbot
const userRoutes = require('./routes/user-management.js');    // 🧑‍💻 CRUD Utilisateurs (/api/beneficiaries)
const dataFlowsRouter = require('./routes/data-flows.js');    // 💸 Flux financiers, RICS, Boycotts
const aiToolsRouter = require('./routes/ai-tools.js');        // 🤖 Outils IA (Classification, Génération)
const staticDataRouter = require('./routes/static-data.js');  // 📊 Données Statiques
const hqDataRouter = require('./routes/hq-data.js'); // 👈 NOUVEL IMPORT
const mapIntegrationRouter = require('./routes/map-integration.js'); // 👈 NOUVEL IMPORT


const app = express();

// --- 2. MIDDLEWARES EXPRESS ---
app.use(express.json());
app.use(cors());

// 🛑 CORRECTION SASS MIDDLEWARE
app.use(sassMiddleware({
    src: path.join(__dirname, 'docs', 'src', 'scss'),
    dest: path.join(__dirname, 'docs', 'src', 'css'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/src/css'
}));

app.use(express.static(path.join(__dirname, 'docs')));
app.use('/roles', express.static(path.join(__dirname, 'docs', 'roles')));

// --- 3. MONTAGE DES ROUTEURS MODULAIRES ET SPÉCIFIQUES ---

// A. Routeurs existants (montés sur des chemins spécifiques)
app.use('/missions', missionsRouter);
app.use('/journal', journalRouter);
app.use('/cvnu', cvnuRouter);
app.use('/map', mapRouter); // Note: mapRouter contient potentiellement des routes d'intégration.
app.use('/reforme', reformeRouter);
app.use('/smartContract', smartContractRouter);
app.use('/democratie', democratieRouter);
app.use('/reseau', reseauRouter);

// B. Routeurs pour l'API générale (/api/*)
app.use('/api', revendicationsRouter); 
app.use('/api/actions', actionsRouter);
app.use('/api/actions-data', actionsRouter); 
app.use('/api/plan_action', actionsRouter); 
app.use('/api/chronology', chronologyRouter);
app.use('/api/media', mediaRouter); 

// C. Routeurs nouvellement créés (Extrait du monolithique)
app.use('/api/gee', geeRouter);              // 🌍 GEE (ex: /api/gee/tiles/:id)
app.use('/api/chat', chatRouter);           // 💬 Chatbot (ex: /api/chat/message)
app.use('/api/beneficiaries', userRoutes);    // 🧑‍💻 Utilisateurs (ex: /api/beneficiaries/register)
app.use('/api', dataFlowsRouter);           // 💸 CRUD Financier, RICS (ex: /api/financial-flows, /api/rics)
app.use('/api', aiToolsRouter);             // 🤖 Outils IA (ex: /api/classify, /api/ai/generate-entity)
app.use('/api', staticDataRouter);          // 📊 Données Statiques (ex: /api/prefectures, /api/satellites)

// Montage des routeurs nouvellement créés
app.use('/api/dashboard', dashboardRouter); // 👈 Monte les routes /api/dashboard/*
app.use('/api/hq', hqDataRouter);            // 💡 Nouveau : Montage du routeur HQ Data (Tâche I2.2)
app.use('/api/operator', dashboardRouter);  // 👈 Monte les routes /api/operator/*
// 🛑 MONTAGE CONSOLIDÉ DES NOUVEAUX ROUTEURS (CORRIGÉ I2.1 et I2.2)

// Routes d'Intégration et de Qualité des Données
app.use('/api/data-integration', mapIntegrationRouter); // 👈 Monte les POSTs trigger-real-scraping & validate-and-integrate
app.use('/api/data-quality', mapIntegrationRouter);      // 👈 Monte le GET video-summary


// le routeur sur '/'. Ici, nous allons la monter spécifiquement pour plus de clarté:
app.use('/smartContract/api', dashboardRouter);

// Documentation Swagger (Logique inchangée)
const swaggerDocumentPath = path.join(__dirname, 'api-docs', 'swagger.yaml');
const swaggerDocument = YAML.load(swaggerDocumentPath);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// --- 4. FONCTION DE PRÉPARATION (Logique de lancement centralisée) ---

/**
 * Fonction qui gère toutes les initialisations de données et services (sauf GEE qui est géré dans serveur.js).
 */
async function startAppSetup() {
    console.log('⏳ Initialisation des données et services...');
    
    // Chargement de toutes les données de fichiers
    await initializeDatabase();
    await readRicsFile();
    await loadBoycottData();
    await loadChatHistoryFile();
    await loadActionsData(); 
    
    // Génération des embeddings IA (pour la classification)
    await generateCategoryEmbeddings(); 
    
    console.log('✅ Configuration initiale terminée.');
}


// --- 5. GESTION DES ERREURS CENTRALISÉE (OPTIONNELLE MAIS RECOMMANDÉE) ---
// Ce middleware doit être le dernier app.use pour capter les erreurs non gérées
/* app.use((err, req, res, next) => {
    console.error(`[ERREUR NON GÉRÉE] ${req.method} ${req.originalUrl}:`, err.stack);
    res.status(500).json({ error: 'Erreur interne du serveur. Veuillez vérifier les logs.' });
});
*/

// --- 6. EXPORT ---
module.exports = {
    app,
    startAppSetup
};