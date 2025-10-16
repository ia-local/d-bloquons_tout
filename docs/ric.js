// docs/ric.js - Logique de Rendu spécifique au Référendum d'Initiative Citoyenne (RIC)

// Déclarer globalement les données dynamiques de la liste des RICs actifs
window.ACTIVE_RICS = window.ACTIVE_RICS || [];

// Fonction pour définir le Template RIC en ligne (pour éviter le 404 sur ric_form_template.json)
function defineRicFormTemplate() {
    // 🛑 Le contenu est désormais défini dans la variable globale pour être utilisé par modalGestion.js
    window.RIC_FORM_TEMPLATE = `
        <form id="ric-form">
            <p class="font-yellow" style="margin-bottom: 20px;">Soumettez votre initiative en définissant la question, le type et le niveau de vote.</p>
            <div class="form-group">
                <label for="ric-question">Votre question (oui/non) :</label>
                <input type="text" id="ric-question" name="question" placeholder="Ex: Faut-il abroger la loi du Plomb ?" required>
            </div>
            <div class="form-group">
                <label for="ric-description">Description et justifications :</label>
                <textarea id="ric-description" name="description" rows="5" placeholder="Expliquez la proposition en détail..." required></textarea>
            </div>
            <div class="form-group">
                <label for="ric-deadline">Date butoir :</label>
                <input type="date" id="ric-deadline" name="deadline" required>
            </div>
            <div class="form-group">
                <label for="ric-type">Type de RIC :</label>
                <select id="ric-type" name="type" required>
                    <option value="Législatif">Législatif</option>
                    <option value="Abrogatoire">Abrogatoire</option>
                    <option value="Constituant">Constituant</option>
                    <option value="Révocatoire">Révocatoire</option>
                </select>
            </div>
            <div class="form-group">
                <label for="ric-level">Niveau de scrutin :</label>
                <select id="ric-level" name="level" required>
                    <option value="local">Local</option>
                    <option value="departemental">Départemental</option>
                    <option value="regional">Régional</option>
                    <option value="national">National</option>
                </select>
            </div>
            <div class="form-group">
                <label for="ric-vote-method">Modalité de vote :</label>
                <select id="ric-vote-method" name="voteMethod">
                    <option value="click">Vote par clic (Internet)</option>
                    <option value="petition">Signature sur pétition (feuille A4)</option>
                    <option value="sms">Vote par SMS</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 20px;">Soumettre le RIC</button>
        </form>
    `;
    console.log("✅ RIC Form Template défini en ligne.");
}


window.loadRICContent = async function() {
    const container = document.getElementById('ric-content-container');
    if (container.hasLoaded) return; 

    container.innerHTML = '<div><p class="font-yellow" style="margin-top: 15px;">Récupération des détails du Référendum d\'Initiative Citoyenne...</p></div>';

    try {
        // 🛑 Charger les données descriptives (ric_details.json) et la liste active (rics.json)
        const [ricData, activeRicsData] = await Promise.all([
            window.fetchData('/api/ric/data'),
            window.fetchData('/api/ric/active-list')
        ]);
        
        // Stockage global des données
        window.RIC_DATA = ricData || {}; 
        window.ACTIVE_RICS = Array.isArray(activeRicsData) ? activeRicsData : []; 
        
        defineRicFormTemplate();

        // --- 1. CONSTRUCTION DU CONTENU HTML ---
        
// CORRECTION I3.2: Vérification de l'existence de l'array 'types'
        const types = (window.RIC_DATA.types && Array.isArray(window.RIC_DATA.types)) ? window.RIC_DATA.types : [];

        const typeCards = types.map((type, index) => `
            <div class="feature-card ric-card-trigger" data-ric-index="${index}" style="transform: none; background: var(--color-ui-primary); border-color: var(--color-accent-red); color: var(--color-text); cursor: pointer;">
                <h4 class="font-yellow" style="font-size: 1.1em;">${type.name}</h4>
                <p style="font-size: 0.9em; margin-top: 5px; color: var(--color-text);">${type.desc}</p>
            </div>
        `).join('');

        const powers = (window.RIC_DATA.separation_of_powers && Array.isArray(window.RIC_DATA.separation_of_powers)) ? window.RIC_DATA.separation_of_powers : [];
        
        const powersHtml = powers.map(p => `
            <div class="feature-card" style="background: var(--color-ui-content); padding: 15px; border-left: 5px solid var(--color-accent-yellow);">
                <i class="${p.icon} font-red" style="font-size: 1.5em;"></i>
                <h4 class="font-yellow" style="margin-top: 5px;">${p.power}</h4>
                <p style="font-size: 0.9em;">${p.description}</p>
                <p style="font-size: 0.8em; color: #aaa; margin-top: 5px;">* ${p.details}</p>
            </div>
        `).join('');

        const ricHtml = `
            <div class="content" style="transform: rotate(0.5deg); margin-bottom: 20px;">
                <h3 class="font-red">🏛️ Qu'est-ce que le RIC ?</h3>
<p style="margin-top: 10px;">${window.RIC_DATA.definition || 'Définition non chargée (API non trouvée ou fichier de secours manquant).'} </p>   
                <p style="margin-top: 15px; font-weight: bold;">Le RIC est notre proposition fondamentale pour restaurer la souveraineté populaire.</p>
                
                <a href="${ricData.manifestoLink}" target="_blank" class="btn btn-secondary" style="
                    display: inline-block; margin-top: 15px; padding: 8px 15px; 
                    background: var(--color-accent-red); color: white; 
                    border: 2px solid white; font-weight: bold;
                    ">
                    👉 Lire l'intégralité de la proposition de réforme (Manifeste)
                </a>
            </div>
            
            <div class="content" style="transform: rotate(-0.5deg); margin-bottom: 30px;">
                <h3 class="font-red">✅ Séparation des Pouvoirs & Processus</h3>
                <div class="feature-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-top: 15px;">
                    ${powersHtml}
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <button data-action="ric-form" class="btn btn-primary" id="propose-ric-btn">
                    <i class="fas fa-edit"></i> Soumettre ma Proposition de RIC
                </button>
            </div>
            
            <div class="content" style="transform: rotate(0.5deg); margin-bottom: 30px;">
                <h3 class="font-red">🗳️ Initiatives Actives (${window.ACTIVE_RICS.length})</h3>
                <p>Liste des propositions en cours de vote/collecte de signatures. <span class="font-yellow">Votes totaux : ${window.ACTIVE_RICS.reduce((acc, ric) => acc + (ric.votes_for || 0) + (ric.votes_against || 0), 0).toLocaleString('fr-FR')}</span></p>
                ${window.ACTIVE_RICS.slice(0, 3).map(ric => `
                    <div class="card active-ric-item" data-ric-id="${ric.id}" style="margin-top: 10px; padding: 15px; border-left: 3px solid var(--color-blue); cursor: pointer;">
                        <h4 style="font-size: 1.1em;">${ric.question}</h4>
                        <p style="font-size: 0.9em; color: #ccc;">${ric.type} (${ric.level}) - Statut : ${ric.status}</p>
                        <p style="font-size: 0.8em; font-weight: bold;">Votes : ${(ric.votes_for + ric.votes_against).toLocaleString('fr-FR')}</p>
                    </div>
                `).join('')}
            </div>


            <div class="content" style="transform: rotate(-0.5deg);">
                <h3 class="font-red">📋 Les 4 Piliers du RIC (Cliquez pour les détails)</h3>
                <div id="ric-feature-grid" class="feature-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 15px;">
                    ${typeCards}
                </div>
            </div>
        `;
        
        // --- 2. INJECTION DU CONTENU ET ATTACHEMENT DES ÉCOUTEURS ---
        
        container.innerHTML = ricHtml;
        
        // ... (Logique d'attachement des écouteurs et de récompense inchangée) ...
        if (window.handleUserAction && window.AGENT_PROFILE && typeof window.grantReward === 'function') {
            
            const proposeRicBtn = document.getElementById('propose-ric-btn');
            if (proposeRicBtn) {
                 proposeRicBtn.addEventListener('click', (e) => {
                     e.preventDefault();
                     if (!window.AGENT_PROFILE.ricMissionSubmitted) {
                         window.AGENT_PROFILE.ricMissionSubmitted = true;
                         window.grantReward(150, 10);
                         console.log(`🎉 MISSION RIC ACCOMPLIE: +150 UTMI. Statut Agent mis à jour.`);
                     }
                     window.handleUserAction('ric-form'); 
                 });
            }
            
            container.querySelectorAll('.ric-card-trigger').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.handleUserAction('ric-detail', card.getAttribute('data-ric-index')); 
                });
            });

            container.querySelectorAll('.active-ric-item').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.handleUserAction('ric-active-detail', card.getAttribute('data-ric-id')); 
                });
            });


        } else {
             console.error("Erreur d'initialisation: Les fonctions de jeu ne sont pas prêtes ou handleUserAction est absent.");
        }


        container.hasLoaded = true;

    } catch (error) {
        console.error("Erreur lors du chargement du contenu RIC (Simulé):", error);
        container.innerHTML = `<p class="font-red">❌ Échec du chargement du contenu RIC. Veuillez vérifier la connexion aux données.</p>`;
    }
};