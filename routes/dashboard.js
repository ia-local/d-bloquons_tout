// Fichier : routes/dashboard.js (FINAL - Routage Tableau de Bord QG)

const express = require('express');
// 🛑 IMPORTATION : Nous importons explicitement toutes les fonctions nécessaires de data.js
const { getDatabase, readJsonFile, getAccountingData } = require('../services/data.js'); 
const { LOG_FILE_PATH, DATABASE_FILE_PATH } = require('../config/index.js');
// Nous ne conservons que calculateDashboardInsights
const { calculateDashboardInsights } = require('../server_modules/utms_calculator.js');
const operator = require('../server_modules/operator.js');

const router = express.Router();

// ---------------------------------------------------------------------
// 1. ROUTES D'INSIGHTS ET DE TABLEAU DE BORD (/api/dashboard/*)
// ---------------------------------------------------------------------

// GET /api/dashboard/accounting (Utilisé pour le détail RBU)
router.get('/accounting', (req, res) => {
    // NOTE: getAccountingData doit être implémenté dans le service data.js
    try {
        const accountingData = getAccountingData() || { TOTAL_REVENUE: 0, TOTAL_EXPENSES: 0, NET_BENEFIT: 0 };
        res.json(accountingData);
    } catch (error) {
        console.error("Erreur lors de la récupération des données d'accounting:", error);
        res.status(500).json({ error: 'Échec de la récupération des données de comptabilité.' });
    }
});

// GET /api/dashboard/summary (Synthèse principale pour la première grille)
router.get('/summary', (req, res) => {
    try {
        const db = getDatabase();
        
        // Métriques simples
        const totalTransactions = db.financial_flows?.length ?? 0;
        const activeAlerts = db.financial_flows?.filter(f => f.is_suspicious)?.length ?? 0;
        const caisseSolde = db.caisse_manifestation?.solde ?? 0;
        const monthlyAllocation = 150; // Valeur de base simulée pour le RBU

        // Calcul du nombre de manifestants (Logique complexe maintenue)
        let estimatedManifestantCount = 0;
        if (db.manifestation_points) {
            db.manifestation_points.forEach(point => {
                if (typeof point.count === 'number') { estimatedManifestantCount += point.count; } 
                else if (typeof point.count === 'string') { const numberMatch = point.count.match(/\d+/); if (numberMatch) { estimatedManifestantCount += parseInt(numberMatch[0]); } else if (point.count.toLowerCase().includes('plusieurs milliers')) { estimatedManifestantCount += 2000; } } 
                else if (typeof point.count === 'object' && point.count !== null) { for (const key in point.count) { if (typeof point.count[key] === 'number') { estimatedManifestantCount += point.count[key]; } } }
            });
        }

        res.json({ 
            totalTransactions, 
            activeAlerts, 
            caisseSolde, 
            estimatedManifestantCount,
            monthlyAllocation, // Ajout de l'allocation mensuelle
            boycottCount: db.boycotts?.length ?? 0,
            ricCount: db.rics?.length ?? 0,
        });
    } catch (error) { 
        res.status(500).json({ error: 'Erreur lors de la génération du résumé.' }); 
    }
});


// GET /api/dashboard/utmi-insights (Détails UTMi pour la modale)
router.get('/utmi-insights', async (req, res) => {
    try {
        const db = getDatabase();
        // Lit le fichier de logs pour les calculs UTMi
        const logs = await readJsonFile(LOG_FILE_PATH, []); 
        
        const taxSummary = {};
        (db.taxes || []).forEach(tax => { taxSummary[tax.id] = { name: tax.name, utmi_value: 0 }; });

        // Calculs UTMi basés sur les logs
        logs.forEach(log => {
            if (log.type === 'FINANCIAL_FLOW' && log.data?.taxAmount) {
                const taxId = log.data.taxId || 'tax_vat';
                if (taxSummary[taxId]) {
                    const utmiValue = log.data.taxAmount * (db.taxes.find(t => t.id === taxId)?.utmi_per_euro || 0);
                    taxSummary[taxId].utmi_value += utmiValue;
                }
            }
        });
        
        // Utilise le calculateur externe
        const insights = calculateDashboardInsights(logs, db);
        insights.taxCollectionSummary = taxSummary;
        res.json(insights);
    } catch (error) { 
        console.error("Erreur UTMi:", error);
        res.status(500).json({ error: 'Échec de la génération des insights UTMi.' }); 
    }
});


// GET /smartContract/api/dashboard-data (Données spécifiques au Smart Contract)
// Ce endpoint doit être monté deux fois: /api/dashboard/smartContract-data et /smartContract/api/dashboard-data
router.get('/smartContract/api/dashboard-data', async (req, res) => {
    const db = getDatabase(); 
    
    // Logique de calcul du Smart Contract (simulée)
    const recettesFiscalesTotales = db.tresorerieCompteCampagne || 0;
    const depenses = db.citoyensSimules?.reduce((sum, citoyen) => sum + (citoyen.allocation || 0), 0) || 0;
    const distributionAllocation = db.citoyensSimules?.reduce((acc, citoyen) => {
        const tranche = Math.floor((citoyen.allocation || 0) / 1000) * 1000;
        acc[tranche] = (acc[tranche] || 0) + 1;
        return acc;
    }, {}) || {};
    
    // Métriques utilisées par la grille QG de Gestion pour la carte "Comptabilité RBU"
    const beneficeNetTrimestriel = recettesFiscalesTotales - depenses;
    const dividendesUtmi = beneficeNetTrimestriel * 0.1; // 10% du bénéfice net simulé

    res.json({
        totalRecettes: recettesFiscalesTotales,
        totalDepenses: depenses,
        recettesParSource: { TVA: recettesFiscalesTotales, Autres: 0 },
        nombreBeneficiaires: db.citoyensSimules?.length || 0,
        distributionAllocation,
        tresorerie: db.tresorerieCompteCampagne || 0,
        // Métriques supplémentaires pour le frontend:
        beneficeNetTrimestriel,
        dividendesUtmi,
    });
});


// ---------------------------------------------------------------------
// 2. ROUTES DE L'OPÉRATEUR IA (Non modifiées)
// ---------------------------------------------------------------------

// GET /api/operator/summary
router.get('/operator/summary', async (req, res) => { 
    try { 
        const summary = await operator.generateSummary(); 
        res.json({ summary }); 
    } catch (error) { 
        res.status(500).json({ error: 'Échec de la génération du résumé.' }); 
    } 
});

// GET /api/operator/plan
router.get('/operator/plan', async (req, res) => { 
    try { 
        const plan = await operator.generateDevelopmentPlan(); 
        res.json({ plan }); 
    } catch (error) { 
        res.status(500).json({ error: 'Échec de la génération du plan.' }); 
    } 
});

// POST /api/operator/chat
router.post('/operator/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ error: 'Message manquant.' }); }
    try { 
        const aiResponse = await operator.getGroqChatResponse(message); 
        res.json({ response: aiResponse }); 
    } catch (error) { 
        res.status(500).json({ error: 'Erreur lors de la communication avec l\'IA.' }); 
    }
});


module.exports = router;