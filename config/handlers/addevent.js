// Fichier: bot/handlers/addevent.js

// On importe le cerveau des données. Attention au chemin relatif !
const dataService = require('../../services/dataService.js');

/**
 * Attache la commande /addevent au bot.
 * @param {Telegraf} bot - L'instance du bot Telegraf.
 */
module.exports = (bot) => {
    bot.command('addevent', async (ctx) => {
        // 1. Extraire la description de l'événement depuis le message de l'utilisateur
        // ex: "/addevent Rassemblement à 14h devant la mairie"
        const text = ctx.message.text.split(' ').slice(1).join(' ');

        // 2. Vérifier si l'utilisateur a bien fourni une description
        if (!text) {
            return ctx.reply('⚠️ Usage: /addevent [description complète de l\'événement]');
        }

        try {
            // 3. Préparer l'objet de données pour le nouvel événement
            const eventData = {
                description: text,
                lieu: "Défini via Telegram", // On peut mettre une valeur par défaut
                log: null,
                lat: null
            };

            // 4. Appeler notre service centralisé pour ajouter l'élément
            const newEvent = await dataService.addElement('evenements', eventData);

            // 5. Confirmer à l'utilisateur que l'opération a réussi
            await ctx.reply(`✅ Événement ajouté avec succès !\n\n*ID*: \`${newEvent.id}\`\n*Description*: ${newEvent.description}`, { parse_mode: 'Markdown' });

        } catch (error) {
            // 6. En cas d'erreur, informer l'utilisateur et logguer le problème
            console.error("💥 Erreur lors de l'exécution de /addevent:", error);
            await ctx.reply(`❌ Une erreur est survenue lors de l'ajout de l'événement.`);
        }
    });
};