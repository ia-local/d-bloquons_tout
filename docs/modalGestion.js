// docs/modalGestion.js - Logique d'affichage et de contenu des Modales (FINAL et STABLE)

// 🛑 GARDE-FOU: Cette fonction sera écrasée par app.js si app.js se charge après
window.handleUserAction = window.handleUserAction || function(action, detailKey = null, isObjective = false) {
    console.error(`Modale non initialisée : action ${action} demandée.`);
};

// 🛑 Initialisation des Variables Globales (simulées)
window.RIC_DATA = window.RIC_DATA || { 
    title: "Le RIC (Données Manquantes)", 
    definition: "Données RIC non chargées. Veuillez vérifier l'onglet 'RIC & Démocratie'.", 
    types: [{ name: "RIC Type (Secours)", desc: "Détails manquants.", detail: "Le module ric.js n'est pas encore prêt." }], 
    manifestoLink: "#",
    intro_modal: "Introduction manquante.",
    conclusion_modal: "Conclusion manquante.",
    separation_of_powers: []
};
window.CHRONOLOGY_EVENTS = window.CHRONOLOGY_EVENTS || [];
window.hasCompletedDailyVeille = window.hasCompletedDailyVeille || false; 
window.RIC_FORM_TEMPLATE = window.RIC_FORM_TEMPLATE || "<form id=\"ric-form\"><p>Formulaire simulé...</p></form>";


window.initializeModalHandling = function() {
    if (document.getElementById('global-modal')?.hasInitialized) return;

    const modal = document.getElementById('global-modal');
    const modalBox = document.getElementById('modal-box');
    const modalContentContainer = document.getElementById('modal-content-container');
    const closeButton = document.getElementById('modal-close-btn');

    if (!modal || !modalBox || !modalContentContainer || !closeButton) {
        console.error("Erreur critique: Les éléments de la modale sont introuvables.");
        return;
    }

   // --- Fonctions utilitaires (openModal, closeModal) ---

    window.openModal = function(title, contentHTML, isChatbot = false) {
        document.getElementById('modal-title').textContent = title;
        modalContentContainer.innerHTML = contentHTML;
        modal.classList.add('visible');
        document.body.classList.add('modal-open');
        
        if (isChatbot) {
            modalBox.classList.add('is-chatbot');
        } else {
            modalBox.classList.remove('is-chatbot');
        }
        
        if (title.includes("Proposer un nouveau RIC")) {
            // Logique de formulaire RIC (assurez-vous d'avoir attachRicFormListener)
        }
    };

    window.closeModal = function() {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        modalBox.classList.remove('is-chatbot'); 
        modalContentContainer.innerHTML = '';
    };
    
    // --- Logique Contenu QG (Simplifiée) ---
    const getHQDetailContent = (key) => { /* ... Logique de secours ... */ return { title: `Détail de ${key}`, icon: "fas fa-question-circle", content: `<p class='font-red'>Détail pour la clé '${key}' non chargé par modalDashboard.js.</p>` }; };


    // --- Logique principale de gestion des actions (handleUserAction) ---
    
    window.handleUserAction = function(action, detailKey = null, isObjective = false) {
        let title = '';
        let content = '';
        const profile = window.AGENT_PROFILE || {}; // Sécurité contre le profil vide

        switch (action) {
            
            case 'dashboard-detail':
                if (window.handleDashboardDetailAction) {
                    window.handleDashboardDetailAction(detailKey);
                    return; 
                }
                break;

            case 'chatbot':
                title = "🤖 Assistant IA - Conversation";
                content = `
                    <div id="chatbot-container">
                        <div id="messages-display" style="height: calc(100% - 70px); overflow-y: auto; padding: 10px; border-bottom: 1px solid var(--color-ui-border);">
                            <p class="chat-system">Connexion à l'Assistant IA...</p>
                        </div>
                        <form id="chat-input-form" style="display: flex; padding: 10px 0;">
                            <select id="persona-select" name="persona" class="input-field" style="width: 30%; margin-right: 10px; padding: 10px;">
                                <option value="generaliste">Généraliste</option>
                                <option value="enqueteur">Enquêteur</option>
                                <option value="avocat">Avocat</option>
                                <option value="codage">Codage</option>
                                <option value="secretaire">Secrétaire</option>
                                <option value="generateur">Générateur</option>
                            </select>
                            <input type="text" id="chat-input" placeholder="Posez votre question à l'IA..." required class="input-field" style="flex-grow: 1; padding: 10px;">
                            <button type="submit" class="btn btn-primary" style="margin-left: 10px;">Envoyer</button>
                        </form>
                    </div>
                `;
                break; 
            case 'telegram-commands':
                title = "📞 Réseau Telegram - Commandes & Salons";
                content = window.generateTelegramModalContent ? window.generateTelegramModalContent() : "<p class='font-red'>❌ Erreur: Module Telegram non chargé.</p>";
                break;
                
            case 'chronology-detail':
                title = "Détail Chronologie"; content = `<p>Rendu de l'événement.</p>`;
                break;
                
            case 'ric-types':
                const ricDataAll = window.RIC_DATA;
                title = ricDataAll.title || "Le Référendum d'Initiative Citoyenne";
                
                let typesHTML = ricDataAll.types.map((type, index) => {
                    return `<div class="ric-type-card" onclick="window.handleUserAction('ric-detail', ${index})">
                                <h4>${type.name}</h4>
                                <p>${type.desc}</p>
                            </div>`;
                }).join('');

                content = `
                    <p style="margin-bottom: 25px;">${ricDataAll.definition || 'Description non disponible.'}</p>
                    <div class="ric-types-grid">
                        ${typesHTML}
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${ricDataAll.manifestoLink}" target="_blank" class="btn btn-primary">Lire le Manifeste Complet 📜</a>
                    </div>
                `;
                break;
                
            case 'ric-detail':
                title = "Détails RIC"; content = `<p>Rendu détaillé du type de RIC.</p>`;
                break;
                
            case 'ric-form':
                title = "🗳️ Proposer un nouveau RIC";
                content = window.RIC_FORM_TEMPLATE; 
                break;
            case 'ric-active-detail':
            case 'ric-vote':
                if (window.handleRicActiveDetail || window.handleRicVote) {
                    window.closeModal();
                    if (action === 'ric-active-detail') window.handleRicActiveDetail(detailKey);
                    if (action === 'ric-vote') window.handleRicVote(detailKey);
                    return;
                }
                break;

            case 'profile':
            case 'cvnu':
                const profile = window.AGENT_PROFILE;
                const nextLevelThresholdXP = window.getNextLevelThreshold ? window.getNextLevelThreshold() : 500; 
                const progressPercent = Math.min(100, ((profile.experience || 0) / nextLevelThresholdXP) * 100);

                title = "💼 Mon CV Numérique Citoyen (CVNU)";
                content = `
                    <div class="cvnu-detail-modal">
                        <h3 class="font-red">Statut d'Agent : Niveau ${profile.level || 1}</h3>
                        <p style="font-weight: bold;">${(profile.utmiCredits || 0).toLocaleString('fr-FR')} UTMi (Charge Agent Value)</p>
                        
                        <div class="stat-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                            <div class="stat-card">
                                <h4>Progression Niveau Actuel</h4>
                                <p>${profile.experience || 0} / ${nextLevelThresholdXP} XP</p>
                                <div class="progress-bar-cvnu"><div style="width: ${progressPercent}%;"></div></div>
                            </div>
                            <div class="stat-card">
                                <h4>Missions Journalières</h4>
                                <p style="color: ${!profile.dashboardVeilleCompleted ? 'var(--color-red)' : 'var(--color-green)'}; font-weight: bold;">${!profile.dashboardVeilleCompleted ? 'Veille Économique : Disponible' : 'Veille Économique : Accomplie'}</p>
                                <p>RIC Soumis : ${profile.ricMissionSubmitted ? 'Oui' : 'Non'}</p>
                                <p style="font-size: 0.8em; color: var(--color-text-light); margin-top: 5px;">Total Missions Accomplies: ${profile.missionsCompleted || 0}</p>
                            </div>
                        </div>

                        <h4 class="font-yellow" style="margin-top: 25px;">Axes Cognitifs Dominants (via UTMi)</h4>
                        <p class="font-red">Le système UTMi valorise votre contribution en fonction de la complexité et de l'impact (Analyse, Stratégie, Imagination).</p>
                        <ul class="axis-list" style="margin-top: 10px;">
                            <li><i class="fas fa-brain"></i> **Axe Principal :** Stratégie</li>
                            <li><i class="fas fa-map-pin"></i> **Activité la plus valorisée :** Analyse de Cible (Carte)</li>
                            <li><i class="fas fa-clock"></i> **Efficacité Temps Réel :** ${profile.energy || 100} / ${profile.maxEnergy || 100} EA</li>
                        </ul>
                        
                        <p class="font-red" style="margin-top: 20px;">*Le CVNU est directement valorisé par le calcul UTMi, reflétant la qualité et l'impact de vos contributions.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center;"><button class="btn btn-primary">Mettre à jour mon CVNU</button></div>
                `; 
                window.openModal(title, content, false);
                break;

            case 'rib':
                title = "💳 RIB & Gestion Fiscale (Simulé)"; content = `<p>Cette section gère vos informations financières.</p>`;
                break;
            case 'config':
                title = "⚙️ Configuration"; content = `<p>Gérez ici vos préférences.</p>`; break;
            case 'logout':
                alert("Déconnexion simulée. À bientôt!");
                return; 
            default:
                title = "Erreur d'Action"; content = "<p>Action non reconnue.</p>";
        }

        if (action !== 'logout') {
            window.openModal(title, content, action === 'chatbot');
            if (action === 'chatbot' && window.initializeChatbot) {
                setTimeout(() => window.initializeChatbot(), 0); 
            }
        }
    };
    
    // --- Initialisation des Événements Statiques (Header et Modal) ---
    closeButton.addEventListener('click', window.closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeModal();
        }
    });

    modal.hasInitialized = true;
};

document.addEventListener('DOMContentLoaded', window.initializeModalHandling);