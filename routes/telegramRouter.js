// Fichier : routes/telegramRouter.js (VERSION AVEC MANIFESTE DÉTAILLÉ)

const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataService = require('../services/dataService.js'); // 👈 AJOUTEZ CETTE LIGNE

const axios = require('axios'); // Nécessaire pour la commande /user

// --- CONSTANTES ET VARIABLES GLOBALES ---
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');

// 🛑 CONSTANTES D'ACCÈS WEB (CORRIGÉES et consolidées)
const GIT_APP_HTTPS_URL = 'https://ia-local.github.io/d-bloquons_tout/'; // URL HTTPS pour lien simple
const WEB_APP_TWA_URL = 'https://t.me/Pi_ia_Pibot/Manifest_910'; // URL TWA (pour Markup.button.webApp)
const WEB_APP_URL = 'https://ia-local.github.io/d-bloquons_tout/'; // URL Web simple pour le bouton URL

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/beneficiaries'; // Endpoint de l'API Citoyen
const API_CAISSE_URL = process.env.API_CAISSE_URL || 'http://localhost:3000/api/caisse-manifestation'; // Endpoint de l'API Caisse (Ajouté à l'étape précédente)
const ORGANIZER_GROUP_ID_CHAT = process.env.ORGANIZER_GROUP_ID_CHAT || "-100123456789"; // ID de chat d'organisateurs

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY || '7281441282:AAGA5F0nRyEsBKIfQOGcAjelkE3DA8IWByU';

// 🛑 CONSTANTES DE NAVIGATION ET DE PAGINATION
const GALLERY_DIR = path.join(__dirname, '..', 'data', 'galerie');
const IMAGES_PER_PAGE = 4; // Affichage de 4 images par page dans le diaporama

const TOPIC_LINKS = {
    '🎨 Application web': 'https://t.me/Pi_ia_Pibot/Manifest_910',
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
const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const bot = new Telegraf(TELEGRAM_API_KEY, {
    telegram: { webhookReply: true }
});
let database = {};
let commands = [];
// --- FONCTIONS UTILITAIRES DE BASE ---
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
            return defaultValue;
        }
        console.error(`Erreur de lecture du fichier ${filePath}:`, error);
        return defaultValue;
    }
}
async function writeJsonFile(filePath, data) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur d'écriture du fichier ${filePath}:`, error);
    }
}
async function saveGeneratedImage(imageDataBase64, type) {
    try {
        await fs.mkdir(GALLERY_DIR, { recursive: true });
        const fileName = `${type}_${Date.now()}.webp`;
        const filePath = path.join(GALLERY_DIR, fileName);
        const imageBuffer = Buffer.from(imageDataBase64, 'base64');
        await fs.writeFile(filePath, imageBuffer);
        console.log(`🖼️ Image sauvegardée : ${filePath}`);
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde de l'image dans la galerie:`, error);
    }
}
async function getGroqChatResponse(promptInput, model, systemMessageContent) {
    try {
        const messages = [];
        if (systemMessageContent) { messages.push({ role: 'system', content: systemMessageContent }); }
        messages.push({ role: 'user', content: promptInput });
        const chatCompletion = await groq.chat.completions.create({ messages: messages, model: model, temperature: 0.7, max_tokens: 2048 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur lors de la génération de la réponse IA (Groq model: ${model}):`, error);
        return 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.';
    }
}

// 🛑 NOUVELLE FONCTION : DÉTAIL DU MANIFESTE (I1.1)
async function getManifesteMarkdown() {
    return `📜 **Manifeste 910-2025 : Plateforme Citoyenne de Mobilisation**
\nNotre mouvement est une plateforme citoyenne pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale**.
\n### 🎯 Nos Objectifs Clés :
\n* **Boycottage Économique :** Mobiliser numériquement pour un boycottage massif des grandes enseignes (Leclerc, Carrefour, Lidl, Intermarché, etc.).
\n* **Caisse de Soutien :** Financer une caisse de manifestation où 100% des fonds seront réinjectés dans les revenus des citoyens (objectif : +500€ à +5000€).
\n* **Réforme Économique :** Démontrer l'illégalité des politiques économiques actuelles via un modèle d'économie circulaire.
\n* **Réforme Politique (RIC) :** Promouvoir le Référendum d'Initiative Citoyenne (RIC) pour la Justice Climatique, Sociale et une nouvelle procédure de Destitution (Art. 68).
\n\nUtilisez la commande /greve pour les détails pratiques de la mobilisation.`;
}

async function getDestitutionInfoMarkdown() {
    return `**La Procédure de Destitution : L'Article 68 de la Constitution**
\nL'Article 68 de la Constitution française prévoit la possibilité de destituer le Président de la République en cas de manquement à ses devoirs manifestement incompatible avec l'exercice de son mandat.
\n https://petitions.assemblee-nationale.fr/initiatives/i-2743
\n\nNotre mouvement demande une application rigoureuse et transparente de cet article, et la mise en place de mécanismes citoyens pour initier et suivre cette procédure.
\nPour le moment, nous recueillons les avis et les soutiens via des sondages et des discussions au sein du bot.
`;
}
async function getRicInfoMarkdown() {
    return `**Le Référendum d'Initiative Citoyenne (RIC) : Le Cœur de notre Démocratie !**
Le RIC est l'outil essentiel pour redonner le pouvoir aux citoyens. Il se décline en plusieurs formes :
\n* **RIC Législatif :** Proposer et voter des lois.
\n* **RIC Abrogatoire :** Annuler une loi existante.
\n* **RIC Constituant :** Modifier la Constitution.
\n* **RIC Révocatoire :** Destituer un élu.
\n\nC'est la garantie que notre voix sera directement entendue et respectée.
\nNous organisons des sondages réguliers et des débats au sein du bot pour recueillir votre opinion et votre soutien sur le RIC. Utilisez la commande /sondage pour participer !
`;
}
async function getManifestationInfo() {
  try {
    const data = await dataService.getAllData();
    const infoManif = data.manifestation;

    return `📢 **Infos sur la manifestation :**\n\n` +
                  `**🗓️ Date :** ${infoManif.date}\n` +
                  `**📍 Lieu :** ${infoManif.lieu}\n` +
                  `**🎯 Objectif :** ${infoManif.objectifs}`;
  } catch (error) {
    console.error("Erreur pour récupérer les infos de la manif via le service:", error);
    return "Impossible de récupérer les informations sur la manifestation pour le moment.";
  }
}

// 🛑 FONCTION RÉCUPÉRATION DES STATISTIQUES DE LA CAISSE (I1.2)
async function getTreasuryStats() {
    try {
        const response = await axios.get(API_CAISSE_URL); 
        const caisseStats = response.data;

        if (!caisseStats || typeof caisseStats.solde === 'undefined') {
            return "⚠️ Le format des données de la caisse est invalide. Vérifiez le serveur API.";
        }
        
        const objectif = caisseStats.objectif || 500000;
        const progression = ((caisseStats.solde / objectif) * 100).toFixed(2);
        const soldeFormatted = caisseStats.solde.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
        const objectifFormatted = objectif.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
        
        return `💰 **Statut de la Caisse de Manifestation**\n\n` +
               `**Solde Actuel :** ${soldeFormatted}\n` +
               `**Objectif :** ${objectifFormatted}\n` +
               `**Progression :** ${progression}%\n` +
               `**Contributeurs :** ${caisseStats.contributeurs?.toLocaleString('fr-FR') || 'N/A'}\n\n` +
               `*100% des fonds seront réinjectés dans les revenus des citoyens après la grève.*`;
    } catch (error) {
        console.error("Erreur lors de la récupération des stats de la caisse:", error.message);
        return "❌ Impossible de contacter l'API de la caisse. Vérifiez le serveur Express.";
    }
}

// Exemple de commande CREATE
bot.command('addevent', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
        return ctx.reply('Usage: /addevent [description de event 910 ]');
    }

    try {
        const eventData = {
            description: text,
            lieu: "Via Telegram",
            log: null,
            lat: null
        };
        const newEvent = await dataService.addElement('evenements', eventData);
        ctx.reply(`✅ Événement ajouté avec succès !\nID: ${newEvent.id}`);
    } catch (error) {
        console.error(error);
        ctx.reply(`❌ Erreur lors de l'ajout de l'événement : ${error.message}`);
    }
});
// --- CONTEXTES ET PROMPTS IA ---
const PLAINTE_PENALE_CONTEXT = `
Objet : Plainte Pénale contre X (Fonctionnaires d'État et Responsables Politiques) pour Infractions Criminelles et Abus d'Autorité (2017–2025).
Chefs d'Accusation : Détournement de Fonds Publics/Privés, Prise Illégale d'Intérêt, Fraude aux Comptes de Campagne, Escroquerie, et Concertation Répression.
Mécanisme : Ruine économique ciblée (7 ans de privation financière) sous façade, masquant enrichissement illégal et Évasion Fiscale.
Contexte Criminel Aggravant : Abus lié au projet "Accord de Paris" utilisé comme arme de géo-ingénierie, financé par Détournement de Fonds. Accusation de Crime contre l'Humanité.
Exigences : Ouverture d'une Enquête pénale, Composition Pénale, Destitution, Réparation Intégrale.
`;

async function getCaricaturePrompt(topic) {
    const systemMessage = `
Tu es un générateur de descriptions d'images pour une IA. Tu dois créer une description de caricature politique SATIRIQUE ET AGRESSIVE, en liant le sujet donné par l'utilisateur (Topic) au CONTEXTE de la PLAINTE PÉNALE ci-dessous.
Règles de Style : Style sombre, très contrasté (type gravure ou dessin de presse), noir et blanc avec des touches de rouge sang.
CONTEXTE DE RÉFÉRENCE:
---
${PLAINTE_PENALE_CONTEXT}
---
Ta réponse doit être UNIQUEMENT la description de l'image (maximum 300 mots). Elle doit fusionner le 'Topic' avec les symboles visuels de la plainte (argent détourné, tampons de répression, justice brisée, chemtrails).
`;
    const prompt = `Le sujet de l'utilisateur ou le texte de référence à caricaturer est : "${topic}".`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }], model: 'llama-3.1-8b-instant', temperature: 0.8 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur Groq pour le prompt de caricature (contextualisé):`, error);
        return `Caricature politique, sombre et contrastée (noir et blanc avec touches de rouge) représentant le sujet : "${topic}". Inclure des symboles de corruption, d'argent détourné, et de justice bafouée.`;
    }
}

async function getImaginePromptContextualized(topic) {
    const systemMessage = `
Tu es un générateur de descriptions d'images pour une IA. Ton rôle est d'interpréter le sujet donné par l'utilisateur (Topic) et de créer une image VISUELLEMENT FORTE ET SYMBOLIQUE.
Utilise le CONTEXTE de la PLAINTE PÉNALE ci-dessous pour rendre l'image politiquement pertinente et profonde.
Règles de Style : Style photoréaliste ou cinématographique, symbolique, focalisé sur la justice, la démocratie, ou la résistance citoyenne. Pas de satire agressive forcée.
CONTEXTE DE RÉFÉRENCE:
---
${PLAINTE_PENALE_CONTEXT}
---
Ta réponse doit être UNIQUEMENT la description de l'image (maximum 300 mots). Elle doit lier le 'Topic' à la thématique de la lutte contre la corruption ou pour la justice sociale.
`;
    const prompt = `Le sujet de l'utilisateur ou le texte de référence à visualiser est : "${topic}".`;
    try {
        const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }], model: 'llama-3.1-8b-instant', temperature: 0.8 });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur Groq pour le prompt /imagine (contextualisé):`, error);
        return `Image symbolique et percutante basée sur le sujet : "${topic}". Représente une scène de résistance citoyenne et d'exigence de justice, dans un style réaliste et fort.`;
    }
}
function getPlaintePenaleCaricaturePrompt() {
    return `Caricature dystopique et très agressive de satire politique, style gravure expressionniste, noir et blanc avec des touches de rouge sang et de vert bilieux.
    
    Représente des **fonctionnaires d'État (silhouettes sombres portant des costumes de luxe)**, masqués ou anonymes, qui sont assis sur une **pile de liasses de billets et de sacs d'argent volé (Détournement de Fonds Publics)**.
    
    Ces figures sont en train de **signer des ordres de Répression (tampons judiciaires/policiers)**, et l'un d'eux tient une **Ordonnance de Protection déchirée et ensanglantée** symbolisant l'Acharnement Judiciaire (2017-2025).
    
    En arrière-plan, le **Palais de Justice s'effondre**, et des nuages aux formes chimiques (chemtrails) s'échappent d'un **logo "Accord de Paris" déformé**, symbolisant la géo-ingénierie, le **Crime contre l'Humanité** et les Actes mettant la vie d'autrui en danger.
    
    Le titre visible sur le mur délabré est : **"RÉPARATION INTÉGRALE"** avec le mot **"JUSTICE"** brisé au sol.`;
}


// --- LOGIQUE SPÉCIFIQUE (Galerie, Topics) ---

/**
 * 🛑 FONCTION RÉUTILISABLE pour la galerie d'images.
 */
async function handleGalleryMenu(ctx) {
    const isCallback = ctx.callbackQuery !== undefined;

    if (isCallback) {
        await ctx.answerCbQuery();
    }

    try {
        const files = await fs.readdir(GALLERY_DIR);
        const imageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
        const totalCount = imageFiles.length;

        let statsMessage = `📂 **Galerie et Archives**\n\n`;
        statsMessage += `Total d'images créées : **${totalCount}**`;

        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('🖼️ Tout', 'view_gallery_page:0:ALL'),
                Markup.button.callback('💥 Caricature', 'view_gallery_page:0:caricature'),
                Markup.button.callback('✨ Imagine', 'view_gallery_page:0:imagine'),
            ],
            [Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')]
        ]);

        if (totalCount === 0) {
            statsMessage += `\n\nLancez la commande /caricature ou /imagine pour créer la première image !`;
        } else {
            statsMessage += `\n\nSélectionnez le filtre pour voir les archives :`;
        }
        
        // Utilisation de editMessageText pour les callbacks pour un flux de menu propre
        if (isCallback) {
            await ctx.editMessageText(statsMessage, { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup });
        } else {
            await ctx.replyWithMarkdown(statsMessage, keyboard);
        }

    } catch (error) {
        console.error('Erreur lors de l\'accès à la galerie:', error);
        await ctx.reply('❌ Une erreur est survenue lors du chargement de la galerie.');
    }
}

/**
 * 🛑 FONCTION RÉUTILISABLE pour le menu des topics. (CORRIGÉ)
 */
async function handleTopicsMenu(ctx) {
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    const keyboard = Markup.inlineKeyboard(keyboardRows);
    
    if (ctx.callbackQuery) {
        // Éditer le message pour afficher le menu Topics (flux de menu)
        await ctx.editMessageText(topicsMessage, { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup });
    } else {
        // Répondre avec un nouveau message (flux de commande /topics)
        await ctx.replyWithMarkdown(topicsMessage, keyboard);
    }
}


// --- 🤖 GESTIONNAIRES DU BOT 🤖 ---

// --- MENU PRINCIPAL START ---
bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    const isPrivateChat = ctx.chat.type === 'private';
    
    let welcomeMessage = `Bonjour citoyen(ne) ! 👋\n\nBienvenue dans l'espace de mobilisation pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale** ! Je suis votre assistant pour le mouvement.`;
    if (payload) { welcomeMessage += `\n\nVous êtes arrivé via un lien d'invitation : \`${payload}\`. Merci de rejoindre notre cause !`; }
    welcomeMessage += `\n\nComment puis-je vous aider à vous informer et à vous engager ?`;
    
    let webAppButton;
    if (isPrivateChat) {
        webAppButton = Markup.button.webApp('🌐 Ouvrir l\'Application Web (TWA)', WEB_APP_TWA_URL);
    } else {
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web', WEB_APP_URL);
    }

    const inlineKeyboard = Markup.inlineKeyboard([
        [webAppButton],
        [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
        [Markup.button.callback('🔗 Salons de Discussion (Topics)', 'show_topics_menu')],
        [Markup.button.callback('🤖 Outils IA & Création', 'ai_tools_menu')],
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);
    
    await ctx.replyWithMarkdown(welcomeMessage, inlineKeyboard);
});

// GESTIONNAIRE D'ACTION POUR RETOURNER AU MENU PRINCIPAL
bot.action('start_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const isPrivateChat = ctx.chat.type === 'private';
    
    let webAppButton;
    if (isPrivateChat) {
        webAppButton = Markup.button.webApp('🌐 Ouvrir l\'Application Web (TWA)', WEB_APP_TWA_URL);
    } else {
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web', WEB_APP_URL);
    }

    const inlineKeyboard = Markup.inlineKeyboard([
        [webAppButton],
        [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
        [Markup.button.callback('🔗 Salons de Discussion (Topics)', 'show_topics_menu')],
        [Markup.button.callback('🤖 Outils IA & Création', 'ai_tools_menu')],
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);
    
    await ctx.editMessageText(`Bonjour citoyen(ne) ! 👋\n\nBienvenue dans l'espace de mobilisation. Comment puis-je vous aider à vous informer et à vous engager ?`, { parse_mode: 'Markdown', reply_markup: inlineKeyboard.reply_markup });
});

// --- COMMANDES DE BASE ET D'INFO ---
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /user, /manifeste, /ric, /destitution, /greve, /caisse, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

// 🛑 COMMANDE /MANIFESTE MISE À JOUR (I1.1)
bot.command('manifeste', async (ctx) => { 
    await ctx.replyWithMarkdown(await getManifesteMarkdown()); 
});

bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });
bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});

// 🛑 COMMANDE /CAISSE (Implémentée à l'étape précédente)
bot.command('caisse', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    await ctx.replyWithMarkdown(await getTreasuryStats());
});

// --- COMMANDES WEB ET NAVIGATION ---
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;
    if (isPrivateChat) {
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_TWA_URL);
    } else {
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_URL);
    }
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([[webAppButton]]));
});
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([[Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_URL)]]));
});
// 🛑 UTILISATION DE LA FONCTION CORRIGÉE
bot.command('topics', handleTopicsMenu);
bot.action('show_topics_menu', async (ctx) => { await ctx.answerCbQuery(); await handleTopicsMenu(ctx); });


// --- COMMANDES DE COMPTE ET CONTACT ---
bot.command('user', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    const telegramId = ctx.from.id;
    
    try {
        const response = await axios.get(`${API_BASE_URL}/by-telegram-id/${telegramId}`);
        const userProfile = response.data;
        let message = `👤 **Gestion de Mon Compte Citoyen**\n\n`;
        if (userProfile) {
            message += `✅ **Profil Citoyen Actif**\n`;
            message += `**Nom : ${userProfile.name || 'N/A'}**\n`;
            message += `\n*ID Citoyen (UUID) :* \`${userProfile.id}\``;
            message += `\n*Score CVNU :* **${userProfile.cv_score || 'N/A'}**`;
        }
        const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.url('🌐 Gérer (Web App)', WEB_APP_URL)],
            [Markup.button.callback('❓ API de Gestion du Compte', 'user_api_info')]
        ]);
        await ctx.replyWithMarkdown(message, inlineKeyboard);
    } catch (error) {
        let message = `👤 **Gestion de Mon Compte Citoyen**\n\n`;
        if (error.response && error.response.status === 404) {
            message += `**Statut : Profil citoyen non enregistré.**\n\n`;
            message += `Votre ID Telegram (**${telegramId}**) n'est pas encore lié à un compte.`;
            message += `\n\n➡️ **Action :** Veuillez vous inscrire via l'Application Web.`;
        } else {
            message += `❌ Connexion échouée : Le service de gestion des comptes est inaccessible.`;
            console.error('Erreur API user:', error.message);
        }
        const inlineKeyboard = Markup.inlineKeyboard([[Markup.button.url('🌐 Procéder à l\'Inscription', WEB_APP_URL)]]);
        await ctx.replyWithMarkdown(message, inlineKeyboard);
    }
});
bot.action('user_api_info', async (ctx) => {
    await ctx.answerCbQuery();
    const infoMessage = `
**Détails de l'API de Gestion de Compte Citoyen (Endpoints)**

* **Créer :** \`POST /api/beneficiaries/register\` (Doit inclure \`telegram_id\`)
* **Lire par Telegram ID :** \`GET /api/beneficiaries/by-telegram-id/:telegramId\`
* **Lire tous :** \`GET /api/beneficiaries\`
* **Modifier :** \`PUT /api/beneficiaries/:id\`
    `;
    await ctx.replyWithMarkdown(infoMessage);
});
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    
    const chatId = ORGANIZER_GROUP_ID_CHAT;
    
    if (chatId) {
        try {
            await bot.telegram.sendMessage(chatId, `**Nouveau message de contact :**\n\nDe : ${ctx.from.first_name} (${ctx.from.username ? '@' + ctx.from.username : 'ID: ' + ctx.from.id})\n\nMessage :\n${messageContent}`, { parse_mode: 'Markdown' });
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { 
            console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); 
            await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. (ID de groupe incorrect ou erreur d\'API)'); 
        }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});

// --- COMMANDES IA (Génération d'images) ---
bot.command('galerie', handleGalleryMenu);
bot.action('gallery_menu', handleGalleryMenu); 
bot.action('ai_tools_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const toolsMessage = `🤖 **Outils IA et Création**\n\nChoisissez un outil pour générer du contenu ou accéder aux archives créées par le mouvement :`;
    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🖼️ Générateur d\'Images (Caricature/Imagine)', 'generator_submenu')],
        [Markup.button.callback('📂 Galerie & Archives', 'gallery_menu')],
        [Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]
    ]);
    await ctx.editMessageText(toolsMessage, { parse_mode: 'Markdown', reply_markup: inlineKeyboard.reply_markup });
});
bot.action('generator_submenu', async (ctx) => {
    await ctx.answerCbQuery();
    const generatorMessage = `🖼️ **Générateur d'Images**\n\nQuel type de contenu visuel souhaitez-vous créer ?`;
    const inlineKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('💥 Caricature Politique', 'info_caricature'),
            Markup.button.callback('✨ Image Libre (Imagine)', 'info_imagine')
        ],
        [
            Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')
        ]
    ]);
    await ctx.editMessageText(generatorMessage, { parse_mode: 'Markdown', reply_markup: inlineKeyboard.reply_markup });
});
bot.action('info_caricature', async (ctx) => {
    await ctx.answerCbQuery();
    const infoMessage = `**💥 Caricature Politique :**

Utilisez la commande \`/caricature [votre sujet]\` pour créer une image satirique et politique percutante.

✨ **NOUVEAU !** Pour la caricature basée sur la Plainte Pénale contre X, utilisez directement la commande : \`/caricature_plainte\`

Voici 5 exemples de sujets... (détails omis pour la concision).`;
    await ctx.replyWithMarkdown(infoMessage);
});
bot.action('info_imagine', async (ctx) => {
    await ctx.answerCbQuery();
    const infoMessage = `*✨ Image Libre (Imagine) :*
    
Utilisez la commande \`/imagine [votre description]\` pour créer n'importe quelle image basée sur une description libre.
    
**Rappel :** Cette commande contextualise votre sujet avec les thématiques de la Plainte Pénale (Justice, Résistance Citoyenne) pour une meilleure pertinence.`;
    await ctx.replyWithMarkdown(infoMessage);
});

// GESTIONNAIRE DE PAGINATION DE LA GALERIE (Code inchangé, il était déjà fonctionnel)
bot.action(/view_gallery_page:(\d+):([a-zA-Z]+)/, async (ctx) => {
    const page = parseInt(ctx.match[1]);
    const filter = ctx.match[2];
    await ctx.answerCbQuery(`Chargement de la page ${page + 1} (Filtre: ${filter})...`);
    
    const chatId = ctx.chat.id;
    const threadId = ctx.callbackQuery.message.message_thread_id;
    const messageId = ctx.callbackQuery.message.message_id;

    try {
        const files = await fs.readdir(GALLERY_DIR);
        let allImageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
        allImageFiles.sort((a, b) => b.localeCompare(a)); // Tri du plus récent au plus ancien

        if (filter !== 'ALL') {
            allImageFiles = allImageFiles.filter(f => f.startsWith(filter));
        }

        const totalCount = allImageFiles.length;
        const totalPages = Math.ceil(totalCount / IMAGES_PER_PAGE);

        if (totalCount === 0 || page < 0 || page >= totalPages) {
              await ctx.telegram.editMessageText(chatId, messageId, undefined,
                  `*🖼️ Archives (Page ${page + 1} / ${totalPages})* \n\nAucune archive trouvée pour le filtre **${filter.toUpperCase()}**.`,
                  { parse_mode: 'Markdown', reply_markup: Markup.inlineKeyboard([
                      [Markup.button.callback('Retour aux Filtres', 'gallery_menu')]
                  ]).reply_markup }
              );
              return;
        }
        
        const start = page * IMAGES_PER_PAGE;
        const end = start + IMAGES_PER_PAGE;
        const imagesOnPage = allImageFiles.slice(start, end);

        const mediaGroup = await Promise.all(imagesOnPage.map(async (fileName, index) => {
            const filePath = path.join(GALLERY_DIR, fileName);
            const imageBuffer = await fs.readFile(filePath);
            const fileType = fileName.split('_')[0];
            const timestamp = parseInt(fileName.split('_')[1]);
            const fileDate = new Date(timestamp).toLocaleDateString('fr-FR');

            return {
                type: 'photo',
                media: { source: imageBuffer },
                caption: (index === 0) ? `🖼️ Page ${page + 1}/${totalPages} | Type: ${fileType.toUpperCase()} (${fileDate})` : undefined,
                parse_mode: 'Markdown'
            };
        }));
        
        const navButtons = [];
        if (page > 0) { navButtons.push(Markup.button.callback('◀️ Précédent', `view_gallery_page:${page - 1}:${filter}`)); }
        navButtons.push(Markup.button.callback(`Filtre: ${filter.toUpperCase()}`, `gallery_menu`)); 
        if (page < totalPages - 1) { navButtons.push(Markup.button.callback('Suivant ▶️', `view_gallery_page:${page + 1}:${filter}`)); }

        const keyboard = Markup.inlineKeyboard([
            navButtons,
            [Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')]
        ]);

        await ctx.telegram.sendMediaGroup(chatId, mediaGroup, { message_thread_id: threadId });
        
        await ctx.telegram.editMessageText(chatId, messageId, undefined,
            `*🖼️ Archives (Filtre: ${filter.toUpperCase()}, Page ${page + 1}/${totalPages})* \n\nLes ${imagesOnPage.length} archives ont été envoyées ci-dessus.`,
            { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup }
        );

    } catch (error) {
        console.error('Erreur fatale lors de la pagination de la galerie:', error);
        await ctx.reply('❌ Impossible de charger cette page des archives. (Veuillez recommencer depuis le menu IA).', Markup.inlineKeyboard([
            [Markup.button.callback('Retour à la Galerie', 'gallery_menu')]
        ]));
    }
});

// --- COMMANDES DE GÉNÉRATION D'IMAGES ---
// COMMANDE /CARICATURE
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    if (!topic) { await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`'); return; }
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });
        const imageDescription = await getCaricaturePrompt(topic);
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                await saveGeneratedImage(imageData, 'caricature');
                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' });
                imageSent = true; break;
            }
        }
        if (!imageSent) { await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.'); }
    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// COMMANDE /CARICATURE_PLAINTE
bot.command('caricature_plainte', async (ctx) => {
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                await saveGeneratedImage(imageData, 'plainte_caricature');
                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' });
                imageSent = true; break;
            }
        }
        if (!imageSent) { await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.'); }
    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// COMMANDE /AI_VISION (Utilise le même prompt fixe que /caricature_plainte)
bot.command('ai_vision', async (ctx) => {
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Vision IA de la Plainte Pénale";
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                await saveGeneratedImage(imageData, 'ai_vision');
                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Vision IA générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' });
                imageSent = true; break;
            }
        }
        if (!imageSent) { await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.'); }
    } catch (error) {
        console.error('Erreur lors de la génération de /ai_vision (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création d\'image.');
    }
});

// COMMANDE /IMAGINE
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    if (!topic) { await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. Voici quelques exemples...`); return; }
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });
        const imageDescription = await getImaginePromptContextualized(topic);
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                await saveGeneratedImage(imageData, 'imagine');
                await ctx.replyWithPhoto({ source: imageBuffer });
                imageSent = true; return;
            }
        }
        if (!imageSent) { await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.'); }
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


// --- GESTIONNAIRES DE SONDAGE ET TEXTE ---
bot.command('create_poll', async (ctx) => {
    await ctx.reply("Pour créer un sondage, veuillez utiliser la commande: `/sondage Question ? Option 1 | Option 2 | Option 3`");
});

bot.command('sondage', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ');
    const parts = args.split('?');
    if (parts.length < 2) { return ctx.reply("Format invalide. Utilisez: `/sondage Question ? Option 1 | Option 2 | Option 3`"); }
    const question = parts[0].trim() + (parts[0].trim().endsWith('?') ? '' : '?');
    const options = parts.slice(1).join('?').trim().split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);
    
    if (options.length < 2) { return ctx.reply("Veuillez fournir au moins deux options séparées par un `|`."); }
    
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
        await ctx.reply("✅ Sondage créé et enregistré !");
    } catch (error) { 
        console.error('Erreur lors de la création du sondage:', error); 
        await ctx.reply("❌ Une erreur est survenue lors de la création du sondage.");
    }
});

bot.on('poll_answer', async (ctx) => {
    const messageId = ctx.pollAnswer.poll_id;
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId.toString() === messageId.toString());
    
    if (pollIndex !== -1) {
        // Logique de mise à jour des votes simplifiée (à affiner pour la gestion des changements de vote)
        db.polls[pollIndex].options.forEach((opt, index) => {
             opt.votes = ctx.pollAnswer.option_ids.includes(index) ? (opt.votes + 1) : opt.votes; 
        });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});

bot.on('text', async (ctx) => {
    try {
        // Mise à jour des stats pour tous les messages
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }

    // Ignorer si c'est une commande
    if (ctx.message.text.startsWith('/')) { return; }

    // Logique de conversation IA
    await ctx.replyWithChatAction('typing');
    try {
        const userMessage = ctx.message.text;
        const aiResponse = await getGroqChatResponse(userMessage, 'llama-3.1-8b-instant', "Vous êtes un assistant AGI utile et informatif pour un tableau de bord de manifestation. Vous répondez aux questions sur le mouvement.");
        await ctx.reply(aiResponse);
    } catch (error) {
        console.error('Échec de la génération de la réponse IA (Telegram) avec llama-3.1-8b-instant:', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA. Veuillez vérifier la configuration de l\'IA ou réessayer plus tard.');
    }
});

// GESTIONNAIRE DE MOT-CLÉ (Manifestation)
bot.on('message', async (ctx) => {
    if (ctx.message.text && ctx.message.text.toLowerCase().includes('manifestation')) {
        const response = await getManifestationInfo();
        ctx.reply(response);
    }
});

// --- MISE À JOUR DU MENU DES COMMANDES OFFICIELLES ---
async function setBotCommands() {
     commands = [
        { command: 'start', description: 'Revenir au menu principal.' },
        { command: 'user', description: 'Gérer votre compte citoyen.' },
        { command: 'web', description: 'Lancer l\'Application Web Telegram (TWA).' },
        { command: 'app', description: 'Accès direct à l\'Application Web (Lien simple).' },
        { command: 'manifeste', description: 'Lire un extrait du manifeste.' },
        { command: 'topics', description: 'Accéder aux salons de discussion Telegram.' },
        { command: 'ric', description: 'Tout savoir sur le Référendum d\'Initiative Citoyenne.' },
        { command: 'destitution', description: 'Comprendre la procédure de destitution.' },
        { command: 'greve', description: 'Infos pratiques sur la Grève du 10 Septembre 2025.' },
        { command: 'caisse', description: 'Afficher le statut de la Caisse de Manifestation.' }, // 👈 NOUVEAU
        { command: 'galerie', description: 'Accéder à la galerie des images générées.' },
        { command: 'imagine', description: 'Générer une image libre via l\'IA.' },
        { command: 'caricature', description: 'Générer une caricature politique via l\'IA.' },
        { command: 'caricature_plainte', description: 'Caricature auto. sur la Plainte Pénale.' },
        { command: 'ai_vision', description: 'Vision IA sur la Plainte Pénale.' },
        { command: 'sondage', description: 'Créer un nouveau sondage.' },
        { command: 'contact', description: 'Contacter les organisateurs.' },
        { command: 'stats', description: 'Afficher les statistiques du bot.' },
        { command: 'help', description: 'Afficher toutes les commandes.' },
    ];
    
    try {
        await bot.telegram.setMyCommands(commands);
        console.log("✅ Commandes officielles du bot mises à jour sur Telegram.");
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des commandes du bot:", error.message);
    }
}

// Optionnel: Appeler la fonction lors de l'initialisation du module
setBotCommands();

module.exports = {
    launch: () => bot.launch(), 
    bot: bot, 
    commands, // La liste des commandes pour le build script
    topicLinks: TOPIC_LINKS // Les liens des topics pour le build script
};