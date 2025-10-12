// docs/modalTelegram.js - Composant pour générer le contenu de la Modale Telegram

/**
 * Génère le contenu HTML pour afficher la liste complète des commandes Bot et des liens Topics.
 * Est appelé par modalGestion.js pour remplir la modale 'telegram-commands'.
 * @returns {string} Le contenu HTML complet.
 */
window.generateTelegramModalContent = function() {
    const telegramData = window.TELEGRAM_DATA;

    if (!telegramData || !telegramData.commands || !telegramData.topicLinks) {
        return "<p class='font-red'>❌ Erreur: Les données TELEGRAM_DATA sont manquantes ou incomplètes. Vérifiez app.js.</p>";
    }

    // --- Génération des LIENS VERS LES SALONS (Topics) ---
    // Cette section doit être affichée en premier
    const topicsHTML = Object.entries(telegramData.topicLinks).map(([topic, link]) => `
        <li>
            <!-- 🛑 CLASSE UTILISÉE PAR modalTelegram.css pour l'effet bouton/glow -->
            <a href="${link}" target="_blank" class="telegram-topic-link">
                <!-- 🛑 NOUVELLE CLASSE POUR LE LABEL ET L'ICÔNE -->
                <div class="topic-label">
                    <i class="fab fa-telegram-plane"></i> ${topic}
                </div>
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `).join('');

    // --- Génération des COMMANDES BOT (utilise command-list-grid pour le mobile-first) ---
    const commandsHTML = telegramData.commands.map(cmd => `
        <div class="command-item">
            <div class="command-name">${cmd.cmd}</div>
            <div class="command-desc">${cmd.desc}</div>
        </div>
    `).join('');

    return `
        <!-- 🛑 SOLUTION TEMPORAIRE: ENCAPSULER LE CONTENU DANS UN CONTENEUR DÉFILANT -->
        <div style="overflow-y: auto; max-height: calc(85vh - 100px);">
            <div class="telegram-modal-content">
                
                <!-- 🛑 NOUVEL ORDRE : LIENS EN PREMIER -->
                <h3 class="telegram-section-title">🔗 Liens directs vers les Salons de Discussion:</h3>
                <ul class="topic-list">${topicsHTML}</ul>
                
                <h3 class="telegram-section-title" style="margin-top: 30px;">🤖 Commandes Bot Utiles:</h3>
                <div class="command-list-grid">${commandsHTML}</div>
                
                <p style="margin-top: 25px; font-size: 0.8em; color: var(--color-text-dark); text-align: center;">
                    <i class="fas fa-info-circle"></i> Le réseau Telegram est notre infrastructure de coordination décentralisée.
                </p>
            </div>
        </div>
    `;
};
