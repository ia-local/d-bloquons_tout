// Fichier : routes/userRouter.js (VERSION FINALE)

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// 🛑 Import du service pour manipuler users.json
const userService = require('../server_modules/userService'); 

// --- LOGIQUE CRUD DES ROUTES ---

/**
 * [GET] /api/beneficiaries
 * Lit tous les utilisateurs enregistrés.
 */
router.get('/', async (req, res) => {
    try {
        const users = await userService.readUsersFile();
        res.status(200).json(users);
    } catch (e) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs.", error: e.message });
    }
});

/**
 * [GET] /api/beneficiaries/count
 * Compte le nombre total d'utilisateurs enregistrés. (Utilisé par le Dashboard)
 */
router.get('/count', async (req, res) => {
    try {
        const count = await userService.getUserCount();
        res.status(200).json({ count });
    } catch (e) {
        res.status(500).json({ message: "Erreur serveur lors du comptage des utilisateurs.", error: e.message });
    }
});

/**
 * [GET] /api/beneficiaries/by-telegram-id/:telegramId
 * Lit un utilisateur par son ID Telegram. (Utilisé par telegramRouter.js)
 */
router.get('/by-telegram-id/:telegramId', async (req, res) => {
    const telegramId = req.params.telegramId;
    try {
        const users = await userService.readUsersFile();
        const user = users.find(u => u.telegram_id && u.telegram_id.toString() === telegramId.toString());

        if (user) {
            // Retours simplifiés pour le bot Telegram
            res.status(200).json({
                id: user.id,
                name: user.name,
                cv_score: user.cv_score || 0,
                telegram_id: user.telegram_id,
            });
        } else {
            res.status(404).json({ message: "Profil citoyen non trouvé pour cet ID Telegram." });
        }
    } catch (e) {
        console.error("Erreur de recherche par Telegram ID:", e);
        res.status(500).json({ message: "Erreur serveur interne.", error: e.message });
    }
});

/**
 * [POST] /api/beneficiaries/register
 * Enregistre un nouvel utilisateur.
 */
router.post('/register', async (req, res) => {
    const { name, email, telegram_id } = req.body;

    if (!name || !email || !telegram_id) {
        return res.status(400).json({ message: "Nom, email et telegram_id sont requis." });
    }

    try {
        const users = await userService.readUsersFile();

        // Vérification des duplications
        if (users.some(u => u.email === email)) {
            return res.status(409).json({ message: "Cet email est déjà enregistré." });
        }
        if (users.some(u => u.telegram_id && u.telegram_id.toString() === telegram_id.toString())) {
            return res.status(409).json({ message: "Cet ID Telegram est déjà enregistré." });
        }

        const newUser = {
            id: uuidv4(),
            name,
            email,
            telegram_id: telegram_id.toString(),
            cv_score: 10,
            registration_date: new Date().toISOString()
        };

        users.push(newUser);
        await userService.writeUsersFile(users);

        res.status(201).json({ message: "Inscription réussie.", user: newUser });

    } catch (e) {
        console.error("Erreur d'inscription:", e);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription.", error: e.message });
    }
});

/**
 * [PUT] /api/beneficiaries/:id
 * Met à jour un utilisateur par son UUID.
 */
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const updates = req.body;

    try {
        const users = await userService.readUsersFile();
        const index = users.findIndex(u => u.id === userId);

        if (index === -1) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Applique les mises à jour
        const updatedUser = { ...users[index], ...updates };
        users[index] = updatedUser;
        await userService.writeUsersFile(users);

        res.status(200).json({ message: "Utilisateur mis à jour.", user: updatedUser });

    } catch (e) {
        console.error("Erreur de mise à jour:", e);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour.", error: e.message });
    }
});


module.exports = router;