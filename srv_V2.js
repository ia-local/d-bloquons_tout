// Fichier : serveur.js (NETTOYÉ ET FINALISÉ)

const { app, startAppSetup } = require('./app'); 
const { authenticateEarthEngine } = require('./services/gee'); 
const { PORT, GROQ_API_KEY } = require('./config');
const telegramBot = require('./routes/telegramRouter.js'); 
const { loadActionsData } = require('./services/data'); // Assurez-vous d'exporter loadActionsData depuis services/data.js

// --- Fonction d'initialisation (Bootstrap) ---

async function bootstrap() {
    try {
        // 1. Authentification Earth Engine (Première étape critique)
        await authenticateEarthEngine();
        console.log('🌍 Earth Engine authentifié et initialisé.');

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
        // 🛑 Afficher la source de l'erreur pour le débogage (si pertinente)
        if (err.message.includes("GEE Private Key n'a pas été chargée")) {
             console.error("Veuillez vérifier le fichier private-key.json.");
        }
        process.exit(1); 
    }
}

bootstrap();