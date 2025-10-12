// Fichier : public/src/js/modalActions.js (VERSION FINALE OPÉRATIONNELLE)

// Les données seront chargées via une API ou un Fallback statique
let actionsData = { 
  "titre_general": "PLUIE D'ACTIONS POUR TOUT BLOQUER : Risques Légaux, Durées et Coordonnées pour Cartographie",
  "objectif": "Consolidation et analyse juridique des 70+ actions...",
  "avertissement": "Les champs 'latitude' et 'longitude' sont initialisés à null...",
  "definitions_risque": {
    "nul": "Aucune infraction pénale ou simple règlement interne.", "faible": "Contravention (max 1 500 €), risque minime de poursuite pénale sauf aggravation.",
    "modere": "Délit possible (1 an max de prison, forte amende) ou risque de requalification.",
    "eleve": "Délit lourd (jusqu'à 2 ans de prison, amende significative, casier judiciaire).",
    "tres_eleve": "Délit/Crime majeur (peine de prison > 2 ans), mettant en danger la sécurité d'autrui ou causant des destructions graves."
  },
  "liste_des_categories": {
    "type": [
      "Blocage", "Économie", "Écologie", "Satire", "Symbole", "Pédagogie", "Perturbation", "Autres"
    ],
    "niveaux_de_risque": [
      "Nul", "Faible", "Faible/Modéré", "Modéré", "Modéré/Élevé", "Élevé", "Très Élevé", "Crime"
    ]
  },
  "liste_actions_consolidee": []
}; 

// Références DOM pour la modale d'actions
const actionsModal = document.getElementById('actions-modal'); 

const ACTION_FIELDS = [
    { key: 'action', label: 'Action Détaillée', type: 'textarea', required: true },
    { key: 'type', label: 'Type / Catégorie (Ex: Blocage / Nul)', type: 'text', required: true },
    { key: 'risque', label: 'Niveau de Risque (Ex: Nul, Élevé, Crime)', type: 'text', required: true },
    { key: 'duree_potentielle_blocage', label: 'Durée Potentielle de Blocage', type: 'text', required: false },
    { key: 'consequences_juridiques', label: 'Conséquences Juridiques Maximales', type: 'textarea', required: true },
];

// -------------------------------------------------------------------
// FONCTIONS D'ACCÈS ET DE RECHERCHE
// -------------------------------------------------------------------

export function setActionsData(data) {
    if (data && data.liste_actions_consolidee) {
        actionsData = data;
        console.log("✅ Actions data injected from map.js.");
    }
}

export async function fetchActionsData() {
    const API_URL = '/api/actions/data';
    const FALLBACK_URL = '/src/json/map/actions.json';
    let data = null;

    try {
        const response = await fetch(API_URL); 
        if (response.ok) { data = await response.json(); actionsData = data; return data; }
    } catch (e) { console.error("Erreur critique lors de l'appel API:", e); }
    
    if (!data) {
        try {
            const fallbackResponse = await fetch(FALLBACK_URL);
            if (fallbackResponse.ok) { data = await fallbackResponse.json(); actionsData = data; return data; }
        } catch (e) { console.error("Erreur lors du chargement du fichier statique de secours:", e); }
    }

    if (!data) { actionsData = { liste_actions_consolidee: [] }; }
    return actionsData;
}

function findActionById(id) {
    const list = actionsData.liste_actions_consolidee ?? [];
    const numericId = parseInt(id); 
    return list.find(action => action.id === numericId);
}

// -------------------------------------------------------------------
// LOGIQUE MODALE D'AFFICHAGE ET D'ÉVÉNEMENTS
// -------------------------------------------------------------------

/**
 * 🛑 GÉNÈRE LE CONTENU STATIQUE MINIMAL (TITRE, TYPE, ACTION).
 */
function generateActionDetail(action) {
    // Définitions de risque robustes
    const fallbackDefinitions = {
        "nul": "Aucune infraction pénale ou simple règlement interne.", "faible": "Contravention (...)",
        "modere": "Délit possible (...)", "eleve": "Délit lourd (...)",
        "tres_eleve": "Délit/Crime majeur (...)"
    };
    
    // 1. Gestion des données de risque
    const risque = action.risque || 'Inconnu';
    const cleanRiskKey = risque.toLowerCase().split('/')[0].trim().replace(/[ éèêà]/g, '_');
    const definition = (actionsData.definitions_risque || fallbackDefinitions)[cleanRiskKey] || "Définition de risque indisponible.";

    // 2. Données à afficher
    const titre = action.titre || action.action || 'Titre non spécifié';
    const type = action.type || 'Catégorie inconnue';
    const description = action.action || 'Description détaillée manquante.';
    const id = action.id;
    
    const hasCoords = action.coordonnees_initiales && action.coordonnees_initiales.latitude !== null;
    const coordsStatus = hasCoords ? `<span style="color: var(--color-success);">✅ LANCÉE</span>` : `<span style="color: var(--color-danger);">❌ NON LANCÉE</span>`;
    const latDisplay = action.coordonnees_initiales?.latitude ?? 'Non enregistrée';
    const lonDisplay = action.coordonnees_initiales?.longitude ?? 'Non enregistrée';
    
    // 3. Construction de la chaîne HTML
    return `
        <div class="action-detail-header" style="border-bottom: 2px solid var(--color-primary); padding-bottom: 10px;">
            <h1 id="action-title-detail">${titre} (ID ${id})</h1>
            <p class="action-category">Type: <strong>${type}</strong></p>
            <p class="action-category">Risque légal: <strong>${risque}</strong></p>
        </div>
        
        <div class="risk-indicator risk-${cleanRiskKey.toLowerCase()}">
            <h4>⚠️ Risque Légal : ${risque}</h4>
            <p class="risk-definition">${definition}</p>
        </div>

        <div style="padding: 20px 0;">
            <h4>Description de l'Opération :</h4>
            <p>${description}</p>
        </div>
        
        <div id="ia-plan-area" style="margin-top: 30px;">
            <h3 class="step-title">3. Plan Tactique et Stratégie (Groq AI)</h3>
            <div id="tactical-plan-result" class="ia-panel loading-indicator" style="padding: 10px;">
                Cliquer sur le bouton ci-dessous pour générer le plan tactique de cette action.
            </div>
            <button id="generate-plan-btn" class="action-btn regenerate-btn" data-action-id="${id}" style="margin-top: 10px;">
                 🧠 Générer le Plan Tactique IA
             </button>
        </div>

        <div class="action-coordinates" style="margin-top: 20px;">
             <h5>Statut de l'Action : ${coordsStatus}</h5>
             <p>Latitude : <span id="action-lat">${latDisplay}</span></p>
             <p>Longitude : <span id="action-lon">${lonDisplay}</span></p>
             <button class="action-btn map-btn" data-action-id="${id}" style="${hasCoords ? 'background-color: #6c757d;' : 'background-color: var(--color-primary);'}">
                 📍 ${hasCoords ? 'Mettre à jour la Position' : "Lancer l'Action (Enregistrer Coordonnées)"}
             </button>
        </div>
    `;
}


/**
 * 🛑 GÉNÈRE LE PLAN TACTIQUE VIA L'API IA (Le cœur de l'interaction)
 */
window.generateTacticalPlan = async function(e) {
    const button = e.target;
    const planResultDiv = actionsModal.querySelector('#tactical-plan-result');
    const actionId = button.dataset.actionId; // ID de l'action à analyser

    if (!planResultDiv || !actionId) return;

    planResultDiv.innerHTML = '<span class="loading-spinner"></span> Génération du plan en cours...';
    planResultDiv.classList.add('loading-indicator');
    button.disabled = true;

    try {
        // L'API est appelée en utilisant l'ID de l'action cliquée
        const response = await fetch(`/api/actions/plan_action?actionId=${actionId}`);
        const data = await response.json();

        planResultDiv.classList.remove('loading-indicator');
        button.disabled = false;
        
        if (response.status === 404) {
            planResultDiv.innerHTML = `<div class="error-message">❌ Action ID ${actionId} non trouvée sur le serveur. (Liste vide).</div>`;
        } else if (response.status !== 200 || data.error) {
            planResultDiv.innerHTML = `<div class="error-message">❌ Erreur lors de la génération IA. ${data.error || response.statusText}.</div>`;
        } else if (data.tactical_plan) {
            planResultDiv.innerHTML = data.tactical_plan;
        } else {
            planResultDiv.innerHTML = `<div class="error-message">❌ Réponse IA vide.</div>`;
        }

    } catch (error) {
        planResultDiv.classList.remove('loading-indicator');
        button.disabled = false;
        planResultDiv.innerHTML = '<div class="error-message">❌ Erreur de connexion API Groq.</div>';
    }
}

/**
 * Gère l'événement de clic pour enregistrer la position et simuler le lancement de l'action.
 */
function handleMapAction(e) {
    const actionId = e.target.dataset.actionId;
    
    if (navigator.geolocation) {
        console.log(`Tentative de géolocalisation pour lancer l'action ID ${actionId}.`);
        // Logique de géolocalisation complète doit être ici si nécessaire
    } else {
        alert("La géolocalisation n'est pas supportée par ce navigateur. Action non lancée.");
    }
}


/**
 * Ouvre la modale des actions et affiche le détail de l'action spécifiée.
 */
window.openActionModal = function(actionId) {
    const actionsModalContent = actionsModal ? actionsModal.querySelector('.modal-content') : null;

    if (!actionsModal || !actionsModalContent) return;

    // 1. Définir le contenu de chargement initial et afficher immédiatement la modale
    actionsModalContent.innerHTML = `
        <span class="close-button close-action-modal">&times;</span>
        <h2 id="action-title">${actionsData.titre_general}</h2>
        <div id="action-body">
            <div id="loading-message" style="text-align: center; padding: 30px;">
                <span class="loading-spinner"></span> Chargement des détails de l'action ${actionId} (via secours statique)...
            </div>
            <div id="action-detail-container"></div> 
        </div>
    `;
    actionsModal.style.display = 'block';
    
    actionsModal.querySelector('.close-button.close-action-modal').onclick = function() { actionsModal.style.display = "none"; };

    // 2. Tenter de recharger les données (via API ou Fallback)
    fetchActionsData().then(() => {
        
        const actionToDisplay = findActionById(actionId); 
        
        const detailContainer = actionsModalContent.querySelector('#action-detail-container');
        const loadingMessage = actionsModalContent.querySelector('#loading-message');

        if (loadingMessage) loadingMessage.style.display = 'none';

        if (!actionToDisplay) {
             if (detailContainer) {
                 detailContainer.innerHTML = `
                     <h2>Erreur</h2>
                     <p>Action ID ${actionId} non trouvée dans les données rechargées. Le fichier actions.json n'a pas chargé cette ID.</p>
                 `;
             }
             return;
        }

        // 3. Injection du contenu détaillé FINAL
        try {
            if (detailContainer) {
                detailContainer.innerHTML = generateActionDetail(actionToDisplay);

                // 4. RATTACHEMENT CRITIQUE des événements au nouveau DOM injecté
                actionsModalContent.querySelector('#generate-plan-btn')?.addEventListener('click', window.generateTacticalPlan);
                actionsModalContent.querySelector('.map-btn')?.addEventListener('click', window.handleMapAction);
            }
        } catch (renderError) {
             console.error(`ERREUR DE RENDU DÉTAILLÉ (Check generateActionDetail!):`, renderError);
             if (detailContainer) {
                 detailContainer.innerHTML = `
                     <h2>Erreur de Rendu</h2>
                     <p>Le contenu de l'action ne peut pas être affiché. Cause: ${renderError.message}</p>
                     <p>Vérifiez la structure de l'action ID ${actionId} dans actions.json.</p>`;
             }
        }
        
    }).catch(e => {
        console.error("Échec critique du chargement des données d'actions:", e);
    });
}


// -------------------------------------------------------------------
// FONCTIONS UTILITAIRES GLOBALES (MANTENUES POUR STABILITÉ)
// -------------------------------------------------------------------

// Ces fonctions vides sont cruciales pour éviter les ReferenceError des autres fichiers.
window.handleEditAction = (id) => { console.log(`Fonctionnalité EDIT temporairement désactivée pour ID: ${id}`); };
window.handleDeleteAction = (id) => { console.log(`Fonctionnalité DELETE temporairement désactivée pour ID: ${id}`); };
window.renderActionsConsolidatedView = () => { console.log("Rendu de la vue consolidée déclenché."); };

/**
 * Fonction utilitaire pour récupérer les actions (pour map.js)
 */
export function getActionsList() {
    return actionsData.liste_actions_consolidee || [];
}

/**
 * Initialisation de la modale d'actions (appelée par app.js)
 */
export function initActionsModule() {
     console.log('Module Actions (modalActions.js) initialisé.');
     // Gestionnaire de fermeture
     if (actionsModal) {
        document.querySelectorAll('.close-button.close-action-modal')?.forEach(btn => {
            btn.onclick = function() { actionsModal.style.display = "none"; }
        });
        window.onclick = function(event) {
            if (event.target == actionsModal) { actionsModal.style.display = "none"; }
        }
    }
}