// Fichier : docs/dashboard.js (VERSION FINALE)

// Logique de rendu des données sur la page "Tableau de Bord Stratégique" (/dashboard)

window.loadDashboardData = async function() {
    const dashboardGrid = document.getElementById('dashboard-grid');
    dashboardGrid.innerHTML = '<p class="font-yellow">⏳ Chargement des métriques...</p>';

    try {
        // --- 1. Récupération des données ---
        // 🛑 Appel au NOUVEL ENDPOINT D'API pour le compte utilisateur
        const userCountData = await window.fetchData('/api/beneficiaries/count'); 
        
        const summaryData = await window.fetchData('/api/dashboard/summary');
        const smartContractData = await window.fetchData('/smartContract/api/dashboard-data');

        // Utilisation du compte utilisateur obtenu
        const totalUsers = userCountData.count || 0; 
        
        // --- 2. Construction des cartes de métriques ---
        const metrics = [
            // 🛑 Affiche le compte réel/mocké de l'API
            { title: "Citoyens enregistrés", value: totalUsers, icon: "fas fa-users" }, 
            
            { title: "Manifestants estimés", value: summaryData.estimatedManifestantCount || 0, icon: "fas fa-person-booth" },
            { title: "Alertes Critiques", value: summaryData.activeAlerts || 0, icon: "fas fa-exclamation-triangle", color: "font-red" },
            { title: "RIC Actifs", value: summaryData.ricCount || 0, icon: "fas fa-balance-scale" },
            { title: "Transactions Totales", value: summaryData.totalTransactions || 0, icon: "fas fa-exchange-alt" },
            { title: "Actions de Boycott", value: summaryData.boycottCount || 0, icon: "fas fa-store-slash" },
            { title: "Allocation Mensuelle CVNU", value: `${summaryData.monthlyAllocation?.toFixed(2) || 'N/A'} €`, icon: "fas fa-hand-holding-usd" }
        ];

        // --- 3. Construction du HTML du Dashboard ---
        let htmlContent = `
            <h3 class="font-yellow" style="margin-top: 0;">Synthèse des Métriques Clés</h3>
            <div class="feature-grid" id="metrics-summary-grid">
                ${metrics.map(metric => `
                    <div class="feature-card">
                        <h4><i class="${metric.icon}"></i> ${metric.title}</h4>
                        <div class="metric-value ${metric.color || ''}">${metric.value}</div>
                    </div>
                `).join('')}
            </div>
            
            <h3 class="font-yellow" style="margin-top: 30px;">Trésorerie & Caisse de Manifestation</h3>
            <div class="feature-grid" id="treasury-grid">
                <div class="feature-card" style="border-color: #00ff00;">
                    <h4><i class="fas fa-wallet"></i> Trésorerie Nette (Smart Contract)</h4>
                    <div class="metric-value" style="color: #00ff00;">${smartContractData.tresorerie?.toFixed(2) || 'N/A'} €</div>
                </div>
                <div class="feature-card">
                    <h4><i class="fas fa-dollar-sign"></i> Recettes Totales</h4>
                    <div class="metric-value">${smartContractData.totalRecettes?.toFixed(2) || 'N/A'} €</div>
                </div>
                <div class="feature-card">
                    <h4><i class="fas fa-receipt"></i> Dépenses Totales</h4>
                    <div class="metric-value font-red">${smartContractData.totalDepenses?.toFixed(2) || 'N/A'} €</div>
                </div>
                <div class="feature-card">
                    <h4><i class="fas fa-hand-holding-heart"></i> Bénéficiaires Actifs</h4>
                    <div class="metric-value">${smartContractData.nombreBeneficiaires || 0}</div>
                </div>
            </div>

            <h3 class="font-yellow" style="margin-top: 30px;">Mon Compte Citoyen (Exemple)</h3>
            <div class="feature-grid" id="user-status-grid">
                ${createUserStatusCard()}
            </div>
        `;
        
        dashboardGrid.innerHTML = htmlContent;

    } catch (error) {
        console.error("Erreur lors du chargement des données du Dashboard:", error);
        dashboardGrid.innerHTML = '<p class="font-red">❌ Erreur lors de la récupération des données. Veuillez vérifier l\'API ou les mocks.</p>';
    }
}

/**
 * Fonction simple pour simuler ou afficher l'état d'un utilisateur logué.
 */
function createUserStatusCard() {
    // Simule les données d'un utilisateur "logué"
    const user = { 
        name: "Citoyen(ne) Anonyme (ID: 123456)", 
        cv_score: 95, 
        status: "Actif / Plaignant",
        last_action: "Vote RIC 'Abrogation Plomb' (2h ago)"
    };
    
    return `
        <div class="feature-card" style="grid-column: span 2 / auto; text-align: left; background: var(--color-ui-content);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <h4 style="color: var(--color-text);"><i class="fas fa-user-check"></i> ${user.name}</h4>
                <div class="metric-value" style="font-size: 1.2rem; color: var(--color-accent-yellow);">CVNU Score: ${user.cv_score}%</div>
            </div>
            <p style="color: var(--color-text);">Statut : <strong>${user.status}</strong></p>
            <p style="color: var(--color-text);">Dernière action : ${user.last_action}</p>
        </div>
        <div class="feature-card" style="background: var(--color-ui-content);">
             <h4><i class="fas fa-piggy-bank"></i> Droits Civiques (UTMI)</h4>
             <div class="metric-value font-yellow">8945.54</div>
             <p style="font-size: 0.8em; color: var(--color-text);">Valeur UTMI totale accumulée.</p>
        </div>
        <div class="feature-card" style="background: var(--color-ui-content);">
             <h4><i class="fas fa-landmark"></i> Évasion Fiscale Contrôlée</h4>
             <div class="metric-value font-red">5200.00 €</div>
             <p style="font-size: 0.8em; color: var(--color-text);">Total des taxes collectées via le Smart Contract.</p>
        </div>
    `;
}