// docs/missions.js - Logique de rendu pour la page "Missions"

window.loadMissionsContent = function() {
    const container = document.getElementById('settings-page').querySelector('.content');
    const telegramData = window.TELEGRAM_DATA;
    const profile = window.AGENT_PROFILE; 

    if (!container || !telegramData || !profile) {
        console.error("Erreur: Impossible de trouver les dépendances nécessaires pour la page Missions.");
        return;
    }
    
    const ricMissionDone = profile.ricMissionSubmitted;
    const veilleMissionDone = profile.dashboardVeilleCompleted; 
    
    // --- Carte Mission RIC ---
    const ricMissionCard = ricMissionDone ? `
        <div class="card mission-card mission-completed" style="padding: 20px; border-left: 5px solid var(--color-green, #4CAF50);">
            <h4 style="color: var(--color-green, #4CAF50);"><i class="fas fa-trophy"></i> Mission 2: Proposition RIC</h4>
            <p>Objectif: Rédiger et soumettre une proposition complète de Référendum d'Initiative Citoyenne.</p>
            <p style="font-weight: bold;">Récompense: <span class="font-green">+150 UTMI (Déjà Réclamée)</span> | Statut: <span style="font-weight: bold; color: var(--color-green, #4CAF50);">ACCOMPLIE</span></p>
            <button class="btn btn-secondary" disabled style="margin-top: 10px;">Proposition Soumise</button>
        </div>
    ` : `
        <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-accent-red);">
            <h4 class="font-red"><i class="fas fa-lightbulb"></i> Mission 2: Proposition RIC</h4>
            <p>Objectif: Rédiger et soumettre une proposition complète de Référendum d'Initiative Citoyenne.</p>
            <p class="font-yellow">Récompense: <span class="font-red">+150 UTMI</span> | Statut: <span style="font-weight: bold;">Nouveau</span></p>
            <button class="btn btn-primary" style="margin-top: 10px;" onclick="window.handleUserAction('ric-form')">Lancer la Proposition</button>
        </div>
    `;

    // --- Carte Mission Veille Économique ---
    const veilleMissionCard = veilleMissionDone ? `
        <div class="card mission-card mission-completed" style="padding: 20px; border-left: 5px solid var(--color-green, #4CAF50);">
            <h4 style="color: var(--color-green, #4CAF50);"><i class="fas fa-search-dollar"></i> Mission 3: Veille Économique</h4>
            <p>Objectif: Analyser les indicateurs du Tableau de Bord (Réinitialisation quotidienne).</p>
            <p style="font-weight: bold;">Récompense: <span class="font-green">+50 UTMI (Journalier Réclamé)</span> | Statut: <span style="font-weight: bold; color: var(--color-green, #4CAF50);">ACCOMPLIE</span></p>
            <button class="btn btn-secondary" disabled style="margin-top: 10px;">Mission Réclamée</button>
        </div>
    ` : `
        <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-blue);">
            <h4 class="font-blue"><i class="fas fa-search-dollar"></i> Mission 3: Veille Économique (Journalière)</h4>
            <p>Objectif: Analyser les indicateurs financiers et de ralliement sur le Tableau de Bord.</p>
            <p class="font-yellow">Récompense: <span class="font-blue">+50 UTMI & 7 EA</span> | Statut: <span style="font-weight: bold;">Disponible</span></p>
            <button class="btn btn-primary" style="margin-top: 10px;" onclick="showPage('dashboard')">Accéder au Tableau de Bord</button>
        </div>
    `;


    // Contenu principal de la page Missions
    const pageContent = `
        <div class="content-section">
            <h2 class="font-red">🛡️ Missions Citoyennes & Objectifs Actuels</h2>
            <p>Devenez un **CVNU de Niveau Supérieur** en accomplissant ces missions. Chaque action validée augmente votre score d'engagement et débloque de nouvelles responsabilités locales.</p>
            
            <div class="mission-card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
                
                <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-accent-yellow);">
                    <h4 class="font-yellow"><i class="fas fa-check-circle"></i> Mission 1: Diffusion Locale</h4>
                    <p>Objectif: Partager le Manifeste du 10 Septembre sur 3 groupes locaux actifs (hors Telegram).</p>
                    <p class="font-red">Récompense: +50 UTMI | Statut: <span style="font-weight: bold;">En cours</span></p>
                    <button class="btn btn-secondary" style="margin-top: 10px;">Soumettre Preuve (Simulé)</button>
                </div>

                ${ricMissionCard}
                ${veilleMissionCard}
            </div>
        </div>
        
        <div class="content-section" style="margin-top: 40px;">
            <h2 class="font-yellow">🤖 Assistant IA & Commandes Bot</h2>
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
                <button class="btn btn-secondary" onclick="window.handleUserAction('telegram-commands')">
                    <i class="fas fa-list"></i> Voir toutes les Commandes & Topics
                </button>
            </div>
        </div>
    `;

    container.innerHTML = pageContent;
};

// NOTE: La fonction showPage est rendue globale par app.js
function showPage(pageName) {
    if (window.showPage) {
        window.showPage(pageName);
    } else {
        console.error("Navigation Error: window.showPage is not defined.");
    }
}