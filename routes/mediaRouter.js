// routes/mediaRouter.js

const express = require('express');
const axios = require('axios'); // Nécessaire pour les requêtes HTTP asynchrones
const router = express.Router();

/**
 * ROUTE ASYNCHRONE POUR LES FICHIERS GITHUB (Images, Vidéos)
 * Exemple d'appel : /api/media/github/ia-local/d-bloquons_tout/main/assets/image.png
 * Le `/*` à la fin permet de capturer le chemin d'accès complet au fichier.
 */
router.get('/github/:owner/:repo/:branch/*', async (req, res) => {
    // Récupération dynamique des paramètres pour plus de flexibilité
    const filePath = req.params[0]; 
    const { owner, repo, branch } = req.params;
    
    // Construction de l'URL RAW de GitHub pour l'accès direct au fichier
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

    console.log(`Tentative de récupération GitHub : ${rawUrl}`);

    try {
        // Requête HTTP asynchrone (axios)
        const response = await axios({
            method: 'GET',
            url: rawUrl,
            responseType: 'stream' // 🛑 TRÈS IMPORTANT: Récupère le contenu sous forme de flux
        });

        // Définir les en-têtes appropriés avant d'envoyer la réponse
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Mise en cache (1 an)

        // Piper le flux de données entrant (Axios) vers le flux de réponse sortant (Express)
        // L'opération de transfert est gérée de manière asynchrone par Node.js
        response.data.pipe(res);

    } catch (error) {
        console.error(`Erreur de récupération GitHub (${rawUrl}):`, error.message);

        if (error.response && error.response.status === 404) {
            return res.status(404).send('Fichier non trouvé sur GitHub.');
        }
        res.status(500).send('Erreur serveur lors de la récupération du fichier depuis GitHub.');
    }
});


/**
 * ROUTE CONCEPTUELLE POUR GOOGLE DRIVE
 * Exemple d'appel : /api/media/drive/FILE_ID_DU_DRIVE
 *
 * ⚠️ NOTE : L'implémentation complète nécessite d'utiliser le SDK Google Drive API (avec OAuth2)
 * pour obtenir le token d'accès au fichier. L'exemple ci-dessous est un squelette asynchrone.
 */
router.get('/drive/:fileId', async (req, res) => {
    const { fileId } = req.params;

    try {
        // 🛑 ICI, VOUS AURIEZ BESOIN D'APPELER VOTRE SERVICE GOOGLE DRIVE API ASYNCHRONE
        // const driveStream = await driveService.downloadFile(fileId); 
        // driveStream.pipe(res);
        
        // Simuler le processus asynchrone
        await new Promise(resolve => setTimeout(resolve, 100)); // Simuler un délai d'API
        
        // Réponse en attendant l'implémentation de l'API Drive
        res.status(501).send("Endpoint Drive actif, mais le service de téléchargement Drive n'est pas encore implémenté (nécessite l'intégration de Google Drive API).");

    } catch (error) {
        console.error(`Erreur de récupération Google Drive (${fileId}):`, error.message);
        res.status(500).send('Erreur serveur lors de la récupération du fichier depuis Google Drive.');
    }
});

module.exports = router;