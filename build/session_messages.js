// Ce script lit les commandes depuis telegramRouter.js et génère un fichier pour le frontend.
const fs = require('fs').promises;
const path = require('path');

// On importe UNIQUEMENT les données exportées de notre routeur
const { commands, topicLinks } = require('../routes/telegramRouter.js');

async function build() {
    console.log("Génération du fichier de données Telegram pour le frontend...");

    const content = `
// ATTENTION: Ce fichier est auto-généré par 'make build-js'. NE PAS MODIFIER MANUELLEMENT.
// Source des données : /routes/telegramRouter.js

window.TELEGRAM_DATA = {
    topicLinks: ${JSON.stringify(topicLinks, null, 4)},
    commands: ${JSON.stringify(commands, null, 4)}
};
`;

    const outputPath = path.join(__dirname, '..', 'docs', 'src', 'js', 'telegramData.js');
    await fs.writeFile(outputPath, content.trim());
    console.log(`✅ Fichier de données écrit avec succès dans ${outputPath}`);
}

build().catch(err => {
    console.error("❌ Erreur lors de la génération du fichier de données :", err);
    process.exit(1);
});