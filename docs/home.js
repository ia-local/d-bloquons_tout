// docs/home.js - Logique de Rendu pour la Page d'Accueil et la Chronologie (VERSION GAMIFIÉE)

// Déclarer l'instance de la carte Leaflet globalement dans window pour app.js
window.globalMap = null; 
// 🛑 Stockage global des événements pour la modale
window.CHRONOLOGY_EVENTS = []; 
// 🛑 Suivi du statut de la Veille Active (Gamification)
window.hasCompletedDailyVeille = false; // Initialisé à faux par défaut

// --- 0. RENDU DE LA PAGE HOME (Accueil Statique) ---

window.loadHomePageContent = function() {
    console.log("Page Accueil chargée (Contenu statique HTML).");
    
    // 1. DÉCLENCHEMENT DU CHARGEMENT DE LA CHRONOLOGIE
    loadChronology();
};

/**
 * 🛑 Fonction qui affiche la carte de la Mission Journalière (Veille Active)
 */
function displayEventObjective() {
    const objectiveContainer = document.querySelector('#home-page .content');
    if (!objectiveContainer) return;
    
    // S'assurer que le DOM de la chronologie existe avant d'essayer d'injecter
    const chronology = document.getElementById('chronology-container');
    if (!chronology || objectiveContainer.querySelector('.event-objective-card')) return;

    // Utilisation de l'événement ID 16 ("MACRON ARRETE") comme objectif cible
    const latestEvent = window.CHRONOLOGY_EVENTS.find(e => e.id === '16'); 
    
    if (!latestEvent) return; 

    // Détermine le statut d'affichage
    const isCompleted = window.hasCompletedDailyVeille;
    
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
    
    // Injection juste avant la chronologie
    chronology.insertAdjacentHTML('beforebegin', objectiveHTML);
    
    // Attacher l'écouteur à la nouvelle carte
    const objectiveCard = objectiveContainer.querySelector('.event-objective-card');
    if (objectiveCard) {
        objectiveCard.addEventListener('click', () => {
            // Déclenche l'action 'chronology-detail'. Le 3ème argument (true/false) indique si c'est pour la récompense.
            window.handleUserAction('chronology-detail', latestEvent.id, !isCompleted);
        });
    }
}


/**
 * 🛑 RENDU DE LA CHRONOLOGIE
 */
async function loadChronology() {
    const container = document.getElementById('chronology-container');
    if (!container) return;
    
    if (container.hasLoaded) return;
    
    try {
        const events = await window.fetchData('/api/chronology/events');
        
        if (!events || events.length === 0) {
            container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p>Aucun événement clé trouvé.</p>`;
            container.hasLoaded = true;
            return;
        }

        window.CHRONOLOGY_EVENTS = events;
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
        
        // ATTACHEMENT DES ÉCOUTEURS DE NAVIGATION NORMALE
        attachChronologyListeners(container);
        
        // AFFICHAGE DE LA CARTE DE MISSION IMMÉDIATEMENT APRÈS LE CHARGEMENT DES DONNÉES
        displayEventObjective(); 

        container.hasLoaded = true;

    } catch (error) {
        console.error("Erreur lors du chargement de la chronologie:", error);
        container.innerHTML = `<h2 class="font-red">⌛ Chronologie</h2><p class="font-red">Échec du chargement des événements.</p>`;
    }
}

/**
 * 🛑 Fonction d'attachement des écouteurs pour les détails sans récompense
 */
function attachChronologyListeners(container) {
    const timelineItems = container.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const handler = () => {
            const eventId = item.getAttribute('data-event-id');
            if (window.handleUserAction) {
                // Lance l'action 'chronology-detail' sans bonus par défaut (false)
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