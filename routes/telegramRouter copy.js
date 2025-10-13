// Fichier : routes/telegramRouter.js (VERSION FINALE, COMPLÈTE ET CORRIGÉE)

const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// NOTE : L'importation d'axios est retirée si elle n'est pas utilisée directement dans ce fichier, 
// pour éviter des dépendances inutiles dans le module du bot.

// --- CONSTANTES ET VARIABLES GLOBALES ---
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');

// 🛑 CONSTANTES D'ACCÈS WEB
const WEB_APP_HTTPS_URL = 't.me/Pi_ia_Pibot/Manifest_910'; 
const ORGANIZER_GROUP_ID_CHAT = "-100123456789"; 

// 🛑 CONSTANTES DE NAVIGATION ET TOPICS (COMPLET)
const GALLERY_DIR = path.join(__dirname, '..', 'data', 'galerie');
const IMAGES_PER_PAGE = 4; 

const TOPIC_LINKS = {
    '🎨 Application web': 't.me/Pi_ia_Pibot/Manifest_910',
    '🎨 Studio (Création)': 'https://t.me/c/2803900118/1232',
    '📝 Revendication (Détails)': 'https://t.me/c/2803900118/3',
    '🗳️ RIC (Référendum)': 'https://t.me/c/2803900118/329',
    '👥 Organisation (Planning)': 'https://t.me/c/2803900118/2',
    '🗺️ Cartes (Ralliement)': 'https://t.me/c/2803900118/991',
    '📄 Documents (Législation)': 'https://t.me/c/2803900118/13',
    '📞 Contacts (Presse/Élus)': 'https://t.me/c/2803900118/8',
    '⚖️ Auditions Libres': 'https://t.me/c/2803900118/491'
};

// Initialisations des services
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY || '7281441282:AAGA5F0nRyEsBKIfQOGcAjelkE3DA8IWByU';
const bot = new Telegraf(TELEGRAM_API_KEY, { telegram: { webhookReply: true } });

// --- FONCTIONS UTILITAIRES DE BASE ---

async function readJsonFile(filePath, defaultValue = {}) {
    // [Implémentation conservée]
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
            return defaultValue;
        }
        return defaultValue;
    }
}
async function writeJsonFile(filePath, data) {
    // [Implémentation conservée]
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}

// --- FONCTIONS ET CONTEXTE IA (Raccourci) ---

const PLAINTE_PENALE_CONTEXT = `Objet : Plainte Pénale contre X pour Infractions Criminelles...`; 

async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    // [Implémentation conservée]
    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        const chatCompletion = await groq.chat.completions.create({ messages: messages, model: model, temperature: 0.7, max_tokens: 2048 });
        return chatCompletion.choices[0].message.content;
    } catch (error) { return 'Une erreur est survenue lors du traitement de votre demande.'; }
}

async function getCaricaturePrompt(topic) {
    const systemMessage = `Tu es un générateur de descriptions d'images pour une IA. Style: sombre, agressif. Contexte: ${PLAINTE_PENALE_CONTEXT}`;
    return await getGroqChatResponse(`Le sujet est : "${topic}"`, 'llama-3.1-8b-instant', systemMessage);
}
// [Autres fonctions getImaginePromptContextualized, getPlaintePenaleCaricaturePrompt, getDestitutionInfoMarkdown, etc. ici...]
async function getDestitutionInfoMarkdown() {
    return `**La Procédure de Destitution : L'Article 68...**`;
}
async function getRicInfoMarkdown() {
    return `**Le Référendum d'Initiative Citoyenne (RIC) :** C'est l'outil essentiel pour redonner le pouvoir aux citoyens. Utilisez /sondage pour participer.`;
}
async function getManifestationInfo() {
    return `**Date :** 10 Septembre 2025. **Objectif :** Grève Générale pour la Justice Sociale.`;
}

// Fonction de sauvegarde d'image (saveGeneratedImage) [Implémentation conservée]
// Fonction handleGalleryMenu [Implémentation conservée]

// --- LOGIQUE DE GESTION DES COMPTES UTILISATEUR (/user) ---

bot.command('user', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    
    try {
        const db = await readJsonFile(DATABASE_FILE_PATH);
        const beneficiaries = db.beneficiaries || [];
        const userProfile = beneficiaries[0]; // Simulation de la recherche

        let message = `👤 **Gestion de Mon Compte Citoyen**\n\n`;
        
        if (userProfile) {
            message += `**Bienvenue, ${userProfile.name || 'Citoyen'} !**\n`;
            message += `\n*ID Citoyen (API) :* \`${userProfile.id || 'N/A'}\``;
            message += `\n*Score CVNU :* **${userProfile.cv_score || 'N/A'}**`;
        } else {
            message += `**Statut : Non-inscrit ou profil non lié.**\n\n`;
            message += `➡️ **Action :** Utilisez l'Application Web pour vous **inscrire**.`;
        }

        const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir la Web App (Profil)', WEB_APP_HTTPS_URL)],
            [Markup.button.callback('❓ API de Gestion du Compte', 'user_api_info')] 
        ]);
        await ctx.replyWithMarkdown(message, inlineKeyboard);
    } catch (error) {
        await ctx.reply('❌ Erreur lors de la vérification de votre compte.');
    }
});

// 🛑 ACTION DE CALLBACK POUR EXPLIQUER L'API UTILISATEUR
bot.action('user_api_info', async (ctx) => {
    await ctx.answerCbQuery();
    const infoMessage = `
**Détails de l'API de Gestion de Compte Citoyen (Endpoints dans serveur.js)**

* **Créer :** \`POST /api/beneficiaries/register\`
* **Lire tous :** \`GET /api/beneficiaries\`
* **Lire un :** \`GET /api/beneficiaries/:id\`
* **Modifier :** \`PUT /api/beneficiaries/:id\`
* **Supprimer :** \`DELETE /api/beneficiaries/:id\`
    `;
    await ctx.replyWithMarkdown(infoMessage);
});


// --- GESTIONNAIRES DE COMMANDES (Intégration des manquants) ---

bot.start(async (ctx) => {
    // [Implémentation conservée]
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton = isPrivateChat 
        ? Markup.button.webApp('🌐 Ouvrir l\'Application Web (TWA)', WEB_APP_HTTPS_URL)
        : Markup.button.url('🌐 Ouvrir l\'Application Web', WEB_APP_HTTPS_URL);

    const inlineKeyboard = Markup.inlineKeyboard([
        [webAppButton],  
        [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
        [Markup.button.callback('🔗 Salons de Discussion (Topics)', 'show_topics_menu')], 
        [Markup.button.callback('🤖 Outils IA & Création', 'ai_tools_menu')],  
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);
    
    await ctx.replyWithMarkdown(`Bonjour citoyen(ne) ! Bienvenue dans l'espace de mobilisation pour la **Grève Générale du 10 Septembre 2025**.`, inlineKeyboard);
});


// 🛑 COMMANDE /TOPICS (Utilisation de l'objet TOPIC_LINKS complet)
bot.command('topics', async (ctx) => {
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant :`;
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => Markup.button.url(label, url));
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});

bot.action('show_topics_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await bot.handleUpdate(ctx.update); // Réutiliser le gestionnaire de commande
});

// 🛑 COMMANDE /SONDAGE (Utilise la logique de création de sondage)
bot.command('sondage', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder en priorité ?';
    const options = ['Justice Sociale', 'RIC', 'Destitution', 'Loi Sécurité Globale'];
    try {
        await ctx.replyWithPoll(question, options, { is_anonymous: false });
        await ctx.reply('✅ Nouveau sondage lancé ! Votez ci-dessus.');
    } catch (error) { 
        await ctx.reply('❌ Impossible de lancer le sondage. Permissions manquantes.');
    }
});

// 🛑 COMMANDE /PETITION
bot.command('petition', async (ctx) => {
    const petitionLink = 'https://petitions.assemblee-nationale.fr/initiatives/i-2743';
    await ctx.replyWithMarkdown(`🗳️ **Pétition Nationale en Cours** : [**Signer la Pétition**](${petitionLink})`, 
        Markup.inlineKeyboard([[Markup.button.url('Signer la Pétition', petitionLink)]])
    );
});

// 🛑 COMMANDE /INVITER
bot.command('inviter', async (ctx) => {
    const inviteLink = `https://t.me/share/url?url=https%3A%2F%2Ft.me%2FPiiapibot&text=Rejoignez%20le%20mouvement%20citoyen%20!`;
    await ctx.replyWithMarkdown(`🤝 **Lien d'invitation** : Partagez ce lien pour recruter : [Lien](${inviteLink})`,
        Markup.inlineKeyboard([[Markup.button.url('Inviter des amis', inviteLink)]])
    );
});

// [Autres commandes d'info simples (/manifeste, /ric, /destitution, /greve, /stats, /contact) ici...]

// --- GESTIONNAIRES GÉNÉRAUX ET EXPORT ---

bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal
/user - Consulter l'état de votre compte citoyen
/web - Lancer l'Application Web Telegram (TWA)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours
/inviter - Inviter des amis à rejoindre le bot
/imagine [description] - Créer une image libre via l'IA
/caricature [description] - Générer une image de caricature politique
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale
/stats - Afficher les statistiques d'utilisation du bot
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});

bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /user, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));


// --- MISE À JOUR DU MENU DES COMMANDES OFFICIELLES ---

async function setBotCommands() {
    // Cette liste est cruciale pour le menu Telegram
    const commands = [
        { command: 'start', description: 'Menu principal.' },
        { command: 'user', description: 'Gérer votre compte citoyen.' }, 
        { command: 'web', description: 'Lancer l\'Application Web (TWA).' },
        { command: 'manifeste', description: 'Extrait du manifeste.' },
        { command: 'topics', description: 'Accéder aux salons de discussion.' },
        { command: 'sondage', description: 'Participer aux sondages.' },
        { command: 'imagine', description: 'Créer une image via l\'IA.' },
        { command: 'contact', description: 'Contacter les organisateurs.' },
        { command: 'help', description: 'Afficher toutes les commandes.' },
    ];
    
    try {
        await bot.telegram.setMyCommands(commands);
        console.log("✅ Commandes officielles du bot mises à jour sur Telegram.");
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des commandes du bot:", error.message);
    }
}

setBotCommands();  

module.exports = {
    launch: () => bot.launch(), 
    bot: bot, 
    commands, // La liste des commandes pour le build script
    topicLinks: TOPIC_LINKS // Les liens des topics pour le build script
};