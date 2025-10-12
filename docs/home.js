// docs/home.js - Logique de Rendu pour la Carte, le Tableau de Bord et le Bot + Chronologie

// Déclarer l'instance de la carte Leaflet globalement dans window pour app.js
window.globalMap = null; 
// 🛑 NOUVEAU: Stockage global des événements pour la modale
window.CHRONOLOGY_EVENTS = []; 

// --- 0. RENDU DE LA PAGE HOME (Accueil Statique) ---
window.loadHomePageContent = function() {
    // La page Home est statique (Manifeste déjà en HTML).
    console.log("Page Accueil chargée (Contenu statique HTML).");
    
    // DÉCLENCHEMENT DU CHARGEMENT DE LA CHRONOLOGIE
    loadChronology();
};

// 🛑 RENDU DE LA CHRONOLOGIE
async function loadChronology() {
    const container = document.getElementById('chronology-container');
    if (!container) return;
    
    // Si le conteneur a déjà du contenu riche, ne pas recharger (optimisation)
    if (container.hasLoaded) return;
    
    try {
        // Récupération des données via l'API (ou le mode de secours)
        const events = await window.fetchData('/api/chronology/events');
        
        // Sécurité: Si fetchData a renvoyé [] (tableau vide), la condition est remplie.
        if (!events || events.length === 0) {
            container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p>Aucun événement clé trouvé.</p>`;
            container.hasLoaded = true;
            return;
        }

        // 🛑 STOCKAGE DES DONNÉES GLOBALES ET TRI
        window.CHRONOLOGY_EVENTS = events;
        // Le .sort() ne causera plus d'erreur car events est garanti être un Array
        events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        let html = `
            <h2 class="font-red" style="text-align: center;">⌛ Chronologie des Événements Clés</h2>
            <p style="color: #ccc; margin-bottom: 20px; text-align: center;">L'histoire de notre mobilisation, des origines à nos objectifs futurs.</p>
            <div id="timeline-list">
        `;

        events.forEach(event => {
            const date = new Date(event.start_date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // UTILISATION DES CLASSES CSS DEFINIES DANS styles.css (timeline-item et content)
            html += `
                <div class="timeline-item content" data-event-id="${event.id}" style="padding-left: 15px; margin-bottom: 15px; cursor: pointer;">
                    <h4 class="font-yellow" style="margin-bottom: 5px;">${event.title} (${event.city})</h4>
                    <p style="font-size: 0.9em; font-weight: 600;">${event.subtitle} - ${date}</p>
                    <p style="font-size: 0.8em; margin-top: 5px;">${event.description}</p>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // 🛑 ATTACHEMENT DES ÉVÉNEMENTS APRÈS INJECTION
        attachChronologyListeners(container);

        container.hasLoaded = true;

    } catch (error) {
        console.error("Erreur lors du chargement de la chronologie:", error);
        container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p class="font-red">Échec du chargement des événements.</p>`;
    }
}

// 🛑 NOUVEAU: Fonction d'attachement des écouteurs
function attachChronologyListeners(container) {
    const timelineItems = container.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const eventId = item.getAttribute('data-event-id');
            // Assurez-vous que modalGestion.js est chargé avant d'appeler handleUserAction
            if (window.handleUserAction) {
                // Lance l'action 'chronology-detail' avec l'ID de l'événement
                window.handleUserAction('chronology-detail', eventId);
            } else {
                console.error("handleUserAction non défini. La modale ne peut pas s'ouvrir.");
            }
        });
    });
}


// --- 1. RENDU DE LA CARTE (Map Page) ---

window.initMap = async function() {
    // Si la carte est déjà initialisée, on ne fait rien
    if (window.globalMap) return; 

    const mapElement = document.getElementById('map');
    // Vérification de sécurité: ne rien faire si l'élément 'map' n'est pas trouvé.
    if (!mapElement) { 
        console.error("Élément #map introuvable. Assurez-vous d'être sur la page Carte."); 
        return; 
    }
    
    // Utiliser les constantes globales
    window.globalMap = L.map('map', {
        center: window.MAP_CONFIG.DEFAULT_CENTER,
        zoom: window.MAP_CONFIG.DEFAULT_ZOOM,
        maxZoom: window.MAP_CONFIG.MAX_ZOOM,
        minZoom: 5 
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributeurs'
    }).addTo(window.globalMap);

    await loadGeeTiles();
    await loadManifestationPoints();
};

async function loadGeeTiles() {
    const alertsElement = document.getElementById('realtime-alerts');
    alertsElement.textContent = "📡 Connexion à Google Earth Engine...";
    try {
        // L'URL de GEE doit inclure les paramètres nécessaires
        const geeData = await window.fetchData('/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED?bands=B4,B3,B2&cloud_percentage=5');
        
        if (geeData.mapid && geeData.token) {
            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: `Satellite: ${geeData.satelliteName || 'S2_SR_HARMONIZED'}`,
                opacity: 0.5,
                zIndex: 100,
                maxNativeZoom: 14 
            }).addTo(window.globalMap);
            alertsElement.textContent = `✅ Couche Satellite chargée.`;
        } else {
            alertsElement.textContent = `⚠️ GEE : ${geeData.error || "Réponse invalide (API). Vérifiez le serveur."}`;
        }
    } catch (error) {
        alertsElement.textContent = "❌ Échec de l'initialisation GEE (Réseau).";
        console.error("Échec de la connexion à l'API GEE:", error);
    }
}

async function loadManifestationPoints() {
    try {
        // Récupération des points via l'API (ou le mode de secours)
        const pointsData = await window.fetchData('/map/data/manifestations'); 
        
        // Sécurité: Si pointsData n'est pas un tableau valide, utiliser un tableau vide
        const points = pointsData || [];
        
        let videoCount = 0;
        
        points.forEach(point => {
            if (point.lat && point.lon) {
                const marker = L.circleMarker([point.lat, point.lon], {
                    radius: 8,
                    color: '#f9e25b', 
                    fillColor: '#f52639', 
                    weight: 1,
                    fillOpacity: 0.9,
                }).addTo(window.globalMap);

                let popupContent = `<div style="color: #1a1a1a;"><b>${point.name} - ${point.city}</b><br>Type: ${point.type || 'Rassemblement'}<br>Participants: ${point.count || 'N/A'}`;
                if (point.video_link) {
                    popupContent += `<br><a href="${point.video_link}" target="_blank" style="color: #f52639; font-weight: bold;">📺 Voir la vidéo</a>`;
                    videoCount++;
                }
                popupContent += '</div>';
                
                marker.bindPopup(popupContent);
            }
        });
        
        const currentAlert = document.getElementById('realtime-alerts');
        if(currentAlert) {
             currentAlert.textContent = `${currentAlert.textContent} | Points: ${points.length} (Vidéo: ${videoCount})`;
        }


    } catch (error) {
        console.error("Échec du chargement des points de manifestation:", error);
    }
}

// --- 2. RENDU DU TABLEAU DE BORD (Dashboard Page) ---

window.loadDashboardData = async function() {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    // Si la grille a déjà été chargée, on ne la recharge pas (sauf si nécessaire)
    if (grid.hasLoaded) return; 
    
    grid.innerHTML = '<p class="font-yellow">Connexion et agrégation des données...</p>';

    try {
        // 🛑 TOUS LES APPELS API SONT MAINTENANT SÉPARÉS ET UTILISENT fetchData
        const [summaryData, utmiData, smartContractData, pointsData] = await Promise.all([
            window.fetchData('/api/dashboard/summary'),
            window.fetchData('/api/dashboard/utmi-insights'),
            window.fetchData('/smartContract/api/dashboard-data'),
            // 🛑 AJOUT DE LA RÉCUPÉRATION DES POINTS DE MANIFESTATION ICI POUR LE COMPTE
            window.fetchData('/map/data/manifestations') 
        ]);

        // Sécurité : Assurer que les listes sont des tableaux pour le .length
        const points = pointsData || [];
        const totalPoints = points.length;

        const metrics = [
            { title: "Solde Caisse Manifeste", value: `${(summaryData.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Allocation Est. : ${(summaryData.monthlyAllocation || 0).toFixed(2)} €/bénéficiaire` },
            { title: "Impact UTMi (Score)", value: (utmiData.totalUTMI || 0).toFixed(2), desc: `Score d'Unité et de Transformation du Mouvement` },
            { title: "Manifestants Est.", value: (summaryData.estimatedManifestantCount || 0).toLocaleString('fr-FR'), desc: `${totalPoints} Points de Rassemblement` },
            { title: "Recettes Contrat (Sim.)", value: `${(smartContractData.totalRecettes || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Dépenses (Allocations): ${(smartContractData.totalDepenses || 0).toFixed(2)} €` },
            { title: "Boycotts Actifs", value: summaryData.boycottCount || 0, desc: `Alertes financières : ${summaryData.activeAlerts || 0}` },
            { title: "RICs Actifs", value: summaryData.ricCount || 0, desc: `Citoyens enregistrés : ${summaryData.beneficiaryCount || 0}` }
        ];

        grid.innerHTML = metrics.map(m => `
            <div class="feature-card insight-card">
                <h3 style="color: inherit; font-size: 1.2rem; margin-bottom: 5px;">${m.title}</h3>
                <p class="metric-value font-red"><b>${m.value}</b></p>
                <p class="metric-desc">${m.desc}</p>
            </div>
        `).join('');

        grid.hasLoaded = true; 
        
    } catch (error) {
        // L'erreur est maintenant bien traitée par fetchData, nous utilisons les valeurs par défaut (0 ou {})
        console.error("Erreur lors du chargement du tableau de bord (Final):", error);
        grid.innerHTML = `<p class="font-red">❌ Échec de la connexion aux métriques API (Vérifiez le serveur ou les fichiers JSON de secours).</p>`;
    }
};

// --- 3. RENDU DE LA PAGE TÉLÉGRAM (Settings Page) ---

window.loadTelegramContent = function() {
    const container = document.getElementById('telegram-content-container');
    // 🛑 UTILISATION DE LA VARIABLE GLOBALE CORRECTE
    const telegramData = window.TELEGRAM_DATA; 

    if (container.hasLoaded) return; 

    // 1. Rendu des Salons de Discussion (Topics)
    const topicHtml = `
        <div class="content quick-start" style="transform: none;">
            <h3 class="font-yellow">🔗 Salons de Discussion Telegram (TOPICS)</h3>
            <p>Accès direct aux salons de discussion dédiés à l'organisation du mouvement.</p>
            <div class="feature-grid">
                ${Object.entries(telegramData.topicLinks).map(([label, url]) => `
                    <div class="feature-card" style="transform: none; text-align: center;">
                        <h4 style="color: var(--color-accent-yellow);">${label}</h4>
                        <a href="${url}" target="_blank" class="btn btn-secondary" style="margin-top: 10px; padding: 5px 10px; font-weight: 600;">Accéder au Salon</a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // 2. Structure HTML pour la pagination des commandes
    const commandsHtmlStructure = `
        <div class="content quick-start" style="transform: none; margin-top: 30px;">
            <h3 class="font-red">🤖 Commandes de l'Assistant Bot (Simulation Pagination)</h3>
            <p>Liste paginée des commandes IA et d'information disponibles.</p>
            <table>
                <thead>
                    <tr><th>Commande</th><th>Description</th></tr>
                </thead>
                <tbody id="commands-list-body">
                    </tbody>
            </table>
            <div id="commands-pagination-controls" style="text-align: center;">
                </div>
        </div>
    `;

    container.innerHTML = topicHtml + commandsHtmlStructure;

    // --- LOGIQUE DE PAGINATION (Utilise window.initializePagination de pagination.js) ---

    const listContainer = document.getElementById('commands-list-body');
    const controlsContainer = document.getElementById('commands-pagination-controls');

    const commandRenderer = (item) => {
        return `
            <tr>
                <td class="font-yellow break-word" style="font-weight: bold;">${item.cmd}</td>
                <td>${item.desc}</td>
            </tr>
        `;
    };

    if (window.initializePagination) {
        window.initializePagination(
            telegramData.commands,
            listContainer,
            controlsContainer,
            commandRenderer
        );
    } else {
        // Rendu des commandes brutes si pagination.js est manquant
        listContainer.innerHTML = telegramData.commands.map(item => commandRenderer(item)).join('');
        controlsContainer.innerHTML = '<tr><td colspan="2" class="font-red">Avertissement: Script de pagination non chargé. Affichage de toutes les commandes.</td></tr>';
    }

    container.hasLoaded = true;
};
