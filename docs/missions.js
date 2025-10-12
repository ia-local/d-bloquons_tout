// docs/missions.js - Logique de rendu pour la page "Missions" (data-page="settings")

/**
 * Fonction de rendu principal pour la page Missions / Commandes Bot.
 * Elle est appelée par app.js lors de la navigation vers la page "settings".
 */
window.loadMissionsContent = function() {
    // Le conteneur doit être l'élément div.content à l'intérieur de #settings-page
    const container = document.getElementById('settings-page').querySelector('.content');
    const telegramData = window.TELEGRAM_DATA;

    if (!container || !telegramData) {
        console.error("Erreur: Impossible de trouver le conteneur de la page Missions ou les données TELEGRAM_DATA.");
        return;
    }
    
    // Contenu principal de la page Missions
    const pageContent = `
        <div class="content-section">
            <h2 class="font-red">🛡️ Missions Citoyennes & Objectifs Actuels</h2>
            <p>Devenez un **CVNU de Niveau Supérieur** en accomplissant ces missions. Chaque action validée augmente votre score d'engagement et débloque de nouvelles responsabilités locales.</p>
            
            <div class="mission-card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
                
                <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-accent-yellow);">
                    <h4 class="font-yellow"><i class="fas fa-check-circle"></i> Mission 1: Diffusion Locale</h4>
                    <p>Objectif: Partager le Manifeste du 10 Septembre sur 3 groupes locaux actifs (hors Telegram).</p>
                    <p class="font-red">Récompense: +50 points CVNU | Statut: <span style="font-weight: bold;">En cours</span></p>
                    <button class="btn btn-secondary" style="margin-top: 10px;">Soumettre Preuve (Simulé)</button>
                </div>

                <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-accent-red);">
                    <h4 class="font-red"><i class="fas fa-lightbulb"></i> Mission 2: Proposition RIC</h4>
                    <p>Objectif: Rédiger et soumettre une proposition complète de Référendum d'Initiative Citoyenne.</p>
                    <p class="font-yellow">Récompense: +150 points CVNU | Statut: <span style="font-weight: bold;">Nouveau</span></p>
                    <button class="btn btn-primary" style="margin-top: 10px;" onclick="window.handleUserAction('ric-form')">Lancer la Proposition</button>
                </div>
            </div>
        </div>

        <div class="content-section" style="margin-top: 40px;">
            <h2 class="font-yellow">🤖                 <button class="btn btn-secondary" onclick="window.handleUserAction('telegram-commands')">
            <i class="fas fa-list"></i> Voir toutes les Commandes & Topics
                </button> Assistant IA & Commandes Bot</h2>
            <h2 class="font-red">📞 Réseau Telegram - Liens & Commandes</h2>
            <p>Votre lien direct vers l'intelligence artificielle pour l'analyse juridique, le codage, et la création de contenu.</p>
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-primary btn-large" onclick="window.handleUserAction('chatbot')">
                    <i class="fas fa-robot"></i> Lancer l'Assistant IA
                </button>

            </div>
        </div>
        
        <div class="content-section" style="margin-top: 40px;">

            <p>Accès aux outils de coordination décentralisée. Cliquez ci-dessous pour voir la liste complète des commandes et des salons.</p>
            <div style="margin-top: 20px; text-align: center;">

            </div>
            
            <!-- 🛑 CONTENU RETIRÉ : Les liens directs ne sont plus affichés ici -->
        </div>
    `;

    container.innerHTML = pageContent;
};
