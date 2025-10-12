// docs/modalGestion.js - Logique d'affichage et de contenu des Modales (Mise à jour pour Chatbot)

// 🛑 GARDE-FOU: Définir la fonction handleUserAction à la portée globale immédiatement
window.handleUserAction = window.handleUserAction || function(action, detailKey = null) {
    console.error(`Modale non initialisée : action ${action} demandée.`);
};

// 🛑 VARIABLES GLOBALES DE SECOURS (Définies ici si les scripts de page ne sont pas encore chargés)
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

window.initializeModalHandling = function() {
    // Si déjà initialisé, on sort
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
    };

    window.closeModal = function() {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        modalBox.classList.remove('is-chatbot'); 
        modalContentContainer.innerHTML = '';
    };
    
    // --- Contenu de Modale pour les Cartes QG (Inchangé) ---
    const getHQDetailContent = (key) => {
        switch(key) {
            case 'finances':
                return {
                    title: "Détail : Trésorerie du Mouvement",
                    icon: "fas fa-euro-sign",
                    content: `<p>Aperçu des mouvements de fonds, y compris les allocations UTMi, le solde de la caisse principale et le statut du Smart Contract.</p><p class="font-yellow">**Fonctionnalité complète :** Affichage des transactions récentes et du tableau de ventilation des dépenses (Simulé).</p><div style="text-align: center; margin-top: 20px;"><button class="btn btn-primary" onclick="alert('Module de Trésorerie en cours de développement.')">Accéder au Journal Comptable</button></div>`
                };
            case 'revendications':
                return {
                    title: "Détail : Moteur de la Démocratie",
                    icon: "fas fa-balance-scale",
                    content: `<p>Statut détaillé de chaque initiative citoyenne (RICs et Pétitions), y compris les seuils de validation et les prochaines échéances.</p><p class="font-yellow">**Prochaine étape :** Intégration du système de vote sécurisé par blockchain pour les propositions soumises.</p>`
                };
            case 'actions':
                return {
                    title: "Détail : Logistique des Actions",
                    icon: "fas fa-hammer",
                    content: `<p>Tableau de bord logistique pour le suivi en temps réel des actions sur le terrain (rassemblements, blocages) et l'efficacité des boycotts commerciaux ciblés.</p><p class="font-red">**Alerte :** 3 actions critiques en attente de validation légale.</p>`
                };
            case 'users':
                return {
                    title: "Détail : Gestion des Utilisateurs (CVNU)",
                    icon: "fas fa-users",
                    content: `<p>Analyse de la démographie des bénéficiaires et des militants (CVNU). Permet de cibler les zones à faible engagement et de coordonner les compétences disponibles.</p><p class="font-yellow">**Gamification :** Les 100 meilleurs CVNU sont éligibles pour les postes de coordination locale.</p>`
                };
            default:
                return {
                    title: "Détail QG Inconnu",
                    icon: "fas fa-question-circle",
                    content: `<p class='font-red'>Le détail pour la clé '${key}' est introuvable.</p>`
                };
        }
    };

    // --- Logique principale de gestion des actions (handleUserAction) ---
    
    window.handleUserAction = function(action, detailKey = null) {
        let title = '';
        let content = '';

        switch (action) {
            
            case 'chatbot':
                // 🛑 AJOUT DE L'ÉMOJI
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
                // 🛑 APPEL DU NOUVEAU FICHIER MODALTELEGRAM.JS ET AJOUT DE L'ÉMOJI
                title = "📞 Réseau Telegram - Commandes & Salons";
                if (window.generateTelegramModalContent) {
                    content = window.generateTelegramModalContent();
                } else {
                    content = "<p class='font-red'>❌ Erreur: Le module modalTelegram.js n'a pas été chargé.</p>";
                }
                break;
                
            case 'chronology-detail':
                const event = window.CHRONOLOGY_EVENTS.find(e => e.id === detailKey);
                
                if (!event) {
                    title = "Erreur de détail Chronologie";
                    content = "<p class='font-red'>Événement historique introuvable.</p>";
                    break;
                }
                
                title = `Événement : ${event.title}`;
                content = `
                    <h3 class="font-red">${event.subtitle} (${event.city})</h3>
                    <p>Date : ${new Date(event.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="margin-top: 15px;">${event.description}</p>
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
                const ricType = ricDataDetail.types[parseInt(detailKey)]; 
                
                if (!ricType) {
                    title = "Erreur de détail RIC";
                    content = "<p class='font-red'>Détail de ce type de RIC introuvable.</p>";
                    break;
                }
                
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
                
            case 'ric-form':
                title = "🗳️ Proposer un nouveau RIC";
                const formTemplate = window.RIC_FORM_TEMPLATE; 
                content = formTemplate || "<p class='font-red'>Erreur: Template de formulaire non chargé. Veuillez recharger la page RIC.</p>";
                break;
                
            case 'cvnu':
                title = "💼 Mon CV Numérique Citoyen (CVNU)";
                content = `<p>Début de la gamification! Le CVNU agrège votre engagement et vos compétences.</p><p class="font-yellow" style="margin-top: 15px;">**Contenu Simulée :** Vous avez 450 points d'engagement.</p><div style="margin-top: 20px; text-align: center;"><button class="btn btn-primary">Mettre à jour mon CVNU</button></div>`; 
                break;
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
            // Passe le titre, le contenu et l'indicateur isChatbot (pour le style) à openModal
            window.openModal(title, content, action === 'chatbot');

            if (action === 'chatbot' && window.initializeChatbot) {
                setTimeout(() => window.initializeChatbot(), 0); 
            }
            
            if (action === 'ric-form') {
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
        }
    }
    
    // --- Initialisation des Événements Statiques (Header et Modal) ---

    closeButton.addEventListener('click', window.closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.closeModal();
        }
    });

    // Le menu utilisateur est géré dans app.js
    
    // Marquer l'initialisation comme complète
    modal.hasInitialized = true;
};

// Lancer l'initialisation après le chargement du DOM
document.addEventListener('DOMContentLoaded', window.initializeModalHandling);