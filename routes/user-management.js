// Fichier : routes/user-management.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, writeDatabaseFile } = require('../services/data'); 

const router = express.Router();

// GET /api/beneficiaries (Lister tous les bénéficiaires/citoyens)
router.get('/', (req, res) => {
    const db = getDatabase();
    res.json(db.beneficiaries || []);
});

// GET /api/beneficiaries/:id (Obtenir un bénéficiaire par ID)
router.get('/:id', (req, res) => {
    const db = getDatabase();
    const beneficiary = (db.beneficiaries || []).find(b => b.id === req.params.id);
    if (!beneficiary) {
        return res.status(404).json({ error: 'Citoyen/Bénéficiaire non trouvé.' });
    }
    res.json(beneficiary);
});

// POST /api/beneficiaries/register (Créer un nouveau bénéficiaire)
router.post('/register', async (req, res) => {
    const { name, email, cv_score } = req.body;
    const db = getDatabase();

    if (!name || !email || cv_score === undefined) { 
        return res.status(400).json({ error: 'Données manquantes pour l\'inscription.' }); 
    }
    
    db.beneficiaries = db.beneficiaries || [];

    const existingBeneficiary = db.beneficiaries.find(b => b.email === email);
    if (existingBeneficiary) { 
        return res.status(409).json({ error: 'Cet email est déjà enregistré.' }); 
    }
    
    const newBeneficiary = { 
        id: uuidv4(), 
        name, 
        email, 
        cv_score: cv_score, 
        registration_date: new Date().toISOString() 
    };
    
    db.beneficiaries.push(newBeneficiary);
    await writeDatabaseFile();
    
    res.status(201).json({ 
        message: 'Citoyen enregistré avec succès.', 
        beneficiary: newBeneficiary 
    });
});

// PUT /api/beneficiaries/:id (Mettre à jour un bénéficiaire par ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = getDatabase();

    const index = (db.beneficiaries || []).findIndex(b => b.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Citoyen/Bénéficiaire non trouvé pour la mise à jour.' });
    }

    delete updates.id; 
    
    db.beneficiaries[index] = { 
        ...db.beneficiaries[index], 
        ...updates 
    };

    try {
        await writeDatabaseFile();
        res.json({ message: 'Compte mis à jour avec succès.', beneficiary: db.beneficiaries[index] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de la base de données.' });
    }
});

// DELETE /api/beneficiaries/:id (Supprimer un bénéficiaire par ID)
router.delete('/:id', async (req, res) => {
    const db = getDatabase();
    const initialLength = (db.beneficiaries || []).length;
    
    db.beneficiaries = (db.beneficiaries || []).filter(b => b.id !== req.params.id);

    if (db.beneficiaries.length < initialLength) {
        try {
            await writeDatabaseFile();
            res.status(204).end(); 
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde de la base de données après suppression.' });
        }
    } else {
        res.status(404).json({ error: 'Citoyen/Bénéficiaire non trouvé pour la suppression.' });
    }
});

module.exports = router;