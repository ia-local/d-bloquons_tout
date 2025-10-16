// docs/missions.js - Logique de rendu pour la page "Missions" (ROBUSTE)

window.loadMissionsContent = function() {
    // 1. Ciblage du conteneur spécifique où les cartes de mission seront injectées.
    const container = document.getElementById('mission-cards-container'); 
    
    // 🛑 VÉRIFICATION CRITIQUE DU CONTENEUR (Correction du TypeError)
    if (!container) {
        console.error("Erreur critique: L'élément #mission-cards-container est introuvable dans le DOM. Vérifiez missions.html.");
        return; // Sortir immédiatement si le conteneur n'est pas là.
    }

    // 2. Dépendances Globales
    const telegramData = window.TELEGRAM_DATA; 
    const profile = window.AGENT_PROFILE;       
    const showPageFunc = window.showPage;
    const handleUserActionFunc = window.handleUserAction;

    if (!telegramData || !profile || !showPageFunc || !handleUserActionFunc) {
        console.error("Erreur critique: Dépendances globales non définies. Vérifiez l'ordre de chargement des scripts dans index.html.");
        container.innerHTML = `<p class="font-red">❌ Échec du chargement des missions. Dépendances globales (PROFILE, TELEGRAM_DATA, showPage, handleUserAction) non définies.</p>`;
        return;
    }
    
    // Logique de statut des missions
    const ricMissionDone = profile.ricMissionSubmitted;
    const veilleMissionDone = profile.dashboardVeilleCompleted; 
    
    // --- Carte Mission 1: Diffusion Locale (Statique) ---
    const mission1Card = `
        <div class="card mission-card" style="padding: 20px; border-left: 5px solid var(--color-accent-yellow);">
            <h4 class="font-yellow"><i class="fas fa-check-circle"></i> Mission 1: Diffusion Locale</h4>
            <p>Objectif: Partager le Manifeste du 10 Septembre sur 3 groupes locaux actifs (hors Telegram).</p>
            <p class="font-red">Récompense: +50 UTMI | Statut: <span style="font-weight: bold;">En cours</span></p>
            <button class="btn btn-secondary" style="margin-top: 10px;">Soumettre Preuve (Simulé)</button>
        </div>
    `;

    // --- Carte Mission RIC (Déléguée à handleUserAction) ---
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
            <button class="btn btn-primary" style="margin-top: 10px;" onclick="handleUserActionFunc('ric-form')">Lancer la Proposition</button>
        </div>
    `;

    // --- Carte Mission Veille Économique (Déléguée à showPage) ---
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
            <button class="btn btn-primary" style="margin-top: 10px;" onclick="showPageFunc('dashboard')">Accéder au Tableau de Bord</button>
        </div>
    `;

    // --- Assemblage des cartes ---
    const missionCardsHTML = [
        mission1Card,
        ricMissionCard,
        veilleMissionCard
    ].join('');
    
    // 3. Injection finale du contenu (Sûr, car le conteneur a été vérifié)
    container.innerHTML = missionCardsHTML;
};