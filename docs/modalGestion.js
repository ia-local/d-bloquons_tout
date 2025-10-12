// docs/modalGestion.js - Logique d'affichage et de contenu des Modales (Correction Critique)

// 🛑 GARDE-FOU: Définir la fonction handleUserAction à la portée globale immédiatement
// Cela empêche Telegraf/App.js de lever une erreur si la navigation se déclenche trop tôt.
window.handleUserAction = window.handleUserAction || function(action, detailKey = null) {
    console.error(`Modale non initialisée : action ${action} demandée.`);
};


window.initializeModalHandling = function() {
    // Si déjà initialisé, on sort
    if (document.getElementById('global-modal')?.hasInitialized) return;

    const modal = document.getElementById('global-modal');
    const modalContentContainer = document.getElementById('modal-content-container');
    const closeButton = document.getElementById('modal-close-btn');

    if (!modal || !modalContentContainer || !closeButton) {
        console.error("Erreur critique: Les éléments de la modale sont introuvables.");
        return;
    }

    // --- Fonctions utilitaires (openModal, closeModal, getRICData) ---

    window.openModal = function(title, contentHTML) {
        document.getElementById('modal-title').textContent = title;
        modalContentContainer.innerHTML = contentHTML;
        modal.classList.add('visible');
        document.body.classList.add('modal-open'); 
    };

    window.closeModal = function() {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        modalContentContainer.innerHTML = ''; 
    };

    const getRICData = () => {
        // Cette fonction devrait idéalement lire des données mises en cache ou faire un fetch ciblé
        // Pour l'instant, elle retourne le mock structuré
        return window.MOCK_DATA && window.MOCK_DATA['/api/ric/data'] 
            ? window.MOCK_DATA['/api/ric/data'] 
            : { 
                title: "Le RIC", 
                definition: "Données non chargées.", 
                types: [], 
                manifestoLink: "#",
                intro_modal: "Données manquantes.",
                conclusion_modal: "",
                separation_of_powers: []
            };
    };
    
    // --- NOUVEAU: Contenu de Modale pour les Cartes QG ---
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
            
            // 🛑 NOUVEAU CAS: Affichage des détails du Tableau de Bord QG
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
                const ricDataDetail = getRICData();
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
                const ricDataAll = getRICData();
                title = ricDataAll.title || "Le Référendum d'Initiative Citoyenne";
                
                let typesHTML = ricDataAll.types.map(type => `
                    <div class="ric-type-card">
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
                // Ceci nécessite que la variable soit définie (ex: dans app.js ou ric.js)
                const formTemplate = window.RIC_FORM_TEMPLATE; 
                content = formTemplate || "<p class='font-red'>Erreur: Template de formulaire non chargé. Vérifiez app.js/ric.js.</p>";
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
            window.openModal(title, content);

            // 🛑 Initialiser la soumission du formulaire après l'ouverture
            if (action === 'ric-form') {
                const ricForm = document.getElementById('ric-form');
                if (ricForm) {
                    ricForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        console.log("Formulaire RIC soumis ! (Action simulée)");
                        // Ici, vous enverriez les données à l'API POST /api/rics
                        
                        // Simulation de succès
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

    // 1. Menu utilisateur (Gestion des actions)
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    if (userMenuDropdown) {
        userMenuDropdown.querySelectorAll('a[data-action]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.getAttribute('data-action');
                window.handleUserAction(action);
            });
        });
    }
    
    // Marquer l'initialisation comme complète
    modal.hasInitialized = true;
};

// Lancer l'initialisation après le chargement du DOM
document.addEventListener('DOMContentLoaded', window.initializeModalHandling);