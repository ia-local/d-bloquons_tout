// docs/modalDashboard.js - Logique de la modale d'affichage des détails HQ et UTMi (FINAL et COMPLET)

const MODAL_ID = 'global-modal';
const MODAL_TITLE_ID = 'modal-title';
const MODAL_CONTENT_ID = 'modal-content-container';

/**
 * Mappe la clé d'API (data-hq-key) aux informations d'affichage et aux endpoints d'API.
 * Cette structure est essentielle pour le routage des détails profonds.
 */
const HQ_DETAILS_MAP = {
    // 🛑 ENDPOINTS QG GÉNÉRIQUES (Utilisent renderHqDetailContent)
    finances: { title: "Détails Financiers & Caisse Manifeste", endpoint: "/api/hq/finances", icon: "fas fa-money-check-alt" },
    revendications: { title: "Revendications & RICs", endpoint: "/api/hq/revendications", icon: "fas fa-gavel" },
    actions: { title: "Logistique & Actions sur le Terrain", endpoint: "/api/hq/actions", icon: "fas fa-truck-moving" },
    users: { title: "Gestion Agents & Manifestants (CVNU)", endpoint: "/api/hq/users", icon: "fas fa-users-cog" },
    
    // 🛑 ENDPOINTS SPÉCIFIQUES (Utilisent leurs propres fonctions de rendu)
    utmi_insights: { title: "Valorisation UTMi & Taux de Transformation", endpoint: "/api/dashboard/utmi-insights", icon: "fas fa-chart-area" },
    rbu_accounting: { title: "Comptabilité RBU & Bénéfice Net", endpoint: "/api/dashboard/accounting", icon: "fas fa-balance-scale" } 
};

/**
 * 🛑 GESTIONNAIRE D'ACTION PRINCIPAL POUR LES MODALES DE DÉTAIL DU DASHBOARD (DÉLÉGUÉ PAR app.js)
 * Ouvre la modale, affiche un spinner, puis charge les données depuis l'API.
 * @param {string} key - La clé de l'indicateur (ex: 'finances', 'utmi_insights').
 */
window.handleDashboardDetailAction = async function(key) {
    // window.openModal (défini dans modalGestion.js) est la méthode préférée
    const detailConfig = HQ_DETAILS_MAP[key];

    if (!detailConfig) {
        window.openModal("Erreur de Configuration", `<p>Configuration introuvable pour la clé : ${key}</p>`);
        return;
    }

    // Affichage immédiat du spinner via modalGestion.js
    const loadingContent = `<p style="text-align: center;"><div class="loading-spinner"></div><br>Chargement des données de ${detailConfig.title}...</p>`;
    window.openModal(detailConfig.title, loadingContent); 

    try {
        // Appel API asynchrone (window.fetchData est défini dans app.js)
        const data = await window.fetchData(detailConfig.endpoint); 
        
        let contentHTML;
        // Routage des fonctions de rendu spécialisées
        if (key === 'utmi_insights') {
            contentHTML = renderUtmiInsights(key, data);
        } else if (key === 'rbu_accounting') {
            contentHTML = renderRbuAccounting(key, data);
        } else {
            // Rendu générique pour les 4 clés QG restantes
            contentHTML = renderHqDetailContent(key, data);
        }
        
        // Mise à jour du contenu après le chargement
        window.openModal(detailConfig.title, contentHTML);

    } catch (error) {
        console.error(`Erreur de chargement des données pour la clé ${key}:`, error);
        window.openModal(detailConfig.title, `<p class="font-red" style="text-align: center;">❌ Échec du chargement des données. Vérifiez la connexion API au serveur.</p>`);
    }
};

/**
 * Fonction de rendu pour les modales de Surveillance et de Gestion (Liste générique).
 * Affiche les paires clé/valeur des données brutes de l'API.
 */
function renderHqDetailContent(key, data) {
    const detailConfig = HQ_DETAILS_MAP[key] || {};
    if (!data || Object.keys(data).length === 0) {
        return `<p style="text-align: center;">Aucune donnée détaillée disponible pour l'élément de gestion ${detailConfig.title || key}.</p>`;
    }
    
    const items = Object.entries(data);

    let note = "Analyse détaillée de l'état actuel.";
    if (key === 'users') note = "Progression des agents, niveaux CVNU et statistiques de présence sur le terrain.";
    if (key === 'finances') note = "Solde des caisses, allocations passées et gestion de la trésorerie du Quartier Général.";
    if (key === 'revendications') note = "Suivi des pétitions en cours, analyse des votes RIC et impact sociétal.";
    if (key === 'actions') note = "Détails des opérations logistiques, gestion des boycotts et efficacité des actions ciblées.";


    return `
        <div class="hq-detail-container">
            <h3 class="detail-section-title font-red"><i class="${detailConfig.icon || 'fas fa-info-circle'}"></i> ${detailConfig.title}</h3>
            <p class="detail-note">${note}</p>
            <ul class="detail-list">
                ${items.map(([label, value]) => {
                    // Logique de formatage pour les devises et les objets
                    const isCurrency = label.toLowerCase().includes('solde') || label.toLowerCase().includes('montant') || label.toLowerCase().includes('depenses') || label.toLowerCase().includes('tresorerie') || label.toLowerCase().includes('recettes');
                    const formattedValue = (typeof value === 'number') 
                        ? (isCurrency ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : value.toLocaleString('fr-FR'))
                        : (typeof value === 'object' && value !== null) 
                            ? JSON.stringify(value, null, 2).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '') 
                            : value;
                            
                    const displayLabel = label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                    return `
                        <li>
                            <span class="detail-label">${displayLabel}</span>
                            <span class="detail-value">${formattedValue}</span>
                        </li>
                    `;
                }).join('')}
            </ul>
            <p class="detail-footer">Source: API pour ${detailConfig.title}. Mise à jour: ${new Date().toLocaleTimeString()}.</p>
        </div>
    `;
}

/**
 * 🛑 Fonction de rendu spécifique pour la clé 'utmi_insights'. (COMPLET)
 */
function renderUtmiInsights(key, data) {
    const detailConfig = HQ_DETAILS_MAP[key];
    const totalTaxCollected = data.totalTaxCollected || 0;
    const note = "Analyse de la Valorisation UTMi : Taux de transformation sociétale, impact des taxes IA et projection RBU.";

    const utmiItems = [
        { label: "Score Actuel d'Unité", value: data.uniteScore || 0, unit: '%' },
        { label: "Taux de Transformation Mouvement", value: data.transformationRate || 0, unit: '%' },
        { label: "Valeur Nette de la Taxe IA", value: data.taxeIaValue || 0, unit: ' €', isCurrency: true },
        { label: "Projection Bénéfice RBU (6 Mois)", value: data.rbuProjection || 0, unit: ' €', isCurrency: true },
        { label: "Manifestants Engagés", value: data.engagedCount || 0, unit: '' },
    ];

    let html = `<div class="hq-detail-container">`;
    
    // --- 1. SYNTHÈSE DE LA VALEUR GÉNÉRÉE ---
    html += `
        <h3 class="detail-section-title font-red"><i class="fas fa-chart-line"></i> Synthèse de la Valeur Générée</h3>
        <ul class="detail-list detail-summary">
            <li><span class="detail-label">UTMi Total Monétisé</span><span class="detail-value font-yellow">${data.totalUtmi?.toFixed(2) || '0.00'} UTMi</span></li>
            <li><span class="detail-label">UTMi / Interaction (Moy.)</span><span class="detail-value">${data.averageUtmiPerInteraction?.toFixed(2) || '0.00'}</span></li>
            <li><span class="detail-label">Taux d'Efficacité UTMi/Coût</span><span class="detail-value">${data.totalUtmiPerCostRatio ? data.totalUtmiPerCostRatio.toFixed(2) : 'N/A'}</span></li>
        </ul>
        <p class="detail-note">${note}</p>
    `;
    
    // --- 2. DÉTAILS FISCAUX (EN GRILLE) ---
    html += `<h3 class="detail-section-title font-blue" style="margin-top: 25px;"><i class="fas fa-balance-scale"></i> Ventilation Fiscale</h3>`;
    html += `<div class="feature-grid modal-insights-grid">`; 
    
    if (data.taxCollectionSummary) {
        Object.values(data.taxCollectionSummary).forEach(tax => {
            const value = (tax.utmi_value || 0).toFixed(2);
            html += `
                <div class="feature-card modal-insight-card">
                    <h4><i class="fas fa-file-invoice"></i> ${tax.name.split(' ')[0]}...</h4>
                    <p class="metric-value font-green">${value} UTMi</p>
                </div>
            `;
        });
    } else {
        html += `
            <div class="feature-card modal-insight-card" style="grid-column: span 2;">
                <h4>Total Collecté Simulé</h4>
                <p class="metric-value font-red">${totalTaxCollected.toFixed(2)} EUR</p>
            </div>
        `;
    }
    html += `</div>`; // Fin de la grille fiscale
    
    // --- 3. PERFORMANCE COGNITIVE ET MODÈLE (EN GRILLE) ---
    html += `<h3 class="detail-section-title font-green" style="margin-top: 25px;"><i class="fas fa-brain"></i> Modèles & Axes Cognitifs</h3>`;
    html += `<div class="feature-grid modal-insights-grid">`;
    
    // 3.1 Performance par Modèle (Top 3)
    if (data.utmiByModel?.length > 0) {
        data.utmiByModel.slice(0, 3).forEach(model => {
            html += `
                <div class="feature-card modal-insight-card">
                    <h4><i class="fas fa-robot"></i> ${model.name.split('-')[0]}</h4>
                    <p class="metric-value font-yellow">${model.utmi.toFixed(2)} UTMi</p>
                </div>
            `;
        });
    }

    // 3.2 Axes Cognitifs (Top 3)
    if (data.utmiByCognitiveAxis?.length > 0) {
        data.utmiByCognitiveAxis.slice(0, 3).forEach(axis => { 
            html += `
                <div class="feature-card modal-insight-card">
                    <h4><i class="fas fa-chart-line"></i> ${axis.name.toUpperCase()}</h4>
                    <p class="metric-value font-blue">${axis.utmi.toFixed(2)} UTMi</p>
                </div>
            `;
        });
    }
    
    html += `</div>`; // Fin de la grille Modèles/Axes
    
    // --- Pied de page ---
    html += `<p class="detail-footer">Moteur de Calcul: utms_calculator.js. Données basées sur ${data.totalInteractionCount || 0} interactions.</p>`;
    html += `</div>`; // Fin de .hq-detail-container
    
    return html;
}

/**
 * 🛑 Fonction de rendu spécifique pour la clé 'rbu_accounting'. (COMPLET)
 */
function renderRbuAccounting(key, data) {
    if (!data || data.TOTAL_REVENUE === undefined) {
         return `<p class="font-red" style="text-align: center;">❌ Données de comptabilité RBU non disponibles ou non complètes.</p>`;
    }
    
    const isProfitable = data.NET_BENEFIT > 0;

    let html = `<div class="hq-detail-container">`;
    
    // --- SYNTHÈSE DES FLUX (Recettes, Dépenses, Bénéfice Net) ---
    html += `<h3 class="detail-section-title font-red"><i class="fas fa-hand-holding-usd"></i> Bilan Financier du Projet (UTMi)</h3>`;
    html += `<ul class="detail-list detail-summary">
        <li style="background: rgba(0, 150, 0, 0.1);"><span class="detail-label">1. Recettes Totales (Taxe AI + UTMi)</span><span class="detail-value font-green">${data.TOTAL_REVENUE.toFixed(2)} UTMi</span></li>
        <li style="background: rgba(150, 0, 0, 0.1);"><span class="detail-label">2. Dépenses Totales (IA + Distribution)</span><span class="detail-value font-red">${data.TOTAL_EXPENSES.toFixed(2)} UTMi</span></li>
        <li style="${isProfitable ? 'border: 2px solid var(--color-green);' : 'border: 2px solid var(--color-red);'}"><span class="detail-label">3. BÉNÉFICE NET</span><span class="detail-value ${isProfitable ? 'font-green' : 'font-red'}">${data.NET_BENEFIT.toFixed(2)} UTMi</span></li>
    </ul>`;

    // --- RBU & CVNU FIDUCIAIRE ---
    html += `<h3 class="detail-section-title font-blue" style="margin-top: 25px;"><i class="fas fa-university"></i> Équilibre CVNU & Passif RBU</h3>`;
    html += `<ul class="detail-list detail-tax-list">
        <li><span class="detail-label">Allocation Mensuelle (Par Utilisateur)</span><span class="detail-value font-yellow">${data.RBU_ALLOCATION_PER_USER.toFixed(2)} €</span></li>
        <li><span class="detail-label">Valeur Fiduciaire de Base CVNU</span><span class="detail-value font-green">${data.CVNU_FIDUCIAIRE_BASE.toFixed(2)} €</span></li>
        <li><span class="detail-label">Passif RBU Est. (Dette Potentielle)</span><span class="detail-value font-red">${data.RBU_DEBT_PASSIVE.toFixed(2)} UTMi (Cycle 28j)</span></li>
    </ul>`;
    
    // --- INDICATEURS DE CONFIANCE ---
    html += `<h3 class="detail-section-title font-green" style="margin-top: 25px;"><i class="fas fa-shield-alt"></i> Stabilité Temporelle (DevOps)</h3>`;
    html += `<ul class="detail-list detail-summary">
        <li><span class="detail-label">Facteur de Confiance Temporelle</span><span class="detail-value">${data.CONFIDENCE_FACTOR.toFixed(3)}</span></li>
        <li><span class="detail-label">Âge Moyen des Logs (Jours)</span><span class="detail-value">${data.AVERAGE_LOG_AGE_DAYS.toFixed(1)}</span></li>
    </ul>`;
    
    html += `<p class="detail-footer">Calculé par la classe RBU Accounting du moteur utms_calculator.js.</p></div>`;
    
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById(MODAL_ID);
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            modal.style.display = "none";
        }
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});