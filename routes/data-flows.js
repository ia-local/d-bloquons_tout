// Fichier : routes/data-flows.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); 
const { calculateUtmi } = require('../server_modules/utms_calculator.js');
const { getDatabase, writeDatabaseFile, getRicsData, writeRicsFile, getBoycottsData } = require('../services/data.js'); 
const { PORT } = require('../config/index.js');

const router = express.Router();

// Fonction utilitaire déplacée depuis le fichier principal
function calculateTaxAmount(transaction, taxes) {
    let totalTax = 0;
    const applicableTaxes = taxes.filter(t => t.applicable_to === 'financial_flows');
    for (const tax of applicableTaxes) {
        if (tax.id === 'tax_vat' && transaction.isVatApplicable) {
            totalTax += transaction.amount * tax.rate;
        } else {
            totalTax += transaction.amount * tax.rate;
        }
    }
    return totalTax;
}


// --- FLUX FINANCIERS (CRUD) ---
router.get('/financial-flows', (req, res) => {
    res.json(getDatabase().financial_flows || []);
});

router.post('/financial-flows', async (req, res) => {
    const db = getDatabase();
    const boycottsData = getBoycottsData();
    const newFlow = { id: uuidv4(), ...req.body, timestamp: new Date().toISOString() };
    
    // Logique métier : calcul des taxes et UTMi
    const isBoycotted = boycottsData.boycotts?.some(boycott => boycott.name.toLowerCase() === newFlow.name.toLowerCase());
    const taxAmount = calculateTaxAmount(newFlow, db.taxes || []);
    const utmiResult = calculateUtmi({ type: 'financial_flow', data: { amount: newFlow.amount, isBoycotted, taxAmount } }, { userCvnuValue: 0.5 });
    
    newFlow.tax_amount = taxAmount;
    newFlow.utmi_value = utmiResult.utmi;

    if (isBoycotted) {
        const tvaAmount = newFlow.amount * (db.taxes.find(t => t.id === 'tax_vat')?.rate || 0);
        try {
            // Appel à l'API locale du smart contract (nécessite le port depuis la config)
            await axios.post(`http://localhost:${PORT}/api/blockchain/recevoir-fonds`, { amount: tvaAmount }, { headers: { 'Content-Type': 'application/json' } });
            newFlow.blockchain_status = 'TVA_AFFECTEE';
        } catch (error) { 
            newFlow.blockchain_status = 'ECHEC_AFFECTATION'; 
            console.error("Échec de l'affectation blockchain:", error.message);
        }
    }
    
    db.financial_flows.push(newFlow);
    await writeDatabaseFile();
    res.status(201).json(newFlow);
});

router.put('/financial-flows/:id', async (req, res) => {
    const db = getDatabase();
    const index = db.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    db.financial_flows[index] = { ...db.financial_flows[index], ...req.body };
    await writeDatabaseFile();
    res.json(db.financial_flows[index]);
});

router.delete('/financial-flows/:id', async (req, res) => {
    const db = getDatabase();
    const index = db.financial_flows.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Flux non trouvé.' });
    db.financial_flows.splice(index, 1);
    await writeDatabaseFile();
    res.status(204).end();
});


// --- CHRONOLOGIE DES AFFAIRES ---
router.get('/affaires', (req, res) => res.json(getDatabase().affaires));

router.post('/affaires/event', async (req, res) => {
    const db = getDatabase();
    const newEvent = { id: uuidv4(), ...req.body };
    db.affaires.chronology.push(newEvent);
    await writeDatabaseFile();
    res.status(201).json(newEvent);
});


// --- REFERENDUMS D'INITIATIVE CITOYENNE (RICS) ---
router.get('/rics', (req, res) => res.json(getRicsData()));

router.post('/rics', async (req, res) => {
    const ricsData = getRicsData();
    const { question, description, deadline, voteMethod, level, locations } = req.body;
    const newRic = { id: uuidv4(), question, description, deadline, voteMethod, level, locations, votes_for: 0, votes_against: 0, status: 'active' };
    ricsData.push(newRic);
    await writeRicsFile();
    res.status(201).json(newRic);
});

router.put('/rics/:id', async (req, res) => {
    const ricsData = getRicsData();
    const ricId = req.params.id;
    const { votes_for, votes_against } = req.body;
    const ric = ricsData.find(r => r.id === ricId);
    if (!ric) { return res.status(404).json({ error: 'Référendum non trouvé.' }); }
    if (typeof votes_for !== 'undefined') { ric.votes_for = votes_for; }
    if (typeof votes_against !== 'undefined') { ric.votes_against = votes_against; }
    await writeRicsFile();
    res.status(200).json(ric);
});


// --- TAXES ---
router.get('/taxes', (req, res) => res.json(getDatabase().taxes || []));

router.post('/taxes', async (req, res) => {
    const db = getDatabase();
    const newTax = { id: uuidv4(), ...req.body };
    db.taxes.push(newTax);
    await writeDatabaseFile();
    res.status(201).json(newTax);
});


// --- BOYCOTTS (CRUD) ---
router.get('/boycotts', (req, res) => res.json(getDatabase().boycotts || []));
router.get('/entities', (req, res) => res.json(getDatabase().entities || [])); // Getter de données statiques

router.post('/boycotts', async (req, res) => {
    const db = getDatabase();
    const newEntity = { id: `ent_${Date.now()}`, ...req.body };
    db.boycotts.push(newEntity);
    await writeDatabaseFile();
    res.status(201).json(newEntity);
});

router.put('/boycotts/:id', async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const updatedEntity = req.body;
    const index = db.boycotts.findIndex(e => e.id === id);
    if (index !== -1) { 
        db.boycotts[index] = { ...db.boycotts[index], ...updatedEntity }; 
        await writeDatabaseFile(); 
        res.json(db.boycotts[index]); 
    } else { 
        res.status(404).json({ message: "Entité non trouvée" }); 
    }
});

router.delete('/boycotts/:id', async (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const initialLength = db.boycotts.length;
    db.boycotts = db.boycotts.filter(m => m.id !== id);
    if (db.boycotts.length < initialLength) { 
        await writeDatabaseFile(); 
        res.status(204).send(); 
    } else { 
        res.status(404).json({ message: "Entité non trouvée" }); 
    }
});


// --- CAISSE & BLOCKCHAIN (Simulée) ---
router.get('/caisse-manifestation', (req, res) => res.json(getDatabase().caisse_manifestation));

router.post('/caisse-manifestation/transaction', async (req, res) => {
    const db = getDatabase();
    const { type, montant, description } = req.body;
    const newTransaction = { id: uuidv4(), type, montant, description, date: new Date().toISOString() };
    
    db.caisse_manifestation.transactions.push(newTransaction);
    db.caisse_manifestation.solde += (type === 'entrée' ? montant : -montant);
    
    await writeDatabaseFile();
    res.status(201).json(newTransaction);
});

router.post('/blockchain/transaction', async (req, res) => {
    const db = getDatabase();
    const newBlock = { id: uuidv4(), ...req.body, hash: '...', signature: '...', timestamp: new Date().toISOString() };
    db.blockchain.transactions.push(newBlock);
    await writeDatabaseFile();
    res.status(201).json(newBlock);
});

router.post('/blockchain/recevoir-fonds', async (req, res) => {
    const db = getDatabase();
    const { amount } = req.body;
    if (!amount) { return res.status(400).json({ error: 'Montant manquant.' }); }
    
    db.blockchain.transactions.push({ id: uuidv4(), type: 'recevoirFonds', amount: amount, timestamp: new Date().toISOString() });
    db.caisse_manifestation.solde += amount;
    
    await writeDatabaseFile();
    res.status(200).json({ message: `Fonds de ${amount}€ reçus avec succès sur le smart contract (simulé).` });
});

router.post('/blockchain/decaisser-allocations', async (req, res) => { 
    // Logique de décaissement simulée
    res.status(200).json({ message: 'Décaissement des allocations en cours...' }); 
});


module.exports = router;