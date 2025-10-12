// Fichier : public/src/js/dynamicDataFetcher.js

/**
 * Lit le fichier de configuration source.json.
 * @returns {Promise<object|null>} La configuration ou null en cas d'erreur.
 */
async function fetchConfig() {
    try {
        const response = await fetch('src/json/map/source.json');
        if (!response.ok) {
            console.warn("Avertissement: Impossible de charger source.json. Utilisation d'une config par défaut.");
            return {
                "general_settings": { "update_frequency_minutes": 30, "last_update": "" },
                "search_config": { "default_city_list": ["Paris", "Nantes", "Lyon"] },
                "data_sources": [{ "name": "Google Actualités", "source_type": "GOOGLE_NEWS", "is_active": true }]
            }; 
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur JSON: Le fichier source.json est invalide.", error);
        return null;
    }
}

/**
 * 🛑 Orchestre le processus : Déclenche le scraping réel côté serveur et attend la préparation du fichier temporaire.
 */
export async function startDynamicFetch() {
    console.log("--- DÉMARRAGE DU COLLECTEUR DYNAMIQUE ---");
    const config = await fetchConfig();

    if (!config) {
        console.error("Échec du chargement de la configuration. Arrêt du processus.");
        return;
    }

    // 🛑 Étape 1 : Déclencher le processus de scraping réel sur le serveur
    try {
        const response = await fetch('/api/data-integration/trigger-real-scraping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Envoi de la configuration pour que le serveur sache quoi chercher
            body: JSON.stringify({ searchConfig: config }) 
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log(`\n✅ Statut Serveur Préparation: ${result.message}`);
            console.log(`   -> ${result.count} points trouvés et écrits dans le fichier temporaire.`);
            // Retourne les données pour que le client sache qu'il y a de nouvelles données
            return result.collectedData || []; 
        } else {
            console.error(`❌ Échec de la préparation du scraping: ${result.error}`);
            return [];
        }
        
    } catch (error) {
        console.error("Erreur critique de connexion pour le déclenchement du scraping:", error);
        return [];
    }
}