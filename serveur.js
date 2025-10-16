// Fichier : serveur.js (CORRIGÉ - Montage GEE dans l'app et Rendu ASCII)

const { app, startAppSetup } = require('./app.js'); 
const { authenticateEarthEngine, geeRouter } = require('./services/gee.js');
const { PORT, GROQ_API_KEY } = require('./config/index.js');
const telegramBot = require('./routes/telegramRouter.js'); 
const mapLeaflet = require('./config/leaflet.js'); 
const { loadActionsData } = require('./services/data.js'); 
const aiRouter = require('./routes/aiRouter.js'); 

// 🛑 IMPORTATION DU MODULE ASCII (Assurez-vous que le chemin est correct)
const { TENSOR_BORDERS: T, TENSOR_JOINTS: J } = require('./config/moduleAscii.js'); 

// --- Fonction utilitaire de rendu ASCII pour le démarrage ---
function drawServerStatusFrame(port, botStatus, groqKeyPresent) {
    const width = 75; // Largeur du cadre
    const hLine = T.LINE_HORIZONTAL.repeat(width - 2);

    let output = '';
    
    // Top Border (╔═════════════════════╗)
    output += `${T.CORNER_TOP_LEFT}${hLine}${T.CORNER_TOP_RIGHT}\n`;
    
    // Title Line
    output += `${T.LINE_VERTICAL} 🚀 MANIFEST 910 - SERVICE STATUS (localhost) `.padEnd(width) + T.LINE_VERTICAL + '\n';
    
    // Separator (╠═════════════════════╣)
    output += `${J.JOINT_LEFT_DOUBLE}${hLine}${J.JOINT_RIGHT_DOUBLE}\n`;
    
    // Status Lines
    output += `${T.LINE_VERTICAL} 🌐 EXPRESS SERVER: http://localhost:${port} `.padEnd(width) + T.LINE_VERTICAL + '\n';
    output += `${T.LINE_VERTICAL} 📚 SWAGGER DOCS: http://localhost:${port}/api-docs `.padEnd(width) + T.LINE_VERTICAL + '\n';
    output += `${T.LINE_VERTICAL} 🤖 TELEGRAM BOT: ${botStatus} `.padEnd(width) + T.LINE_VERTICAL + '\n';
    output += `${T.LINE_VERTICAL} 🌍 EARTH ENGINE: ACTIF `.padEnd(width) + T.LINE_VERTICAL + '\n';

    // Warning Line
    if (!groqKeyPresent) {
        output += `${T.LINE_VERTICAL} ⚠️ AVERTISSEMENT: GROQ_API_KEY manquant. Les appels IA échoueront. `.padEnd(width) + T.LINE_VERTICAL + '\n';
    }
    
    // Bottom Border (╚═════════════════════╝)
    output += `${T.CORNER_BOTTOM_LEFT}${hLine}${T.CORNER_BOTTOM_RIGHT}`;
    
    return output;
}

// --- Fonction d'initialisation (Bootstrap) ---
async function bootstrap() {
    try {
        // 1. Authentification Earth Engine
        await authenticateEarthEngine();
        
        // 🛑 MONTAGE DE LA ROUTE GEE 
        app.use('/api/gee', geeRouter); 

        // 2. Chargement des données 
        await startAppSetup(); 
        
        // 3. Lancement du Bot
        telegramBot.launch();
        const botStatus = 'ACTIF'; 
        
        // 4. Lancement du Serveur Express
        app.listen(PORT, () => {
            const groqPresent = !!GROQ_API_KEY;
            
            // 🛑 REMPLACEMENT DES LOGS PAR L'AFFICHAGE ASCII
            const statusFrame = drawServerStatusFrame(PORT, botStatus, groqPresent);
            console.log('\n' + statusFrame + '\n');
            
        });
        
    } catch (err) {
        console.error('\n' + '╔═════════════════════════════════════════════╗');
        console.error('║ ERREUR FATALE AU DÉMARRAGE DU SERVEUR :       ║');
        console.error('╠═════════════════════════════════════════════╣');
        console.error(`║ Message: ${err.message}`.padEnd(54) + '║');
        if (err.message.includes("GEE Private Key n'a pas été chargée")) {
             console.error("║ Veuillez vérifier le fichier private-key.json.".padEnd(54) + '║');
        }
        console.error('╚═════════════════════════════════════════════╝');
        process.exit(1); 
    }
}

bootstrap();