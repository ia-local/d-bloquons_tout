// Fichier : public/src/js/parametres.js
import { initJournalModal } from './journalModal.js';
// Assurez-vous que dynamicDataFetcher est importé là où vous en avez besoin,
// ou que ces fonctions sont appelées par un autre script qui a importé startDynamicFetch.
// Pour ce fichier, nous avons besoin de la fonction startDynamicFetch pour la collecte.
import { startDynamicFetch } from './dynamicDataFetcher.js';

export function initParametresPage() {
    console.log('Initialisation de la page des paramètres.');
    
    // Logique de la modal du journal (inchangée)
    const openJournalModalBtn = document.getElementById('open-journal-modal-btn');
    const journalModal = document.getElementById('journal-modal');

    if (openJournalModalBtn && journalModal) {
        initJournalModal();
    } else {
        console.warn("Éléments de la modal du journal introuvables. Fonctionnalité de la modal désactivée pour cette page.");
    }
    
    // Afficher les outils d'administration et le bilan de qualité
    displayAdminTools();
    displayVideoQualitySummary(); 
}

/**
 * Affiche les outils d'intégration et attache les écouteurs d'événements.
 */
function displayAdminTools() {
    const adminContainer = document.getElementById('admin-content-area');
    if (!adminContainer) {
        console.warn("Conteneur d'administration #admin-content-area non trouvé.");
        return; 
    }
    
    // 🛑 Injection du HTML de l'interface
    adminContainer.innerHTML = `
        <h3 style="margin-top: 30px;">Outils d'Intégration Cartographique Dynamique</h3>
        
        <div id="quality-summary-container">
            <!-- Le bilan de qualité sera injecté ici au chargement -->
            <p>Chargement du bilan de qualité...</p>
        </div>
        <hr>
        
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <p id="integration-status" style="margin-right: 20px;">Statut: Prêt.</p>
            <div id="enrichment-indicator" style="display: flex; align-items: center;">
                <span id="status-light" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: gray; margin-right: 5px;"></span>
                <span id="last-run-info">Statut du Service: Inconnu.</span>
            </div>
        </div>
        
        <!-- Boutons d'administration -->
        <button id="fetch-data-btn" 
                style="padding: 10px 20px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 15px;">
            1. Collecter Data Live (Scraping)
        </button>
        <button id="validate-integrate-btn" 
                style="padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 15px;">
            2. Valider et Intégrer les Nouveaux Points
        </button>
        <button id="enrich-videos-btn" 
                style="padding: 10px 20px; background-color: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">
            3. Enrichir les Liens Vidéo Manquants
        </button>
    `;
    
    // Attacher les événements aux boutons
    const fetchBtn = document.getElementById('fetch-data-btn');
    const integrateBtn = document.getElementById('validate-integrate-btn');
    const enrichBtn = document.getElementById('enrich-videos-btn');

    // Événement 1: Déclenche le scraping réel via startDynamicFetch
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
            const statusElement = document.getElementById('integration-status');
            statusElement.textContent = "Statut: Démarrage de la collecte dynamique en cours...";
            
            // 🛑 L'appel à startDynamicFetch déclenche l'API du serveur
            await startDynamicFetch(); 
            
            statusElement.textContent = "Statut: Collecte terminée. Données prêtes pour l'intégration (Étape 2).";
            displayVideoQualitySummary(); // Mettre à jour le bilan après la collecte
        });
    }

    if (integrateBtn) {
        integrateBtn.addEventListener('click', validateAndIntegrateData);
    }
    
    if (enrichBtn) {
        enrichBtn.addEventListener('click', enrichMissingVideos);
    }
    
    updateEnrichmentIndicator();
}

/**
 * Appelle l'API pour obtenir et afficher le bilan de qualité des données (vidéos manquantes).
 */
async function displayVideoQualitySummary() {
    const container = document.getElementById('quality-summary-container');
    if (!container) return;
    
    try {
        const response = await fetch('/api/data-quality/video-summary');
        const summary = await response.json();

        if (response.ok) {
            let missingHtml = `<p>✅ **Bilan Qualité :** ${summary.totalPoints} événements analysés.</p>`;
            
            if (summary.missingCount > 0) {
                missingHtml += `<p style="color: red;">❌ **ALERTE :** ${summary.missingCount} (${summary.percentageMissing.toFixed(1)}%) événements n'ont pas de lien vidéo de référence.</p>`;
                missingHtml += `<h4>Éléments Manquants (Top 20) :</h4><ul>`;
                
                summary.missingList.forEach(item => {
                    missingHtml += `<li>ID: ${item.id} - ${item.name} (${item.city})</li>`;
                });
                
                missingHtml += `</ul>`;
            } else {
                missingHtml += `<p style="color: green;">✅ **PARFAIT :** Tous les événements ont un lien vidéo de référence.</p>`;
            }
            
            container.innerHTML = missingHtml;
        } else {
            container.innerHTML = `<p style="color: red;">❌ Erreur lors de la récupération du bilan : ${summary.error}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p style="color: red;">❌ Erreur de connexion au serveur pour le bilan de qualité.</p>`;
        console.error('Erreur lors du fetch du bilan vidéo:', error);
    }
}

/**
 * 🛑 Fonction qui appelle l'API pour valider et fusionner les données temporaires 
 * (Route /validate-and-integrate).
 */
async function validateAndIntegrateData() {
    const statusElement = document.getElementById('integration-status');
    const button = document.getElementById('validate-integrate-btn');
    
    if (statusElement) statusElement.textContent = "Statut: Intégration en cours... Ne quittez pas la page.";
    if (button) button.disabled = true;

    try {
        const response = await fetch('/api/data-integration/validate-and-integrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (response.ok) {
            statusElement.innerHTML = `✅ **SUCCÈS :** ${result.message} <br> Points intégrés : ${result.integratedPoints.length} / Total : ${result.totalPoints}`;
            displayVideoQualitySummary(); 
        } else {
            statusElement.textContent = `❌ ERREUR : ${result.error || result.message || 'Échec de l\'intégration.'}`;
        }

    } catch (error) {
        statusElement.textContent = `❌ ERREUR CRITIQUE : Problème de connexion au serveur lors de l'intégration.`;
        console.error("Erreur critique lors de l'appel API:", error);
    } finally {
        if (button) button.disabled = false;
        updateEnrichmentIndicator(); 
    }
}

/**
 * 🛑 Fonction qui appelle l'API pour enrichir les liens vidéo des points existants 
 * (Route /enrich-videos).
 */
async function enrichMissingVideos() {
    const statusElement = document.getElementById('integration-status');
    const button = document.getElementById('enrich-videos-btn');
    
    if (statusElement) statusElement.textContent = "Statut: Recherche de vidéos en cours... Ceci peut prendre quelques secondes.";
    if (button) button.disabled = true;

    try {
        const response = await fetch('/api/data-integration/enrich-videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        
        if (response.ok) {
            statusElement.innerHTML = `✅ **SUCCÈS :** ${result.message} <br> ${result.enrichedCount} points mis à jour.`;
            displayVideoQualitySummary();
        } else {
            statusElement.textContent = `❌ ERREUR : ${result.error || result.message || 'Échec de l\'enrichissement.'}`;
        }

    } catch (error) {
        statusElement.textContent = `❌ ERREUR CRITIQUE : Problème de connexion au serveur lors de l'enrichissement vidéo.`;
        console.error("Erreur critique lors de l'appel API d'enrichissement:", error);
    } finally {
        if (button) button.disabled = false;
        updateEnrichmentIndicator();
    }
}


/**
 * 🛑 Fonction qui met à jour l'indicateur visuel du service d'enrichissement.
 */
async function updateEnrichmentIndicator() {
    const light = document.getElementById('status-light');
    const infoSpan = document.getElementById('last-run-info');
    if (!light || !infoSpan) return;

    try {
        const response = await fetch('/api/data-integration/enrichment-status');
        const status = await response.json();
        
        const lastRun = status.lastVideoEnrichment;
        
        if (lastRun && lastRun !== 'N/A') {
            const lastDate = new Date(lastRun);
            const now = new Date();
            const diffHours = Math.abs(now - lastDate) / 36e5;
            
            // Affichage de la date/heure locale
            infoSpan.textContent = `Dernier enrichissement : ${lastDate.toLocaleTimeString()}`;

            // Logique du feu de signalisation (basée sur l'ancienne mise à jour)
            if (diffHours < 24) {
                light.style.backgroundColor = '#10b981'; // Vert : Moins de 24h
            } else if (diffHours < 48) {
                light.style.backgroundColor = '#facc15'; // Jaune : Plus de 24h
            } else {
                light.style.backgroundColor = '#ef4444'; // Rouge : Échec ou plus de 48h
            }
        } else {
            light.style.backgroundColor = 'gray';
            infoSpan.textContent = 'Dernier enrichissement : Jamais exécuté';
        }

    } catch (error) {
        light.style.backgroundColor = 'black';
        infoSpan.textContent = 'Service déconnecté (API introuvable)';
    }
}