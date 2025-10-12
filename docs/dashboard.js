// docs/dashboard.js - Contient la logique de chargement et de rendu du Tableau de Bord QG (Quartier Général)

/**
 * Charge toutes les métriques du Tableau de Bord en effectuant des appels API asynchrones et parallèles.
 * Cette fonction lit les données agrégées pour le QG (Finances, Revendications, Actions, Utilisateurs).
 */
window.loadDashboardData = async function() {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    if (grid.hasLoaded) return; 
    
    grid.innerHTML = '<p class="font-yellow">Connexion au Quartier Général de données...</p>';

    try {
        // 🛑 CHARGEMENT ASYNCHRONE ET PARALLÈLE DE TOUTES LES DONNÉES CLÉS (7 appels API)
        const [
            summaryData, 
            utmiData, 
            smartContractData, 
            pointsData,
            financesData,
            revendicationsData,
            actionsData,
            usersData
        ] = await Promise.all([
            // Données primaires (ancienne structure)
            window.fetchData('/api/dashboard/summary'),
            window.fetchData('/api/dashboard/utmi-insights'),
            window.fetchData('/smartContract/api/dashboard-data'),
            window.fetchData('/map/data/manifestations'), 
            
            // Nouvelles données QG (gestion des données)
            window.fetchData('/api/hq/finances'),
            window.fetchData('/api/hq/revendications'),
            window.fetchData('/api/hq/actions'),
            window.fetchData('/api/hq/users')
        ]);

        // Sécurité : Assurer que les listes sont des tableaux pour le .length
        const points = pointsData || [];
        const totalPoints = points.length;
        
        // --- SECTION 1: METRICS PRINCIPALES (BASÉES SUR L'ANCIEN RENDU) ---
        const primaryMetrics = [
            { title: "Solde Caisse Manifeste", value: `${(summaryData.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Allocation Est. : ${(summaryData.monthlyAllocation || 0).toFixed(2)} €/bénéficiaire` },
            { title: "Impact UTMi (Score)", value: (utmiData.totalUTMI || 0).toFixed(2), desc: `Score d'Unité et de Transformation du Mouvement` },
            { title: "Manifestants Est.", value: (summaryData.estimatedManifestantCount || 0).toLocaleString('fr-FR'), desc: `${totalPoints} Points de Rassemblement` },
            { title: "Recettes Contrat (Sim.)", value: `${(smartContractData.totalRecettes || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, desc: `Dépenses (Allocations): ${(smartContractData.totalDepenses || 0).toFixed(2)} €` },
            { title: "Boycotts Actifs", value: summaryData.boycottCount || 0, desc: `Alertes financières : ${summaryData.activeAlerts || 0}` },
            { title: "RICs Actifs", value: summaryData.ricCount || 0, desc: `Citoyens enregistrés : ${summaryData.beneficiaryCount || 0}` }
        ];

        let html = '<h2 class="font-yellow" style="text-align: center; margin-bottom: 20px;">Tableau de Bord : Indicateurs Clés</h2>';
        
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

        
        // --- SECTION 2: QG DE GESTION (AGRÉGATION DES NOUVELLES DONNÉES HQ) ---
        
        const qgCards = [
            {
                title: "Trésorerie & Allocations",
                color: 'var(--color-accent-yellow)',
                metrics: [
                    { label: "Solde Général", value: (financesData.caisseSolde || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) },
                    { label: "Bénéficiaires", value: (financesData.beneficiaryCount || 0).toLocaleString('fr-FR') },
                    { label: "Trésorerie Contrat", value: (financesData.tresorerieSmartContract || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }
                ],
                desc: `Dernière mise à jour : ${new Date(financesData.lastUpdate || Date.now()).toLocaleTimeString('fr-FR')}`
            },
            {
                title: "Revendications & Démocratie",
                color: 'var(--color-accent-red)',
                metrics: [
                    { label: "RICs Actifs", value: (revendicationsData.ricsActifs || 0) },
                    { label: "Pétitions en Cours", value: (revendicationsData.petitionsEnCours || 0) },
                    { label: "Votes Totaux RIC", value: (revendicationsData.totalVotesRIC || 0).toLocaleString('fr-FR') }
                ],
                desc: `Dernier RIC : ${revendicationsData.dernierRic || 'N/A'}`
            },
            {
                title: "Actions & Logistique",
                color: 'var(--color-primary-green)',
                metrics: [
                    { label: "Actions Totales", value: (actionsData.actionsTotales || 0) },
                    { label: "Actions En Cours", value: (actionsData.actionsEnCours || 0) },
                    { label: "Boycotts Commerciaux", value: (actionsData.boycottsCommerce || 0) }
                ],
                desc: `Boycotts actifs totaux : ${actionsData.boycottsActifs || 0}`
            },
            {
                title: "Gestion Utilisateurs (CVNU)",
                color: 'var(--color-blue)',
                metrics: [
                    { label: "Bénéficiaires Enreg.", value: (usersData.beneficiairesEnregistres || 0).toLocaleString('fr-FR') },
                    { label: "CVNU Complets", value: (usersData.cvnuComplets || 0) },
                    { label: "Score CV Moyen", value: (usersData.scoreMoyen || 0).toFixed(2) }
                ],
                desc: `Militants actifs : ${usersData.militantsActifs || 0}`
            }
        ];

        html += '<h2 class="font-red" style="text-align: center; margin-top: 40px; margin-bottom: 20px;">QG de Gestion des Données</h2>';
        html += '<div id="hq-management-cards" class="feature-grid">';
        
        // Rendu des 4 nouvelles cartes QG
        html += qgCards.map(card => `
            <div class="feature-card hq-card" style="border-top: 5px solid ${card.color};">
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
        
    } catch (error) {
        console.error("Erreur critique lors du chargement du tableau de bord:", error);
        grid.innerHTML = `<p class="font-red">❌ Échec de la connexion aux API du QG (Vérifiez le serveur et les routes HQ).</p>`;
    }
};
