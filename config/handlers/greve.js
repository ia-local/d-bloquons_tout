// Fichier : bot/handlers/greve.js
const dataService = require('../../services/dataService.js'); // Attention au chemin relatif !

async function getManifestationInfo() {
    // ... (copiez-collez votre fonction getManifestationInfo ici)
    const data = await dataService.getAllData();
    return `📢 **Infos :** ${data.manifestation.date} - ${data.manifestation.objectifs}`;
}

module.exports = (bot) => {
    bot.command('greve', async (ctx) => {
        const info = await getManifestationInfo();
        await ctx.replyWithMarkdown(info);
    });
};