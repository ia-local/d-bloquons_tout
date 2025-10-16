// docs/home.js - Logique de Rendu de la Page d'Accueil et la Chronologie (VERSION FINALE STABLE)

// Déclarer l'instance de la carte Leaflet globalement dans window pour app.js
window.globalMap = null; 
// 🛑 Stockage global des événements (rempli par loadChronology)
window.CHRONOLOGY_EVENTS = window.CHRONOLOGY_EVENTS || []; 
// 🛑 Suivi du statut de la Veille Active (Dépend de la gamification du Dashboard)
window.hasCompletedDailyVeille = window.hasCompletedDailyVeille || false; 

// --- Fonctions utilitaires de support (omises pour la concision) ---
// Ces fonctions sont conservées pour éviter les ReferenceErrors si elles sont appelées ailleurs.
function fetchProjectData() { return Promise.resolve({}); }
function showSlides(n) { console.log("showSlides simulée."); } 
function renderTeamCards(team) { console.log("renderTeamCards simulée."); }
function getIconForRole(role) { return "fa-user-tie"; }
function renderFinanceChart(projections) { console.log("renderFinanceChart simulée."); }
function initModalSlides(data) { console.log("initModalSlides simulée."); } 


/**
 * 🛑 Fonction qui affiche la carte de la Mission Journalière (Veille Active)
 */
function displayEventObjective() {
    const chronologyContainer = document.getElementById('chronology-container');
    if (!chronologyContainer) return;

    if (chronologyContainer.previousElementSibling && chronologyContainer.previousElementSibling.classList.contains('event-objective-card')) return;

    // Utilisation de l'événement ID 16 ("MACRON ARRETE") comme objectif cible (Simulation)
    const latestEvent = window.CHRONOLOGY_EVENTS.find(e => e.id === '16'); 
    if (!latestEvent) return; 

    // Détermine le statut d'affichage (dépend de la gamification du Dashboard)
    const isCompleted = window.AGENT_PROFILE ? window.AGENT_PROFILE.dashboardVeilleCompleted : window.hasCompletedDailyVeille;
    
    const objectiveHTML = `
        <div class="alert ${isCompleted ? 'alert-success' : 'alert-info'} event-objective-card" style="margin-top: 30px; border-left: 5px solid ${isCompleted ? 'var(--color-green)' : 'var(--color-accent-red)'}; cursor: pointer;" data-event-id="${latestEvent.id}">
            <h3 class="${isCompleted ? 'font-green' : 'font-yellow'}">
                <i class="fas fa-bullseye"></i> ${isCompleted ? 'OBJECTIF ACCOMPLI' : 'OBJECTIF ÉVÉNEMENTIEL : VEILLE ACTIVE'}
            </h3>
            <p><strong>MISSION :</strong> ${latestEvent.title} - ${latestEvent.subtitle} (Cliquez pour lire et valider)</p>
            <p class="${isCompleted ? 'font-green' : 'font-red'}">
                RÉCOMPENSE : <strong>${isCompleted ? 'RÉCLAMÉE' : '+30 UTMi (Veille Active) + 5 EA'}</strong>
            </p>
        </div>
    `;
    
    chronologyContainer.insertAdjacentHTML('beforebegin', objectiveHTML);
    
    const objectiveCard = chronologyContainer.previousElementSibling; 
    if (objectiveCard) {
        objectiveCard.addEventListener('click', () => {
            // Déclenche l'action 'chronology-detail' (gérée dans app.js)
            window.handleUserAction('chronology-detail', latestEvent.id, !isCompleted);
        });
    }
}


/**
 * 🛑 RENDU DE LA CHRONOLOGIE DES ÉVÉNEMENTS (Appel API /api/chronology/events)
 */
async function loadChronology() {
    const container = document.getElementById('chronology-container');
    if (!container || container.hasLoaded) return;
    
    container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p class="font-yellow">Chargement des événements...</p>`;

    try {
        const events = await window.fetchData('/api/chronology/events');
        
        if (!events || events.length === 0) {
            container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p>Aucun événement clé trouvé.</p>`;
            container.hasLoaded = true;
            return;
        }

        window.CHRONOLOGY_EVENTS = events;
        events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)); // Tri du plus récent au plus ancien

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
            
            html += `
                <div role="button" tabindex="0" class="timeline-item content" data-event-id="${event.id}" style="padding-left: 15px; margin-bottom: 15px; cursor: pointer;">
                    <h4 class="font-yellow" style="margin-bottom: 5px;">${event.title} (${event.city})</h4>
                    <p style="font-size: 0.9em; font-weight: 600;">${event.subtitle} - ${date}</p>
                    <p style="font-size: 0.8em; margin-top: 5px;">${event.description}</p>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        attachChronologyListeners(container);
        displayEventObjective(); 

        container.hasLoaded = true;

    } catch (error) {
        console.error("Erreur lors du chargement de la chronologie:", error);
        container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p class="font-red">Échec du chargement des événements.</p>`;
    }
}

/**
 * 🛑 Fonction d'attachement des écouteurs pour les détails de la chronologie
 */
function attachChronologyListeners(container) {
    const timelineItems = container.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const handler = () => {
            const eventId = item.getAttribute('data-event-id');
            if (window.handleUserAction) {
                window.handleUserAction('chronology-detail', eventId, false); 
            } else {
                console.error("handleUserAction non défini. La modale ne peut pas s'ouvrir.");
            }
        };

        item.addEventListener('click', handler);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    });
}

// 🛑 NOUVELLE FONCTION : CHARGEMENT DE L'APERÇU DU JOURNAL
/**
 * Charge les 9 dernières entrées du journal pour la page d'accueil (Teaser).
 */
async function loadJournalTeaser() {
    // Le conteneur '#journal-teaser-content' doit exister dans home.html
    const container = document.getElementById('journal-teaser-content');
    if (!container) return;
    
    container.innerHTML = `<p style="text-align: center;">Chargement des dernières mises à jour...</p>`;

    try {
        // 🛑 Utilisation de fetchData (qui gère le fallback journal_entries.json)
        const entries = await window.fetchData('/api/journal/entries');
        
        if (!entries || entries.length === 0) {
            container.innerHTML = `<p class="font-yellow">Aucun article récent.</p>`;
            return;
        }
        
        // Afficher les 9 dernières entrées maximum
        const latestEntries = entries.slice(0, 9);
        
        const entriesHTML = latestEntries.map(entry => {
            const date = entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : 'Date N/A';
            const category = entry.category || 'GÉNÉRAL';

            return `
                <div class="journal-teaser-item" onclick="window.handleUserAction('journal-detail', '${entry.id}')" style="cursor: pointer; padding: 5px 0;">
                    <i class="fas fa-arrow-right"></i> <b>${entry.title || 'Article Sans Titre'}</b> (${category}) - ${date}
                </div>
            `;
        }).join('');
        
        // Rendu dans un conteneur stylisé (journal-teaser-list)
        container.innerHTML = `<div class="journal-teaser-list">${entriesHTML}</div>`;

    } catch (error) {
        console.error("Erreur lors du chargement de l'aperçu du journal:", error);
        container.innerHTML = `<p class="font-red">❌ Échec du chargement des mises à jour.</p>`;
    }
}


/**
 * Initialise la page d'accueil (Manifeste, Chronologie, Journal).
 * C'est le point d'entrée appelé par app.js::window.showPage('home').
 */
window.loadHomePageContent = async function() {
    console.log("Page Accueil chargée (P3.2). Lancement de l'initialisation.");
    
    // 🛑 CHARGEMENT DU JOURNAL TEASER
    loadJournalTeaser();
    
    // 🛑 CHARGER LA CHRONOLOGIE EN DERNIER (POINT CRITIQUE)
    loadChronology(); 
};