// Fichier : routes/hq-data.js

const express = require('express');
const { getDatabase, getActionsData, getRicsData } = require('../services/data'); 
const router = express.Router();

// NOTE : Pour un fonctionnement complet, ces données devraient être générées par un service d'agrégation,
// mais ici nous utilisons directement les getters de la base de données.

router.get('/finances', (req, res) => {
    const db = getDatabase();
    res.json({
        caisseSolde: db.caisse_manifestation?.solde || 0,
        beneficiaryCount: db.beneficiaries?.length || 0,
        tresorerieSmartContract: db.tresorerieCompteCampagne || 0,
        lastUpdate: new Date().toISOString()
    });
});

router.get('/revendications', (req, res) => {
    const db = getDatabase();
    const rics = getRicsData();
    res.json({
        ricsActifs: rics.filter(r => r.status === 'active').length,
        petitionsEnCours: db.polls?.length || 0,
        totalVotesRIC: rics.reduce((sum, r) => sum + (r.votes_for || 0) + (r.votes_against || 0), 0),
        dernierRic: rics.length > 0 ? rics[rics.length - 1].question : 'Aucun',
    });
});

router.get('/actions', (req, res) => {
    const db = getDatabase();
    const actions = getActionsData();
    res.json({
        actionsTotales: actions.liste_actions_consolidee?.length || 0,
        actionsEnCours: actions.liste_actions_consolidee?.filter(a => a.status === 'in_progress').length || 0,
        boycottsCommerce: db.boycotts?.filter(b => b.type === 'commerce').length || 0,
        boycottsActifs: db.boycotts?.length || 0,
    });
});

router.get('/users', (req, res) => {
    const db = getDatabase();
    const users = db.beneficiaries || [];
    const totalScore = users.reduce((sum, u) => sum + (u.cv_score || 0), 0);
    res.json({
        beneficiairesEnregistres: users.length,
        cvnuComplets: users.filter(u => u.cv_score >= 0.8).length,
        scoreMoyen: users.length > 0 ? (totalScore / users.length) : 0,
        militantsActifs: users.filter(u => u.status === 'active').length,
    });
});

module.exports = router;