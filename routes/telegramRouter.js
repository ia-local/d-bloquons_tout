// Fichier : routes/telegramRouter.js (VERSION FINALE AVEC CORRECTION HTTPS WEB APP ET MISE À JOUR DU MENU DES COMMANDES)

const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONSTANTES ET VARIABLES GLOBALES ---
const STATS_FILE = path.join(__dirname, '..', 'data', 'stats.json');
const DATABASE_FILE_PATH = path.join(__dirname, '..', 'data', 'database.json');

// 🛑 CONSTANTES D'ACCÈS WEB (CORRIGÉES)
const GIT_APP_HTTPS_URL = 'https://ia-local.github.io/d-bloquons_tout/'; // URL HTTPS pour WebApp et lien simple
const WEB_APP_HTTPS_URL = 't.me/Pi_ia_Pibot/Manifest_910'; // URL HTTPS pour WebApp et lien simple
const TELEGRAM_WEB_APP_LAUNCH_LINK = 't.me/Pi_ia_Pibot/Manifest_910'; // Lien t.me pour référence (non utilisé pour Markup.button.webApp)

const ORGANIZER_GROUP_ID_CHAT = "-100123456789"; // ID de chat d'organisateurs (simulé/à configurer)

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY || '7281441282:AAGA5F0nRyEsBKIfQOGcAjelkE3DA8IWByU';

// 🛑 CONSTANTES DE NAVIGATION ET DE PAGINATION
const GALLERY_DIR = path.join(__dirname, '..', 'data', 'galerie');
const IMAGES_PER_PAGE = 4; // Affichage de 4 images par page dans le diaporama

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
const groq = new Groq({ apiKey: GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const bot = new Telegraf(TELEGRAM_API_KEY, {
    telegram: { webhookReply: true }
});
let database = {};

// --- FONCTIONS UTILITAIRES (pour l'autonomie du module) ---
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

/**
 * 🛑 FONCTION : Sauvegarde l'image générée dans le dossier data/galerie.
 */
async function saveGeneratedImage(imageDataBase64, type) {
    try {
        await fs.mkdir(GALLERY_DIR, { recursive: true });
        // Utiliser Date.now() pour garantir l'unicité et le tri
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
  const info = `Voici quelques informations sur la manifestation : \n\n` +
               `**Date :** 10 Septembre 2025\n` +
               `**Objectif :** Grève Générale pour la Justice Sociale\n` +
               `**Points de ralliement :** Paris (Place de la République), Lyon (Place Bellecour), Marseille (Vieux-Port). D'autres lieux seront annoncés prochainement.`;
  return info;
}

/**
 * Texte de référence complet de la plainte pénale (utilisé pour donner du contexte à l'IA).
 */
const PLAINTE_PENALE_CONTEXT = `
Objet : Plainte Pénale contre X (Fonctionnaires d'État et Responsables Politiques) pour Infractions Criminelles et Abus d'Autorité (2017–2025).
Chefs d'Accusation : Détournement de Fonds Publics/Privés, Prise Illégale d'Intérêt, Fraude aux Comptes de Campagne, Escroquerie, et Concertation Répression.
Mécanisme : Ruine économique ciblée (7 ans de privation financière) sous façade, masquant enrichissement illégal et Évasion Fiscale.
Contexte Criminel Aggravant : Abus lié au projet "Accord de Paris" utilisé comme arme de géo-ingénierie, financé par Détournement de Fonds. Accusation de Crime contre l'Humanité.
Exigences : Ouverture d'une Enquête pénale, Composition Pénale, Destitution, Réparation Intégrale.
`;

/**
 * Fonction utilitaire pour générer la description de l'image de caricature via Groq.
 * Style : SATIRIQUE ET AGRESSIF.
 */
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
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', 
            temperature: 0.8
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur Groq pour le prompt de caricature (contextualisé):`, error);
        return `Caricature politique, sombre et contrastée (noir et blanc avec touches de rouge) représentant le sujet : "${topic}". Inclure des symboles de corruption, d'argent détourné, et de justice bafouée.`;
    }
}


/**
 * Fonction utilitaire pour générer la description de l'image pour /imagine.
 * Style : SYMBOLIQUE ET CINÉMATOGRAPHIQUE.
 */
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
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant', 
            temperature: 0.8
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Erreur Groq pour le prompt /imagine (contextualisé):`, error);
        return `Image symbolique et percutante basée sur le sujet : "${topic}". Représente une scène de résistance citoyenne et d'exigence de justice, dans un style réaliste et fort.`;
    }
}


/**
 * Prompt fixe et agressif pour générer une caricature IA basée sur le texte de la plainte pénale.
 */
function getPlaintePenaleCaricaturePrompt() {
    return `Caricature dystopique et très agressive de satire politique, style gravure expressionniste, noir et blanc avec des touches de rouge sang et de vert bilieux. 
    
    Représente des **fonctionnaires d'État (silhouettes sombres portant des costumes de luxe)**, masqués ou anonymes, qui sont assis sur une **pile de liasses de billets et de sacs d'argent volé (Détournement de Fonds Publics)**. 
    
    Ces figures sont en train de **signer des ordres de Répression (tampons judiciaires/policiers)**, et l'un d'eux tient une **Ordonnance de Protection déchirée et ensanglantée** symbolisant l'Acharnement Judiciaire (2017-2025).
    
    En arrière-plan, le **Palais de Justice s'effondre**, et des nuages aux formes chimiques (chemtrails) s'échappent d'un **logo "Accord de Paris" déformé**, symbolisant la géo-ingénierie, le **Crime contre l'Humanité** et les Actes mettant la vie d'autrui en danger.
    
    Le titre visible sur le mur délabré est : **"RÉPARATION INTÉGRALE"** avec le mot **"JUSTICE"** brisé au sol.`;
}

// --- FONCTION DE LOGIQUE RÉUTILISABLE POUR LE MENU GALERIE ---
async function handleGalleryMenu(ctx) {
    const isCallback = ctx.callbackQuery !== undefined;

    if (isCallback) {
        // NOTE: On n'appelle pas answerCbQuery ici pour le moment, car on répond avec un message
        // L'appel de pagination le fera
    }

    try {
        const files = await fs.readdir(GALLERY_DIR);
        const imageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
        const totalCount = imageFiles.length;

        let replyMessage = `📂 **Galerie et Archives**\n\n`;
        replyMessage += `Total d'images créées : **${totalCount}**`;

        if (totalCount === 0) {
            replyMessage += `\n\nLancez la commande /caricature ou /imagine pour créer la première image !`;
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')]
            ]);
            
            await ctx.replyWithMarkdown(replyMessage, keyboard);
            return;
        }

        // --- Affichage du menu de filtrage (étape préliminaire) ---
        
        let statsMessage = `Total d'images créées : **${totalCount}**\n\nSélectionnez le filtre pour voir les archives :`;

        const filterButtons = [
            Markup.button.callback('🖼️ Tout', 'view_gallery_page:0:ALL'),
            Markup.button.callback('💥 Caricature', 'view_gallery_page:0:caricature'),
            Markup.button.callback('✨ Imagine', 'view_gallery_page:0:imagine'),
        ];

        const keyboard = Markup.inlineKeyboard([
            filterButtons,
            [Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')]
        ]);

        await ctx.replyWithMarkdown(statsMessage, keyboard);
        
    } catch (error) {
        console.error('Erreur lors de l\'accès à la galerie:', error);
        await ctx.reply('❌ Une erreur est survenue lors du chargement de la galerie.');
    }
}


// --- 🤖 EXPORTATION DE LA LOGIQUE DU BOT 🤖 ---

// --- MENU PRINCIPAL START (CORRIGÉ POUR GÉRER LES GROUPES/TOPICS) ---
bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    const isPrivateChat = ctx.chat.type === 'private';
    
    let welcomeMessage = `Bonjour citoyen(ne) ! 👋\n\nBienvenue dans l'espace de mobilisation pour la **Grève Générale du 10 Septembre 2025** et la **Justice Sociale** ! Je suis votre assistant pour le mouvement.`;
    if (payload) { welcomeMessage += `\n\nVous êtes arrivé via un lien d'invitation : \`${payload}\`. Merci de rejoindre notre cause !`; }
    welcomeMessage += `\n\nComment puis-je vous aider à vous informer et à vous engager ?`;
    
    // 🛑 LOGIQUE DE SÉLECTION DU BOUTON POUR ÉVITER BUTTON_TYPE_INVALID
    let webAppButton;
    if (isPrivateChat) {
        // WebApp natif (privilégié dans les chats privés)
        webAppButton = Markup.button.webApp('🌐 Ouvrir l\'Application Web (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Bouton URL simple (universellement compatible, utilisé dans les groupes/topics)
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web', WEB_APP_HTTPS_URL);
    }

    const inlineKeyboard = Markup.inlineKeyboard([
        // 🛑 Utilisation du bouton choisi
        [webAppButton], 
        
        [Markup.button.callback('📜 Le Manifeste', 'show_manifest')],
        [Markup.button.callback('🔗 Salons de Discussion (Topics)', 'show_topics_menu')], 
        [Markup.button.callback('🤖 Outils IA & Création', 'ai_tools_menu')], 
        [Markup.button.callback('❓ Aide & Commandes', 'show_help')]
    ]);
    
    await ctx.replyWithMarkdown(welcomeMessage, inlineKeyboard);
});

// --- GESTIONNAIRES DE COMMANDES ET ACTIONS ---

// 🛑 COMMANDE /GALERIE (CORRIGÉE : APPEL DE LA LOGIQUE INTERNE)
bot.command('galerie', handleGalleryMenu);
bot.action('gallery_menu', handleGalleryMenu); // L'action appelle la même logique

// --- NOUVEAU GESTIONNAIRE DE MENU TOPICS ---
bot.action('show_topics_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    // Convertir l'objet TOPIC_LINKS en une liste de boutons
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    // Regrouper les boutons par paires
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('start_menu', async (ctx) => { await ctx.answerCbQuery(); await bot.start(ctx); });
bot.action('show_manifest', async (ctx) => {
    await ctx.answerCbQuery();
    const manifestoContent = `**Extrait du Manifeste 'Le 10 Septembre' :**
Notre mouvement est né de la conviction que la République doit retrouver ses valeurs de justice sociale, de démocratie directe et de transparence. Nous exigeons :
\n1.  **L'instauration du Référendum d'Initiative Citoyenne (RIC)** dans toutes ses formes (législatif, abrogatoire, constituant, révocatoire).
\n2.  **La mise en œuvre de la procédure de destitution** des élus, notamment présidentielle, en cas de manquement grave à leurs devoirs, conformément à l'Article 68 de la Constitution.
\n3.  **Une refonte du système fiscal** pour une plus grande équité et une contribution juste de chacun.
\n4.  **Une véritable transition écologique** qui ne laisse personne de côté, financée par la justice fiscale.
\n5.  **La fin de l'impunité** et la responsabilisation des élites économiques et politiques.
\n\nPour le manifeste complet et toutes nos propositions, interrogez l'IA ou explorez les commandes /manifeste, /ric, /destitution.
`;
    await ctx.replyWithMarkdown(manifestoContent);
});
bot.action('engage_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const engageMessage = `Choisissez how you would like to engage :\n\n` +
                          `✅ **Signer la Pétition RIC :** Le Référendum d'Initiative Citoyenne est au cœur de nos demandes. Participez à nos sondages réguliers sur le sujet, ou lancez la commande /ric pour en savoir plus.\n\n` +
                          `⚖️ **Soutenir la Procédure de Destitution :** Nous visons la responsabilisation des élus. Utilisez la commande /destitution pour comprendre l'Article 68 et nos actions.\n\n` +
                          `💬 **Jugement Majoritaire & Justice Sociale :** Explorez nos propositions pour une démocratie plus juste. Vous pouvez poser des questions à l'IA ou utiliser la commande /manifeste pour plus de détails sur nos objectifs de justice sociale.`;
    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('En savoir plus sur le RIC', 'ric_info_from_engage')],
        [Markup.button.callback('En savoir plus sur la Destitution', 'destitution_info_from_engage')],
        [Markup.button.callback('Retour au menu principal', 'start_menu')]
    ]);
    await ctx.replyWithMarkdown(engageMessage, inlineKeyboard);
});

// --- LOGIQUE DE MENU IA ---

bot.action('ai_tools_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const toolsMessage = `🤖 **Outils IA et Création**\n\nChoisissez un outil pour générer du contenu ou accéder aux archives créées par le mouvement :`;
    
    const inlineKeyboard = Markup.inlineKeyboard([
        [
            // Bouton pour la génération de Caricatures / Images
            Markup.button.callback('🖼️ Générateur d\'Images (Caricature/Imagine)', 'generator_submenu')
        ],
        [
            // Option pour la galerie / archives
            Markup.button.callback('📂 Galerie & Archives', 'gallery_menu')
        ],
        [
            Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')
        ]
    ]);
    await ctx.replyWithMarkdown(toolsMessage, inlineKeyboard);
});

bot.action('generator_submenu', async (ctx) => {
    await ctx.answerCbQuery();
    const generatorMessage = `🖼️ **Générateur d'Images**\n\nQuel type de contenu visuel souhaitez-vous créer ?`;
    
    const inlineKeyboard = Markup.inlineKeyboard([
        [
            // Bouton pour la Caricature (expliquant la commande)
            Markup.button.callback('💥 Caricature Politique', 'info_caricature'), 
            // Bouton pour l'Image générale
            Markup.button.callback('✨ Image Libre (Imagine)', 'info_imagine')
        ],
        [
            Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')
        ]
    ]);
    await ctx.replyWithMarkdown(generatorMessage, inlineKeyboard);
});

// --- ACTION D'INFORMATION POUR /CARICATURE ---
bot.action('info_caricature', async (ctx) => {
    await ctx.answerCbQuery();
    const infoMessage = `**💥 Caricature Politique :**

Utilisez la commande \`/caricature [votre sujet]\` pour créer une image satirique et politique percutante.

✨ **NOUVEAU !** Pour la caricature basée sur la Plainte Pénale contre X (Détournement, Abus d'Autorité, Crime d'État), utilisez directement la commande : \`/caricature_plainte\`

Voici 5 exemples de sujets pour la commande \`/caricature\` classique :

1.  \`Le haut fonctionnaire et les sacs d'argent détourné écrasant le citoyen ruiné (2017-2025)\`
2.  \`La main de la répression frappant les dossiers judiciaires pour masquer la fraude électorale\`
3.  \`Le symbole de l'Accord de Paris crachant des chemtrails financés par des fonds illégaux\`
4.  \`L'urne de vote renversée et le politique masqué peignant "IMPUNITÉ" sur l'Article 68\`
5.  \`La main invisible de la citoyenneté déchirant le mur de la corruption pour exiger la Réparation Intégrale\`

**Comment ça marche ?** L'IA va analyser votre texte et y ajouter des symboles visuels de Justice Corrompue, Détournement de Fonds et Abus d'Autorité pour un maximum d'impact.`;
    
    await ctx.replyWithMarkdown(infoMessage);
});

// --- ACTION D'INFORMATION POUR /IMAGINE (CORRIGÉE) ---
bot.action('info_imagine', async (ctx) => {
    await ctx.answerCbQuery();
    
    // Correction: Utilisation de la syntaxe Markdown stricte
    const infoMessage = `
*✨ Image Libre (Imagine) :*
    
Utilisez la commande \`/imagine [votre description]\` pour créer n'importe quelle image basée sur une description libre.
    
**Rappel :** Cette commande contextualise votre sujet avec les thématiques de la Plainte Pénale (Justice, Résistance Citoyenne) pour une meilleure pertinence.

Voici quelques exemples rapides :
    
1. \`/imagine la justice sociale représentée par une balance en or\`
2. \`/imagine un dragon survolant l'Assemblée Nationale au coucher du soleil\`
3. \`/imagine un citoyen en colère devant l'Assemblée Nationale\``;
    
    await ctx.replyWithMarkdown(infoMessage); 
});


// --- ACTION PRINCIPALE DE PAGINATION DE LA GALERIE (AVEC FILTRE ET STABILITÉ) ---
bot.action(/view_gallery_page:(\d+):([a-zA-Z]+)/, async (ctx) => {
    // Match 1: Page Index, Match 2: Filter (e.g., 'ALL', 'caricature', 'imagine')
    const page = parseInt(ctx.match[1]); 
    const filter = ctx.match[2];
    await ctx.answerCbQuery(`Chargement de la page ${page + 1} (Filtre: ${filter})...`);
    
    const chatId = ctx.chat.id;
    const threadId = ctx.callbackQuery.message.message_thread_id;
    const messageId = ctx.callbackQuery.message.message_id;

    try {
        const files = await fs.readdir(GALLERY_DIR);
        
        // 1. FILTRAGE ET TRI
        let allImageFiles = files.filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png')).sort();

        if (filter !== 'ALL') {
            allImageFiles = allImageFiles.filter(f => f.startsWith(filter));
        }

        const totalCount = allImageFiles.length;
        const totalPages = Math.ceil(totalCount / IMAGES_PER_PAGE);

        if (totalCount === 0 || page < 0 || page >= totalPages) {
             // Si le filtre a produit 0 résultats
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

        // Créer le groupe de médias pour l'affichage en grille
        const mediaGroup = await Promise.all(imagesOnPage.map(async (fileName, index) => {
            const filePath = path.join(GALLERY_DIR, fileName);
            const imageBuffer = await fs.readFile(filePath);
            
            const fileType = fileName.split('_')[0];
            const timestamp = parseInt(fileName.split('_')[1]);
            const fileDate = new Date(timestamp).toLocaleDateString();

            return {
                type: 'photo',
                media: { source: imageBuffer },
                caption: (index === 0) ? `🖼️ Page ${page + 1}/${totalPages} | Type: ${fileType.toUpperCase()} (${fileDate})` : undefined,
                parse_mode: 'Markdown'
            };
        }));
        
        // --- Construction des boutons de pagination ---
        const navButtons = [];
        if (page > 0) {
            navButtons.push(Markup.button.callback('◀️ Précédent', `view_gallery_page:${page - 1}:${filter}`));
        }
        navButtons.push(Markup.button.callback(`Page ${page + 1}/${totalPages}`, `gallery_menu`)); 
        if (page < totalPages - 1) {
            navButtons.push(Markup.button.callback('Suivant ▶️', `view_gallery_page:${page + 1}:${filter}`));
        }

        const keyboard = Markup.inlineKeyboard([
            navButtons,
            [Markup.button.callback('⬅️ Retour aux Outils IA', 'ai_tools_menu')]
        ]);

        // 1. Envoyer le groupe de photos (Grille)
        await ctx.telegram.sendMediaGroup(chatId, mediaGroup, { message_thread_id: threadId }); 
        
        // 2. Éditer le message INITIAL (celui qui avait le bouton cliqué) pour y ajouter le nouveau clavier de navigation.
        await ctx.telegram.editMessageText(chatId, messageId, undefined, 
            `*🖼️ Archives (Filtre: ${filter.toUpperCase()}, Page ${page + 1}/${totalPages})* \n\nLes ${IMAGES_PER_PAGE} archives ont été envoyées ci-dessus.`, 
            { parse_mode: 'Markdown', reply_markup: keyboard.reply_markup }
        );


    } catch (error) {
        console.error('Erreur fatale lors de la pagination de la galerie:', error);
        
        // Tenter d'envoyer un message d'erreur simple
        await ctx.reply('❌ Impossible de charger cette page des archives. (Veuillez recommencer depuis le menu IA).', Markup.inlineKeyboard([
            [Markup.button.callback('Retour à la Galerie', 'gallery_menu')]
        ]));
    }
});


// --- COMMANDE /AI_VISION (MAINTENANT UN GÉNÉRATEUR AUTOMATISÉ) ---
bot.command('ai_vision', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Vision Contextuelle de la Plainte Pénale";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'ai_vision');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Vision IA générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de /ai_vision (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création d\'image.');
    }
});


// --- COMMANDES ET FONCTIONS ORIGINALES ---
bot.command('galerie', handleGalleryMenu); 
bot.action('gallery_menu', handleGalleryMenu); // L'action appelle la même logique

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    // Logique de correction: WebApp seulement en privé, URL en groupe
    if (isPrivateChat) {
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

bot.command('stats', async (ctx) => {
    const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
    const statsMessage = `📊 Statistiques d'utilisation du bot :\nTotal de messages traités : ${stats.totalMessages}`;
    await ctx.reply(statsMessage);
});
bot.command('manifeste', (ctx) => { ctx.reply('Le Manifeste du mouvement pour le 10 septembre est le suivant...'); });
bot.command('destitution', async (ctx) => { await ctx.replyWithMarkdown(await getDestitutionInfoMarkdown()); });
bot.command('ric', async (ctx) => { await ctx.replyWithMarkdown(await getRicInfoMarkdown()); });
bot.command('greve', async (ctx) => { await ctx.replyWithMarkdown(await getManifestationInfo()); });

// --- COMMANDE /CARICATURE (GÉNÉRALE AVEC CONTEXTUALISATION) ---
bot.command('caricature', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!topic) {
        await ctx.reply('Veuillez fournir le thème de votre caricature. Exemple: `/caricature la fraude aux comptes de campagne`');
        return;
    }
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Analyse du sujet et création du prompt de caricature IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et satirique par Groq (contextualisé)
        const imageDescription = await getCaricaturePrompt(topic);
        
        await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'caricature');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${topic.substring(0, 50)}...**`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec un thème différent.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature. Vérifiez votre clé Gemini et Groq.');
    }
});

// --- COMMANDE /CARICATURE_PLAINTE (AUTOMATISÉE) ---
bot.command('caricature_plainte', async (ctx) => {
    
    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Utilisation du prompt automatisé "Plainte Pénale - Crime d\'État"...', { parse_mode: 'Markdown' });

        // 1. Utilisation du prompt détaillé fixe
        const imageDescription = getPlaintePenaleCaricaturePrompt();
        const sujetCourt = "Plainte Pénale - Détournement & Abus";
        
        await ctx.reply(`Description IA utilisée (fixe): \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        
        let imageSent = false;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');

                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'plainte_penale');

                await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Caricature politique générée sur le thème **${sujetCourt}** !`, parse_mode: 'Markdown' }); 
                imageSent = true;
                break;
            }
        }
        
        if (!imageSent) {
            await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer.');
        }

    } catch (error) {
        console.error('Erreur lors de la génération de la caricature_plainte (Telegram):', error);
        await ctx.reply('❌ Une erreur est survenue lors du processus de création de caricature.');
    }
});

// --- COMMANDE /IMAGINE (AVEC CONTEXTUALISATION ET SAUVEGARDE) ---
bot.command('imagine', async (ctx) => {
    const topic = ctx.message.text.split(' ').slice(1).join(' ');
    
    // CORRECTION: Ajout d'exemples si le topic est manquant
    if (!topic) { 
        await ctx.replyWithMarkdown(`Veuillez fournir une description pour l'image. 
Voici quelques exemples :
1. \`/imagine un dragon survolant une ville futuriste\`
2. \`/imagine la justice sociale représentée par une balance en or\`
3. \`/imagine un champ de blé écrasant les symboles de l'évasion fiscale\`
        `); 
        return; 
    }

    try {
        await ctx.replyWithChatAction('upload_photo');
        await ctx.reply('⏳ **Étape 1/2** : Contextualisation du sujet et création du prompt d\'image IA...', { parse_mode: 'Markdown' });

        // 1. Génération du prompt détaillé et contextualisé par Groq
        const imageDescription = await getImaginePromptContextualized(topic); 
        
await ctx.reply(`Description IA utilisée: \`${imageDescription.substring(0, 100)}...\`\n\n⏳ **Étape 2/2** : Génération de l'image par Gemini en cours...`);

        // 2. Génération de l'image par Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
        const result = await model.generateContent(imageDescription);
        const response = result.response;
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const imageData = part.inlineData.data;
                const imageBuffer = Buffer.from(imageData, 'base64');
                
                // 🛑 SAUVEGARDE AUTOMATIQUE
                await saveGeneratedImage(imageData, 'imagine');

                await ctx.replyWithPhoto({ source: imageBuffer });
                return;
            }
        }
        await ctx.reply('Désolé, l\'IA a généré une réponse sans image. Veuillez réessayer avec une autre description.');
    } catch (error) {
        console.error('Erreur lors de la génération de l\'image (Telegram):', error);
        await ctx.reply('Désolé, une erreur est survenue lors de la génération de l\'image. Le modèle a pu échouer ou la description était trop complexe.');
    }
});


bot.command('create_poll', async (ctx) => {
    const question = 'Quel sujet devrions-nous aborder dans le prochain live ?';
    const options = ['Justice Sociale', 'Justice Fiscale', 'Justice Climatique'];
    try {
        const message = await ctx.replyWithPoll(question, options, { is_anonymous: false });
        const pollId = uuidv4();
        // Pour les sondages, il faut gérer la base de données de manière plus robuste
        const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
        if (!db.polls) { db.polls = []; }
        db.polls.push({ id: pollId, messageId: message.message_id, question: question, options: options.map(opt => ({ text: opt, votes: 0 })), creatorId: ctx.from.id });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    } catch (error) { console.error('Erreur lors de la création du sondage:', error); }
});
bot.on('poll_answer', async (ctx) => {
    const db = await readJsonFile(DATABASE_FILE_PATH, { polls: [] });
    const pollIndex = db.polls.findIndex(p => p.messageId === ctx.pollAnswer.poll_id);
    if (pollIndex !== -1) {
        ctx.pollAnswer.option_ids.forEach(optionIndex => { db.polls[pollIndex].options[optionIndex].votes++; });
        await writeJsonFile(DATABASE_FILE_PATH, db);
    }
});
bot.on('text', async (ctx) => {
    try {
        const stats = await readJsonFile(STATS_FILE, { totalMessages: 0 });
        stats.totalMessages = (stats.totalMessages || 0) + 1;
        await writeJsonFile(STATS_FILE, stats);
    } catch (error) { console.error('Erreur lors de la mise à jour du compteur de messages:', error); }
    if (ctx.message.text.startsWith('/')) { return; }
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
bot.command('contact', async (ctx) => {
    const messageContent = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageContent) { await ctx.reply('Veuillez fournir le message que vous souhaitez envoyer aux organisateurs. Exemple: /contact J\'ai une idée pour la grève.'); return; }
    if (ORGANIZER_GROUP_ID_CHAT) {
        try {
            await bot.telegram.sendMessage(ORGANIZER_GROUP_ID_CHAT, `Nouveau message de l'utilisateur ${ctx.from.first_name} (${ctx.from.username || 'ID: ' + ctx.from.id}) :\n\n${messageContent}`);
            await ctx.reply('Votre message a été transmis aux organisateurs. Merci !');
        } catch (error) { console.error('Erreur lors de l\'envoi du message aux organisateurs:', error); await ctx.reply('Désolé, je n\'ai pas pu transmettre votre message aux organisateurs. Veuillez réessayer plus tard.'); }
    } else { await ctx.reply('Le canal de contact des organisateurs n\'est pas configuré. Veuillez contacter l\'administrateur du bot.'); }
});
bot.on('message', async (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('manifestation')) {
    const response = await getManifestationInfo();
    bot.telegram.sendMessage(msg.chat.id, response);
  }
});


// --- COMMANDES DE NAVIGATION DÉDIÉES ---

// 🛑 COMMANDE POUR LANCER LA TELEGRAM WEB APP (TWA) - CORRECTION DE L'ERREUR 400
bot.command('web', async (ctx) => {
    const isPrivateChat = ctx.chat.type === 'private';
    let webAppButton;

    if (isPrivateChat) {
        // Utilisation du bouton WebApp natif dans les chats privés
        webAppButton = Markup.button.webApp('🌐 Ouvrir la Web App (TWA)', WEB_APP_HTTPS_URL);
    } else {
        // Utilisation du bouton URL simple dans les groupes/topics pour éviter l'erreur 400
        webAppButton = Markup.button.url('🌐 Ouvrir l\'Application Web (Lien)', WEB_APP_HTTPS_URL);
    }
    
    await ctx.replyWithMarkdown(`🗺️ **Lancement de l'Application Web :**\n\nCliquez sur le bouton ci-dessous pour ouvrir l'interface. (Dans les groupes, l'ouverture native peut être limitée.)`,
        Markup.inlineKeyboard([
            [webAppButton]
        ]));
});

// 🛑 COMMANDE POUR LE LIEN WEB SIMPLE
bot.command('app', async (ctx) => {
    await ctx.replyWithMarkdown(`🗺️ **Accès à l'Application Web & Carte du Mouvement :**\n\nVous pouvez consulter les points de ralliement, le tableau de bord et les statistiques directement via notre application web.`,
        Markup.inlineKeyboard([
            [Markup.button.url('🌐 Ouvrir l\'Application Web (Lien Simple)', WEB_APP_HTTPS_URL)]
        ]));
});

bot.command('topics', async (ctx) => {
    // Accès direct au menu des topics
    const topicsMessage = `🔗 **Espaces de Discussion et Organisation**\n\nCliquez sur un bouton ci-dessous pour accéder au topic correspondant dans notre groupe principal.`;
    
    const topicButtons = Object.entries(TOPIC_LINKS).map(([label, url]) => 
        Markup.button.url(label, url)
    );
    
    const keyboardRows = [];
    for (let i = 0; i < topicButtons.length; i += 2) {
        keyboardRows.push(topicButtons.slice(i, i + 2));
    }
    
    keyboardRows.push([Markup.button.callback('⬅️ Retour au Menu Principal', 'start_menu')]);

    await ctx.replyWithMarkdown(topicsMessage, Markup.inlineKeyboard(keyboardRows));
});


bot.action('show_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpMessage = `Voici les commandes que vous pouvez utiliser :
/start - Revenir au menu principal et message de bienvenue
/web - Lancer l'Application Web Telegram (TWA) (Nouveau!)
/app - Accès direct à l'Application Web (Lien simple)
/manifeste - Lire un extrait de notre manifeste
/topics - Accéder directement aux salons de discussion Telegram (Nouveau!)
/ric - Tout savoir sur le Référendum d'Initiative Citoyenne
/destitution - Comprendre la procédure de destitution (Art. 68)
/greve - Infos pratiques sur la Grève du 10 Septembre 2025
/sondage - Participer aux sondages d'opinion du mouvement
/petition - Accéder aux pétitions en cours (via le bot)
/inviter - Inviter des amis à rejoindre le bot et le mouvement
/imagine [description] - Créer une image à partir d'une description textuelle (contextualisée)
/caricature [description] - Générer une image de caricature politique (agressive et contextualisée)
/caricature_plainte - Créer une caricature automatisée sur la Plainte Pénale
/ai_vision - Générer la vision IA de la Plainte Pénale (Nouveau!)
/stats - Afficher les statistiques d'utilisation du bot
/aboutai - En savoir plus sur mon fonctionnement
/help - Afficher ce message d'aide
`;
    await ctx.reply(helpMessage);
});
bot.help((ctx) => ctx.reply('Commandes disponibles: /start, /manifeste, /ric, /destitution, /greve, /topics, /galerie, /app, /web, /imagine, /caricature, /caricature_plainte, /ai_vision, /stats, /help'));

// ... (le reste des commandes)

// --- MISE À JOUR DU MENU DES COMMANDES OFFICIELLES ---

// Cette fonction garantit que le menu / est mis à jour dans l'interface Telegram
async function setBotCommands() {
    // Les commandes listées ici sont celles qui apparaissent dans le menu /
    const commands = [
        { command: 'start', description: 'Revenir au menu principal.' },
        { command: 'web', description: 'Lancer l\'Application Web Telegram (TWA).' },
        { command: 'app', description: 'Accès direct à l\'Application Web (Lien simple).' },
        { command: 'manifeste', description: 'Lire un extrait du manifeste.' },
        { command: 'topics', description: 'Accéder aux salons de discussion Telegram.' },
        { command: 'ric', description: 'Tout savoir sur le Référendum d\'Initiative Citoyenne.' },
        { command: 'destitution', description: 'Comprendre la procédure de destitution.' },
        { command: 'greve', description: 'Infos pratiques sur la Grève du 10 Septembre 2025.' },
        { command: 'galerie', description: 'Accéder à la galerie des images générées.' },
        { command: 'imagine', description: 'Générer une image libre via l\'IA.' },
        { command: 'caricature', description: 'Générer une caricature politique via l\'IA.' },
        { command: 'help', description: 'Afficher toutes les commandes.' },
    ];
    
    // Tentative de définition des commandes au démarrage du bot
    try {
        await bot.telegram.setMyCommands(commands);
        console.log("✅ Commandes officielles du bot mises à jour sur Telegram.");
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des commandes du bot:", error.message);
    }
}

// Optionnel: Appeler la fonction lors de l'initialisation du module
setBotCommands(); 

module.exports = bot;