// docs/modalGestion.js - Logique d'affichage et de contenu des Modales (FINALISÉ GAMIFICATION)

// 🛑 GARDE-FOU: Définir la fonction handleUserAction à la portée globale immédiatement
window.handleUserAction = window.handleUserAction || function(action, detailKey = null, isObjective = false) {
    console.error(`Modale non initialisée : action ${action} demandée.`);
};

// 🛑 VARIABLES GLOBALES DE SECOURS (Elles seront mises à jour par ric.js et home.js au chargement)
window.RIC_DATA = window.RIC_DATA || { 
    title: "Le RIC", 
    definition: "Données non chargées.", 
    types: [], 
    manifestoLink: "#",
    intro_modal: "Données manquantes.",
    conclusion_modal: "",
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
        
        // Attachement du Formulaire RIC après injection si l'action est 'ric-form'
        if (title.includes("Proposer un nouveau RIC")) {
            attachRicFormListener();
        }
    };

    window.closeModal = function() {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        modalBox.classList.remove('is-chatbot'); 
        modalContentContainer.innerHTML = '';
    };
    
    // --- Logique Contenu QG (Inchangée) ---
    const getHQDetailContent = (key) => { 
        switch(key) {
            case 'finances': return { title: "Détail : Trésorerie du Mouvement", icon: "fas fa-euro-sign", content: `<p>Aperçu des mouvements de fonds...</p>` };
            case 'revendications': return { title: "Détail : Moteur de la Démocratie", icon: "fas fa-balance-scale", content: `<p>Statut détaillé de chaque initiative citoyenne...</p>` };
            case 'actions': return { title: "Détail : Logistique des Actions", icon: "fas fa-hammer", content: `<p>Tableau de bord logistique pour le suivi...</p>` };
            case 'users': return { title: "Détail : Gestion des Utilisateurs (CVNU)", icon: "fas fa-users", content: `<p>Analyse de la démographie des bénéficiaires...</p>` };
            default: return { title: "Détail QG Inconnu", icon: "fas fa-question-circle", content: `<p class='font-red'>Détail pour la clé '${key}' introuvable.</p>` };
        }
    };

    // --- Logique de soumission de formulaire RIC ---
    function attachRicFormListener() {
        const ricForm = document.getElementById('ric-form');
        if (ricForm) {
            ricForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log("Formulaire RIC soumis ! (Action simulée)");
                
                window.closeModal();
                window.openModal("✅ Initiative soumise", "<p>Votre proposition de RIC a été enregistrée. Elle sera soumise à l'étape de validation juridique citoyenne.</p>");
            });
        }
    }


    // --- Logique principale de gestion des actions (handleUserAction) ---
    
    window.handleUserAction = function(action, detailKey = null, isObjective = false) {
        let title = '';
        let content = '';

        switch (action) {
            
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
                const event = window.CHRONOLOGY_EVENTS.find(e => e.id === detailKey);
                const isVeilleObjective = isObjective; 

                if (!event) { title = "Erreur de détail Chronologie"; content = "<p class='font-red'>Événement historique introuvable.</p>"; break; }
                
                title = `Événement : ${event.title} (${event.city})`;
                let bonusMessage = '';
                
                if (isVeilleObjective && event.id === '16' && !window.hasCompletedDailyVeille && typeof window.grantReward === 'function') {
                    const XP_VEILLE = 30;
                    const ENERGY_GAIN_VEILLE = 5;
                    
                    window.hasCompletedDailyVeille = true;
                    window.grantReward(XP_VEILLE, ENERGY_GAIN_VEILLE);
                    
                    bonusMessage = `<div class="alert alert-success" style="margin-top: 15px;"><i class="fas fa-award"></i> **RÉCOMPENSE DE VEILLE ACTIVE :** +${XP_VEILLE} UTMi et +${ENERGY_GAIN_VEILLE} EA gagnés !</div>`;
                    setTimeout(window.loadHomePageContent, 50); 
                } else if (window.hasCompletedDailyVeille && event.id === '16') {
                    bonusMessage = `<div class="alert alert-success" style="margin-top: 15px;"><i class="fas fa-check-circle"></i> Objectif de Veille Active déjà accompli.</div>`;
                }

                
                content = `
                    <h3 class="font-red">${event.subtitle}</h3>
                    <p>Date : ${new Date(event.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    ${bonusMessage}
                    <p style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--color-border, #444);">${event.description}</p>
                `;
                break;
                
            case 'dashboard-detail':
                const hqDetail = getHQDetailContent(detailKey);
                title = hqDetail.title;
                content = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <i class="${hqDetail.icon}" style="font-size: 2.5rem; color: var(--color-accent-red);"></i>
                    </div>
                    <div class="content-detail-hq">
                        ${hqDetail.content}
                    </div>
                `;
                break;
                
            case 'ric-detail':
                const ricDataDetail = window.RIC_DATA;
                
                if (!ricDataDetail || !ricDataDetail.types || ricDataDetail.types.length === 0) {
                     title = "Erreur de chargement des données RIC";
                     content = "<p class='font-red'>Les données RIC n'ont pas été chargées. Veuillez visiter la page RIC d'abord.</p>";
                     break;
                }
                
                const ricType = ricDataDetail.types[parseInt(detailKey)]; 
                
                if (!ricType) { title = "Erreur de détail RIC"; content = "<p class='font-red'>Détail de ce type de RIC introuvable.</p>"; break; }
                
                title = `Détails : ${ricType.name}`;
                content = `
                    <div class="ric-detail-specific">
                        <h3 class="font-red">${ricDataDetail.intro_modal}</h3>
                        <p style="font-weight: bold; margin-bottom: 20px;">Le RIC est l'outil essentiel pour redonner le pouvoir aux citoyens. Il se décline en plusieurs formes :</p>
                        
                        <div class="specific-type-section" style="margin-top: 20px; border-left: 4px solid var(--color-accent-yellow); padding-left: 15px; background: var(--color-ui-primary); padding: 15px; border-radius: 4px;">
                            <h4 class="font-yellow" style="margin-bottom: 5px;">${ricType.name}</h4>
                            <p style="font-style: italic; margin-bottom: 10px;">${ricType.desc}</p>
                            <p>${ricType.detail}</p>
                        </div>
                        
                        <p style="margin-top: 30px;">${ricDataDetail.conclusion_modal}</p>
                    </div>
                `;
                break;

            // 🛑 DÉBUT DES CAS QUI MANQUAIENT :
            case 'ric-types':
                const ricDataAll = window.RIC_DATA;
                title = ricDataAll.title || "Le Référendum d'Initiative Citoyenne";
                
                let typesHTML = ricDataAll.types.map((type, index) => `
                    <div class="ric-type-card" onclick="window.handleUserAction('ric-detail', ${index})">
                        <h4>${type.name}</h4>
                        <p>${type.desc}</p>
                    </div>
                `).join('');

                content = `
                    <p style="margin-bottom: 25px;">${ricDataAll.definition}</p>
                    <div class="ric-types-grid">
                        ${typesHTML}
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${ricDataAll.manifestoLink}" target="_blank" class="btn btn-primary">Lire le Manifeste Complet 📜</a>
                    </div>
                `;
                break;
                // 🛑 FIN DU CAS QUI MANQUAIT

            case 'ric-form':
                title = "🗳️ Proposer un nouveau RIC";
                // Ceci utilise la variable globale chargée par modalRic.js
                content = window.RIC_FORM_TEMPLATE; 
                break;
            case 'ric-active-detail':
                // 🛑 ACHEMINEMENT VERS LA LOGIQUE DÉDIÉE DANS modalRic.js
                if (window.handleRicActiveDetail) {
                    window.closeModal(); // Ferme si une autre modale est ouverte
                    window.handleRicActiveDetail(detailKey);
                    return;
                }
                break;
            
            case 'ric-vote':
                // 🛑 ACHEMINEMENT VERS LA LOGIQUE DÉDIÉE DANS modalRic.js
                if (window.handleRicVote) {
                    window.closeModal();
                    window.handleRicVote(detailKey);
                    return;
                }
                break;
            // ... dans window.handleUserAction (modalGestion.js)
            case 'profile':
            case 'cvnu':
                const profile = window.AGENT_PROFILE;
                
                // 🛑 UTILISATION DE LA FONCTION STABLE getNextLevelThreshold()
                // Calcule l'XP nécessaire pour le niveau suivant
                const nextLevelThresholdXP = window.getNextLevelThreshold ? window.getNextLevelThreshold() : 500; 
                
                const engagementScore = profile.experience;
                const utmiPerLevel = nextLevelThresholdXP; 
                const progressPercent = Math.min(100, (engagementScore / utmiPerLevel) * 100);

                // Détermination des statuts de mission
                // NOTE: dashboardVeilleCompleted est FALSE si la mission est disponible (voir dashboard.js)
                const isDashboardVeilleAvailable = !profile.dashboardVeilleCompleted; 
                const veilleStatus = isDashboardVeilleAvailable ? 'Veille Économique : Disponible' : 'Veille Économique : Accomplie';
                const veilleColor = isDashboardVeilleAvailable ? 'var(--color-red)' : 'var(--color-green)'; // Rouge pour inciter à l'action

                const missionStatus = profile.ricMissionSubmitted ? 'RIC Soumise' : 'RIC Non Soumise';

                title = "💼 Mon CV Numérique Citoyen (CVNU)";
                content = `
                    <div class="cvnu-detail-modal">
                        <h3 class="font-red">Statut d'Agent : Niveau ${profile.level}</h3>
                        <p style="font-weight: bold;">${profile.utmiCredits.toLocaleString('fr-FR')} UTMi (Charge Agent Value)</p>
                        
                        <div class="stat-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                            <div class="stat-card">
                                <h4>Progression Niveau Actuel</h4>
                                <p>${engagementScore} / ${utmiPerLevel} XP (Prochain Seuil)</p>
                                <div class="progress-bar-cvnu"><div style="width: ${progressPercent}%;"></div></div>
                            </div>
                            <div class="stat-card">
                                <h4>Missions Journalières</h4>
                                <p style="color: ${veilleColor}; font-weight: bold;">${veilleStatus}</p>
                                <p>${missionStatus}</p>
                                <p style="font-size: 0.8em; color: var(--color-text-light); margin-top: 5px;">Total Missions Accomplies: ${profile.missionsCompleted}</p>
                            </div>
                        </div>

                        <h4 class="font-yellow" style="margin-top: 25px;">Axes Cognitifs Dominants (via UTMi)</h4>
                        <p class="font-red">Le système UTMi valorise votre contribution en fonction de la complexité et de l'impact (Analyse, Stratégie, Imagination).</p>
                        <ul class="axis-list" style="margin-top: 10px;">
                            <li><i class="fas fa-brain"></i> **Axe Principal :** Stratégie</li>
                            <li><i class="fas fa-map-pin"></i> **Activité la plus valorisée :** Analyse de Cible (Carte)</li>
                            <li><i class="fas fa-clock"></i> **Efficacité Temps Réel :** ${profile.energy} / ${profile.maxEnergy} EA</li>
                        </ul>
                        
                        <p class="font-red" style="margin-top: 20px;">*Le CVNU est directement valorisé par le calcul UTMi, reflétant la qualité et l'impact de vos contributions.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center;"><button class="btn btn-primary">Mettre à jour mon CVNU</button></div>
                `; 
                window.openModal(title, content, false);
                break;
// ... (Reste de modalGestion.js)

            case 'rib':
                title = "💳 RIB & Gestion Fiscale (Simulé)";
                content = `<p>Cette section gère vos informations pour les **Allocations UTMi** et le suivi des **Impôts Citoyens**.</p><p class="font-red" style="margin-top: 15px;">**Note de Sécurité :** Cette interface est simulée.</p>`;
                break;
            case 'config':
                title = "⚙️ Configuration et Préférences";
                content = `<p>Gérez ici vos notifications, la confidentialité et les paramètres de votre compte.</p>`;
                break;
            case 'logout':
                alert("Déconnexion simulée. À bientôt!");
                return; 
            default:
                title = "Erreur d'Action";
                content = "<p>Action non reconnue.</p>";
        }

        if (action !== 'logout') {
            window.openModal(title, content, action === 'chatbot');
            if (action === 'chatbot' && window.initializeChatbot) {
                setTimeout(() => window.initializeChatbot(), 0); 
            }
        }
    }
    
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