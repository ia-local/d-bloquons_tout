// docs/dashboard.js - Contient la logique de chargement et de rendu du Tableau de Bord QG

const LAST_VEILLE_KEY = 'lastDashboardVeilleTimestamp';
const VEILLE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

function checkVeilleAvailability() {
    const lastTimestamp = parseInt(localStorage.getItem(LAST_VEILLE_KEY) || '0', 10);
    const currentTime = Date.now();
    const isAvailable = (currentTime - lastTimestamp) >= VEILLE_COOLDOWN_MS;

    if (window.AGENT_PROFILE) {
        window.AGENT_PROFILE.dashboardVeilleCompleted = !isAvailable;
    }
    
    return isAvailable;
}

function executeVeilleReward() {
    if (typeof window.grantReward !== 'function') {
        console.error("Erreur: La fonction grantReward n'est pas disponible pour la récompense de Veille.");
        return;
    }
    
    const XP_VEILLE_DASHBOARD = 50;
    const ENERGY_GAIN_DASHBOARD = 7;
    
    window.grantReward(XP_VEILLE_DASHBOARD, ENERGY_GAIN_DASHBOARD);
    
    localStorage.setItem(LAST_VEILLE_KEY, Date.now().toString());
    if (window.AGENT_PROFILE) {
        window.AGENT_PROFILE.dashboardVeilleCompleted = true; // Mission faite pour cette session/journée
    }
    
    console.log(`🎉 BONUS JOURNALIER : +${XP_VEILLE_DASHBOARD} UTMi et +${ENERGY_GAIN_DASHBOARD} EA pour la Veille Économique. Mise à jour du timestamp.`);
    
    window.loadDashboardData(true);
}


window.loadDashboardData = async function(forceReload = false) {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    const missionAvailable = checkVeilleAvailability();

    if (grid.hasLoaded && !forceReload) {
        return; 
    }
    
    grid.innerHTML = '<p class="font-yellow">Connexion au Quartier Général de données...</p>';

    try {
        const [
            summaryData, utmiData, smartContractData, pointsData,
            financesData, revendicationsData, actionsData, usersData
        ] = await Promise.all([
            window.fetchData('/api/dashboard/summary'),
            window.fetchData('/api/dashboard/utmi-insights'),
            window.fetchData('/smartContract/api/dashboard-data'),
            window.fetchData('/map/data/manifestations'), 
            window.fetchData('/api/hq/finances'),
            window.fetchData('/api/hq/revendications'),
            window.fetchData('/api/hq/actions'),
            window.fetchData('/api/hq/users')
        ]);

        // 🛑 INITIALISATION SÉCURISÉE DES DONNÉES (CORRECTE)
        const points = pointsData || [];
        const totalPoints = points.length;
        const sD = summaryData || {};
        const uD = utmiData || {};
        const scD = smartContractData || {};
        const fD = financesData || {};
        const rD = revendicationsData || {};
        const aD = actionsData || {};
        const usrD = usersData || {};
        
        
        // --- RENDU HTML (Utilise sD, uD, etc., sans risque d'erreur) ---
        const primaryMetrics = [
            { title: "Solde Caisse Manifeste", value: `${(sD.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Allocation Est. : ${(sD.monthlyAllocation || 0).toFixed(2)} €/bénéficiaire` },
            { title: "Impact UTMi (Score)", value: (uD.totalUTMI || 0).toFixed(2), desc: `Score d'Unité et de Transformation du Mouvement` },
            { title: "Manifestants Est.", value: (sD.estimatedManifestantCount || 0).toLocaleString('fr-FR'), desc: `${totalPoints} Points de Rassemblement` },
            { title: "Recettes Contrat (Sim.)", value: `${(scD.totalRecettes || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Dépenses (Allocations): ${(scD.totalDepenses || 0).toFixed(2)} €` },
            { title: "Boycotts Actifs", value: sD.boycottCount || 0, desc: `Alertes financières : ${sD.activeAlerts || 0}` },
            { title: "RICs Actifs", value: sD.ricCount || 0, desc: `Citoyens enregistrés : ${sD.beneficiaryCount || 0}` }
        ];

        let html = '<h2 class="font-yellow" style="text-align: center; margin-bottom: 20px;">Tableau de Bord : Indicateurs Clés</h2>';
        
        // CARTE DE MISSION JOURNALIÈRE
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

        // Affichage des metrics principaux
        html += '<div id="primary-metrics" class="feature-grid">';
        html += primaryMetrics.map(m => `
            <div class="feature-card insight-card">
                <h3 style="color: inherit; font-size: 1.2rem; margin-bottom: 5px;">${m.title}</h3>
                <p class="metric-value font-red"><b>${m.value}</b></p>
                <p class="metric-desc">${m.desc}</p>
            </div>
        `).join('');
        html += '</div>';

        
        // --- SECTION 2: QG DE GESTION ---
        const qgCards = [
            {
                title: "Trésorerie & Allocations", color: 'var(--color-accent-yellow)', key: 'finances', 
                metrics: [
                    { label: "Solde Général", value: (fD.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) },
                    { label: "Bénéficiaires", value: (fD.beneficiaryCount || 0).toLocaleString('fr-FR') },
                    { label: "Trésorerie Contrat", value: (fD.tresorerieSmartContract || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }
                ],
                desc: `Dernière mise à jour : ${new Date(fD.lastUpdate || Date.now()).toLocaleTimeString('fr-FR')}`
            },
            {
                title: "Revendications & Démocratie", color: 'var(--color-accent-red)', key: 'revendications', 
                metrics: [
                    { label: "RICs Actifs", value: (rD.ricsActifs || 0) },
                    { label: "Pétitions en Cours", value: (rD.petitionsEnCours || 0) },
                    { label: "Votes Totaux RIC", value: (rD.totalVotesRIC || 0).toLocaleString('fr-FR') }
                ],
                desc: `Dernier RIC : ${rD.dernierRic || 'N/A'}`
            },
            {
                title: "Actions & Logistique", color: 'var(--color-primary-green)', key: 'actions', 
                metrics: [
                    { label: "Actions Totales", value: (aD.actionsTotales || 0) },
                    { label: "Actions En Cours", value: (aD.actionsEnCours || 0) },
                    { label: "Boycotts Commerciaux", value: (aD.boycottsCommerce || 0) }
                ],
                desc: `Boycotts actifs totaux : ${aD.boycottsActifs || 0}`
            },
            {
                title: "Gestion Utilisateurs (CVNU)", color: 'var(--color-blue)', key: 'users', 
                metrics: [
                    { label: "Bénéficiaires Enreg.", value: (usrD.beneficiairesEnregistres || 0).toLocaleString('fr-FR') },
                    { label: "CVNU Complets", value: (usrD.cvnuComplets || 0) },
                    { label: "Score CV Moyen", value: (usrD.scoreMoyen || 0).toFixed(2) }
                ],
                desc: `Militants actifs : ${usrD.militantsActifs || 0}`
            }
        ];

        html += '<h2 class="font-red" style="text-align: center; margin-top: 40px; margin-bottom: 20px;">QG de Gestion des Données</h2>';
        html += '<div id="hq-management-cards" class="feature-grid">';
        
        html += qgCards.map(card => `
            <div class="feature-card hq-card" 
                 style="border-top: 5px solid ${card.color}; cursor: pointer;"
                 data-hq-key="${card.key}">
                <h3 style="color: ${card.color}; font-size: 1.3rem; margin-bottom: 10px;">${card.title}</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${card.metrics.map(m => `
                        <li style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #444;">
                            <span style="font-size: 0.9em;">${m.label} :</span>
                            <span style="font-weight: bold; color: #fff;">${m.value}</span>
                        </li>
                    `).join('')}
                </ul>
                <p class="metric-desc" style="margin-top: 10px; font-size: 0.8em; color: #aaa;">${card.desc}</p>
            </div>
        `).join('');
        html += '</div>';

        grid.innerHTML = html;
        grid.hasLoaded = true; 
        
        // 🛑 ATTACHER LES ÉCOUTEURS
        
        const claimBtn = document.getElementById('claim-veille-btn');
        if (claimBtn && missionAvailable) {
            claimBtn.addEventListener('click', executeVeilleReward);
        }

        document.querySelectorAll('#hq-management-cards .hq-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const key = card.getAttribute('data-hq-key');
                if (window.handleUserAction) {
                    if (window.AGENT_PROFILE && typeof window.grantReward === 'function' && window.AGENT_PROFILE.energy > 5) {
                         window.grantReward(5, 0); // Bonus analyse QG
                    }
                    window.handleUserAction('dashboard-detail', key);
                } else {
                    console.error("handleUserAction non défini. Impossible d'ouvrir la modale.");
                }
            });
        });

    } catch (error) {
        console.error("ERREUR FATALE LORS DU RENDU DU TABLEAU DE BORD. Le contenu affiché pourrait être incomplet.", error);
        if (!grid.hasLoaded) {
             grid.innerHTML = `<p class="font-red">❌ Échec critique du rendu. Détails de l'erreur en console.</p>`;
        }
    }
};