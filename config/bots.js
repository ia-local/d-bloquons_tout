// Fichier : config/bots.js

// On définit ici tous les bots que l'application doit gérer.
const botsConfig = [
    {
        name: 'mainBot',
        token: process.env.TELEGRAM_API_KEY, // Le token de votre bot principal
        enabledCommands: [ // La liste des commandes que ce bot doit écouter
            'start', 
            'greve', 
            'addevent', 
            'manifeste', 
            'ric', 
            'galerie', 
            'imagine', 
            'caricature',
            // ...ajoutez toutes les commandes publiques ici
        ]
    },
    {
        name: 'adminBot',
        token: process.env.TELEGRAM_ADMIN_API_KEY, // Un NOUVEAU token pour un bot d'admin
        enabledCommands: [
            'start',
            'stats',      // Commande pour voir les stats
            'addevent',   // Commande pour ajouter un événement
            'deleteevent' // Nouvelle commande que seul l'admin aura
        ]
    }
];

// On exporte aussi les commandes du bot principal pour le script de build du frontend
const mainBotCommands = [
    { command: 'start', description: 'Menu principal.' },
    { command: 'greve', description: 'Infos sur la manifestation.' },
    { command: 'addevent', description: 'Ajouter un événement (protégé ?).' },
    // ... la liste complète que vous aviez dans setBotCommands()
];

module.exports = { botsConfig, mainBotCommands };