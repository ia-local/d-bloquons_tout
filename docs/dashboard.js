// docs/dashboard.js - Contient la logique de chargement et de rendu du Tableau de Bord QG (FINAL et COMMENTÉ)

// Clé et temps de recharge pour la mission journalière (24 heures)
const LAST_VEILLE_KEY = 'lastDashboardVeilleTimestamp';
const VEILLE_COOLDOWN_MS = 24 * 60 * 60 * 1000; 

// --- Fonctions Utilitaires de Gamification et Temps ---

/**
 * Vérifie si la mission de Veille Économique est disponible (après 24h).
 * Met à jour le statut global window.AGENT_PROFILE.dashboardVeilleCompleted.
 * @returns {boolean} True si la mission est disponible.
 */
function checkVeilleAvailability() {
    const lastTimestamp = parseInt(localStorage.getItem(LAST_VEILLE_KEY) || '0', 10);
    const currentTime = Date.now();
    const isAvailable = (currentTime - lastTimestamp) >= VEILLE_COOLDOWN_MS;

    if (window.AGENT_PROFILE) {
        // Le statut est 'false' si la mission est disponible, 'true' si elle est complétée.
        window.AGENT_PROFILE.dashboardVeilleCompleted = !isAvailable;
    }
    
    // Logique DEVOPS pour le temps restant (utile pour les logs de débogage)
    const timeRemaining = VEILLE_COOLDOWN_MS - (currentTime - lastTimestamp);
    if (!isAvailable && window.APP_STATE?.LOG_LEVEL !== 'warn') {
        const remainingHours = Math.floor(timeRemaining / (60 * 60 * 1000));
        console.log(`[DEVOPS/SMART] Veille verrouillée. Temps restant (Temporel): ${remainingHours}h.`);
    }

    return isAvailable;
}

/**
 * Exécute la récompense de la mission de Veille et met à jour le localStorage.
 * Déclenche une mise à jour du rendu du Dashboard pour désactiver le bouton.
 */
function executeVeilleReward() {
    // Vérification de la dépendance externe (fournie par modalProfile.js)
    if (typeof window.grantReward !== 'function') {
        console.error("Erreur: La fonction grantReward n'est pas disponible pour la récompense de Veille.");
        return;
    }
    
    const XP_VEILLE_DASHBOARD = 50;
    const ENERGY_GAIN_DASHBOARD = 7;
    
    window.grantReward(XP_VEILLE_DASHBOARD, ENERGY_GAIN_DASHBOARD);
    
    localStorage.setItem(LAST_VEILLE_KEY, Date.now().toString());
    if (window.AGENT_PROFILE) {
        window.AGENT_PROFILE.dashboardVeilleCompleted = true; 
    }
    
    console.log(`🎉 BONUS JOURNALIER : +${XP_VEILLE_DASHBOARD} UTMi et +${ENERGY_GAIN_DASHBOARD} EA pour la Veille Économique. Mise à jour du timestamp.`);
    
    // Force le rechargement du Dashboard pour refléter le statut "ACCOMPLIE"
    window.loadDashboardData(true);
}


// --- Fonction Principale de Rendu ---

/**
 * Charge les données du Tableau de Bord QG en appelant 8 endpoints en parallèle.
 * @param {boolean} [forceReload=false] - Forcer le rechargement même si la grille est déjà chargée.
 */
window.loadDashboardData = async function(forceReload = false) {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return; // Assure que l'élément DOM est présent

    const missionAvailable = checkVeilleAvailability();

    if (grid.hasLoaded && !forceReload) {
        return; // Évite un rechargement inutile si la page est déjà rendue.
    }
    
    grid.innerHTML = '<p class="font-yellow">Connexion au Quartier Général de données...</p>';

    try {
        // 🛑 Lancement des 8 requêtes API en parallèle via window.fetchData (défini dans app.js)
        // 🛑 ÉTAPE 1 : Lancement des 8 requêtes API en parallèle 
        const [
            summaryData, utmiData, smartContractData, pointsData, 
            financesData, revendicationsData, actionsData, usersData
        ] = await Promise.all([
            window.fetchData('/api/dashboard/summary'),           // 1. Synthèse générale
            window.fetchData('/api/dashboard/utmi-insights'),     // 2. Détails UTMi
            window.fetchData('/smartContract/api/dashboard-data'),// 3. Smart Contract / RBU
            window.fetchData('/map/data/manifestations'),         // 4. Points de ralliement
            window.fetchData('/api/hq/finances'),                 // 5. Finances QG
            window.fetchData('/api/hq/revendications'),           // 6. Revendications QG
            window.fetchData('/api/hq/actions'),                  // 7. Actions QG
            window.fetchData('/api/hq/users')               // 8. Utilisateurs QG (Agents/Manifestants)
        ]);

        // 🛑 DÉCLARATION DES VARIABLES HQ (Sécurisée contre les objets vides {})
        // 🛑 ÉTAPE 2 : Sécurisation et assignation des données (utilisant || {})
        const points = pointsData || [];
        const totalPoints = points.length;
        const sD = summaryData || {}; 
        const uD = utmiData || {}; 
        const scD = smartContractData || {};
        const fD = financesData || {}; 
        const rD = revendicationsData || {}; 
        const aD = actionsData || {}; 
        const usrD = usersData || {}; 
        const totalUtmi = uD.totalUtmi || 0;
        const totalTaxCollected = uD.totalTaxCollected || 0;
        
        // --- RENDU HTML ---
        
        let html = '<h2 class="font-yellow" style="text-align: center; margin-bottom: 20px;">Tableau de Bord : Indicateurs Clés</h2>';
        
        // 1. CARTE DE MISSION JOURNALIÈRE
        const missionCardHTML = `
            <div id="veille-mission-card" class="feature-card insight-card" style="grid-column: 1 / -1; border-left: 5px solid ${missionAvailable ? 'var(--color-green)' : 'var(--color-accent-red)'}; cursor: ${missionAvailable ? 'pointer' : 'default'};">
                <h3 class="${missionAvailable ? 'font-green' : 'font-red'}" style="font-size: 1.2rem; margin-bottom: 5px;">
                    <i class="fas fa-search"></i> Veille Économique (Mission Journalière)
                </h3>
                <p class="metric-value font-red">
                    <b>Statut : ${missionAvailable ? 'DISPONIBLE' : 'ACCOMPLIE POUR AUJOURD\'HUI'}</b>
                </p>
                <p class="metric-desc">
                    ${missionAvailable ? 'Cliquez sur le bouton pour analyser les données et réclamer votre bonus de Veille ( +50 UTMi ).' : 'Revenez demain (ou dans 24h) pour votre prochaine récompense.'}
                </p>
                <button id="claim-veille-btn" class="btn ${missionAvailable ? 'btn-primary' : 'btn-secondary'}" ${missionAvailable ? '' : 'disabled'} style="margin-top: 10px;">
                    ${missionAvailable ? 'Réclamer la Récompense' : 'Mission Verrouillée'}
                </button>
            </div>
        `;
        html += missionCardHTML; 

        // --- 🛑 GRILLE PRINCIPALE DE 8 CARTES (Synthèse) 🛑 ---
        // Cette grille est la première chose que l'utilisateur voit et fournit des liens cliquables.
        
        const allMainMetrics = [
            // --- VALORISATION UTMi/RBU ---
            { title: "Impact UTMi Total", value: totalUtmi.toFixed(2), desc: `Score d'Unité et de Transformation du Mouvement`, color: 'var(--color-blue)', key: 'utmi_insights' },
            { title: "Taxe AI Traitée (Est.)", value: totalTaxCollected.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), desc: `Base de financement potentielle du RBU (Art. Fiscal IA)`, color: 'var(--color-blue)', key: 'utmi_insights' },
            { title: "Bénéficiaires RBU", value: (scD.nombreBeneficiaires || 0).toLocaleString('fr-FR'), desc: `Trésorerie Contrat : ${(scD.tresorerie || 0).toFixed(2)} €`, color: 'var(--color-blue)', key: 'utmi_insights' },
            { title: "Allocation Est. (Mois)", value: (sD.monthlyAllocation || 0).toFixed(2), desc: `Basé sur le solde de la Caisse Manifeste`, color: 'var(--color-blue)', key: 'utmi_insights' },
            
            // --- SURVEILLANCE DE TERRAIN ---
            { title: "Solde Caisse Manifeste", value: `${(fD.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Alertes financières : ${sD.activeAlerts || 0}`, color: 'var(--color-yellow)', key: 'finances' },
            { title: "Manifestants Est.", value: (sD.estimatedManifestantCount || 0).toLocaleString('fr-FR'), desc: `${totalPoints} Points de Rassemblement`, color: 'var(--color-yellow)', key: 'users' }, 
            { title: "Boycotts Actifs", value: aD.boycottsCommerce || 0, desc: `Actions logistiques totales : ${aD.actionsTotales || 0}`, color: 'var(--color-yellow)', key: 'actions' },
            { title: "RICs Actifs", value: rD.ricsActifs || 0, desc: `Pétitions en cours : ${rD.petitionsEnCours || 0}`, color: 'var(--color-yellow)', key: 'revendications' }
        ];

        html += '<h3 class="font-blue" style="text-align: center; margin-top: 20px; margin-bottom: 10px;">Synthèse Globale (8 Indicateurs Clés)</h3>';
        html += '<div id="main-insights-grid" class="feature-grid">'; 
        
        // Rendu des 8 cartes cliquables
        html += allMainMetrics.map(m => `
            <div class="feature-card insight-card clickable-metric-card" 
                 style="border-bottom: 3px solid ${m.color}; cursor: pointer;" 
                 data-hq-key="${m.key}">
                <h3 style="color: inherit; font-size: 1.1rem; margin-bottom: 5px;">${m.title}</h3>
                <p class="metric-value font-red"><b>${m.value}</b></p>
                <p class="metric-desc">${m.desc}</p>
            </div>
        `).join('');

        html += '</div>'; // Fin de #main-insights-grid

        // --- 🛑 DEUXIÈME GRILLE : QG DE GESTION (5 DÉTAILS APPROFONDIS) 🛑 ---
        // Cette grille offre des liens pour les modales de détail du Quartier Général.
        
        const qgCards = [
            { title: "Gestion Financière", color: 'var(--color-red)', key: 'finances', metrics: [{ label: "Solde Opérations", value: `${fD.soldeOperations || 0} €` }, { label: "Dépenses Mensuelles", value: `${fD.depensesMensuelles || 0} €` }], desc: "Analyse des flux de trésorerie et alertes budgétaires." },
            { title: "Opérations de Terrain", color: 'var(--color-yellow)', key: 'actions', metrics: [{ label: "Agents Actifs", value: usrD.agentsActifs || 0 }, { label: "Taux de Réussite", value: `${aD.successRate || 0}%` }], desc: "Suivi des logistiques, des boycotts et des réussites sur site." },
            { title: "Gestion des Revendications", color: 'var(--color-blue)', key: 'revendications', metrics: [{ label: "RICs Critiques", value: rD.ricsCritiques || 0 }, { label: "Votes Traités", value: rD.votesTraites || 0 }], desc: "Statut des pétitions et l'engagement citoyen." },
            { title: "Statistiques Agents", color: 'var(--color-red)', key: 'users', metrics: [{ label: "CVNU Moyen", value: usrD.cvnuMoyen || 0 }, { label: "Agents Haut Niveau", value: usrD.agentsHautNiveau || 0 }], desc: "Données démographiques et performance de l'équipe." },
            // NOTE: Le endpoint rbu_accounting est utilisé pour la clé 'rbu_accounting'
            { title: "Comptabilité RBU", color: 'var(--color-green)', key: 'rbu_accounting', metrics: [{ label: "Bénéfice Net (Q)", value: `${scD.beneficeNetTrimestriel || 0} €` }, { label: "Dividendes UTMi", value: `${scD.dividendesUtmi || 0} €` }], desc: "Bilan trimestriel du Réseau de Base Unifié." }
        ];

        html += '<h2 class="font-red" style="text-align: center; margin-top: 40px; margin-bottom: 20px;">QG de Gestion (Détails Approfondis)</h2>';
        html += '<div id="hq-management-cards" class="feature-grid">';
        
        // Rendu des 5 cartes QG cliquables
        html += qgCards.map(card => {
             const cardMetrics = card.metrics.map(m => `<li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #444;"><span style="font-size: 0.9em;">${m.label} :</span><span style="font-weight: bold; color: #fff;">${m.value}</span></li>`).join('');

             return `<div class="feature-card hq-card clickable-hq-card" 
                         style="border-top: 5px solid ${card.color}; cursor: pointer;"
                         data-hq-key="${card.key}">
                        <h3 style="color: ${card.color}; font-size: 1.3rem; margin-bottom: 10px;">${card.title}</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">${cardMetrics}</ul>
                        <p class="metric-desc" style="margin-top: 10px; font-size: 0.8em; color: #aaa;">${card.desc}</p>
                    </div>`;
        }).join('');
        html += '</div>'; // Fin de #hq-management-cards

        grid.innerHTML = html;
        grid.hasLoaded = true; 
        
        // 🛑 ATTACHER LES ÉCOUTEURS GLOBALE POUR TOUTES LES 13 CARTES 🛑
        // 🛑 ÉTAPE 3 : Attachement des écouteurs de clics et de la récompense
        const attachDetailListeners = () => {
            const clickableCards = document.querySelectorAll('.clickable-metric-card, .clickable-hq-card');
            
            clickableCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    const key = card.getAttribute('data-hq-key');
                    if (window.handleDashboardDetailAction) {
                        window.handleDashboardDetailAction(key);
                    } else {
                        console.error("handleDashboardDetailAction non défini. (Vérifiez modalDashboard.js)");
                    }
                });
            });
            // Attacher l'écouteur de la récompense
            const claimBtn = document.getElementById('claim-veille-btn');
            if (claimBtn && missionAvailable) {
                claimBtn.addEventListener('click', executeVeilleReward);
            }
        };
        // 🛑 ATTACHER L'ÉCOUTEUR POUR LE BOUTON DE RÉCOMPENSE
        const claimBtn = document.getElementById('claim-veille-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                if (missionAvailable) {
                    executeVeilleReward();
                }
            });
        }
        // Rendu final
        grid.innerHTML = html; // Assume que 'html' contient le rendu complet
        grid.hasLoaded = true;
        attachDetailListeners(); 

    } catch (error) {
        console.error("ERREUR FATALE LORS DU RENDU DU TABLEAU DE BORD. ", error);
        if (!grid.hasLoaded) {
             grid.innerHTML = `<p class="font-red">❌ Échec critique du rendu. Détails de l'erreur en console.</p>`;
        }
    }
};