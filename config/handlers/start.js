// Fichier : bot/handlers/start.js
const { Markup } = require('telegraf');

module.exports = (bot) => {
    bot.start(async (ctx) => {
        // ... (copiez-collez ici TOUTE la logique de votre `bot.start()`)
        const welcomeMessage = `Bonjour ! Je suis ${bot.botInfo.first_name}. Comment puis-je vous aider ?`;
        const webAppButton = Markup.button.webApp('🌐 Ouvrir l\'Application', 'https://t.me/Pi_ia_Pibot/Manifest_910');
        await ctx.reply(welcomeMessage, Markup.inlineKeyboard([webAppButton]));
    });
};