// Fichier : bot/botManager.js

const { Telegraf } = require('telegraf');
const { botsConfig } = require('./bots.js');

// On charge dynamiquement tous les handlers disponibles
const handlers = {
    start: require('./handlers/start.js'),
    greve: require('./handlers/greve.js'),
    addevent: require('./handlers/addevent.js'), // Assurez-vous de créer ce fichier
    // ... requirez tous vos autres fichiers de handlers ici
};

const configuredBots = [];

function initializeBots() {
    console.log(`🤖 Initialisation de ${botsConfig.length} bot(s)...`);

    for (const config of botsConfig) {
        if (!config.token) {
            console.warn(`⚠️ Token manquant pour le bot '${config.name}'. Ce bot sera ignoré.`);
            continue;
        }

        const bot = new Telegraf(config.token);
        console.log(` > Bot '${config.name}' créé.`);

        // Attacher les handlers activés pour ce bot
        for (const commandName of config.enabledCommands) {
            if (handlers[commandName]) {
                handlers[commandName](bot); // On passe l'instance du bot au handler
                console.log(`   -> Commande '/${commandName}' attachée à '${config.name}'.`);
            }
        }
        
        configuredBots.push(bot);
    }
}

function launchAllBots() {
    if (configuredBots.length === 0) {
        initializeBots();
    }
    
    console.log(`🚀 Lancement de ${configuredBots.length} bot(s)...`);
    configuredBots.forEach(bot => bot.launch());
}

module.exports = { launchAllBots };