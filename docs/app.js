// docs/app.js - Logique Principale et Navigation (VERSION FINALE ET ROBUSTE)

// 🛑 Importation de la logique de Gamification depuis le composant dédié
import { updateProfileUI, grantReward, checkLevelUp, getNextLevelThreshold } from './modalProfile.js';
// 🛑 Importation des logiques du journal et RIC
import './journal.js'; 
import './modalJournal.js'; 
import './ric.js';

// --- NOUVEAU: GESTION DES MODES D'ÉTAT GLOBALES ---
window.APP_STATE = {
    MODE: '/session', 
    LOG_LEVEL: 'warn', 
    IS_DEV: false
};

window.setAppState = function(mode) {
    const validModes = ['/dev', '/focus', '/active', '/session'];
    if (!validModes.includes(mode)) {
        console.warn(`[STATE] Mode d'état inconnu: ${mode}. L'état n'a pas été modifié.`);
        return;
    }
    
    window.APP_STATE.MODE = mode;
    window.APP_STATE.IS_DEV = mode === '/dev';

    if (mode === '/dev') {
        window.APP_STATE.LOG_LEVEL = 'debug';
        console.log("🚦 Mode DEV activé: Logs détaillés.");
    } else if (mode === '/focus') {
        window.APP_STATE.LOG_LEVEL = 'info';
        console.log("🚦 Mode FOCUS activé: Concentré.");
    } else {
        window.APP_STATE.LOG_LEVEL = 'warn';
        console.log(`🚦 Mode SESSION activé: Logs de base.`);
    }
    
    if (window.initDevTools) {
        window.initDevTools(window.APP_STATE.IS_DEV);
    }
};

// Exposer les variables globales
window.MAP_CONFIG = {
    DEFAULT_CENTER: [46.603354, 1.888334], 
    DEFAULT_ZOOM: 6,
    MAX_ZOOM: 14
};

// Exposition globale des fonctions
window.updateProfileUI = updateProfileUI; 
window.grantReward = grantReward;
window.checkLevelUp = checkLevelUp; 
window.getNextLevelThreshold = getNextLevelThreshold;


// GESTIONNAIRE D'ACTIONS PROFIL (Fallback si non défini par modalProfile.js)
window.handleProfileAction = window.handleProfileAction || function(action) {
    console.warn(`[PROFILE ACTION FALLBACK] Action de profil '${action}' non gérée. Le module modalProfile.js est manquant.`);
};

// --- 1. DONNÉES STATIQUES (MAPPAGE API & PROFIL) ---
window.TELEGRAM_DATA = {
    topicLinks: {
        '🎨 Studio (Création)': 'https://t.me/c/2803900118/1232',
        '📝 Revendication (Détails)': 'https://t.me/c/2803900118/3',
        '🗳️ RIC (Référendum)': 'https://tme/c/2803900118/329',
        '👥 Organisation (Planning)': 'https://t.me/c/2803900118/2',
        '🗺️ Cartes (Ralliement)': 'https://t.me/c/2803900118/991',
        '📄 Documents (Législation)': 'https://tme/c/2803900118/13',
        '📞 Contacts (Presse/Élus)': 'https://t.me/c/2803900118/8',
        '⚖️ Auditions Libres': 'https://tme/c/2803900118/491'
    },
    commands: [
        { cmd: '/start', desc: 'Revenir au menu principal du Bot.' },
        { cmd: '/topics', desc: 'Accéder directement aux salons de discussion Telegram.' },
        { cmd: '/manifeste', desc: 'Lire un extrait du manifeste du mouvement.' },
        { cmd: '/ric', desc: 'Tout savoir sur le Référendum d\'Initiative Citoyenne.' },
        { cmd: '/destitution', desc: 'Comprendre la procédure de destitution (Art. 68).' },
        { cmd: '/greve', desc: 'Infos pratiques sur la Grève du 10 Septembre 2025.' },
        { cmd: '/caisse', desc: 'Afficher le statut de la Caisse de Manifestation.' }, 
        { cmd: '/imagine [desc]', desc: 'Générer une image libre via l\'IA (Simulé).' },
        { cmd: '/caricature [desc]', desc: 'Générer une caricature politique via l\'IA (Simulé).' },
        { cmd: '/caricature_plainte', desc: 'Caricature automatisée sur la Plainte Pénale.' },
        { cmd: '/ai_vision', desc: 'Générer la vision IA de la Plainte Pénale.' },
        { cmd: '/galerie', desc: 'Accéder à la galerie des images générées.' },
        { cmd: '/stats', desc: 'Afficher les statistiques d\'utilisation du bot.' },
        { cmd: '/help', desc: 'Afficher toutes les commandes.' },
        { cmd: '/petition', desc: 'Lancer une nouvelle pétition citoyenne.' },
        { cmd: '/inviter', desc: 'Générer un lien d\'invitation.' }
    ]
};
const API_TO_FILE_MAP = {
    '/api/chronology/events': 'events',
    '/map/data/manifestations': 'manifestation_points_2_octobre',
    '/api/ric/data': 'ric_details',
    '/api/ric/active-list': 'rics', 
    '/api/ric/form-template': 'ric_form_template', 
    '/api/dashboard/summary': 'dashboard_summary',
    '/api/dashboard/utmi-insights': 'utmi_insights',
    '/smartContract/api/dashboard-data': 'smartcontract_data',
    '/api/hq/finances': 'finances',
    '/api/hq/revendications': 'revendications',
    '/api/hq/actions': 'actions',
    '/api/hq/users': 'users',
    '/api/chat/history': 'chat_history',
    '/api/chat/message': 'chat_response',
    '/api/gee/tiles/COPERNICUS/S2_SR_HARMONIZED': 'gee_mock_data',
    '/api/journal/entries': 'journal_entries' 
};
window.AGENT_PROFILE = {
    level: 1, experience: 0, energy: 100, maxEnergy: 100, utmiCredits: 0, 
    missionsCompleted: 0, ricMissionSubmitted: false, dashboardVeilleCompleted: false 
};



// 🛑 FONCTION DE SECOURS: Tente de charger le JSON local (Correction I3.1)
async function attemptLocalFallback(originalUrl, originalMethod) {
    let data = null;
    
    const methodToCheck = originalMethod || 'GET'; 

    if (methodToCheck === 'GET') {
        const cleanUrl = originalUrl.includes('?') ? originalUrl.substring(0, originalUrl.indexOf('?')) : originalUrl;
        
        const fileNameRoot = API_TO_FILE_MAP[cleanUrl] || API_TO_FILE_MAP[originalUrl]; 

        if (fileNameRoot) {
            const localPath = `./src/json/${fileNameRoot}.json`; 
            try {
                const localResponse = await fetch(localPath); 
                
                if (localResponse.ok) {
                    data = await localResponse.json();
                    if (window.APP_STATE.LOG_LEVEL !== 'error') {
                        console.warn(`[MODE SECOURS SUCCÈS] Chargement réussi de : ${localPath}`);
                    }
                } else {
                     console.error(`[MODE SECOURS ÉCHEC FATAL] Fichier ${localPath} non trouvé (Statut: ${localResponse.status}).`);
                }
            } catch (localError) {
                console.error(`[MODE SECOURS ÉCHEC CRITIQUE] Erreur réseau lors du chargement local.`, localError);
            }
        }
    }
    return { data };
}

// --- 2. FONCTION UTILITAIRE DE RÉCUPÉRATION DE DONNÉES (Fetch Réel - Corrigé) ---

window.fetchData = async function(url, method = 'GET', body = null) {
    if (window.APP_STATE.LOG_LEVEL === 'debug') {
        console.log(`[Mode API] Tentative d'appel à l'API: ${url}`);
    }
    
    let data = null;
    const cleanUrlForListCheck = url.includes('?') ? url.substring(0, url.indexOf('?')) : url;
    const isListEndpoint = cleanUrlForListCheck.includes('/events') 
        || cleanUrlForListCheck.includes('/manifestations') 
        || cleanUrlForListCheck.includes('/api/rics') 
        || cleanUrlForListCheck.includes('/beneficiaries') 
        || cleanUrlForListCheck.includes('/api/chat/history')
        || cleanUrlForListCheck.includes('/api/journal/entries') 
        || cleanUrlForListCheck === '/api/ric/active-list';
    
    let apiFailed = false;

    // TENTATIVE DE FETCH RÉEL
    try {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
        if (body) { options.body = JSON.stringify(body); }

        const response = await fetch(url, options);

        if (response.ok) {
            data = await response.json();
        } else {
            apiFailed = true;
        }

    } catch (error) {
        console.error(`[Erreur Fetch] Échec lors de la requête API pour l'URL: ${url}`, error);
        apiFailed = true;
    }

    // --- LOGIQUE DE SECOURS ---
    if (apiFailed) {
        const fallbackResult = await attemptLocalFallback(url, method);
        data = fallbackResult.data;
    }
    
    // --- 🛑 LOGIQUE DE NORMALISATION ET DE VÉRIFICATION DE SÉCURITÉ UNIVERSELLE ---
    
    if (data) {
        if (cleanUrlForListCheck.includes('/map/data/manifestations') && !Array.isArray(data) && Array.isArray(data.manifestation_points)) {
            data = data.manifestation_points;
            if (window.APP_STATE.LOG_LEVEL !== 'warn') {
                 console.warn(`[NORMALISATION] Format manifestation_points extrait.`);
            }
        }
        
        if (isListEndpoint && !Array.isArray(data)) {
            console.error(`[SÉCURITÉ] L'endpoint ${url} a retourné un objet au lieu d'un tableau. Conversion forcée en tableau vide.`);
            return []; 
        }
        
        return data;
    }

    if (isListEndpoint) {
         if (window.APP_STATE.LOG_LEVEL !== 'error') {
            console.warn(`[STABILITÉ] Retour d'un tableau vide pour éviter le crash UI.`);
         }
        return []; 
    }

    return {}; 
};


// --- 3. LOGIQUE DE NAVIGATION (setupNavigation) ---
document.addEventListener('DOMContentLoaded', function() {
    
    window.setAppState('/dev'); 
    
    const navLinks = document.querySelectorAll('[data-page]');
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    
    // 🛑 FONCTION DE ROUTAGE CENTRALISÉE (CONSOLIDÉE)
    window.handleUserAction = function(action, value = null) {
        
        console.log(`[ACTION] Déclenchement de l'action utilisateur: ${action} (Valeur: ${value})`);

        let title = '';
        let content = '';
        const profile = window.AGENT_PROFILE || {};
        const nextLevelThresholdXP = window.getNextLevelThreshold ? window.getNextLevelThreshold() : 500; 
        const progressPercent = Math.min(100, ((profile.experience || 0) / nextLevelThresholdXP) * 100);

        switch (action) {
            
            // --- Cas Délégués à des Modules Spécialisés ---
            
            case 'ric-active-detail':
            case 'ric-vote':
                if (window.handleRicActiveDetail && window.handleRicVote) {
                    window.closeModal(); 
                    if (action === 'ric-active-detail') window.handleRicActiveDetail(value);
                    if (action === 'ric-vote') window.handleRicVote(value);
                    return; 
                }
                break;
                
            case 'dashboard-detail':
                if (window.handleDashboardDetailAction) {
                    window.handleDashboardDetailAction(value);
                    return;
                }
                break;
                
            case 'chatbot':
                 if (window.openChatbotModal) {
                    window.openChatbotModal();
                    return;
                }
                break;

            // 🛑 GESTION DU DÉTAIL DU JOURNAL (Nécessite modalJournal.js)
            case 'journal-detail':
                if (window.handleJournalDetailAction) {
                    window.handleJournalDetailAction(value);
                    return; 
                }
                break;

            // --- Cas de Rendu de Contenu (Géré ici) ---
                
            case 'telegram-commands':
                title = "📞 Réseau Telegram - Commandes & Salons";
                const topicLinksHTML = Object.entries(window.TELEGRAM_DATA.topicLinks).map(([label, url]) => 
                     `<li><a href="${url}" target="_blank" class="telegram-topic-link"><span class="topic-label"><i class="fab fa-telegram-plane"></i>${label}</span><i class="fas fa-chevron-right"></i></a></li>`
                ).join('');
                const commandsHTML = window.TELEGRAM_DATA.commands.map(cmd => 
                    `<div class="command-item"><p class="command-name">${cmd.cmd}</p><p class="command-desc">${cmd.desc}</p></div>`
                ).join('');

                content = `
                    <div class="telegram-modal-content">
                        <h4 class="telegram-section-title">Salons de Discussion (Topics)</h4>
                        <ul class="topic-list">${topicLinksHTML}</ul>
                        <h4 class="telegram-section-title" style="margin-top: 30px;">Commandes du Bot</h4>
                        <div class="command-list-grid">${commandsHTML}</div>
                    </div>
                `;
                break;
                
            case 'chronology-detail':
                title = "Détail Chronologie"; 
                const event = window.CHRONOLOGY_EVENTS.find(e => e.id == value);
                if (event) {
                    content = `
                        <h3 class="font-red">${event.title}</h3>
                        <p class="font-yellow">${event.subtitle}</p>
                        <p style="margin-top: 15px;">${event.description_long || event.description}</p>
                    `;
                } else {
                     content = `<p class="font-red">Détail de l'événement n°${value} non trouvé.</p>`;
                }
                
                if (arguments[2] === true && !window.hasCompletedDailyVeille) {
                    if (window.grantReward) {
                        window.grantReward(30, 5); 
                        window.hasCompletedDailyVeille = true;
                        if (window.displayEventObjective) window.displayEventObjective(); 
                    }
                }

                break;
                
            case 'ric-types':
                const ricDataAll = window.RIC_DATA;
                title = "Le Référendum d'Initiative Citoyenne";
                
                let typesHTML = (ricDataAll.types || []).map((type, index) => {
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
                const ricDataStatic = window.RIC_DATA;
                const ricTypeIndex = parseInt(value, 10);
                const typeDetail = ricDataStatic.types && ricDataStatic.types[ricTypeIndex];
                
                if (typeDetail) {
                    title = `📋 ${typeDetail.name} (Type de RIC)`;
                    content = `
                        <p class="font-yellow" style="font-weight: bold; margin-bottom: 15px;">${typeDetail.desc}</p>
                        <p>${typeDetail.detail || "Aucun détail supplémentaire n'a été fourni pour ce type de RIC."}</p>
                        <p style="margin-top: 20px; color: var(--color-accent-red); font-style: italic;">
                            ${ricDataStatic.conclusion_modal || "La proposition est en cours d'analyse pour l'intégration légale."}
                        </p>
                    `;
                } else {
                    title = "Erreur de détail RIC";
                    content = `<p class="font-red">Détail du type de RIC non trouvé à l'index ${value}.</p>`;
                }
                break;

            case 'ric-form':
                if (window.openModalWithForm) {
                    window.openModalWithForm('Soumettre une Initiative RIC', window.RIC_FORM_TEMPLATE, 'POST', '/api/rics/submit');
                    return;
                }
                break;

            // --- Cas de Profil (Rendu Statique) ---
            case 'profile':
            case 'cvnu':
                title = "💼 Mon CV Numérique Citoyen (CVNU)";
                content = `<p>CVNU Detail (rendu par app.js/handleUserAction)</p>`;
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
                console.warn(`[ACTION INCONNUE - ERREUR LOGIQUE] Action non gérée: ${action}`);
                return; 
        }

        // Bloc d'ouverture de modale centralisé
        if (title) { 
            window.openModal(title, content, action === 'chatbot');
            if (action === 'chatbot' && window.initializeChatbot) {
                setTimeout(() => window.initializeChatbot(), 0); 
            }
        }
    }
    
    // 🛑 Fonction de gestion unifiée des interactions (Cerveau de l'IA)
    window.handleGlobalInteraction = function(context, type, value) {
        
        if (context === 'profile') {
            window.handleUserAction(value); 
        
        } else if (context === 'map') {
            if (type === 'action' && window.handleMapAction) {
                window.handleMapAction(value);
            } else if (type === 'layer' && window.toggleMapLayer) {
                window.toggleMapLayer(value);
            } else {
                 console.error(`[INTENT] Fonction de carte (${type}) non chargée pour l'action ${value}.`);
            }
        }
        
        // Fermeture des menus après interaction
        const mapLayersToggle = document.getElementById('road-map'); 
        const mapLayersMenu = document.getElementById('map-layers-menu'); 
        
        if (context === 'profile' && userMenuDropdown) {
             userMenuDropdown.classList.add('hidden'); 
        } else if (context === 'map' && mapLayersMenu) {
             mapLayersMenu.classList.add('hidden');
             if (mapLayersToggle) mapLayersToggle.classList.remove('fab-open');
        }
    }

    // ... (Initialisations et listeners inchangés) ...

    // 🛑 NOUVEAU: Fonction de chargement HTML externe (LE FIX CRITIQUE)
    const loadExternalHTML = async (fileName, targetElement) => {
        try {
            const response = await fetch(fileName); 
            if (response.ok) {
                const htmlContent = await response.text();
                targetElement.innerHTML = htmlContent;
            } else {
                targetElement.innerHTML = `<p class="font-red">❌ Erreur lors du chargement de ${fileName} (Statut: ${response.status}).</p>`;
            }
        } catch (e) {
             targetElement.innerHTML = `<p class="font-red">❌ Erreur réseau lors du chargement de ${fileName}.</p>`;
        }
    };


    window.showPage = function(pageName) {
        
        // Logique de mise à jour de la classe 'active' pour la navigation
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) link.classList.add('active');
        });

        const currentActivePage = document.querySelector('.page.active');
        if (currentActivePage) {
             currentActivePage.classList.remove('active');
        }

        const targetPageId = `${pageName}-page`;
        const activePage = document.getElementById(targetPageId);
        
        if (!activePage) {
            console.error(`Erreur critique: La page ${pageName} (${targetPageId}) n'a pas été trouvée dans le DOM.`);
            return;
        }

        activePage.classList.add('active');
        if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log(`[AFFICHAGE OK] Page visible: #${targetPageId}`);
        
        const safeRenderCall = (renderFunc) => {
            try {
                if (typeof renderFunc === 'function') {
                    renderFunc(); 
                }
            } catch (e) {
                console.error(`Erreur lors du rendu de la page ${pageName}:`, e);
            }
        };

        // 🛑 LOGIQUE DE ROUTAGE CRITIQUE : CHARGEMENT HTML ASYNCHRONE + APPEL JS
        if (pageName === 'map') {
            safeRenderCall(() => {
                if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log("➡️ Entrée dans le **Module de Cartographie**.");
                if (window.initMap) {
                    window.initMap(); 
                    setTimeout(() => { 
                       if (window.globalMap) window.globalMap.invalidateSize(); 
                    }, 50); 
                }
            });
        } else if (pageName === 'dashboard') {
            safeRenderCall(window.loadDashboardData);
            if (window.APP_STATE.LOG_LEVEL !== 'warn') console.log("➡️ Accès au **Tableau de Bord Stratégique**.");
        } else if (pageName === 'settings') {
            loadExternalHTML('missions.html', activePage).then(() => {
                safeRenderCall(window.loadMissionsContent); 
            });
        } else if (pageName === 'ric') {
            loadExternalHTML('ric.html', activePage).then(() => { 
                safeRenderCall(window.loadRICContent);
            });
        } else if (pageName === 'journal') { // 🛑 ROUTAGE JOURNAL
            loadExternalHTML('journal.html', activePage).then(() => { 
                safeRenderCall(window.loadJournalEntries); 
            });
        } else if (pageName === 'home') {
            // 🛑 FIX CRITIQUE : Charger home.html avant d'appeler la logique JS (loadHomePageContent)
            loadExternalHTML('home.html', activePage).then(() => { 
                safeRenderCall(window.loadHomePageContent);
            });
        }
    }

    // Attacher les écouteurs d'événements
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            window.showPage(pageName);
        });
    }); 
    window.showPage('home'); 
    
    if (window.updateProfileUI) {
        window.updateProfileUI();
    }
});