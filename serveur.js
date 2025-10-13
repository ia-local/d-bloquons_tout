// Fichier : serveur.js (CORRIGÉ - Montage GEE dans l'app)

const { app, startAppSetup } = require('./app.js'); 
const { authenticateEarthEngine, geeRouter } = require('./services/gee.js'); // 🛑 IMPORTATION DE geeRouter
const { PORT, GROQ_API_KEY } = require('./config/index.js');
const telegramBot = require('./routes/telegramRouter.js'); 
const mapLeaflet = require('./config/leaflet.js'); 
const { loadActionsData } = require('./services/data.js'); 
const aiRouter = require('./routes/aiRouter.js'); 
// --- Fonction d'initialisation (Bootstrap) ---

async function bootstrap() {
    try {
        // 1. Authentification Earth Engine (Première étape critique)
        await authenticateEarthEngine();
        console.log('🌍 Earth Engine authentifié et initialisé.');
        
        // 🛑 MONTAGE DE LA ROUTE GEE (Si le montage n'est pas fait dans app.js)
        app.use('/api/gee', geeRouter); // Assurez-vous que votre objet 'app' est bien Express
        console.log('🌐 Route Google Earth Engine (/api/gee) montée.');

        // 2. Chargement des données (Base de données, Actions, Embeddings)
        await startAppSetup(); 
        
        // 3. Lancement du Bot
        telegramBot.launch();
        console.log('🤖 Bot Telegram démarré.');
        
        // 4. Lancement du Serveur Express
        app.listen(PORT, () => {
            console.log(`🌐 Serveur d'enquête parlementaire démarré sur http://localhost:${PORT}`);
            console.log(`📚 Documentation API Swagger UI disponible sur http://localhost:${PORT}/api-docs`);
            
            if (!GROQ_API_KEY) {
                console.warn("⚠️ AVERTISSEMENT: La variable GROQ_API_KEY n'est pas définie. Les appels Groq échoueront.");
            }
        });
        
    } catch (err) {
        console.error('ERREUR FATALE AU DÉMARRAGE DU SERVEUR :', err.message);
        if (err.message.includes("GEE Private Key n'a pas été chargée")) {
             console.error("Veuillez vérifier le fichier private-key.json.");
        }
        process.exit(1); 
    }
}

bootstrap();